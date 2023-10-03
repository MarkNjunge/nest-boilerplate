import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema
    .createTable("users", table => {
      table.increments("id").primary();
      table.string("username", 32).notNullable();
    })
    .createTable("contacts", table => {
      table.increments("id").primary();
      table.string("email", 64).notNullable();
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
      table.string("city", 32).notNullable().unique();
      table.string("country", 32).notNullable().unique();
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
