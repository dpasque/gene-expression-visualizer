import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("genes", (table) => {
    table.increments("id").primary();
    table.string("symbol").notNullable().unique();
    table.string("ensembl_id").notNullable().unique();
    table.string("name");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("genes");
}
