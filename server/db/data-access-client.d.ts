export interface GeneExpressionDatum {
  cpm: number;
  agePostConceptionDays: number;
}

export interface GeneDefinition {
  symbol: string;
  name: string;
  ensemblId?: string | null;
}

export interface DevelopmentMilestone {
  postConceptionDays: number;
  label: string;
}

export interface DataAccessClient {
  getCpmExpressionByGeneSymbol: (
    geneSymbol: string
  ) => Promise<GeneExpressionDatum[]>;

  getAllGeneDefinitions: () => Promise<GeneDefinition[]>;

  getAllDevelopmentMilestones: () => Promise<DevelopmentMilestone[]>;
}
