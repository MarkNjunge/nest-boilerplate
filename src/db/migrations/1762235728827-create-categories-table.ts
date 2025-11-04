import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoriesTable1762235728827 implements MigrationInterface {
    name = "CreateCategoriesTable1762235728827";

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "categories" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying NOT NULL, "parent_id" character varying, CONSTRAINT "PK_categories" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK__category__parent_id" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK__category__parent_id"`);
        await queryRunner.query(`DROP TABLE "categories"`);
    }

}
