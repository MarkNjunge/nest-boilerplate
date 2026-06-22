import { Controller } from "@nestjs/common";
import { CrudController } from "@/lib/crud";
import { Category, CategoryCreateDto, CategoryUpdateDto } from "@/models/category/category";
import { CategoryService } from "@/modules/category/category.service";

@Controller("categories")
export class CategoryController extends CrudController(
  Category,
  CategoryCreateDto,
  CategoryUpdateDto,
  {
    auth: { publicReads: true, mode: "ADMIN" }
  }
) {
  constructor(
    protected readonly categoryService: CategoryService
  ) {
    super();
  }

  get service() {
    return this.categoryService;
  }

}
