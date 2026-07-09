# CRUD Layer

This directory contains the core CRUD (Create, Read, Update, Delete) abstractions for the NestJS boilerplate. 
It provides base classes for entities, services, and controllers that enable rapid development of REST APIs with minimal boilerplate.

## Architecture

The CRUD layer uses inheritance to separate read and write operations:

### Services

- **BaseService** - Read-only operations: `count`, `list`, `get`, `getById`
- **CrudService extends BaseService** - Adds write operations: `create`, `createBulk`, `update`, `upsert`, `deleteById`, etc.

### Controllers

- **BaseController** - Read-only endpoints (auth configurable via `options.auth`)
- **CrudController extends BaseController** - Adds write endpoints (auth configurable via `options.auth`)

Use `BaseService`/`BaseController` for read-only access, `CrudService`/`CrudController` for full CRUD.

## BaseEntity

All entities should extend `BaseEntity` which provides:
- `id`: ULID-based string with entity-specific prefix
- `createdAt`: Auto-managed creation timestamp
- `updatedAt`: Auto-managed update timestamp

### Example

```typescript
import { Entity, Column } from "typeorm";
import { BaseEntity } from "@/lib/crud";

@Entity("users")
export class User extends BaseEntity {
  idPrefix(): string {
    return "usr_";
  }

  @Column()
  username: string;

  @Column()
  email: string;
}
```

**Important**: Every entity MUST implement `idPrefix()` to return a 3-4 character prefix (e.g., `"usr_"`, `"post_"`, `"cmt_"`).

## UserScopedEntity

Extends `BaseEntity` for resources that belong to a specific user. Adds a `userId` column and a `@ManyToOne` relation
to the project's `User` model. Services automatically filter all queries by the authenticated user's ID and inject it on create.

The relation target is resolved lazily via a static `_userType` field so the library has no hard import on the project's `User`.
Subclasses must provide `_userType` in a static block and implement `getUserType()`.

```typescript
import { Entity, Column } from "typeorm";
import { UserScopedEntity } from "@/lib/crud/entity/user-scoped.entity";
import { User } from "@/models/user/user";

@Entity("posts")
export class Post extends UserScopedEntity<User> {
  static { UserScopedEntity._userType = User; }

  getUserType() {
    return User;
  }

  idPrefix(): string {
    return "post_";
  }

  @Column()
  title: string;
}
```

The corresponding service requires no extra configuration — user scoping is on by default:

```typescript
@Injectable()
export class PostService extends CrudService<Post, PostCreateDto, PostUpdateDto> {
  constructor(@InjectRepository(Post) repo: Repository<Post>) {
    super("Post", repo); // userScoped: true by default
  }
}
```

For global resources that should not be filtered by user (e.g. `User`, `Category`), pass `{ userScoped: false }`:

```typescript
super("User", repo, { userScoped: false });
```

To bypass scoping for a **single call** (e.g. a public feed or an admin action) without changing the service
constructor, pass `userScoped: false` in the context:

```typescript
// Public feed — list all posts regardless of author
const feed = await this.postService.list({ ...ctx, userScoped: false }, query);

// Admin — fetch any user's post by ID
const post = await this.postService.getById({ ...ctx, userScoped: false }, id);
```

Authorization for who may make these calls is enforced by the guard layer, not the service.

**Do not include `userId` in Create DTOs** for user-scoped entities — it is injected automatically from the
authenticated user's context and any value provided in the request body is ignored.

## BaseService

Provides read-only operations for entities. All methods accept an `ICrudContext` as their first argument, which carries
the authenticated user's ID used for user-scoped filtering.

### Constructor

```typescript
super(name: string, repository: Repository<Entity>, options?: ServiceOptions)
```

`ServiceOptions`:
- `userScoped?: boolean` — defaults to `true`. When `true`, all queries are automatically filtered by the authenticated
  user's `userId`. Set to `false` for global resources (e.g. `User`, `Category`).

