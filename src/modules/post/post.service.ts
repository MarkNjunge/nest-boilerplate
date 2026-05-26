import { Injectable } from "@nestjs/common";
import { CrudService, TransactionService } from "@/lib/crud";
import { Post, PostCreateDto, PostUpdateDto } from "@/models/post/post";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CommentService } from "@/modules/comment/comment.service";
import { CreatePostWithCommentDto } from "@/models/post/post-with-comment.dto";
import { IReqCtx } from "@/decorators/request-context.decorator";

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

  async feed(ctx: IReqCtx): Promise<Post[]> {
    return this.list({ ...ctx, userScoped: false }, { limit: 20, sort: { updatedAt: "DESC" } });
  }

  async createPostWithComment(ctx: IReqCtx, dto: CreatePostWithCommentDto): Promise<Post> {
    return this.transactionService.run(async manager => {
      const txPostService = this.withTransaction(manager);
      const txCommentService = this.commentService.withTransaction(manager);

      const post = await txPostService.create(ctx, {
        title: dto.title,
        content: dto.content,
        categoryId: dto.categoryId,
      });

      const comment = await txCommentService.create(ctx, {
        content: dto.comment.content,
        postId: post.id,
      });

      return Object.assign(post, { comments: [comment] });
    });
  }
}
