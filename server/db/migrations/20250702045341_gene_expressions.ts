import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("gene_expressions", (table) => {
    table.increments("id").primary();
    table
      .integer("gene_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("genes")
      .onDelete("CASCADE");
    table
      .integer("sample_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("samples")
      .onDelete("CASCADE");
    table.float("cpm").notNullable();
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("deleted_at");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("gene_expressions");
}
