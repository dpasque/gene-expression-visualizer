import { knex, type Knex } from "knex";
import type {
  DataAccessClient,
  DevelopmentMilestone,
  GeneDefinition,
  GeneExpressionDatum,
} from "./data-access-client.js";

export class PostgresDataAccessClient implements DataAccessClient {
  private db: Knex;
  constructor(knexConfig: Knex.Config) {
    this.db = knex(knexConfig);
  }

  async getCpmExpressionByGeneSymbol(
    geneSymbol: string
  ): Promise<GeneExpressionDatum[]> {
    const dbResults = await this.db("gene_expressions")
      .join("samples", "gene_expressions.sample_id", "samples.id")
      .join("genes", "gene_expressions.gene_id", "genes.id")
      .where("genes.symbol", geneSymbol)
      .whereNull("gene_expressions.deleted_at")
      .whereNull("samples.deleted_at")
      .whereNull("genes.deleted_at")
      .select(["gene_expressions.cpm as cpm", "samples.age_days as age_days"])
      .orderBy("samples.age_days", "asc");

    return dbResults.map((row) => ({
      cpm: row.cpm,
      agePostConceptionDays: row.age_days,
    }));
  }

  async getAllGeneDefinitions(): Promise<GeneDefinition[]> {
    const dbResults = await this.db("genes")
      .whereNull("deleted_at")
      .select(["symbol", "name", "ensembl_id"]);

    return dbResults.map((row) => ({
      symbol: row.symbol,
      name: row.name,
      ensemblId: row.ensembl_id,
    }));
  }

  async getAllDevelopmentMilestones(): Promise<DevelopmentMilestone[]> {
    const dbResults = await this.db("developmental_milestones")
      .whereNull("deleted_at")
      .select(["post_conception_days", "label"]);

    return dbResults.map((row) => ({
      postConceptionDays: row.post_conception_days,
      label: row.label,
    }));
  }
}
