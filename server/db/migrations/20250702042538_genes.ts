import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("genes", (table) => {
    table.increments("id").primary();
    table.string("symbol").notNullable().unique();
    table.string("ensembl_id").notNullable().unique();
    table.string("name");
    table
      .timestamp("created_at")
      .notNullable()
      .defaultTo(knex.fn.now())
      .index();
    table.timestamp("deleted_at");
  });
  // A partial index for non-deleted filtering
  await knex.raw(
    "CREATE INDEX idx_genes_not_deleted ON genes (id) WHERE deleted_at IS NULL"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("genes");
}
