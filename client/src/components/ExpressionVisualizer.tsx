import { useMemo, useState } from "react";
import { ExpressionChart } from "./ExpressionChart";
import { LoadingSpinner } from "./LoadingSpinner";
import { RequestError } from "./RequestError";
// @ts-ignore -- not worth making a type declaration right now
import * as d3 from "d3-regression";
import type {
  DevelopmentMilestone,
  GeneDefinition,
  GeneExpressionDatum,
} from "../../../shared";
import { useApi } from "../api/ApiContext";

interface Props {
  geneDefinitions: GeneDefinition[];
  developmentalMilestones: DevelopmentMilestone[];
}

export function ExpressionVisualizer({
  geneDefinitions,
  developmentalMilestones,
}: Props) {
  const api = useApi();

  const [geneSymbol, setGeneSymbol] = useState("");
  const [selectedGeneDefinition, setSelectedGeneDefinition] =
    useState<GeneDefinition | null>(null);
  const [symbolInputError, setSymbolInputError] = useState<string | null>(null);
  const [expressionData, setExpressionData] = useState<GeneExpressionDatum[]>(
    []
  );
  const [expressionDataLoading, setExpressionDataLoading] = useState(false);
  const [expressionDataError, setExpressionDataError] = useState<string | null>(
    null
  );
  const [requestMade, setRequestMade] = useState(false);

  const geneDefinitionsBySymbol = useMemo(() => {
    const map: Record<string, GeneDefinition> = {};
    geneDefinitions.forEach((gene) => {
      map[gene.symbol] = gene;
    });
    return map;
  }, [geneDefinitions]);

  const handleLoadExpressionData = async () => {
    const geneSymbolCleaned = geneSymbol.trim().toUpperCase();
    if (!geneSymbolCleaned) {
      setSymbolInputError("A gene symbol is required.");
      return;
    }

    if (!geneDefinitionsBySymbol[geneSymbolCleaned]) {
      setSymbolInputError(
        `${geneSymbolCleaned} is not a recognized gene symbol.`
      );
      return;
    }

    setSelectedGeneDefinition(geneDefinitionsBySymbol[geneSymbolCleaned]);

    try {
      setRequestMade(true);
      setExpressionDataLoading(true);
      setExpressionDataError(null);
      const expressionData = await api.getGeneExpressionData(geneSymbolCleaned);
      setExpressionData(expressionData);
    } catch (e) {
      const error = e as Error;
      setExpressionDataError(
        error.message ||
          "Unexpected error occurred while loading expression data."
      );
    } finally {
      setExpressionDataLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-blue-900">
          Visualize gene expression data
        </h2>
        <p className="text-gray-700">
          Select a gene symbol to view its expression across developmental
          milestones.
        </p>
      </div>

      <form className="flex flex-col items-start gap-y-2.5">
        <div className="flex flex-row items-center gap-4 flex-wrap">
          <div className="flex flex-row gap-x-2 items-center">
            <label htmlFor="gene-symbol">Gene symbol:</label>
            {/* @TODO:ENHANCE - this would be amazing as a combobox! 
            We have all the definitions on the client. Just needs a lot of thoughtful design.
            Ideally, would support searching on all known parts of gene definition: 
            symbol, name, ensemble ID, etc */}
            <input
              type="text"
              id="gene-symbol"
              name="gene-symbol"
              placeholder="e.g. XIST"
              className={`border rounded px-2 py-1 ${
                symbolInputError ? "border-red-600" : "border-gray-300"
              }`}
              value={geneSymbol}
              onChange={(e) => {
                setGeneSymbol(e.target.value);
                setSymbolInputError(null);
              }}
              aria-invalid={!!symbolInputError}
              aria-describedby="gene-symbol-error"
            />
          </div>
          <button
            className="w-fit bg-blue-900 hover:bg-blue-700 active:bg-blue-600 text-white py-2 px-4 rounded"
            type="button"
            onClick={handleLoadExpressionData}
          >
            See expression data
          </button>
        </div>

        {symbolInputError && (
          <span className="text-red-600" role="alert" id="gene-symbol-error">
            {symbolInputError}
          </span>
        )}
      </form>

      <div>
        {expressionDataLoading && (
          <div
            role="status"
            className="flex flex-col items-center my-8 gap-y-2.5"
          >
            <LoadingSpinner sizePx={48} />
            <span className="text-gray-600">
              Loading expression data for {geneSymbol}...
            </span>
          </div>
        )}

        {!expressionDataLoading && expressionDataError && (
          <RequestError message={expressionDataError} />
        )}

        {!expressionDataLoading &&
          !expressionDataError &&
          requestMade &&
          expressionData.length === 0 && (
            <div
              className="bg-amber-100 border border-amber-400 text-amber-800 px-4 py-3 rounded relative"
              role="status"
            >
              &#9432; No data was found for the selected gene.
            </div>
          )}

        {!expressionDataLoading &&
          !expressionDataError &&
          requestMade &&
          selectedGeneDefinition &&
          expressionData.length > 0 && (
            <ExpressionChart
              expressionData={expressionData}
              developmentalMilestones={developmentalMilestones}
              selectedGeneDefinition={selectedGeneDefinition}
            />
          )}
      </div>
    </section>
  );
}
