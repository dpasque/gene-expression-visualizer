import { ExpressionVisualizer } from "./ExpressionVisualizer";

export function App() {
  return (
    <>
      <header className="bg-blue-900 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-white text-3xl font-semibold text-center">
            Gene Expression Visualization
          </h1>
        </div>
      </header>

      <main className="border-x border-gray-200 max-w-5xl mx-auto min-h-75 px-4 pt-6 pb-12">
        <ExpressionVisualizer />
      </main>

      <footer className="bg-gray-200 px-4 py-12">
        <div className="max-w-5xl mx-auto flex flex-col gap-y-2 text-center">
          <span className="text-gray-800">
            This tool runs off of publicly available data from the{" "}
            <a
              href="http://www.brainvar.org/"
              className="text-blue-600 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              BrainVar project
            </a>
            .
          </span>
          <a
            href="https://github.com/dpasque/gene-expression-visualizer"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            See the source code.
          </a>
        </div>
      </footer>
    </>
  );
}
