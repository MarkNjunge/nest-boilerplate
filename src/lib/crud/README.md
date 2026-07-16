# CRUD Layer

This directory contains the core CRUD (Create, Read, Update, Delete) abstractions for the NestJS boilerplate. 
It provides base classes for entities, services, and controllers that enable rapid development of REST APIs with minimal boilerplate.

## Architecture

The CRUD layer uses inheritance to separate read and write operations:

### Folder Structure

```
src/lib/crud/
├── controller/
│   ├── base.controller.ts           # Read-only controller base
│   ├── crud.controller.ts           # Full CRUD controller
│   └── controller-exclude.spec.ts   # Route exclusion tests
├── entity/
│   ├── base.entity.ts               # Entity base with id, timestamps
│   ├── user-scoped.entity.ts        # Entity base with userId for per-user isolation
│   └── id.ts                        # ULID generation utilities
├── query/
│   ├── index.ts                     # Barrel exports
│   ├── query.type.ts                # Types: Filter, Sort, Select, Include, Query
│   ├── query.dto.ts                 # DTOs for raw query parameters
│   ├── query.parser.ts              # Parsing raw query strings into Query objects
│   ├── query.validator.ts           # Validation decorators (IsValidFilter, IsValidSort)
│   └── typeorm-query-mapper.ts      # Query → TypeORM conversion
├── cache/
│   └── i-cache.service.ts           # ICacheService interface
├── service/
│   ├── base.service.ts              # Read-only service base
│   ├── crud.service.ts              # Full CRUD service
│   └── crud-cache.service.ts        # Full CRUD service with caching
├── transaction/
│   └── transaction.service.ts       # Transaction wrapper
├── testing/                         # Test utilities and specs
├── plopfile.ts                      # Code generation configuration
├── plop-templates/                  # Code generation templates
├── utils/                           # Internal utilities (context, crypto, constants, etc.)
└── index.ts                         # Public exports
```

### Entities

- **BaseEntity** - Provides `id` generation (ULID with prefix), `createdAt`, and `updatedAt` timestamps. The base type for all resources.
- **UserScopedEntity** - Extends `BaseEntity` with a `userId` column and `@ManyToOne` relation to the project's `User` model. 
  Services automatically filter all queries by the authenticated user's ID.

### Services

- **BaseService** - Read-only operations
- **CrudService** - Extends BaseService with write operations
- **CrudCacheService** - Extends CrudService with automatic caching

### Controllers

- **BaseController** - Read-only endpoints
- **CrudController extends BaseController** - Adds write endpoints

Use `BaseService`/`BaseController` for read-only access, `CrudService`/`CrudController` for full CRUD.

## Entities

### BaseEntity

All entities should extend `BaseEntity` which provides:
- `id`: ULID-based string with entity-specific prefix
- `createdAt`: Auto-managed creation timestamp
- `updatedAt`: Auto-managed update timestamp

```typescript
import { Entity, Column } from "typeorm";
import { BaseEntity } from "@/lib/crud";

@Entity("users")
export class User extends BaseEntity {
  @Column()
  username: string;

  @Column()
  email: string;
  
  idPrefix(): string {
    return "usr_";
  }
}
```

### UserScopedEntity

