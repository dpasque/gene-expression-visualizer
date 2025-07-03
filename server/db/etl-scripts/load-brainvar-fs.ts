#!/usr/bin/env node
import { APP_CONFIG } from "../../config.ts";
import fs from "fs/promises";
import zlib from "zlib";
import process from "process";
import knex from "knex";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import dbConfig from "../../knexfile.ts";
import { parseAndLoadBrainvarData } from "./helpers/brainvar.ts";

function getDefaultDatasetId() {
  const now = new Date();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const yyyy = now.getUTCFullYear();
  return `brainvar-imported-${mm}${dd}${yyyy}`;
}

async function readGzippedTsvFile(filePath: string) {
  const buffer = await fs.readFile(filePath);
  return zlib.gunzipSync(buffer).toString("utf-8");
}

async function readTsvFile(filePath: string) {
  return await fs.readFile(filePath, "utf-8");
}

async function run() {
  const argv = yargs(hideBin(process.argv))
    .option("gene-map", {
      type: "string",
      demandOption: true,
      describe: "Path to a gzipped gene map file",
    })
    .option("cpm", {
      type: "string",
      demandOption: true,
      describe: "Path to CPM file",
    })
    .option("meta", {
      type: "string",
      demandOption: true,
      describe: "Path to metadata file",
    })
    .option("dataset-id", {
      type: "string",
      demandOption: false,
      describe: "Optional dataset identifier for this import",
      default: getDefaultDatasetId(),
    })
    .help().argv;

  const GENE_MAP_FILE = argv["gene-map"];
  const CPM_FILE = argv["cpm"];
  const META_FILE = argv["meta"];
  const DATASET_ID = argv["dataset-id"];

  const db = knex(dbConfig[APP_CONFIG.NODE_ENV]);

  try {
    const geneMapTsv = await readGzippedTsvFile(GENE_MAP_FILE);
    const cpmTsv = await readTsvFile(CPM_FILE);
    const metaTsv = await readTsvFile(META_FILE);

    await parseAndLoadBrainvarData({
      db,
      geneMapTsv,
      cpmTsv,
      metaTsv,
      datasetId: DATASET_ID,
    });
  } finally {
    await db.destroy();
  }
}

try {
  await run();
  console.log("BrainVar ETL process from file system completed successfully.");
  process.exit(0);
} catch (error) {
  console.error("Error occurred while running ETL process:", error);
  process.exit(1);
}
