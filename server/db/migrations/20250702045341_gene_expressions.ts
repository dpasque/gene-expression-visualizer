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
      .onDelete("CASCADE")
      .index();
    table
      .integer("sample_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("samples")
      .onDelete("CASCADE")
      .index();
    table.float("cpm").notNullable().index();
    table
      .timestamp("created_at")
      .notNullable()
      .defaultTo(knex.fn.now())
      .index();
    table.timestamp("deleted_at");
  });
  // A partial index for non-deleted filtering
  await knex.raw(
    "CREATE INDEX idx_gene_expressions_not_deleted ON gene_expressions (id) WHERE deleted_at IS NULL"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("gene_expressions");
}