`ICrudContext`:
- `traceId: string` — request trace ID
- `user?: { userId: string }` — authenticated user; required when scoping is active
- `userScoped?: boolean` — per-call override; when `false`, bypasses user filtering for that call regardless of the
  service-level default

### Methods

- `count(ctx: ICrudContext, query?: Query): Promise<number>` - Count entities matching query
- `list(ctx: ICrudContext, query?: Query): Promise<Entity[]>` - List entities with filtering, sorting, pagination
- `get(ctx: ICrudContext, query: Query): Promise<Entity | null>` - Get first entity matching query
- `getById(ctx: ICrudContext, id: string): Promise<Entity | null>` - Get entity by ID
- `listCursor(ctx: ICrudContext, query?: Query): Promise<CursorPaginationResult<Entity>>` - Cursor-based pagination
- `withTransaction(manager: EntityManager): this` - Create transaction-scoped clone

### Example

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BaseService } from "@/lib/crud";
import { User } from "@/models/user/user";

@Injectable()
export class UserService extends BaseService<User> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super("User", repo, { userScoped: false });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }
}
```

## CrudService

Extends `BaseService` with write operations. When `userScoped` is true (the default), `userId` is automatically
injected from context on create and all updates/deletes are scoped to the current user.

### Additional Methods

- `create(ctx: ICrudContext, dto: CreateDto): Promise<Entity>` - Create entity; injects `userId` from context
- `createBulk(ctx: ICrudContext, dtos: CreateDto[]): Promise<Entity[]>` - Create multiple entities
- `upsert(ctx: ICrudContext, dto: CreateDto | UpdateDto): Promise<Entity>` - Create or update
- `upsertBulk(ctx: ICrudContext, dtos: (CreateDto | UpdateDto)[]): Promise<Entity[]>` - Bulk upsert
- `update(ctx: ICrudContext, id: string, dto: UpdateDto): Promise<Entity | null>` - Update by ID (scoped to user)
- `updateIndexed(ctx: ICrudContext, filter: Filter, dto: UpdateDto): Promise<Entity[]>` - Update matching records
- `deleteById(ctx: ICrudContext, id: string): Promise<number>` - Delete by ID (scoped to user); returns affected count
- `deleteIndexed(ctx: ICrudContext, filter: Filter): Promise<number>` - Delete matching records

### Example

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudService } from "@/lib/crud";
import { Post } from "@/models/post/post";
import { Post, PostCreateDto, PostUpdateDto } from "@/models/post/post";

@Injectable()
export class PostService extends CrudService<Post, PostCreateDto, PostUpdateDto> {
  constructor(@InjectRepository(Post) repo: Repository<Post>) {
    super("Post", repo); // userScoped: true by default
  }
}
```

## BaseController

Provides read-only HTTP endpoints.

### Routes

- `GET /count` - Count entities
- `GET /` - List entities with query support
- `GET /first` - Get first entity matching query
- `GET /:id` - Get entity by ID

### Example

```typescript
import { Controller } from "@nestjs/common";
import { BaseController } from "@/lib/crud";
import { User } from "@/models/user/user.entity";
import { UserService } from "./user.service";

@Controller("users")
export class UserController extends BaseController(User) {
  constructor(private readonly userService: UserService) {
    super();
  }

  get service() {
    return this.userService;
  }
}
```

The `service` getter is required — the base controller accesses `this.service` to delegate to the service layer. The `super()` call takes no arguments.

## CrudController

Extends `BaseController` with write endpoints. Auth is required by default (configurable via `options.auth`).

`createDtoType` and `updateDtoType` are **required** — they are used for Swagger documentation and request validation.

### Additional Routes

- `POST /` - Create entity
- `POST /bulk` - Create multiple entities
- `PUT /` - Upsert entity
- `PATCH /:id` - Update entity
- `DELETE /:id` - Delete entity

### Example

