import { memo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface Props {
  transformedData: { agePostConceptionDays: number; cpm: number }[];
  xMilestoneTicks: { value: number; label: string }[];
  yTicks: number[];
  loessRegression: [number, number][];
}

export const ExpressionChart = memo(function ExpressionChart({
  transformedData,
  xMilestoneTicks,
  yTicks,
  loessRegression,
}: Props) {
  return (
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
  );
});
