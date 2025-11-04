import { Injectable } from "@nestjs/common";
import { CrudService } from "@/db/crud/crud.service";
import { Post, PostCreateDto, PostUpdateDto } from "@/models/post/post";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class PostService extends CrudService<
  Post,
  PostCreateDto,
  PostUpdateDto
> {
  constructor(
    @InjectRepository(Post)
    protected readonly postRepository: Repository<Post>
  ) {
    super("Post", postRepository);
  }
}
