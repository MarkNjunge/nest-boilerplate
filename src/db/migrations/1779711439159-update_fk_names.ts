import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateFkNames1779711439159 implements MigrationInterface {
    name = 'UpdateFkNames1779711439159'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK__comment__user_id"`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK__post__user_id"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK__users__user_profiles"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK__users__user_profiles" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK__comments__user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK__posts__user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK__posts__user_id"`);
        await queryRunner.query(`ALTER TABLE "comments" DROP CONSTRAINT "FK__comments__user_id"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK__users__user_profiles"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK__users__user_profiles" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK__post__user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "comments" ADD CONSTRAINT "FK__comment__user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
