import { useEffect, useState } from "react";
import type { DevelopmentMilestone, GeneDefinition } from "../../../shared";
import { ExpressionVisualizer } from "./ExpressionVisualizer";
import { useApi } from "../api/ApiContext";
import { LoadingSpinner } from "./LoadingSpinner";

export function AppMain() {
  const [staticData, setStaticData] = useState<{
    developmentalMilestones: DevelopmentMilestone[];
    geneDefinitions: GeneDefinition[];
  }>({
    developmentalMilestones: [],
    geneDefinitions: [],
  });
  const [staticDataLoading, setStaticDataLoading] = useState(true);
  const [staticDataError, setStaticDataError] = useState<string | null>(null);

  const api = useApi();

  useEffect(() => {
    async function loadStaticData() {
      setStaticDataLoading(true);
      setStaticDataError(null);
      try {
        const [milestones, genes] = await Promise.all([
          api.getDevelopmentalMilestones(),
          api.getGeneDefinitions(),
        ]);
        setStaticData({
          developmentalMilestones: milestones,
          geneDefinitions: genes,
        });
      } catch (e) {
        const error = e as Error;
        setStaticDataError(
          error.message ||
            "Unexpected error occurred while loading static data."
        );
      } finally {
        setStaticDataLoading(false);
      }
    }

    loadStaticData();
  }, []);

  return (
    <main className="border-x border-gray-200 max-w-5xl mx-auto min-h-75 px-8 pt-6 pb-12">
      {staticDataLoading && <LoadingSpinner />}

      {!staticDataLoading && staticDataError && (
        <div className="text-red-600">{staticDataError}</div>
      )}

      {!staticDataLoading && !staticDataError && (
        <ExpressionVisualizer
          developmentalMilestones={staticData.developmentalMilestones}
          geneDefinitions={staticData.geneDefinitions}
        />
      )}
    </main>
  );
}