```typescript
import { Controller } from "@nestjs/common";
import { CrudController } from "@/lib/crud";
import { User, UserCreateDto, UserUpdateDto } from "@/models/user/user";
import { UserService } from "./user.service";

@Controller("users")
export class UserController extends CrudController(User, UserCreateDto, UserUpdateDto) {
  constructor(private readonly userService: UserService) {
    super();
  }

  get service() {
    return this.userService;
  }
}
```

## Route Exclusion

Both `BaseController` and `CrudController` accept an optional `options` parameter to exclude specific routes:

```typescript
// BaseController — exclude specific read-only routes
BaseController(User, { exclude: ["listCursor"] })

// CrudController — exclude any base or crud route
CrudController(User, UserCreateDto, UserUpdateDto, {
  exclude: ["deleteById", "createBulk"]
})
```

### Available Route Names

**BaseController routes:**
- `count` - GET /count
- `list` - GET /
- `get` - GET /first
- `listCursor` - GET /cursor (cursor-based pagination)
- `getById` - GET /:id

**CrudController routes (in addition to Base routes):**
- `create` - POST /
- `createBulk` - POST /bulk
- `upsert` - PUT /
- `upsertBulk` - PUT /bulk
- `update` - PATCH /:id
- `updateIndexed` - PATCH /
- `deleteById` - DELETE /:id
- `deleteIndexed` - DELETE /

Excluded methods are removed from the controller prototype, so NestJS never registers them as routes.

## Auth Configuration

The `options` object accepts an `auth` field to control how authentication is applied:

| Value                                  | Behaviour                                               |
|----------------------------------------|---------------------------------------------------------|
| _(omitted)_                            | All routes require user auth (default)                  |
| `{ mode: "ADMIN" }`                    | All routes require admin auth                           |
| `{ publicReads: true }`                | Read routes are public; write routes require user auth  |
| `{ publicReads: true, mode: "ADMIN" }` | Read routes are public; write routes require admin auth |
| `false`                                | Auth guard is not applied to any route                  |

```typescript
// Default — all routes require user auth
CrudController(Post, PostCreateDto, PostUpdateDto)

// Admin-only (e.g. user management)
CrudController(User, UserCreateDto, UserUpdateDto, { auth: { mode: "ADMIN" } })

// Public catalogue — anyone can read, only admins can write
CrudController(Category, CategoryCreateDto, CategoryUpdateDto, {
  auth: { publicReads: true, mode: "ADMIN" }
})

// Fully public (no guard at all)
BaseController(Announcement, { auth: false })
```

When `publicReads: true` is set on a `CrudController`, read routes (inherited from `BaseController`) have no guard, while write routes have the guard applied at the method level. This means `ctx.user` may be `undefined` on read handlers — design accordingly.

## Transactions

The `TransactionService` provides a reusable wrapper around TypeORM's transactions for atomic multi-entity operations.

### Key Features

- **Isolation Levels**: Support for `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`
- **Automatic Rollback**: TypeORM automatically rolls back on errors
- **Service Reuse**: Use `withTransaction(manager)` to create transaction-scoped service clones

### Example

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudService, TransactionService } from "@/lib/crud";
import { Post, PostCreateDto, PostUpdateDto } from "@/models/post/post";
import { CommentService } from "@/modules/comment/comment.service";

@Injectable()
export class PostService extends CrudService<Post, PostCreateDto, PostUpdateDto> {
  constructor(
    @InjectRepository(Post) repo: Repository<Post>,
    private readonly transactionService: TransactionService,
    private readonly commentService: CommentService,
  ) {
    super("Post", repo);
  }

  async createPostWithComment(ctx: ICrudContext, dto: CreatePostWithCommentDto): Promise<Post> {
    return this.transactionService.run(async manager => {
      // Create transaction-scoped service clones
      const txPostService = this.withTransaction(manager);
      const txCommentService = this.commentService.withTransaction(manager);

      // All operations use the same transaction; userId is injected from ctx automatically
      const post = await txPostService.create(ctx, {
        title: dto.title,
        content: dto.content,
      });

      const comment = await txCommentService.create(ctx, {
        content: dto.comment.content,
        postId: post.id,
      });

      return Object.assign(post, { comments: [comment] });
    });
  }