Extends `BaseEntity` for resources that belong to a specific user. It adds a `userId` column and a `@ManyToOne` relation
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

  @Column()
  title: string;

  getUserType() {
    return User;
  }

  idPrefix(): string {
    return "post_";
  }
}
```

**Do not include `userId` in Create DTOs** for user-scoped entities - it is injected automatically from the
authenticated user's context and any value provided in the request body is ignored.

## Services

### ServiceOptions

Services accept a `ServiceOptions` object in the constructor:

| Option       | Type      | Default | Description                                                                                                                                              |
|--------------|-----------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| `userScoped` | `boolean` | `true`  | When `true`, all queries are automatically filtered by the authenticated user's `userId`. Set to `false` for global resources (e.g. `User`, `Category`). |

### ICrudContext

All service methods accept an `ICrudContext` as their first argument:

| Field        | Type                 | Description                                                                                                    |
|--------------|----------------------|----------------------------------------------------------------------------------------------------------------|
| `traceId`    | `string`             | Request trace ID for logging/debugging                                                                         |
| `user`       | `{ userId: string }` | Authenticated user; required when scoping is active                                                            |
| `userScoped` | `boolean`            | Per-call override; when `false`, bypasses user filtering for that call regardless of the service-level default |

### BaseService

Provides read-only operations for entities. All methods accept an `ICrudContext` as their first argument, which carries
the authenticated user's ID used for user-scoped filtering.

#### Methods
- `count(ctx: ICrudContext, query?: Query): Promise<number>` - Count entities matching query
- `list(ctx: ICrudContext, query?: Query): Promise<Entity[]>` - List entities with filtering, sorting, pagination
- `get(ctx: ICrudContext, query: Query): Promise<Entity | null>` - Get first entity matching query
- `getById(ctx: ICrudContext, id: string): Promise<Entity | null>` - Get entity by ID
- `listCursor(ctx: ICrudContext, query?: Query): Promise<CursorPaginationResult<Entity>>` - Cursor-based pagination
- `withTransaction(manager: EntityManager): this` - Create transaction-scoped clone

#### Pagination Limits

List and cursor endpoints enforce a default limit of `20` and a maximum limit of `99` via `DEFAULT_ROW_LIMIT` and 
`MAX_ROW_LIMIT` in `crud-consts.ts`.

These limits only apply to query-based operations — internal service calls (e.g. calls to `list()` from within another service method) are not capped.

#### Metrics

`BaseService` emits OpenTelemetry counters and histograms via `crud_operations_total` and `crud_operation_duration_seconds` with the following attributes:

- `entity` — the resource name (e.g. `"User"`)
- `operation` — the method name in snake_case (e.g. `"list"`, `"get_by_id"`)
- `status` — `"success"` or `"failure"`

#### Example

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

### CrudService

Extends `BaseService` with write operations.

When `userScoped` is `true` (the default), `userId` is automatically
injected from context on create and all updates/deletes are scoped to the current user.

#### Methods

- `create(ctx: ICrudContext, dto: CreateDto): Promise<Entity>` - Create entity; injects `userId` from context
- `createBulk(ctx: ICrudContext, dtos: CreateDto[]): Promise<Entity[]>` - Create multiple entities
- `upsert(ctx: ICrudContext, dto: CreateDto | UpdateDto): Promise<Entity>` - Create or update
- `upsertBulk(ctx: ICrudContext, dtos: (CreateDto | UpdateDto)[]): Promise<Entity[]>` - Bulk upsert
- `update(ctx: ICrudContext, id: string, dto: UpdateDto): Promise<Entity | null>` - Update by ID (scoped to user)
- `updateIndexed(ctx: ICrudContext, filter: Filter, dto: UpdateDto): Promise<Entity[]>` - Update matching records
- `deleteById(ctx: ICrudContext, id: string): Promise<number>` - Delete by ID (scoped to user); returns affected count
- `deleteIndexed(ctx: ICrudContext, filter: Filter): Promise<number>` - Delete matching records

#### Metrics

`CrudService` inherits the `BaseService` metrics (`crud_operations_total`, `crud_operation_duration_seconds`) with the 
same attributes. All write methods (create, update, delete, etc.) are tracked with the operation name in 
snake_case and `status` set to `"success"` or `"failure"`.

#### Example

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
    super("Post", repo);
  }
}
```

### CrudCacheService

Extends `CrudService` with caching for read operations and automatic cache invalidation.

It uses a **generation-based invalidation** strategy.

> **⚠️ Warning:** Bypassing the service and modifying the database directly (e.g. via the repository or raw queries) 
> will lead to a stale cache. Always use service methods to ensure proper cache invalidation, or clear the cache by calling invalidateCache().

#### ICacheService Interface

`CrudCacheService` depends on an `ICacheService` implementation (see [ICacheService](cache/i-cache.service.ts)):

The project provides a Redis-based implementation via `CacheService` in [`src/modules/_cache/cache.service.ts`](../../modules/_cache/cache.service.ts).

#### Usage

