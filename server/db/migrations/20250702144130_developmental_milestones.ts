import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("developmental_milestones", (table) => {
    table.increments("id").primary();
    table.integer("post_conception_days").notNullable().index();
    table.string("label").notNullable().index();
    table
      .timestamp("created_at")
      .notNullable()
      .defaultTo(knex.fn.now())
      .index();
    table.timestamp("deleted_at");
  });
  // A partial index for non-deleted filtering
  await knex.raw(
    "CREATE INDEX idx_developmental_milestones_not_deleted ON developmental_milestones (id) WHERE deleted_at IS NULL"
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable("developmental_milestones");
}
