import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("samples", (table) => {
    table.increments("id").primary();
    // BrainCode -- but more flexible for future data samples
    table.string("sample_code").notNullable().unique();
    table.integer("age_days").notNullable();
    table.string("sex").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("samples");
}