Extend `CrudCacheService` instead of `CrudService`, provide an `ICacheService`, and implement `cacheNs()`:

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudCacheService } from "@/lib/crud/service/crud-cache.service";
import { CacheService } from "@/modules/_cache/cache.service";
import { Category, CategoryCreateDto, CategoryUpdateDto } from "@/models/category/category";

@Injectable()
export class CategoryService extends CrudCacheService<Category, CategoryCreateDto, CategoryUpdateDto> {
  constructor(
    @InjectRepository(Category) repo: Repository<Category>,
    cacheService: CacheService,
  ) {
    super("Category", repo, cacheService, { userScoped: false });
  }

  cacheNs(ctx: ICrudContext): string {
    return "categories";
  }
}
```

The only additional requirement is `cacheNs(ctx)` - a method that returns the namespace prefix for all cache keys
(e.g. `"categories"`). This is typically a static identifier for the resource.

**Important:** For user scoped entities, ensure the `user_id` from `ctx` is used.

#### How It Works

##### Read Caching

Read operations (`list`, `get`, `getById`, `listCursor`) check Redis before hitting the database. On a cache miss,
the result is fetched from the database and stored in cache with a configurable TTL, if it is not null.

##### Invalidation

Instead of tracking and deleting every individual query cache on each write, the service uses a **generation counter**:

1. A cache key (`{cacheNs}:gen`) stores a monotonically incrementing integer.
2. Query-based cache keys embed this generation:
   ```
   {cacheNs}:list:{gen}:{sha1(query)}
   {cacheNs}:get:{gen}:{sha1(query)}
   {cacheNs}:list_cursor:{gen}:{sha1(query)}
   ```
3. On any write operation, the generation is incremented via `incr`, instantly invalidating all query-based caches
   without needing to enumerate them.

Individual entity caches (keyed `{cacheNs}:{id}`) are explicitly deleted on mutation, since they are not tied to the
generation counter.

| Method            | Invalidation                                  |
|-------------------|-----------------------------------------------|
| `create`          | increments generation                         |
| `createBulk`      | increments generation                         |
| `upsert`          | increments generation + deletes per-ID cache  |
| `upsertBulk`      | increments generation + deletes per-ID caches |
| `update`          | increments generation + deletes per-ID cache  |
| `updateIndexed`   | increments generation + deletes per-ID caches |
| `deleteById`      | increments generation + deletes per-ID cache  |
| `deleteIndexed`   | increments generation + deletes per-ID caches |

#### Configuration

| Property    | Default    | Description                         |
|-------------|------------|-------------------------------------|
| `CACHE_TTL` | `300` (5m) | TTL in seconds for cached entries   |

Override `CACHE_TTL` in your subclass to adjust the TTL

#### Metrics

`CrudCacheService` emits OpenTelemetry counters via `crud_cache_operations_total` with the following attributes:

- `entity` - the resource name (e.g. `"Category"`)
- `operation` - the method name in snake_case (e.g. `"list"`, `"get_by_id"`)
- `result` - `"hit"` or `"miss"`

### User Scoping

User scoping is on by default

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
// Public feed - list all posts regardless of author
const feed = await this.postService.list({ ...ctx, userScoped: false }, query);

// Admin - fetch any user's post by ID
const post = await this.postService.getById({ ...ctx, userScoped: false }, id);
```

**Important:** Authorization for who may make these calls is enforced by the guard layer in the app, not the service.

## Controllers

### BaseController

Provides read-only HTTP endpoints.

#### Routes

| Method | Route     | Name         | Description                                |
|--------|-----------|--------------|--------------------------------------------|
| GET    | `/count`  | `count`      | Count entities                             |
| GET    | `/`       | `list`       | List entities with query support           |
| GET    | `/first`  | `get`        | Get first entity matching query            |
| GET    | `/cursor` | `listCursor` | Cursor-based paginated list                |
| GET    | `/:id`    | `getById`    | Get entity by ID                           |

#### Example

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

The `service` getter is required - the base controller accesses `this.service` to delegate to the service layer. The `super()` call takes no arguments.