  async createWithIsolation(dto: PostCreateDto): Promise<Post> {
    // Specify custom isolation level
    return this.transactionService.run(
      async manager => {
        const txService = this.withTransaction(manager);
        return txService.create(ctx, dto);
      },
      { isolationLevel: "SERIALIZABLE" }
    );
  }
}
```

### How It Works

1. `TransactionService.run()` wraps your callback in a TypeORM transaction
2. `withTransaction(manager)` creates a lightweight clone of the service that uses a transaction-scoped repository
3. All existing service methods (`create`, `update`, `list`, etc.) work on the clone without modification
4. On error, TypeORM automatically rolls back the transaction

## Query System

The CRUD layer includes a powerful query parsing system that converts URL parameters into TypeORM queries.

### Supported Parameters

- `select=field1,field2` - Field selection
- `include=relation1,relation2` - Eager load relations
- `filter=(field,operator,value):(field2,operator,value2)` - Filtering
- `sort=(field,ASC):(field2,DESC)` - Sorting. Supports dot-notation for nested relation fields, e.g. `(user.name,ASC)`
- `limit=10&offset=0` - Pagination

### Filter Operators

- `eq` - Equals
- `ne` - Not equals
- `like` - SQL LIKE (case-sensitive)
- `ilike` - SQL ILIKE (case-insensitive)
- `gt` - Greater than
- `lt` - Less than
- `gte` - Greater than or equal
- `lte` - Less than or equal
- `in` - In array
- `notin` - Not in array
- `isnull` - Is null
- `isnotnull` - Is not null
- `between` - Between two values
- `notbetween` - Not between two values
- `any` - PostgreSQL ANY
- `none` - PostgreSQL NONE
- `contains` - Array contains
- `containedby` - Array contained by
- `raw` - Raw SQL (use with caution)

### Example Queries

**Select specific fields:**
```
GET /users?select=username,email
```

**Include relations:**
```
GET /posts?include=comments,author
```

**Nested select with relations:**
```
GET /posts?select=title,comments.content,comments.user.username&include=comments,comments.user
```

**Nested relation field selection** (select specific fields from a relation and its sub-relation):
```
GET /posts?select=id,comments.id,comments.user.username&include=comments,comments.user
```
> The root `id` is auto-injected when `include` is used. Intermediate relation IDs (e.g. `comments.id`) must be
> selected explicitly so TypeORM can link nested records.

**Filter by field:**
```
GET /users?filter=(username,eq,john)
```

**Filter using 'in' operator:**
```
GET /users?filter=(username,in,john|paul)
```

**Multiple filters:**
```
GET /posts?filter=(userId,eq,usr_123):(createdAt,gt,2025-01-01)
```

**Range filter:**
```
GET /products?filter=(price,between,100,500)
```

**Sort and paginate:**
```
GET /posts?sort=(createdAt,DESC)&limit=20&offset=40
```

**Sort by nested relation field:**
```
GET /posts?sort=(author.name,ASC):(author.email,DESC)
```

**Complex query:**
```
GET /posts?select=title,content,author.username&include=author&filter=(published,eq,true):(createdAt,gte,2025-01-01)&sort=(createdAt,DESC)&limit=10
```

## Cursor Pagination

Cursor pagination is suited for infinite-scroll feeds and large datasets where offset pagination degrades in 
performance or stability.

Unlike offset-based pagination, cursor pagination is immune to rows being inserted or deleted between pages.

### When to use cursor vs offset pagination

|                                      | Offset | Cursor |
|--------------------------------------|--------|--------|
| Arbitrary page jump                  | ✓      | ✗      |
| Stable results under inserts/deletes | ✗      | ✓      |
| Scalable to large datasets           | ✗      | ✓      |

### Endpoint

```
GET /{resource}/cursor
```

### Query Parameters

| Param       | Type            | Default | Description                                                     |
|-------------|-----------------|---------|-----------------------------------------------------------------|
| `after`     | string          | —       | Return items **greater than** this cursor                       |
| `before`    | string          | —       | Return items **less than** this cursor                          |
| `sortField` | string          | `id`    | Field to sort and paginate by. id is still used a a tie-breaker |
| `sortDir`   | `ASC` \| `DESC` | `ASC`   | Sort direction for the ORDER BY                                 |
| `limit`     | number          | 20      | Max items per page (max 99)                                     |
| `select`    | string          | —       | Field selection (same as list endpoint)                         |
| `include`   | string          | —       | Relation loading (same as list endpoint)                        |
| `filter`    | string          | —       | Filtering (same as list endpoint)                               |

`after` and `before` cannot be combined. `offset` and `sort` are not available on this endpoint.

### Cursor semantics

- `after=X`: fetch items where `(sortField, id) > (X_sortValue, X_id)`
- `before=X`: fetch items where `(sortField, id) < (X_sortValue, X_id)`
- `sortDir` controls the ORDER BY direction, not the WHERE inequality direction

### Cursor format

- **Default (`sortField=id`):** cursor is the entity ID string, e.g. `usr_01jt...`
- **Custom `sortField`:** cursor is an opaque base64url string encoding both the sort value and entity ID. Treat it as opaque — do not parse it.

### Response shape

```typescript
{
  data: Entity[];
  pageInfo: {
    hasNextPage: boolean;       // more items exist after the last cursor
    hasPreviousPage: boolean;   // more items exist before the first cursor
    startCursor: string | null; // cursor of the first item
    endCursor: string | null;   // cursor of the last item
  }
}
```

### Examples

**First page (default sort by id ASC):**
```
GET /posts?limit=10
```

**Next page using endCursor:**
```
GET /posts/cursor?after=post_01jt...&limit=10
```

**Sort by createdAt DESC (newest first):**
```
GET /posts/cursor?sortField=createdAt&sortDir=DESC&limit=10
```

**Next page with DESC sort — use `before` with endCursor:**
```
GET /posts/cursor?sortField=createdAt&sortDir=DESC&before=<endCursor>&limit=10
```

**With filters and field selection:**
```
GET /posts/cursor?select=title,content&filter=(published,eq,true)&sortField=createdAt&sortDir=DESC&limit=5
```

**Example response:**
```json
{
  "data": [
    { "id": "post_01jt...", "title": "Hello World", "createdAt": "2025-04-28T10:00:00Z" }
  ],
  "pageInfo": {
    "hasNextPage": true,
    "hasPreviousPage": false,
    "startCursor": "post_01jt...",
    "endCursor": "cG9zdF8wMWp0Li4u"
  }
}
```

## File Structure

```
src/lib/crud/
├── controller/
│   ├── base.controller.ts       # Read-only controller base
│   └── crud.controller.ts       # Full CRUD controller
├── entity/
│   ├── base.entity.ts           # Entity base with id, timestamps
│   ├── user-scoped.entity.ts    # Entity base with userId for per-user isolation
│   └── id.ts                    # ULID generation utilities
├── query/
│   ├── cursor-pagination.ts     # Cursor-based pagination
│   ├── query.ts                 # Query parameter types
│   └── typeorm-query-mapper.ts  # Query → TypeORM conversion
├── service/
│   ├── base.service.ts          # Read-only service base
│   └── crud.service.ts          # Full CRUD service
├── transaction/
│   └── transaction.service.ts   # Transaction wrapper
├── testing/                     # Test utilities and specs
└── index.ts                     # Public exports
```

## Best Practices

1. **Extend UserScopedEntity<User> for user-owned resources** — Add `static { UserScopedEntity._userType = User; }` and `getUserType()` to wire the relation lazily
2. **Extend BaseEntity for global resources** - Use with `{ userScoped: false }` in the service constructor
3. **Never put userId in Create DTOs** - For user-scoped entities it is injected from context automatically
4. **Implement idPrefix()** - Required for all entities (3-4 characters)
5. **Use BaseService for read-only** - Prevents accidental mutations
6. **Use CrudService for full CRUD** - Get all CRUD operations automatically
7. **Leverage transactions** - Use `TransactionService` for multi-entity operations
8. **Exclude unnecessary routes** - Use the `exclude` option to minimize API surface
9. **Configure auth per controller** - Use `auth: { mode: "ADMIN" }` or `auth: { publicReads: true }` to fit the resource's access model
10. **Add custom methods** - Extend base classes with domain-specific logic

## Common Patterns

### Global (Non-User-Scoped) API

For resources shared across all users (e.g. categories, tags), where reads are public and writes require admin auth:

```typescript
// Service — explicitly opt out of user scoping
export class CategoryService extends CrudService<Category, CategoryCreateDto, CategoryUpdateDto> {
  constructor(@InjectRepository(Category) repo: Repository<Category>) {
    super("Category", repo, { userScoped: false });
  }
}

