import { Injectable } from "@nestjs/common";
import { CrudService } from "@/db/crud/crud.service";
import {
  Comment,
  CommentCreateDto,
  CommentUpdateDto,
} from "@/models/comment/comment";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class CommentService extends CrudService<
  Comment,
  CommentCreateDto,
  CommentUpdateDto
> {
  constructor(
    @InjectRepository(Comment)
    protected readonly commentRepository: Repository<Comment>
  ) {
    super("Comment", commentRepository);
  }
}