> **Note:** `BaseController` accepts an optional second generic type parameter for the service type. This allows you to use a `CrudService` (which extends `BaseService`) as the backing service while only exposing read routes via the API — useful when you want to expose only reads publicly but use write methods internally (e.g. in other services or via transactions).

### CrudController

Extends `BaseController` with write endpoints. Auth is required by default (configurable via `options.auth`).

#### Routes

| Method | Route   | Name            | Description                                      |
|--------|---------|-----------------|--------------------------------------------------|
| POST   | `/`     | `create`        | Create entity                                    |
| POST   | `/bulk` | `createBulk`    | Create multiple entities                         |
| PUT    | `/`     | `upsert`        | Create or update entity (upsert)                 |
| PUT    | `/bulk` | `upsertBulk`    | Bulk upsert (create or update multiple entities) |
| PATCH  | `/`     | `updateIndexed` | Update entities matching a filter                |
| PATCH  | `/:id`  | `update`        | Update entity by ID                              |
| DELETE | `/`     | `deleteIndexed` | Delete entities matching a filter                |
| DELETE | `/:id`  | `deleteById`    | Delete entity by ID                              |

#### Example

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

### Route Exclusion

Both `BaseController` and `CrudController` accept an optional `options` parameter to exclude specific routes:

```typescript
// BaseController - exclude specific read-only routes
BaseController(User, { exclude: ["listCursor"] })

// CrudController - exclude any base or crud route
CrudController(User, UserCreateDto, UserUpdateDto, {
  exclude: ["deleteById", "createBulk"]
})
```

Excluded methods are removed from the controller prototype, so NestJS never registers them as routes.

### Auth Configuration

The `options` object accepts an `auth` field to control how authentication is applied:

| Value                                  | Behaviour                                                      |
|----------------------------------------|----------------------------------------------------------------|
| _(omitted)_                            | (default) All routes require auth. No auth mode is specified.  |
| `{ mode: "ADMIN" }`                    | All routes require `ADMIN` mode auth                           |
| `{ publicReads: true }`                | Read routes are public; write routes require auth              |
| `{ publicReads: true, mode: "ADMIN" }` | Read routes are public; write routes require `ADMIN` mode auth |
| `false`                                | Auth guard is not applied to any route                         |

```typescript
// Default - all routes require user auth
CrudController(Post, PostCreateDto, PostUpdateDto)

// Admin-only (e.g. user management)
CrudController(User, UserCreateDto, UserUpdateDto, { auth: { mode: "ADMIN" } })

// Public catalogue - anyone can read, only admins can write
CrudController(Category, CategoryCreateDto, CategoryUpdateDto, {
  auth: { publicReads: true, mode: "ADMIN" }
})

// Fully public (no guard at all)
BaseController(Announcement, { auth: false })
```

When `publicReads: true` is set on a `CrudController`, read routes (inherited from `BaseController`) have no guard, 
while write routes have the guard applied at the method level. This means `ctx.user` may be `undefined` on read handlers - design accordingly.

## Transactions

The `TransactionService` provides a reusable wrapper around TypeORM's transactions for atomic multi-entity operations.

### Key Features

- **Service Reuse**: Use `withTransaction(manager)` to create transaction-scoped service clones
- **Automatic Rollback**: TypeORM automatically rolls back on errors
- **Isolation Levels**: Support for `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`

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

### Query Parameters

| Parameter | Description                                                                                                                      |
|-----------|----------------------------------------------------------------------------------------------------------------------------------|
| `select`  | Comma-separated field names to return (supports dot-notation for nested relations, e.g. `title,comments.content,user.username`)  |
| `include` | Comma-separated relation names to eager-load (supports dot-notation for nested relations, e.g. `comments,user,user.profile`)     |
| `filter`  | Filter expressions in `(field,operator,value)` format, colon-separated for multiple filters                                      |
| `sort`    | Sort expressions in `(field,direction)` format, colon-separated for multiple columns; supports dot-notation for nested relations |
| `limit`   | Number of results to return (default: `20`, max: `99`)                                                                           |
| `offset`  | Number of results to skip (offset pagination only)                                                                               |


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
- `raw` - Raw SQL (use with caution). Not available via API.

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

**Complex multi-relation select & include** (multiple relations, deeply nested fields, and relation traversal through multiple levels):

