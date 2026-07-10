import { Injectable } from "@nestjs/common";
import { ICrudContext } from "@/lib/crud";
import { Category, CategoryCreateDto, CategoryUpdateDto } from "@/models/category/category";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { CacheService } from "@/modules/_cache/cache.service";
import { Logger } from "@/logging/Logger";
import { CrudCacheService } from "@/lib/crud/service/crud-cache.service";

@Injectable()
export class CategoryService extends CrudCacheService<Category, CategoryCreateDto, CategoryUpdateDto> {
  protected logger = new Logger("CategoryService");

  constructor(
    @InjectRepository(Category)
    protected readonly categoryRepository: Repository<Category>,
    protected readonly cacheService: CacheService
  ) {
    super("Category", categoryRepository, cacheService, { userScoped: false });
  }

  cacheNs(ctx: ICrudContext) {
    return "categories";
  }

}
