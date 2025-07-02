import type {
  DevelopmentMilestone,
  GeneDefinition,
  GeneExpressionDatum,
} from "../../../shared";

export interface ApiClient {
  getDevelopmentalMilestones(): Promise<DevelopmentMilestone[]>;
  getGeneExpressionData(symbol: string): Promise<GeneExpressionDatum[]>;
  getGeneDefinitions(): Promise<GeneDefinition[]>;
}
