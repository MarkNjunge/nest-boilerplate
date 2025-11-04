import { Controller } from "@nestjs/common";
import { CrudController } from "@/db/crud/crud.controller";
import { Post, PostCreateDto, PostUpdateDto } from "@/models/post/post";
import { PostService } from "@/modules/post/post.service";

@Controller("post")
export class PostController extends CrudController(
  Post,
  PostCreateDto,
  PostUpdateDto
)<PostCreateDto, PostUpdateDto> {
  constructor(protected readonly postService: PostService) {
    super(postService);
  }
}
