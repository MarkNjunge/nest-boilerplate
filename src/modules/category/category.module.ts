import { Module } from "@nestjs/common";
import { CategoryController } from "@/modules/category/category.controller";
import { CategoryService } from "@/modules/category/category.service";
import { DbModule } from "@/modules/_db/db.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "@/models/category/category";

@Module({
  imports: [DbModule, TypeOrmModule.forFeature([Category])],
  controllers: [CategoryController],
  providers: [CategoryService]
})
export class CategoryModule {}
