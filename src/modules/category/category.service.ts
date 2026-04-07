import { Injectable } from "@nestjs/common";
import { CrudService } from "@/lib/crud";
import { Category, CategoryCreateDto, CategoryUpdateDto } from "@/models/category/category";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class CategoryService extends CrudService<Category, CategoryCreateDto, CategoryUpdateDto>{
  constructor(
    @InjectRepository(Category)
    protected readonly categoryRepository: Repository<Category>
  ) {
    super("Category", categoryRepository);
  }
}
