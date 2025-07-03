import { useEffect, useState } from "react";
import type { DevelopmentMilestone, GeneDefinition } from "../../../shared";
import { ExpressionVisualizer } from "./ExpressionVisualizer";
import { useApi } from "../api/ApiContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { RequestError } from "./RequestError";

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
    <main className="flex-1 border-x border-gray-200 max-w-5xl mx-auto min-h-75 px-4 sm:px-8 md:px-12 pt-6 pb-12">
      {staticDataLoading && (
        <div className="flex flex-col items-center gap-y-4" role="status">
          <LoadingSpinner />
          <p className="text-gray-500">Loading configuration data...</p>
        </div>
      )}

      {!staticDataLoading && staticDataError && (
        <RequestError message={staticDataError} />
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
