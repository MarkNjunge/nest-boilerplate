import { Body, Controller, Post as HttpPost, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiSecurity } from "@nestjs/swagger";
import { CrudController } from "@/db/crud/crud.controller";
import { Post, PostCreateDto, PostUpdateDto } from "@/models/post/post";
import { PostService } from "@/modules/post/post.service";
import { CreatePostWithCommentDto } from "@/models/post/post-with-comment.dto";
import { AuthGuard } from "@/guards/auth.guard";

@Controller("post")
export class PostController extends CrudController(
  Post,
  PostCreateDto,
  PostUpdateDto
)<PostCreateDto, PostUpdateDto> {
  constructor(protected readonly postService: PostService) {
    super(postService);
  }

  @HttpPost("/with-comment")
  @UseGuards(AuthGuard)
  @ApiSecurity("api-key")
  @ApiOperation({ summary: "Create a post with a comment in a single transaction" })
  @ApiBody({ type: CreatePostWithCommentDto })
  @ApiResponse({ status: 201, type: Post })
  async createPostWithComment(
    @Body() dto: CreatePostWithCommentDto,
  ): Promise<Post> {
    return this.postService.createPostWithComment(dto);
  }
}
