import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("samples", (table) => {
    table.increments("id").primary();
    // From BrainVar data, this is the brain code - a unique identifier for the sample.
    // Using a more generic name to allow for more potential future data sources.
    table.string("sample_code").notNullable().unique().index();
    // Some string to group samples from the same dataset. Useful if we keep growing
    // the dataset or sources over time.
    table.string("dataset_id").index();
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