```
GET /posts?select=title,category.name,user.username,user.profile.bio&include=category,user,user.profile
```

This query:
- Selects the root field `title` from the Post entity
- Selects `name` from the direct `category` relation
- Selects `username` from the direct `user` relation
- Selects `bio` from the deeply nested `user.profile` relation (User → UserProfile)
- Includes all three relations: `category`, `user`, and `user.profile` (the `user.profile` include is required to traverse through `user` into its `profile` sub-relation)

> **Rule of thumb:** every dot-separated path in `select` (e.g. `user.profile.bio`) must have its corresponding
> relation chain listed in `include` (e.g. `user,user.profile`). Top-level relation names like `category` require their
> own `include` entry regardless of nesting depth.

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

```
GET /{resource}/cursor
```

### Query Parameters

| Param       | Type            | Default | Description                                                     |
|-------------|-----------------|---------|-----------------------------------------------------------------|
| `after`     | string          | -       | Return items **greater than** this cursor                       |
| `before`    | string          | -       | Return items **less than** this cursor                          |
| `sortField` | string          | `id`    | Field to sort and paginate by. id is still used a a tie-breaker |
| `sortDir`   | `ASC` \| `DESC` | `ASC`   | Sort direction for the ORDER BY                                 |
| `limit`     | number          | 20      | Max items per page (max 99)                                     |
| `select`    | string          | -       | Field selection (same as list endpoint)                         |
| `include`   | string          | -       | Relation loading (same as list endpoint)                        |
| `filter`    | string          | -       | Filtering (same as list endpoint)                               |

`after` and `before` cannot be combined. `offset` and `sort` are not available on this endpoint.

### Cursor semantics

- `after=X`: fetch items where `(sortField, id) > (X_sortValue, X_id)`
- `before=X`: fetch items where `(sortField, id) < (X_sortValue, X_id)`
- `sortDir` controls the ORDER BY direction, not the WHERE inequality direction

### Cursor format

- **With default `sortField`(`id`):** cursor is the entity ID string, e.g. `usr_01jt...`
- **With custom `sortField`:** cursor is an base64url string encoding both the sort value and entity ID. Treat it as opaque - do not parse it.

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
GET /posts/cursor?limit=10

{
  "data": [],
  "pageInfo": {
    "hasNextPage": true,
    "hasPreviousPage": false,
    "startCursor": "post_247wh",
    "endCursor": "post_p1mn7"
  }
}
```

**Next page using `endCursor`:**
```
GET /posts/cursor?limit=10&after=post_p1mn7