// Controller — public reads, admin-only writes
@Controller("categories")
export class CategoryController extends CrudController(Category, CategoryCreateDto, CategoryUpdateDto, {
  auth: { publicReads: true, mode: "ADMIN" }
}) {
  constructor(private readonly categoryService: CategoryService) {
    super();
  }

  get service() {
    return this.categoryService;
  }
}
```

### User-Scoped API

For resources owned by a user (e.g. posts, orders). Extends `UserScopedEntity<User>` and uses the default `userScoped: true`:

```typescript
// Entity
import { User } from "@/models/user/user";
import { UserScopedEntity } from "@/lib/crud/entity/user-scoped.entity";

@Entity("posts")
export class Post extends UserScopedEntity<User> {
  static { UserScopedEntity._userType = User; }

  getUserType() { return User; }
  idPrefix() { return "post_"; }

  @Column()
  title: string;
}

// Service — user scoping is on by default
export class PostService extends CrudService<Post, PostCreateDto, PostUpdateDto> {
  constructor(@InjectRepository(Post) repo: Repository<Post>) {
    super("Post", repo);
  }
}

// Controller
@Controller("posts")
export class PostController extends CrudController(Post, PostCreateDto, PostUpdateDto) {
  constructor(private readonly postService: PostService) {
    super();
  }

