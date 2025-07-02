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

interface GeneMapRow {
  symbol: string;
  ensembl_gene_id: string;
  name: string;
}

interface MetaRow {
  Braincode: string;
  AgeDays: string;
  sex: string;
}

interface CpmRow {
  gene: string;
  [sampleCode: string]: string;
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
  const geneMapRows: GeneMapRow[] = parseTsv(geneMapTsv);
  const metaRows: MetaRow[] = parseTsv(metaTsv);
  if (!cpmTsv.startsWith("gene\t")) {
    // csv-parse doesn't handle headless index columns like pandas, so we need to prepend
    cpmTsv = "gene\t" + cpmTsv;
  }
  const cpmRows: CpmRow[] = parseTsv(cpmTsv);
  // for (const row of cpmRows) {
  //   // Strip down to just Ensembl ID if symbol is present.
  //   row.gene = row.gene.split("|")[0];
  // }

  const geneInsertRows = geneMapRows.map((row) => ({
    symbol: row.symbol.toUpperCase(),
    ensembl_id:
      row.ensembl_gene_id && row.ensembl_gene_id !== "."
        ? row.ensembl_gene_id
        : null,
    name: row.name,
  }));

  const DB_BATCH_SIZE = 500;

  for (let i = 0; i < geneInsertRows.length; i += DB_BATCH_SIZE) {
    const batch = geneInsertRows.slice(i, i + DB_BATCH_SIZE);
    await db("genes").insert(batch).onConflict("symbol").merge();
  }

  const allGenes = await db("genes").select("id", "symbol");
  const geneDbIdBySymbol: { [key: string]: string } = {};
  for (const gene of allGenes) {
    geneDbIdBySymbol[gene.symbol] = gene.id;
  }

  const metaInsertRows = metaRows.map((row) => ({
    sample_code: row.Braincode,
    dataset_id: datasetId,
    age_days: parseInt(row.AgeDays),
    sex: row.sex,
  }));
  for (let i = 0; i < metaRows.length; i += DB_BATCH_SIZE) {
    const batch = metaInsertRows.slice(i, i + DB_BATCH_SIZE);
    await db("samples").insert(batch).onConflict("sample_code").merge();
  }

  const allSamples = await db("samples").select("id", "sample_code");
  const sampleDbIdByCode: { [key: string]: string } = {};
  for (const sample of allSamples) {
    sampleDbIdByCode[sample.sample_code] = sample.id;
  }

  const cpmInsertRows = [];
  const geneMissingSymbol: string[] = [];
  const genesNotInDb: string[] = [];
  const samplesNotInDb: string[] = [];
  for (const row of cpmRows) {
    const geneSymbol = row.gene.split("|")[1]?.toUpperCase();
    if (!geneSymbol) {
      geneMissingSymbol.push(row.gene);
      continue;
    }

    const geneDbId = geneDbIdBySymbol[geneSymbol];
    if (!geneDbId) {
      genesNotInDb.push(row.gene);
      continue;
    }

    const allSampleEntriesForGene = Object.entries(row).filter(
      ([key]) => key !== "gene"
    );

    for (const [sampleCode, cmpValue] of allSampleEntriesForGene) {
      const sampleDbId = sampleDbIdByCode[sampleCode];
      if (!sampleDbId) {
        samplesNotInDb.push(sampleCode);
        continue;
      }

      cpmInsertRows.push({
        gene_id: geneDbId,
        sample_id: sampleDbId,
        cpm: parseFloat(cmpValue),
      });
    }
  }

  if (geneMissingSymbol.length > 0) {
    console.warn(
      `${geneMissingSymbol.length} genes were missing symbols and were skipped:`,
      geneMissingSymbol
    );
  }
  if (genesNotInDb.length > 0) {
    console.warn(
      `${genesNotInDb.length} genes were not found in DB and were skipped:`,
      genesNotInDb
    );
  }
  if (samplesNotInDb.length > 0) {
    console.warn(
      `${samplesNotInDb.length} samples were not found in DB and were skipped:`,
      samplesNotInDb
    );
  }

  for (let i = 0; i < cpmInsertRows.length; i += DB_BATCH_SIZE) {
    const batch = cpmInsertRows.slice(i, i + DB_BATCH_SIZE);
    await db("gene_expressions")
      .insert(batch)
      .onConflict(["gene_id", "sample_id"])
      .merge();
  }
}

async function run() {
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

await run();
