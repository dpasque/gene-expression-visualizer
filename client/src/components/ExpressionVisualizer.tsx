import { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import type {
  DevelopmentMilestone,
  GeneDefinition,
  GeneExpressionDatum,
} from "../../../shared";
import { useApi } from "../api/ApiContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { RequestError } from "./RequestError";
// @ts-ignore -- not worth making a type declaration right now
import * as d3 from "d3-regression";

interface Props {
  geneDefinitions: GeneDefinition[];
  developmentalMilestones: DevelopmentMilestone[];
}

export function ExpressionVisualizer({
  geneDefinitions,
  developmentalMilestones,
}: Props) {
  const [geneSymbol, setGeneSymbol] = useState("");
  const [expressionData, setExpressionData] = useState<GeneExpressionDatum[]>(
    []
  );
  const [expressionDataLoading, setExpressionDataLoading] = useState(false);
  const [expressionDataError, setExpressionDataError] = useState<string | null>(
    null
  );
  const [requestMade, setRequestMade] = useState(false);

  const api = useApi();

  const handleLoadExpressionData = async () => {
    if (!geneSymbol) {
      return;
    }
    try {
      setRequestMade(true);
      setExpressionDataLoading(true);
      setExpressionDataError(null);
      const expressionData = await api.getGeneExpressionData(geneSymbol);
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

  const transformedData = useMemo(() => {
    // Log transform to improve visualization
    // Add a small number (epsilon) to avoid log(0)
    return expressionData.map((d) => ({
      agePostConceptionDays: Math.log2(
        (d as any).agePostConceptionDays + Number.EPSILON
      ),
      cpm: Math.log2((d as any).cpm + Number.EPSILON),
    }));
  }, [expressionData]);

  const xMilestoneTicks = useMemo(
    // We use the milestones for the x-axis ticks
    // Needs the same log2 treatment as the data
    () =>
      developmentalMilestones.map((m) => ({
        value: Math.log2(m.postConceptionDays + Number.EPSILON),
        label: m.label,
      })),
    [developmentalMilestones]
  );

  const yTicks = useMemo(() => {
    if (transformedData.length === 0) {
      return [];
    }
    const values = transformedData.map((d) => d.cpm);
    const min = Math.ceil(Math.min(...values));
    const max = Math.ceil(Math.max(...values));
    const range = max - min;
    const interval = Math.ceil(range / 6);
    const ticks = [];
    for (let v = min; v <= max; v += interval) {
      ticks.push(v);
    }
    return ticks;
  }, [transformedData]);

  const loessRegression = useMemo(() => {
    if (transformedData.length < 2) {
      return [];
    }
    // d3-regression expects [x, y] pairs
    const points = transformedData.map((d) => [d.agePostConceptionDays, d.cpm]);
    const generateLoess = d3
      .regressionLoess()
      .x((d: any[]) => d[0])
      .y((d: any[]) => d[1])
      .bandwidth(0.5); // adjust as needed
    return generateLoess(points);
  }, [transformedData]);

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

      <form className="flex flex-row items-center gap-4 flex-wrap">
        <div className="flex flex-row gap-x-2 items-center">
          <label htmlFor="gene-symbol">Gene symbol:</label>
          <input
            type="text"
            id="gene-symbol"
            name="gene-symbol"
            placeholder="e.g. XIST"
            className="border border-gray-300 rounded px-2 py-1"
            value={geneSymbol}
            onChange={(e) => setGeneSymbol(e.target.value)}
          />
        </div>
        <div className="flex flex-row justify-end">
          <button
            className="w-fit bg-blue-900 hover:bg-blue-700 active:bg-blue-600 text-white py-2 px-4 rounded"
            type="button"
            onClick={handleLoadExpressionData}
          >
            See expression data
          </button>
        </div>
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
          transformedData.length === 0 && (
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
          transformedData.length > 0 && (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis
                  dataKey="agePostConceptionDays"
                  name="Developmental stage (log2-scaled)"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  ticks={xMilestoneTicks.map((t) => t.value)}
                  tickFormatter={(value) => {
                    const tick = xMilestoneTicks.find(
                      (t) => Math.abs(t.value - value) < Number.EPSILON
                    );
                    return tick ? tick.label : "";
                  }}
                  interval={0}
                  tickMargin={8}
                  angle={-30}
                />
                <YAxis
                  dataKey="cpm"
                  name="Gene expression (log2(cpm))"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  ticks={yTicks}
                  interval={0}
                  tickMargin={8}
                />
                <Scatter
                  name="Expression"
                  data={transformedData}
                  fill="#C41E3A"
                />
                {loessRegression.length > 1 && (
                  <Scatter
                    data={loessRegression.map(([x, y]: [number, number]) => ({
                      agePostConceptionDays: x,
                      cpm: y,
                    }))}
                    line={{ stroke: "#2563eb", strokeWidth: 3 }}
                    name="LOESS"
                    fill="none"
                    legendType="none"
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          )}
      </div>
    </section>
  );
}