  get service() {
    return this.postService;
  }
}
```

The Create DTO must **not** include `userId`:

```typescript
export class PostCreateDto {
  @IsNotEmpty()
  title: string;
  // no userId — it is injected from the authenticated user's context
}
```

### Custom Endpoints

```typescript
@Controller("users")
export class UserController extends CrudController(User, UserCreateDto, UserUpdateDto) {
  constructor(private readonly userService: UserService) {
    super();
  }

  get service() {
    return this.userService;
  }

  @Get("search")
  async search(@Query("q") query: string) {
    return this.userService.list({
      filter: [
        { field: "username", operator: "like", value: `%${query}%` }
      ]
    });
  }
}
```

### Multi-Entity Transactions

```typescript
export class OrderService extends CrudService<Order, CreateOrderDto, UpdateOrderDto> {
  constructor(
    @InjectRepository(Order) repo: Repository<Order>,
    private readonly transactionService: TransactionService,
    private readonly inventoryService: InventoryService,
    private readonly paymentService: PaymentService,
  ) {
    super("Order", repo);
  }

  async createOrder(ctx: ICrudContext, dto: CreateOrderDto): Promise<Order> {
    return this.transactionService.run(async manager => {
      const txOrderService = this.withTransaction(manager);
      const txInventoryService = this.inventoryService.withTransaction(manager);
      const txPaymentService = this.paymentService.withTransaction(manager);

      // All operations in same transaction; userId injected from ctx automatically
      const order = await txOrderService.create(ctx, dto);
      await txInventoryService.decrementStock(dto.items);
      await txPaymentService.createCharge(order.id, dto.amount);

      return order;
    }, { isolationLevel: "SERIALIZABLE" });
  }
}
```
