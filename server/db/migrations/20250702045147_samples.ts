import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("samples", (table) => {
    table.increments("id").primary();
    table.string("sample_code").notNullable().unique().index();
    table.integer("age_days").notNullable().index();
    table.string("sex").notNullable().index();
    table
      .timestamp("created_at")
      .notNullable()
      .defaultTo(knex.fn.now())
      .index();
    table.timestamp("deleted_at");
  });
  // A partial index for non-deleted filtering
  await knex.raw(
    "CREATE INDEX idx_samples_not_deleted ON samples (id) WHERE deleted_at IS NULL"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("samples");
}
