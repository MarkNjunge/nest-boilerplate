import { Controller } from "@nestjs/common";
import { CrudController } from "@/lib/crud";
import {
  Comment,
  CommentCreateDto,
  CommentUpdateDto,
} from "@/models/comment/comment";
import { CommentService } from "@/modules/comment/comment.service";

@Controller("comments")
export class CommentController extends CrudController(
  Comment,
  CommentCreateDto,
  CommentUpdateDto,
  { exclude: ["list", "listCursor"] }
) {
  constructor(protected readonly commentService: CommentService) {
    super();
  }

  get service() {
    return this.commentService;
  }
}
