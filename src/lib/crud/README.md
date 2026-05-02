# CRUD Layer

This directory contains the core CRUD (Create, Read, Update, Delete) abstractions for the NestJS boilerplate. It provides base classes for entities, services, and controllers that enable rapid development of REST APIs with minimal boilerplate.

## Architecture

The CRUD layer uses inheritance to separate read and write operations:

### Services

- **BaseService** - Read-only operations: `count`, `list`, `get`, `getById`
- **CrudService extends BaseService** - Adds write operations: `create`, `createBulk`, `update`, `upsert`, `deleteById`, etc.

### Controllers

- **BaseController** - Read-only endpoints (no auth required)
- **CrudController extends BaseController** - Adds write endpoints (auth required)

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

## BaseService

Provides read-only operations for entities.

### Methods

- `count(query?: QueryParams): Promise<number>` - Count entities matching query
- `list(query?: QueryParams): Promise<Entity[]>` - List entities with filtering, sorting, pagination
- `get(query: QueryParams): Promise<Entity | null>` - Get first entity matching query
- `getById(id: string): Promise<Entity>` - Get entity by ID (throws if not found)
- `withTransaction(manager: EntityManager): this` - Create transaction-scoped clone

### Example

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BaseService } from "@/lib/crud";
import { User } from "@/models/user/user.entity";

@Injectable()
export class UserService extends BaseService<User> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super("User", repo);
  }

  // Add custom methods here
  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email } });
  }
}
```

## CrudService

Extends `BaseService` with write operations.

### Additional Methods

- `create(dto: CreateDto): Promise<Entity>` - Create single entity
- `createBulk(dtos: CreateDto[]): Promise<Entity[]>` - Create multiple entities
- `upsert(dto: CreateDto | UpdateDto): Promise<Entity>` - Create or update based on unique fields
- `upsertBulk(dtos: (CreateDto | UpdateDto)[]): Promise<Entity[]>` - Bulk upsert
- `update(id: string, dto: UpdateDto): Promise<Entity>` - Update entity by ID
- `updateIndexed(dto: UpdateDto & { id: string }): Promise<Entity>` - Update with ID in DTO
- `deleteById(id: string): Promise<void>` - Delete entity by ID
- `deleteIndexed(dto: { id: string }): Promise<void>` - Delete with ID in DTO

### Example

```typescript
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CrudService } from "@/lib/crud";
import { User } from "@/models/user/user.entity";
import { CreateUserDto, UpdateUserDto } from "@/models/user/user.dto";

@Injectable()
export class UserService extends CrudService<User, CreateUserDto, UpdateUserDto> {
  constructor(@InjectRepository(User) repo: Repository<User>) {
    super("User", repo);
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
import { ApiTags } from "@nestjs/swagger";
import { BaseController } from "@/lib/crud";
import { User } from "@/models/user/user.entity";
import { UserService } from "./user.service";

@ApiTags("Users")
@Controller("users")
export class UserController extends BaseController(User) {
  constructor(private readonly userService: UserService) {
    super(userService);
  }
}
```

## CrudController

Extends `BaseController` with write endpoints (requires authentication).

### Additional Routes

- `POST /` - Create entity
- `POST /bulk` - Create multiple entities
- `PUT /` - Upsert entity
- `PATCH /:id` - Update entity
- `DELETE /:id` - Delete entity

### Example

```typescript
import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CrudController } from "@/lib/crud";
import { User } from "@/models/user/user.entity";
import { CreateUserDto, UpdateUserDto } from "@/models/user/user.dto";
import { UserService } from "./user.service";

@ApiTags("Users")
@Controller("users")
export class UserController extends CrudController(User, CreateUserDto, UpdateUserDto) {
  constructor(private readonly userService: UserService) {
    super(userService);
  }
}
```

## Route Exclusion

Both `BaseController` and `CrudController` accept an optional `options` parameter to exclude specific routes:

```typescript
// BaseController — exclude specific read-only routes
BaseController(User, { exclude: ["listCursor"] })

// CrudController — exclude any base or crud route
CrudController(User, CreateUserDto, UpdateUserDto, {
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
import { Post } from "@/models/post/post.entity";
import { CreatePostDto, UpdatePostDto } from "@/models/post/post.dto";
import { CommentService } from "@/modules/comment/comment.service";

@Injectable()
export class PostService extends CrudService<Post, CreatePostDto, UpdatePostDto> {
  constructor(
    @InjectRepository(Post) repo: Repository<Post>,
    private readonly transactionService: TransactionService,
    private readonly commentService: CommentService,
  ) {
    super("Post", repo);
  }

  async createPostWithComment(dto: CreatePostWithCommentDto): Promise<Post> {
    return this.transactionService.run(async manager => {
      // Create transaction-scoped service clones
      const txPostService = this.withTransaction(manager);
      const txCommentService = this.commentService.withTransaction(manager);

      // All operations use the same transaction
      const post = await txPostService.create({
        title: dto.title,
        content: dto.content,
        userId: dto.userId
      });

      const comment = await txCommentService.create({
        content: dto.comment.content,
        userId: dto.userId,
        postId: post.id
      });

      return Object.assign(post, { comments: [comment] });
    });
  }

  async createWithIsolation(dto: CreatePostDto): Promise<Post> {
    // Specify custom isolation level
    return this.transactionService.run(
      async manager => {
        const txService = this.withTransaction(manager);
        return txService.create(dto);
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
- `sort=(field,ASC):(field2,DESC)` - Sorting
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

1. **Always extend BaseEntity** - Ensures consistent IDs and timestamps
2. **Implement idPrefix()** - Required for all entities (3-4 characters)
3. **Use BaseService for read-only** - Prevents accidental mutations
4. **Use CrudService for full CRUD** - Get all CRUD operations automatically
5. **Leverage transactions** - Use `TransactionService` for multi-entity operations
6. **Exclude unnecessary routes** - Use the `exclude` option to minimize API surface
7. **Add custom methods** - Extend base classes with domain-specific logic
8. **Test with QueryParams** - Use the query system for flexible filtering

## Common Patterns

### Read-Only API

```typescript
// Service
export class CategoryService extends BaseService<Category> {
  constructor(@InjectRepository(Category) repo: Repository<Category>) {
    super("Category", repo);
  }
}

// Controller
@Controller("categories")
export class CategoryController extends BaseController(Category) {
  constructor(private readonly categoryService: CategoryService) {
    super(categoryService);
  }
}
```

### Full CRUD API

```typescript
// Service
export class ProductService extends CrudService<Product, CreateProductDto, UpdateProductDto> {
  constructor(@InjectRepository(Product) repo: Repository<Product>) {
    super("Product", repo);
  }
}

// Controller
@Controller("products")
export class ProductController extends CrudController(Product, CreateProductDto, UpdateProductDto) {
  constructor(private readonly productService: ProductService) {
    super(productService);
  }
}
```

### Custom Endpoints

```typescript
@Controller("users")
export class UserController extends CrudController(User, CreateUserDto, UpdateUserDto) {
  constructor(private readonly userService: UserService) {
    super(userService);
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

  async createOrder(dto: CreateOrderDto): Promise<Order> {
    return this.transactionService.run(async manager => {
      const txOrderService = this.withTransaction(manager);
      const txInventoryService = this.inventoryService.withTransaction(manager);
      const txPaymentService = this.paymentService.withTransaction(manager);

      // All operations in same transaction
      const order = await txOrderService.create(dto);
      await txInventoryService.decrementStock(dto.items);
      await txPaymentService.createCharge(order.id, dto.amount);

      return order;
    }, { isolationLevel: "SERIALIZABLE" });
  }
}
```