{
  "data": [],
  "pageInfo": {
    "hasNextPage": true,
    "hasPreviousPage": true,
    "startCursor": "post_45qcy",
    "endCursor": "post_hq6t2"
  }
}
```

**Sort by createdAt DESC (newest first):**
```
GET /posts/cursor?sortField=createdAt&sortDir=DESC&limit=10
```

**Next page with DESC sort - use `before` with endCursor:**
```
GET /posts/cursor?sortField=createdAt&sortDir=DESC&before=<endCursor>&limit=10
```

**With filters and field selection:**
```
GET /posts/cursor?select=title,content&filter=(published,eq,true)&sortField=createdAt&sortDir=DESC&limit=5
```

## Testing

### Unit & Integration Tests

The CRUD library includes an exhaustive test suite covering every component in isolation and in combination. Tests are 
co-located with source files as `*.spec.ts` and use Jest with [testcontainers](https://testcontainers.com/) for PostgreSQL-backed integration scenarios.

Key test areas:

- **Query parser** — Validates parsing, validation, and TypeORM mapping for every filter operator, sort direction, 
  field selection, and relation loading combination.
- **Services** — Covers all BaseService, CrudService, and CrudCacheService methods including user scoping, cursor 
  pagination, transactions, and cache hit/miss scenarios.
- **Controllers** — Tests route exclusion, auth configuration, and HTTP layer integration for both BaseController and CrudController.

Run with:

```bash
npm run test
```

### End-to-End Tests

The E2E test suite is **exhaustive**, covering every layer of the CRUD system, the query parser, cache invalidation, 
and transactional behaviour in a real Docker environment.

A Docker Compose stack creates isolated PostgreSQL and Redis containers, builds the application, and runs the 
test suite against the live server.

Test Files:

- `spec/crud.e2e-spec.ts` — **Full CRUD lifecycle**: create, list, get, update (patch), delete, bulk/create-bulk, upsert, bulk-upsert, `updateIndexed`, `deleteIndexed`; field selection (`select`) and relation loading (`include`) on both reads and writes; error cases (validation, missing auth, missing filter); complex multi-relation nested queries
- `spec/pagination.e2e-spec.ts` — **Cursor-based pagination**: `after` / `before` cursors, filter + limit, page info (`hasNextPage`, `hasPreviousPage`, `startCursor`, `endCursor`), mutual-exclusion of `after` and `before`
- `spec/transactions.e2e-spec.ts` — **Atomic transactions**: multi-entity create with rollback on failure, verification that both entities persist on success and neither persists on failure
- `spec/nesting.e2e-spec.ts` — **Nested select & include**: one-to-many relations (`comments`), deeply nested relations (`comments.user`), relation-only fields (`id`, `comments.id`, `comments.user.username`)
- `spec/caching.e2e-spec.ts` — **Generation-based cache invalidation**: verifies that every write operation (create, createBulk, upsert, upsertBulk, update, updateIndexed, deleteById, deleteIndexed) bumps the generation and invalidates list, get (`/first`), and cursor caches; also verifies per-ID cache deletion

All tests use [supertest](https://www.npmjs.com/package/supertest) and run against a real PostgreSQL and Redis instance. Each test file creates isolated test users and data to avoid cross-contamination.

Running E2E Tests:

```bash
# Run e2e tests in Docker (isolated stack, no local deps required)
npm run test:e2e

# Run e2e tests locally (requires a running app instance)
# Set TEST_API_HOST (default http://localhost:3000) and TEST_ADMIN_KEY to configure
npm run test:e2e:local
```

## Best Practices

1. **Extend UserScopedEntity<User> for user-owned resources** - Add `static { UserScopedEntity._userType = User; }` and `getUserType()` to wire the relation lazily
2. **Extend BaseEntity for global resources** - Use with `{ userScoped: false }` in the service constructor
3. **Never put userId in Create/Update DTOs** - For user-scoped entities it is injected from context automatically
4. **Implement idPrefix()** - Required for all entities (3-4 characters)
5. **Use BaseService for read-only** - Prevents accidental mutations
6. **Use CrudService for full CRUD** - Get all CRUD operations automatically
7. **Enable caching** - Extend `CrudCacheService` instead of `CrudService` to add read caching and automatic invalidation for frequently-read resources
8. **Leverage transactions** - Use `TransactionService` for multi-entity operations
9. **Exclude unnecessary routes** - Use the `exclude` option to minimize API surface
10. **Configure auth per controller** - Use `auth: { mode: "ADMIN" }` or `auth: { publicReads: true }` to fit the resource's access model
11. **Add custom methods** - Extend base classes with domain-specific logic

## Common Patterns

### Global (Non-User-Scoped) API

For resources shared across all users (e.g. categories, tags), where reads are public and writes require admin auth:

```typescript
// Entity - extends BaseEntity
@Entity({ name: "categories" })
export class Category extends BaseEntity {
  @ApiProperty()
  @Column()
  name: string;

  idPrefix(): string {
    return "cat_";
  }
}

// Service - explicitly opt out of user scoping
export class CategoryService extends CrudService<Category, CategoryCreateDto, CategoryUpdateDto> {
  constructor(@InjectRepository(Category) repo: Repository<Category>) {
    super("Category", repo, { userScoped: false });
  }
}

// Controller - public reads, admin-only writes
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
// Entity - Extends UserScopedEntity
@Entity("posts")
export class Post extends UserScopedEntity<User> {
  static { UserScopedEntity._userType = User; }

  getUserType() { return User; }
  idPrefix() { return "post_"; }

  @Column()
  title: string;
}

// Service - user scoping is on by default
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
  // no userId - it is injected from the authenticated user's context
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
