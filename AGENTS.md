# AGENTS.md

This file provides guidance for AI agents working with this NestJS boilerplate codebase.

## Project Overview

A production-ready NestJS boilerplate using Fastify, TypeORM (PostgreSQL), and comprehensive tooling for building REST APIs.

**Tech Stack:**
- NestJS 11 with Fastify (not Express)
- TypeORM with PostgreSQL
- SWC compiler for fast builds
- Winston logging with OpenTelemetry support
- Jest for testing

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
│   ├── _base/                 # BaseEntity class
│   ├── _shared/               # Shared DTOs (ApiResponse, ApiError)
│   └── {entity}/              # Entity + CreateDto + UpdateDto
├── db/
│   ├── crud/                  # Generic CrudService & CrudController
│   ├── migrations/            # TypeORM migrations
│   └── query/                 # Query parsing utilities
├── guards/                    # Auth guard
├── interceptors/              # Global response interceptor
├── filters/                   # Exception filter
├── decorators/                # @Serialize, @ReqCtx
├── pipes/                     # Validation pipe
├── logging/                   # Winston logger
├── cls/                       # Request context (trace IDs)
├── config/                    # Config loading
└── utils/                     # HttpException, error codes, helpers

config/
├── default.json                      # Default config values
├── custom-environment-variables.json # Env var mappings
└── local.json                        # Local overrides (gitignored)
```

## Adding New Features

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

1. **Entity** (`src/models/{name}/{name}.entity.ts`):
   - Extend `BaseEntity` from `@/models/_base/_base.entity.ts`
   - Implement `idPrefix()` returning a 3-4 char prefix (e.g., `"usr_"`)
   - Add `@Entity("table_name")` decorator

2. **DTOs** (same file or separate):
   - Create `Create{Name}Dto` with `class-validator` decorators
   - Create `Update{Name}Dto` with optional fields

3. **Service** (`src/modules/{name}/{name}.service.ts`):
   - Extend `CrudService<Entity, CreateDto, UpdateDto>`
   - Inject repository via `@InjectRepository(Entity)`

4. **Controller** (`src/modules/{name}/{name}.controller.ts`):
   - Extend `CrudController<Entity, CreateDto, UpdateDto>`
   - Add `@Controller("{route}")` and `@ApiTags("{Tag}")`

5. **Module** (`src/modules/{name}/{name}.module.ts`):
   - Import in `AppModule` at `src/modules/app/app.module.ts`
   - Add entity to `DbModule` exports at `src/modules/_db/db.module.ts`

6. **Migration**: Generate after entity changes

## Key Patterns

### BaseEntity

All entities extend `BaseEntity` which provides:
- `id`: ULID-based string with entity prefix
- `createdAt`, `updatedAt`: Auto-managed timestamps

```typescript
@Entity("users")
export class User extends BaseEntity {
  idPrefix(): string {
    return "usr_";
  }

  @Column()
  username: string;
}
```

### CrudService

Generic service with methods: `list`, `get`, `getById`, `create`, `createBulk`, `update`, `upsert`, `deleteById`, etc.

```typescript
@Injectable()
export class UserService extends CrudService<User, CreateUserDto, UpdateUserDto> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super(repo, new Logger("UserService"));
  }
}
```

### CrudController

Generic controller providing REST endpoints with authentication on write operations:
- `GET /` - List with query support
- `GET /:id` - Get by ID
- `POST /` - Create (requires auth)
- `PATCH /:id` - Update (requires auth)
- `DELETE /:id` - Delete (requires auth)

### Query System

The API supports advanced queries via URL parameters:
- `select=field1,field2` - Field selection
- `include=relation` - Eager load relations
- `filter=(field,operator,value)` - Filtering
- `sort=(field,ASC)` - Sorting
- `limit=10&offset=0` - Pagination

Operators: `eq`, `ne`, `like`, `ilike`, `gt`, `lt`, `gte`, `lte`, `in`, `notin`, `isnull`, `isnotnull`, `between`, `notbetween`

### Authentication

Bearer token auth via `AuthGuard` and `AuthService`. Token is checked against `config.apiKey`.

```typescript
@UseGuards(AuthGuard)
@Post()
create(@Body() dto: CreateUserDto) {}
```

Access authenticated user via `@ReqCtx()`:

```typescript
@UseGuards(AuthGuard)
@Get()
handler(@ReqCtx() ctx: IReqCtx) {
  console.log(ctx.user);  // { userId: "sample-user-id" }
}
```

The auth flow:
1. `AuthGuard` extracts Bearer token from Authorization header
2. `AuthService.validateToken()` validates the token
3. Authenticated user is stored in CLS (request context)
4. `@ReqCtx()` decorator retrieves user from CLS

### Error Handling

Use the custom `HttpException` for consistent error responses:

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

### Request Context

Access trace ID and request info:

```typescript
@Get()
handler(@ReqCtx() ctx: IReqCtx) {
  console.log(ctx.traceId);
}
```

## Configuration

Configuration hierarchy (later overrides earlier):
1. `config/default.json` - Base defaults
2. `config/{NODE_ENV}.json` - Environment-specific
3. `config/local.json` - Local overrides (gitignored)
4. `.env` file - Environment variables
5. System environment variables

Access config via:
```typescript
import { config } from "./config";
config.port
```

## Testing

### Unit Tests

Located alongside source files as `*.spec.ts`. Run with `npm run test`.

### E2E Tests

Located in `test/app.e2e-spec.ts`. Tests all CRUD operations, auth, validation, and queries.

```bash
npm run test:e2e:local  # Local execution
npm run test:e2e        # Docker-based
```

### Writing Tests

- Use `@testcontainers/postgresql` for integration tests requiring a database
- Mock dependencies using Jest's `jest.mock()`
- Test files use the pattern `{name}.spec.ts`

## Important Files

| File | Purpose |
|------|---------|
| `src/main.ts` | Bootstrap, middleware, Swagger setup |
| `src/modules/app/app.module.ts` | Root module, import all feature modules here |
| `src/modules/_db/db.module.ts` | TypeORM config, entity exports |
| `src/db/crud/crud.service.ts` | Generic CRUD service base class |
| `src/db/crud/crud.controller.ts` | Generic CRUD controller base class |
| `src/models/_base/_base.entity.ts` | Base entity with id, timestamps |
| `src/filters/all-exceptions.filter.ts` | Global exception handling |
| `src/guards/auth.guard.ts` | Bearer token authentication |
| `plopfile.ts` | Code generation configuration |
| `config/default.json` | Default configuration values |

## Common Tasks

### Add a field to an existing entity

1. Add the column to the entity class
2. Update CreateDto and UpdateDto if needed
3. Generate migration: `npm run migration generate add_field_to_table`
4. Review the generated migration
5. Run: `npm run migration up` or restart the server

### Add a new endpoint to existing controller

1. Add method to the service if custom logic needed
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

## Pitfalls to Avoid

1. **Don't use Express-specific code** - This uses Fastify, not Express
2. **Always generate migrations** - Don't rely on `synchronize: true`
3. **Use the custom HttpException** - Not the NestJS one, for consistent error format
4. **Import from `@/`** - Use path aliases, not relative paths like `../../`
5. **Add entities to DbModule** - New entities must be added to `src/modules/_db/db.module.ts`
6. **Implement `idPrefix()`** - Required for all entities extending BaseEntity
7. **Don't skip validation** - Always add class-validator decorators to DTOs
7. **Don't skip Swagger** - Always add swagger decorators to DTOs
