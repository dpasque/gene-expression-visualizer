import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App.tsx";
import { ApiProvider } from "./api/ApiContext.tsx";
import { httpServerApiClient } from "./api/http-server-api-client.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ApiProvider value={httpServerApiClient}>
      <App />
    </ApiProvider>
  </StrictMode>
);
