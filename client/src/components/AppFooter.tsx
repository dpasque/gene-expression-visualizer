export function AppFooter() {
  return (
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
  );
}
