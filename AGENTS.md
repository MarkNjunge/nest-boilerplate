# AGENTS.md

This file provides guidance for AI agents working with this NestJS boilerplate codebase.

@README.md

## Quick Reference

### Essential Commands

```bash
npm run start:dev      # Development with hot reload
npm run build          # Build the project
npm run test           # Run unit tests
npm run test:e2e:local # Run E2E tests locally
npm run lint           # Check linting
npm run lint:fix       # Fix linting issues
npm run codegen        # Generate new data model (interactive)
```

### Database Commands

```bash
npm run migration generate migration_name  # Generate migration from schema changes
npm run migration create migration_name    # Create empty migration
npm run migration up                       # Run migrations
npm run migration down                     # Revert last migration
```

## Project Structure

```
src/
├── main.ts                    # Application entry point
├── modules/                   # Feature modules
│   ├── app/                   # Root AppModule
│   ├── _db/                   # Database configuration
│   ├── auth/                  # Auth service (global)
│   ├── user/                  # Example: User module
│   └── {feature}/             # Other feature modules
├── models/                    # Entities and DTOs
│   ├── _shared/               # Shared DTOs (ApiResponse, ApiError)
│   └── {entity}/              # Entity + CreateDto + UpdateDto
├── lib/
│   └── crud/                  # Generic Base/Crud Service & Controller
├── db/
│   └── migrations/            # TypeORM migrations
├── guards/                    # Auth guard
├── interceptors/              # Global response interceptor
├── filters/                   # Exception filter
├── decorators/                # @Serialize, @ReqCtx
├── pipes/                     # Validation pipe
├── logging/                   # Winston logger
├── als/                       # Request context (trace IDs)
├── config/                    # Config loading and secrets manager
└── utils/                     # HttpException, error codes, helpers

config/
├── default.json                      # Default config values
├── custom-environment-variables.json # Env var mappings
└── local.json                        # Local overrides (gitignored)
```

## Important Files

| File                                   | Purpose                                      |
|----------------------------------------|----------------------------------------------|
| `src/main.ts`                          | Bootstrap, middleware, Swagger setup         |
| `src/modules/app/app.module.ts`        | Root module, import all feature modules here |
| `src/modules/_db/db.module.ts`         | TypeORM config, entity exports               |
| `src/filters/all-exceptions.filter.ts` | Global exception handling                    |
| `src/guards/auth.guard.ts`             | Bearer token authentication                  |
| `src/lib/crud/plopfile.ts`             | Code generation configuration                |
| `config/default.json`                  | Default configuration values                 |

## Adding Data Models

### Using Code Generation (Recommended)

Run `npm run codegen` to scaffold a new data model with:
- Entity class extending BaseEntity
- CrudService (optional)
- CrudController (optional)
- Module with proper imports

After generation:
1. Add fields to the entity in `src/models/{name}/{name}.entity.ts`
2. Add validation decorators to the DTOs
3. Generate migration: `npm run migration generate add_{name}`
4. Review and run the migration

### Manual Creation

Read `src/lib/crud/plopfile.ts` and the `src/lib/crud/plop-templates/` directory to understand what files are needed
and how they are structured. Use that as the source of truth when creating a new data model manually.

## Common Tasks

### Add a field to an existing entity

1. Add the column to the entity class
2. Update CreateDto and UpdateDto if needed
3. Generate migration: `npm run migration generate add_field_to_table`
4. Review the generated migration
5. Run: `npm run migration up` or restart the server

### Add a new endpoint to an existing controller

1. Add method to the service if custom logic is needed
2. Add route handler to the controller with appropriate decorators
3. Add Swagger decorators (`@ApiOperation`, `@ApiResponse`)

### Add custom validation

Use `class-validator` decorators in DTOs:

```typescript
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class CreateUserDto {
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;
}
```

## Code Patterns

### Entity

```typescript
@Entity("users")
export class User extends BaseEntity {
  idPrefix(): string { return "usr_"; }

  @Column()
  username: string;
}
```

### Service

All entity services must extend `CrudService` (or `BaseService` for read-only). Never inject
`@InjectRepository(Entity)` as the sole data-access mechanism — the CRUD layer provides user scoping,
metrics, logging, id generation, and timestamp management.

```typescript
@Injectable()
export class UserService extends CrudService<User, CreateUserDto, UpdateUserDto> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super("User", repo);
  }
}
```

#### User Scoping

User scoping is **on by default** — all queries are automatically filtered to the authenticated user.

