import { Controller } from "@nestjs/common";
import { CrudController } from "@/db/crud/crud.controller";
import {
  Comment,
  CommentCreateDto,
  CommentUpdateDto,
} from "@/models/comment/comment";
import { CommentService } from "@/modules/comment/comment.service";

@Controller("comment")
export class CommentController extends CrudController(
  Comment,
  CommentCreateDto,
  CommentUpdateDto
)<CommentCreateDto, CommentUpdateDto> {
  constructor(protected readonly commentService: CommentService) {
    super(commentService);
  }
}
