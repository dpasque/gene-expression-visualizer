import { parse } from "csv-parse/sync";
import type { Knex } from "knex";

const DB_BATCH_SIZE = 1000;

function parseTsv(tsvContent: string) {
  return parse(tsvContent, {
    delimiter: "\t",
    columns: true,
    skip_empty_lines: true,
  });
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

export async function parseAndLoadBrainvarData({
  db,
  geneMapTsv,
  cpmTsv,
  metaTsv,
  datasetId,
}: {
  db: Knex;
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

  const geneDbIdBySymbol = await parseAndLoadGeneMapData({ db, geneMapRows });
  const sampleDbIdByCode = await parseAndLoadSampleMetadata({
    db,
    metaRows,
    datasetId,
  });
  await parseAndLoadExpressionCpmData({
    db,
    geneDbIdBySymbol,
    sampleDbIdByCode,
    cpmRows,
  });
}

async function parseAndLoadGeneMapData({
  db,
  geneMapRows,
}: {
  db: Knex;
  geneMapRows: GeneMapRow[];
}) {
  const geneInsertRows = geneMapRows.map((row) => ({
    symbol: row.symbol.toUpperCase(),
    ensembl_id:
      row.ensembl_gene_id && row.ensembl_gene_id !== "."
        ? row.ensembl_gene_id
        : null,
    name: row.name,
  }));

  console.log(`Inserting ${geneInsertRows.length} gene mapping rows...`);
  for (let i = 0; i < geneInsertRows.length; i += DB_BATCH_SIZE) {
    const batch = geneInsertRows.slice(i, i + DB_BATCH_SIZE);
    await db("genes").insert(batch).onConflict("symbol").ignore();
  }

  const allGenes = await db("genes").select("id", "symbol");
  const geneDbIdBySymbol: { [key: string]: number } = {};
  for (const gene of allGenes) {
    geneDbIdBySymbol[gene.symbol] = gene.id;
  }

  return geneDbIdBySymbol;
}

async function parseAndLoadSampleMetadata({
  db,
  metaRows,
  datasetId,
}: {
  db: Knex;
  metaRows: MetaRow[];
  datasetId: string;
}) {
  const metaInsertRows = metaRows.map((row) => ({
    sample_code: row.Braincode,
    dataset_id: datasetId,
    age_days: parseInt(row.AgeDays),
    sex: row.sex,
  }));

  console.log(`Inserting ${metaInsertRows.length} sample metadata rows...`);
  for (let i = 0; i < metaRows.length; i += DB_BATCH_SIZE) {
    const batch = metaInsertRows.slice(i, i + DB_BATCH_SIZE);
    await db("samples").insert(batch).onConflict("sample_code").ignore();
  }

  const allSamplesForDataset = await db("samples")
    .select("id", "sample_code")
    .where("dataset_id", datasetId);
  const sampleDbIdByCode: { [key: string]: number } = {};
  for (const sample of allSamplesForDataset) {
    sampleDbIdByCode[sample.sample_code] = sample.id;
  }

  return sampleDbIdByCode;
}

async function parseAndLoadExpressionCpmData({
  db,
  geneDbIdBySymbol,
  sampleDbIdByCode,
  cpmRows,
}: {
  db: Knex;
  geneDbIdBySymbol: { [key: string]: number };
  sampleDbIdByCode: { [key: string]: number };
  cpmRows: CpmRow[];
}) {
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
      `[WARNING] ${geneMissingSymbol.length} genes were missing symbols and were skipped.`
    );
  }
  if (genesNotInDb.length > 0) {
    console.warn(
      `[WARNING] ${genesNotInDb.length} genes were not found in DB and were skipped.`
    );
  }
  if (samplesNotInDb.length > 0) {
    console.warn(
      `[WARNING]${samplesNotInDb.length} samples were not found in DB and were skipped.`
    );
  }

  console.log(
    `Inserting ${cpmInsertRows.length} gene expression rows... (This may take a while)`
  );

  for (let i = 0; i < cpmInsertRows.length; i += DB_BATCH_SIZE * 3) {
    const batch1 = cpmInsertRows.slice(i, i + DB_BATCH_SIZE);
    const batch2 = cpmInsertRows.slice(
      i + DB_BATCH_SIZE,
      i + DB_BATCH_SIZE * 2
    );
    const batch3 = cpmInsertRows.slice(
      i + DB_BATCH_SIZE * 2,
      i + DB_BATCH_SIZE * 3
    );

    await Promise.all(
      [batch1, batch2, batch3].map((batch) =>
        db("gene_expressions")
          .insert(batch1)
          .onConflict(["gene_id", "sample_id"])
          .ignore()
      )
    );
  }
}