- **Global resources** (e.g. `User` itself, `Category`): pass `{ userScoped: false }` at construction time.
- **Per-call bypass** (e.g. admin actions, public lookups, auth before login): spread `userScoped: false`
  into the context parameter: `{ ...ctx, userScoped: false }`.

```typescript
// Global resource — never scoped
super("User", repo, { userScoped: false });

// Per-call bypass — internal lookup across all users
const user = await this.userService.get({ ...ctx, userScoped: false }, {
  filter: { eq: [{ key: "email", value: email }] },
});
```

See `src/lib/crud/README.md` § "User Scoping" for full details.

#### Prefer CRUD methods over `this.repository.*`

When a service extends `CrudService`, use the inherited CRUD methods (`this.create()`, `this.get()`,
`this.getById()`, `this.list()`, `this.deleteById()`) instead of calling `this.repository` directly.
The CRUD methods automatically inject `userId` from context, generate ids, set timestamps, emit
metrics, and apply user scoping.

```typescript
// ✅ DO — uses CRUD method (injects userId, sets id/timestamps)
return this.create(ctx, { email, passwordHash, role: "standard" } as any);

// ✅ DO — get with filter
const existing = await this.get(ctx, { filter: { eq: [{ key: "email", value: email }] } });

// ❌ DON'T — bypasses the CRUD layer
const entity = this.repository.create({ ... });
return this.repository.save(entity);
```

#### Partial updates: delegate to `super.update()`

`CrudService.update()` handles partial updates natively. Perform business validation and then delegate the actual DB write:

```typescript
async update(ctx: IReqCtx, id: string, dto: UrlUpdateDto): Promise<Url | null> {
  // Verify ownership / existence
  const existing = await this.getById(ctx, id);
  if (!existing) {
    throw new HttpException(404, "Not found", ErrorCodes.LINK_NOT_FOUND);
  }

  // Custom business validation
  if (dto.slug !== undefined) {
    // ...validate slug, check uniqueness...
  }

  // Delegate the partial update
  const updateData: any = Object.assign({}, dto);
  if (dto.slug !== undefined) {
    updateData.isCustom = true;
  }
  return super.update(ctx, id, updateData);
}
```

#### Inject services, not repositories

When `ServiceA` needs data from `EntityB`, inject `ServiceB` — not `@InjectRepository(EntityB)`.
This keeps all data access flowing through the CRUD layer.

```typescript
// ✅ DO
constructor(
  @InjectRepository(Post) repo: Repository<Post>,
  private readonly userService: UserService,   // <-- inject the service
) {
  super("Post", repo);
}

// ❌ DON'T
constructor(
  @InjectRepository(Post) repo: Repository<Post>,
  @InjectRepository(User) private readonly userRepository: Repository<User>,  // <-- bypasses CRUD
) {
  super("Post", repo);
}
```

Correspondingly, when `ModuleA` depends on `ServiceB` from `ModuleB`, import `ModuleB`:
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Post]), UserModule],  // UserModule, not TypeOrmModule.forFeature([User])
})
export class PostModule {}
```


### Controller

```typescript
@Controller("users")
export class UserController extends CrudController(User, CreateUserDto, UpdateUserDto) {
  constructor(private readonly userService: UserService) {
    super(userService);
  }
}
```

#### Request Context (traceId)

Every HTTP request gets a `traceId` from the ALS middleware (`src/als/als.middleware.ts`). Extract it
in controllers via `@ReqCtx()` and **always pass it through** to service methods. Never construct a
hardcoded `{ traceId: "..." }` — it breaks distributed tracing.

```typescript
// ✅ DO — ctx flows from controller through service
@Post("/register")
async register(@ReqCtx() ctx: IReqCtx, @Body() dto: RegisterDto) {
  return this.authService.register(ctx, dto.email, dto.password);
}

// In the service, accept ctx as the first parameter:
async register(ctx: IReqCtx, email: string, password: string): Promise<...> {
  const crudCtx = { ...ctx, userScoped: false };
  const result = await this.userService.get(crudCtx, { ... });
...
}

// ❌ DON'T — hardcoded traceId
const ctx = { traceId: "auth:register", userScoped: false };
```

The only exception is **standalone code** with no request context (e.g. cron jobs, scripts). Use
`emptyCtx()` from `@/decorators/request-context.decorator` in those cases.

#### Auth Guards and Redundant Checks

If a controller route has `@UseGuards(AuthGuard)`, the user is **guaranteed** to be authenticated.
Do not add `if (!ctx.user?.userId)` guards in the service — use `ctx.user!` directly.

```typescript
// ✅ DO — guard already applied on the route
async togglePremium(ctx: IReqCtx): Promise<TogglePremiumResponseDto> {
  const userId = ctx.user!.userId;  // safe — guard enforces auth
  ...
}

