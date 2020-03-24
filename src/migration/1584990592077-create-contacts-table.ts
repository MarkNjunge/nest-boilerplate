import {MigrationInterface, QueryRunner} from "typeorm";

export class createContactsTable1584990592077 implements MigrationInterface {
    name = 'createContactsTable1584990592077'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "contacts" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "REL_af0a71ac1879b584f255c49c99" UNIQUE ("user_id"), CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`ALTER TABLE "contacts" ADD CONSTRAINT "FK_af0a71ac1879b584f255c49c99a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "contacts" DROP CONSTRAINT "FK_af0a71ac1879b584f255c49c99a"`, undefined);
        await queryRunner.query(`DROP TABLE "contacts"`, undefined);
    }

}
