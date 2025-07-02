import { useState } from "react";

export function ExpressionVisualizer() {
  const [geneSymbol, setGeneSymbol] = useState("");
  const [expressionData, setExpressionData] = useState([]);
  const [requestInProgress, setRequestInProgress] = useState(false);
  const handleLoadExpressionData = async () => {
    if (!geneSymbol) {
      return;
    }
    setRequestInProgress(true);
    const queryParams = new URLSearchParams({ symbol: geneSymbol });

    const response = await fetch(
      `http://localhost:3000/api/v1/gene-expression-data?${queryParams.toString()}`
    );
    const data = await response.json();
    setExpressionData(data);
    setRequestInProgress(false);
  };
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
      <pre>{JSON.stringify(expressionData, null, 2)}</pre>
    </section>
  );
}
