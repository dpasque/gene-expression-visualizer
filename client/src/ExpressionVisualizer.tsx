import { useEffect, useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DevelopmentMilestone, GeneExpressionDatum } from "../../shared";

export function ExpressionVisualizer() {
  const [geneSymbol, setGeneSymbol] = useState("");
  const [expressionData, setExpressionData] = useState<GeneExpressionDatum[]>(
    []
  );
  const [dataRequestInProgress, setDataRequestInProgress] = useState(false);

  const [developmentalMilestones, setDevelopmentalMilestones] = useState<
    DevelopmentMilestone[]
  >([]);
  const [milestoneRequestInProgress, setMilestoneRequestInProgress] =
    useState(false);

  useEffect(() => {
    async function loadDevelopmentalMilestones() {
      setMilestoneRequestInProgress(true);
      const response = await fetch(
        "http://localhost:3000/api/v1/developmental-milestones"
      );
      const data = await response.json();
      setDevelopmentalMilestones(data);
      setMilestoneRequestInProgress(false);
    }

    loadDevelopmentalMilestones();
  }, []);

  const handleLoadExpressionData = async () => {
    if (!geneSymbol) {
      return;
    }
    setDataRequestInProgress(true);
    const queryParams = new URLSearchParams({ symbol: geneSymbol });

    const response = await fetch(
      `http://localhost:3000/api/v1/gene-expression-data?${queryParams.toString()}`
    );
    const data = await response.json();
    setExpressionData(data);
    setDataRequestInProgress(false);
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
    const interval = 1;
    const ticks = [];
    for (let v = min; v <= max; v += interval) {
      ticks.push(Number(v.toFixed(2)));
    }
    return ticks;
  }, [transformedData]);

  if (developmentalMilestones.length === 0 && milestoneRequestInProgress) {
    return <div>Loading developmental milestones...</div>;
  }

  return (
    <section>
      <div className="max-w-2xl mx-auto">
        <h2>Plot gene expression data</h2>
        <p>
          Select a gene symbol to view its expression across developmental
          milestones.
        </p>
        <form className="flex flex-col gap-y-2">
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
      </div>
      <div>
        {!dataRequestInProgress && transformedData.length > 0 && (
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
                angle={-30} // @TODO: might want to rotate for visibility
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
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                name="Expression"
                data={transformedData}
                fill="#C41E3A"
              />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
