#!/usr/bin/env node

import fs from "fs/promises";
import zlib from "zlib";
import { parse, type Options } from "csv-parse/sync";
import process from "process";
import knex from "knex";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import dbConfig from "../../knexfile.ts";

const db = knex(dbConfig[process.env.NODE_ENV || "development"]);

function getDefaultDatasetId() {
  const now = new Date();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const yyyy = now.getUTCFullYear();
  return `brainvar-imported-${mm}${dd}${yyyy}`;
}

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

function parseTsv(tsvContent: string) {
  return parse(tsvContent, {
    delimiter: "\t",
    columns: true,
    skip_empty_lines: true,
  });
}

async function readGzippedTsvFile(filePath: string) {
  const buffer = await fs.readFile(filePath);
  return zlib.gunzipSync(buffer).toString("utf-8");
}

async function readTsvFile(filePath: string) {
  return await fs.readFile(filePath, "utf-8");
}

async function parseAndLoadBrainvarData({
  geneMapTsv,
  cpmTsv,
  metaTsv,
  datasetId,
}: {
  geneMapTsv: string;
  cpmTsv: string;
  metaTsv: string;
  datasetId: string;
}) {
  const geneMapRows = parseTsv(geneMapTsv);
  const metaRows = parseTsv(metaTsv);
  if (!cpmTsv.startsWith("gene\t")) {
    // csv-parse doesn't handle headless index columns like pandas, so we need to prepend
    cpmTsv = "gene\t" + cpmTsv;
  }
  const cpmRows = parseTsv(cpmTsv);
  for (const row of cpmRows) {
    // Strip down to just Ensembl ID if symbol is present.
    row.gene = row.gene.split("|")[0];
  }

  const geneDbIdByEnsembleId: { [key: string]: string } = {};
  for (const gene of geneMapRows) {
    const [id] = await db("genes")
      .insert({
        symbol: gene.symbol,
        ensembl_id: gene.ensembl_gene_id,
        name: gene.name,
      })
      .onConflict(["ensembl_id"])
      .merge()
      .returning("id");
    geneDbIdByEnsembleId[gene.ensembl_gene_id] = id;
  }
}

async function main() {
  const geneMapTsv = await readGzippedTsvFile(GENE_MAP_FILE);
  const cpmTsv = await readTsvFile(CPM_FILE);
  const metaTsv = await readTsvFile(META_FILE);

  await parseAndLoadBrainvarData({
    geneMapTsv,
    cpmTsv,
    metaTsv,
    datasetId: DATASET_ID,
  });
}

await main();
