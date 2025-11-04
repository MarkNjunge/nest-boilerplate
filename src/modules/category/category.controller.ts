import { Controller } from "@nestjs/common";
import { CrudController } from "@/db/crud/crud.controller";
import { Category, CategoryCreateDto, CategoryUpdateDto } from "@/models/category/category";
import { CategoryService } from "@/modules/category/category.service";

@Controller("category")
export class CategoryController extends CrudController(Category, CategoryCreateDto, CategoryUpdateDto)<CategoryCreateDto, CategoryUpdateDto> {
  constructor(
    protected readonly categoryService: CategoryService
  ) {
    super(categoryService);
  }
}
