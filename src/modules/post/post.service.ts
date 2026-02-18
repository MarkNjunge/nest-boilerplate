import { Injectable } from "@nestjs/common";
import { CrudService } from "@/db/crud/crud.service";
import { Post, PostCreateDto, PostUpdateDto } from "@/models/post/post";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { TransactionService } from "@/db/transaction/transaction.service";
import { CommentService } from "@/modules/comment/comment.service";
import { CreatePostWithCommentDto } from "@/models/post/post-with-comment.dto";

@Injectable()
export class PostService extends CrudService<
  Post,
  PostCreateDto,
  PostUpdateDto
> {
  constructor(
    @InjectRepository(Post)
    protected readonly postRepository: Repository<Post>,
    private readonly transactionService: TransactionService,
    private readonly commentService: CommentService,
  ) {
    super("Post", postRepository);
  }

  async createPostWithComment(dto: CreatePostWithCommentDto): Promise<Post> {
    return this.transactionService.run(async manager => {
      const txPostService = this.withTransaction(manager);
      const txCommentService = this.commentService.withTransaction(manager);

      const post = await txPostService.create({
        title: dto.title,
        content: dto.content,
        userId: dto.userId,
        categoryId: dto.categoryId,
      });

      const comment = await txCommentService.create({
        content: dto.comment.content,
        userId: dto.userId,
        postId: post.id,
      });

      return Object.assign(post, { comments: [comment] });
    });
  }
}
