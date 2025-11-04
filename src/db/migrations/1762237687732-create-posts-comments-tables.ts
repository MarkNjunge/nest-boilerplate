import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePostsCommentsTables1762237687732 implements MigrationInterface {
    name = 'CreatePostsCommentsTables1762237687732'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "comments" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "content" text NOT NULL, "user_id" character varying NOT NULL, "post_id" character varying NOT NULL, CONSTRAINT "PK_comments" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "posts" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "title" character varying NOT NULL, "content" text NOT NULL, "user_id" character varying NOT NULL, "category_id" character varying, CONSTRAINT "PK_posts" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK__comment__user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK__comment__post_id" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK__post__user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK__post__category_id" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK__post__category_id"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK__post__user_id"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK__comment__post_id"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK__comment__user_id"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP TABLE "comments"`);
    }

}
