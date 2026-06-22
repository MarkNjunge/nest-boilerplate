import { Body, Controller, Get, Post as HttpPost, Query, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity } from "@nestjs/swagger";
import { CrudController, CursorRawQuery, RestrictedCursorRawQuery, parseRawQuery } from "@/lib/crud";
import { Post, PostCreateDto, PostUpdateDto } from "@/models/post/post";
import { PostService } from "@/modules/post/post.service";
import { CreatePostWithCommentDto } from "@/models/post/post-with-comment.dto";
import { AuthGuard } from "@/guards/auth.guard";
import { IReqCtx, ReqCtx } from "@/decorators/request-context.decorator";

@Controller("posts")
export class PostController extends CrudController(
  Post,
  PostCreateDto,
  PostUpdateDto
) {
  constructor(protected readonly postService: PostService) {
    super();
  }

  get service() {
    return this.postService;
  }

  @Get("/feed")
  @ApiOperation({ summary: "Get posts feed" })
  @ApiResponse({ status: 200, type: Post, isArray: true })
  async feed(@ReqCtx() ctx: IReqCtx, @Query() query: RestrictedCursorRawQuery) {
    const fullQuery: CursorRawQuery = {
      // eslint-disable-next-line @typescript-eslint/no-misused-spread
      ...query,
      sortField: "updatedAt",
      sortDir: "DESC"
    };
    return this.postService.listCursor({ ...ctx, userScoped: false }, parseRawQuery(fullQuery, true));
  }

  @HttpPost("/with-comment")
  @UseGuards(AuthGuard)
  @ApiSecurity("api-key")
  @ApiOperation({ summary: "Create a post with a comment in a single transaction" })
  @ApiBody({ type: CreatePostWithCommentDto })
  @ApiResponse({ status: 201, type: Post })
  async createPostWithComment(
    @ReqCtx() ctx: IReqCtx,
    @Body() dto: CreatePostWithCommentDto,
  ): Promise<Post> {
    return this.postService.createPostWithComment(ctx, dto);
  }
}
