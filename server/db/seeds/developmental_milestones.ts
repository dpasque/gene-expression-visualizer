import type { Knex } from "knex";

const DEFAULT_MILESTONES = [
  { post_conception_days: 8 * 7, label: "8w" },
  { post_conception_days: 10 * 7, label: "10w" },
  { post_conception_days: 13 * 7, label: "13w" },
  { post_conception_days: 16 * 7, label: "16w" },
  { post_conception_days: 19 * 7, label: "19w" },
  { post_conception_days: 24 * 7, label: "24w" },
  { post_conception_days: 40 * 7, label: "Birth" },
  { post_conception_days: 40 * 7 + Math.floor(365 / 2), label: "6m" },
  { post_conception_days: 40 * 7 + 365, label: "1y" },
  { post_conception_days: 40 * 7 + 365 * 6, label: "6y" },
  { post_conception_days: 40 * 7 + 365 * 12, label: "12y" },
];

/**
 * Seed the developmental milestones table. Since this table is relatively static and driven
 * by admin configuration rather than data sets, we can set a useful default set in a seed.
 * @param {Knex} knex
 */
export async function seed(knex: Knex): Promise<void> {
  await knex("developmental_milestones").del();
  await knex("developmental_milestones").insert(DEFAULT_MILESTONES);
}