// ❌ DON'T — redundant check
const userId = ctx.user?.userId;
if (!userId) {
  throw new HttpException(401, "Not authenticated", ErrorCodes.MISSING_AUTHENTICATION);
}
```

### API Response DTOs

Every API response must use a dedicated DTO class with `@ApiProperty` decorators. Reference it in the
controller with `@ApiResponse({ status, type: TheDto })` — never use inline `schema: { ... }`.

When an `@ApiProperty` references a class type, you must also add `@Type(() => TheClass)` from
`class-transformer` for correct serialization:

```typescript
import { Type } from "class-transformer";

export class LoginResponseDto {
  @ApiProperty({ type: User })
  @Type(() => User)
  user: User;

  @ApiProperty({ example: "eyJhbGciOiJIUzI1NiIs..." })
  accessToken: string;
}
```

### API vs Internal DTOs

When the shape exposed to API clients differs from the internal DB/entity shape, create a **separate
API DTO** following the naming convention `XxxApiDto`. The internal DTO (`XxxCreateDto` / `XxxUpdateDto`)
remains the CRUD layer's contract, matching entity columns directly.

**Example** — exposing `customSlug` to clients while internally using `slug` + `isCustom`:

```typescript
// Internal — matches entity columns, used by CrudService
export class UrlCreateDto {
  originalUrl: string;
  slug?: string;       // entity field: slug
  isCustom?: boolean;   // entity field: is_custom
  expiresAt?: Date;
}

// External — cleaner API contract for clients
export class UrlCreateApiDto {
  originalUrl: string;
  customSlug?: string;  // user-friendly name; maps to slug + isCustom: true internally
  expiresAt?: Date;
}
```

The controller uses the API DTO:

```typescript
import { UrlCreateApiDto } from "@/models/url/url";

@Post("/urls")
@ApiBody({ type: UrlCreateApiDto })
async shorten(@ReqCtx() ctx: IReqCtx, @Body() dto: UrlCreateApiDto): Promise<Url> {
  return this.urlService.shorten(ctx, dto);
}
```

The service maps between them — the API DTO flows from the controller through the service's public
methods, and the service passes the internal DTO to CRUD methods as needed.

### Error Handling

Throw the custom HttpException class.

```typescript
import { HttpException } from "@/utils/HttpException";
import { ErrorCodes } from "@/utils/error-codes";

throw new HttpException(404, "User not found", ErrorCodes.INVALID_USER, { id });
```

### Logging

```typescript
import { Logger } from "@/logging/Logger";

const logger = new Logger("ServiceName");
logger.info("Message", { data: { key: "value" } });
```

## Writing Tests

- Unit tests live alongside source files as `*.spec.ts`
- Use `@testcontainers/postgresql` for integration tests requiring a database
- Mock dependencies using Jest's `jest.mock()`
- E2E tests live in `e2e-test/app.e2e-spec.ts`

## Pitfalls to Avoid

1. **Don't use Express-specific code** — This uses Fastify, not Express
2. **Always generate migrations** — Don't rely on `synchronize: true`
3. **Use the custom HttpException** — Not the NestJS one, for consistent error format
4. **Import from `@/`** — Use path aliases, not relative paths like `../../`
5. **Add entities to DbModule** — New entities must be added to `src/modules/_db/db.module.ts`
6. **Implement `idPrefix()`** — Required for all entities extending BaseEntity
7. **Don't skip validation** — Always add class-validator decorators to DTOs
8. **Don't skip Swagger** — Always add Swagger decorators to DTOs
9. **Don't hardcode traceIds** — `@ReqCtx()` carries the real `traceId` from the ALS middleware; pass it through, never write `{ traceId: "..." }`
10. **Don't inject repositories into other services** — Inject the domain service (e.g. `UserService`) instead of `@InjectRepository(User)`; import the module, not the TypeORM feature
11. **Don't duplicate auth checks** — If `@UseGuards(AuthGuard)` is on the route, don't re-check `if (!ctx.user)` in the service
12. **Don't call `this.repository.create/save` for entity creation** — Use `this.create()` from CrudService (handles userId injection, id generation, timestamps, metrics)
13. **Don't hand-roll partial updates** — Validate business rules, then delegate to `super.update()`
14. **Don't use inline response schemas** — Create a DTO class and use `@ApiResponse({ status, type: TheDto })`
15. **Don't forget `@Type(() => Class)`** — When using `@ApiProperty({ type: SomeClass })`, also add `@Type(() => SomeClass)` from `class-transformer`
