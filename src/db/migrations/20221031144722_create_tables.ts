import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable("users", table => {
      table.increments("id").primary();
      table.string("username", 64).notNullable();
    })
    .createTable("contacts", table => {
      table.increments("id").primary();
      table.string("email").notNullable();
      table
        .integer("user_id")
        .unique()
        .notNullable()
        .references("id")
        .inTable("users")
        .withKeyName("FK_contacts_user_id_on_users")
        .onDelete("CASCADE");
    })
    .createTable("addresses", table => {
      table.increments("id").primary();
      table.string("city").notNullable();
      table.string("country").notNullable();
      table
        .integer("user_id")
        .unique()
        .notNullable()
        .references("id")
        .inTable("users")
        .withKeyName("FK_addresses_user_id_on_users")
        .onDelete("CASCADE");
    });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema
    .dropTableIfExists("addresses")
    .dropTableIfExists("contacts")
    .dropTableIfExists("users");
}
