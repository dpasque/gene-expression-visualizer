import { Router } from "express";
import type { DataAccessClient } from "./db/data-access-client.js";

export function createRoutes({
  dataAccessClient,
}: {
  dataAccessClient: DataAccessClient;
}) {
  const router = Router();

  const serverErrorResponse = {
    error: "Unexpected server error occurred.",
  };

  router.get("/gene-expression-data", async (req, res) => {
    try {
      const geneSymbol = req.query.symbol;
      if (!geneSymbol || typeof geneSymbol !== "string") {
        res.status(400).json({
          error: "Missing required string query parameter: symbol",
        });
        return;
      }

      const data = await dataAccessClient.getCpmExpressionByGeneSymbol(
        geneSymbol
      );
      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json(serverErrorResponse);
    }
  });

  router.get("/gene-definitions", async (_req, res) => {
    try {
      const data = await dataAccessClient.getAllGeneDefinitions();
      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json(serverErrorResponse);
    }
  });

  router.get("/developmental-milestones", async (req, res) => {
    try {
      const data = await dataAccessClient.getAllDevelopmentMilestones();
      res.status(200).json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json(serverErrorResponse);
    }
  });

  return router;
}
