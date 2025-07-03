import { memo, useMemo } from "react";
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
// @ts-ignore -- not worth making a type declaration right now
import * as d3 from "d3-regression";

interface Props {
  expressionData: GeneExpressionDatum[];
  developmentalMilestones: DevelopmentMilestone[];
  selectedGeneDefinition: GeneDefinition;
}

export const ExpressionChart = memo(function ExpressionChart({
  expressionData,
  developmentalMilestones,
  selectedGeneDefinition,
}: Props) {
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
    // Try to get some reasonable integer ticks for the y-axis
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

  // @TODO: so far, this is keeping up on the client-side, so keeping it here.
  // If performance becomes an issue, we should move this to the server, return it as part of the API response.
  const loessRegression: [number, number][] = useMemo(() => {
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
    <figure aria-describedby="expression-chart-metadata">
      <figcaption className="text-base md:text-xl font-semibold text-gray-800 mb-2 text-center">
        Expression (log2 CPM) by developmental stage (log2 days post-conception)
      </figcaption>
      <dl className="mb-4 text-gray-700" id="expression-chart-metadata">
        <div className="flex flex-row flex-wrap justify-center gap-x-6 gap-y-1">
          <div className="flex flex-row gap-x-2 items-center">
            <dt className="font-semibold">Gene symbol:</dt>
            <dd>{selectedGeneDefinition.symbol}</dd>
          </div>
          <div className="flex flex-row gap-x-2 items-center">
            <dt className="font-semibold">Ensembl ID:</dt>
            <dd>{selectedGeneDefinition.ensemblId || "—"}</dd>
          </div>
          <div className="flex flex-row gap-x-2 items-center">
            <dt className="font-semibold">Name:</dt>
            <dd>{selectedGeneDefinition.name}</dd>
          </div>
        </div>
      </dl>

      <ResponsiveContainer width="100%" height={460}>
        <ScatterChart aria-label="Gene expression scatter plot with LOESS regression">
          <CartesianGrid />
          <XAxis
            dataKey="agePostConceptionDays"
            name="Developmental stage (log2 days post-conception)"
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
            height={60}
            label={{
              value: "Developmental stage (log2 days post-conception)",
              position: "insideBottom",
              offset: 5,
              style: {
                textAnchor: "middle",
                fill: "#1e293b",
                fontWeight: 500,
              },
            }}
          />
          <YAxis
            dataKey="cpm"
            name="Gene expression (log2 CPM)"
            type="number"
            domain={["dataMin", "dataMax"]}
            ticks={yTicks}
            interval={0}
            tickMargin={8}
            label={{
              value: "Gene expression (log2 CPM)",
              angle: -90,
              position: "insideLeft",
              style: {
                textAnchor: "middle",
                fill: "#1e293b",
                fontWeight: 500,
              },
            }}
          />
          <Scatter name="Expression" data={transformedData} fill="#C41E3A" />
          {loessRegression.length > 1 && (
            <Scatter
              data={loessRegression.map(([x, y]) => ({
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
    </figure>
  );
});
