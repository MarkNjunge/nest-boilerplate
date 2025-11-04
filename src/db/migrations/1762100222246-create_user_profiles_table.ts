import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserProfilesTable1762100222246 implements MigrationInterface {
    name = 'CreateUserProfilesTable1762100222246'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_profiles" ("id" character varying NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "bio" character varying NOT NULL, "user_id" character varying, CONSTRAINT "REL_6ca9503d77ae39b4b5a6cc3ba8" UNIQUE ("user_id"), CONSTRAINT "PK__user_profiles" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "FK__users__user_profiles" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "FK__users__user_profiles"`);
        await queryRunner.query(`DROP TABLE "user_profiles"`);
    }

}
