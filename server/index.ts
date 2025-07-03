import "dotenv/config";
import express from "express";
import { createRoutes } from "./routes.ts";
import { PostgresDataAccessClient } from "./db/postgres-data-access-client.ts";
import dbConfig from "./knexfile.ts";
import { APP_CONFIG } from "./config.ts";
import cors from "cors";

const app = express();
app.use(cors());

// Create hard dependencies of current instance for dependency injection below
const dataAccessClient = new PostgresDataAccessClient(
  dbConfig[APP_CONFIG.NODE_ENV]
);

app.use("/api/v1", createRoutes({ dataAccessClient }));

app.listen(APP_CONFIG.API_PORT, () => {
  console.log(`Server listening on port ${APP_CONFIG.API_PORT}`);
});
