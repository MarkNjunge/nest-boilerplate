import { MigrationInterface, QueryRunner } from "typeorm";

export class seed1580125276613 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      "INSERT INTO public.users (username) VALUES('Simpson');",
    );
    await queryRunner.query(
      "INSERT INTO public.addresses (city, country, user_id) VALUES('Nairobi', 'Kenya', 1);",
    );

    await queryRunner.query(
      "INSERT INTO public.users (username) VALUES('Elise');",
    );
    await queryRunner.query(
      "INSERT INTO public.addresses (city, country, user_id) VALUES('Yaounde', 'Cameroon', 2);",
    );

    await queryRunner.query(
      "INSERT INTO public.users (username) VALUES('Flora');",
    );
    await queryRunner.query(
      "INSERT INTO public.addresses (city, country, user_id) VALUES('Cairo', 'Egypy', 3);",
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {}
}
