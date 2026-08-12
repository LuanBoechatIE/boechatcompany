// Leitura e escrita de planilha do CRM.
//
// Trocamos `xlsx` (SheetJS) por `exceljs`: o 0.18.5 é a última versão no npm e
// carrega duas falhas altas (prototype pollution e ReDoS) que disparam ao ler
// arquivo enviado por terceiro — exatamente o caminho do import de leads. As
// versões corrigidas do SheetJS só existem no CDN próprio deles, fora do
// registry.
//
// Diferença de comportamento que veio junto: `exceljs` não lê o .xls legado
// (BIFF), só .xlsx. `lerPlanilha` avisa em vez de falhar mudo.
//
// `exceljs` também não lê export do Google Sheets/Lark Sheet (bug próprio da
// lib, nunca corrigido — ver `lerXlsxBufferFallback`). `lerXlsxBuffer` cobre
// isso com um fallback que ignora estilo.

export class PlanilhaFormatoAntigo extends Error {
  constructor() {
    super("Formato .xls antigo não é mais aceito. Salve como .xlsx ou CSV.");
    this.name = "PlanilhaFormatoAntigo";
  }
}

// O bundle de browser do exceljs é UMD; conforme o bundler, o namespace vem
// direto ou embrulhado em `default`.
async function carregarExcelJS() {
  const mod = await import("exceljs");
  const m = mod as unknown as { default?: unknown };
  return (m.default ?? mod) as typeof import("exceljs");
}

// Uma célula do exceljs pode ser string, número, Date, fórmula, rich text ou
// hyperlink. O import trata tudo como texto (era `raw: false` no SheetJS).
export function textoDaCelula(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toLocaleDateString("pt-BR");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.richText)) {
      return o.richText.map((t) => String((t as { text?: unknown }).text ?? "")).join("");
    }
    if ("result" in o) return textoDaCelula(o.result); // fórmula: usa o valor calculado
    if ("text" in o) return String(o.text ?? ""); // hyperlink
    if ("error" in o) return "";
    return "";
  }
  return String(v);
}

// CSV na mão porque o exceljs só lê CSV a partir de stream de Node. Trata
// aspas, separador dentro de aspas e quebra de linha dentro de aspas.
export function lerCsv(texto: string): string[][] {
  const limpo = texto.replace(/^﻿/, "");
  const primeira = limpo.split("\n")[0] ?? "";
  // Excel em pt-BR exporta com `;`; o resto do mundo com `,`. Decide pelo que
  // aparece mais no cabeçalho.
  const sep = (primeira.match(/;/g)?.length ?? 0) >= (primeira.match(/,/g)?.length ?? 0) ? ";" : ",";

  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let emAspas = false;

  for (let i = 0; i < limpo.length; i++) {
    const ch = limpo[i];
    if (emAspas) {
      if (ch === '"') {
        if (limpo[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          emAspas = false;
        }
      } else {
        campo += ch;
      }
      continue;
    }
    if (ch === '"') {
      emAspas = true;
    } else if (ch === sep) {
      linha.push(campo);
      campo = "";
    } else if (ch === "\n") {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else if (ch !== "\r") {
      campo += ch;
    }
  }
  if (campo !== "" || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas;
}

async function lerXlsxBufferExcelJS(buf: ArrayBuffer): Promise<string[][]> {
  const ExcelJS = await carregarExcelJS();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const grid: string[][] = [];
  // Percorre por índice (e não com `eachRow`) pra linha vazia no meio não
  // desalinhar o corpo em relação ao cabeçalho.
  for (let r = 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const linha: string[] = [];
    for (let c = 1; c <= ws.columnCount; c++) linha.push(textoDaCelula(row.getCell(c).value));
    grid.push(linha);
  }
  return grid;
}

async function carregarJSZip() {
  const mod = await import("jszip");
  const m = mod as unknown as { default?: unknown };
  return (m.default ?? mod) as typeof import("jszip");
}

function colunaDaRef(ref: string): number {
  const letras = ref.match(/[A-Z]+/)?.[0] ?? "A";
  let n = 0;
  for (const ch of letras) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1; // 0-based
}

function textoDosNos(el: Element | null): string {
  if (!el) return "";
  return Array.from(el.getElementsByTagName("t"))
    .map((t) => t.textContent ?? "")
    .join("");
}

// Fallback pra quando o exceljs não consegue ler o arquivo. Bug conhecido e
// nunca corrigido pela lib (exceljs#104, aberta em 2016; exceljs#2802, 2024):
// o `styles.xml` que o Google Sheets (e Lark Sheet) exportam tem um XML de
// borda que quebra o parser de ESTILO do exceljs antes mesmo de ler os dados
// — o arquivo abre normal no Excel de verdade. Import de lead só precisa do
// texto das células, sem formatação nenhuma, então lê o XML na mão via
// jszip (dependência do próprio exceljs) e ignora `styles.xml` de vez, o que
// evita o bug por completo.
async function lerXlsxBufferFallback(buf: ArrayBuffer): Promise<string[][]> {
  const JSZip = await carregarJSZip();
  const zip = await JSZip.loadAsync(buf);

  const nomeAba = Object.keys(zip.files)
    .filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n))
    .sort()[0];
  if (!nomeAba) return [];

  const parser = new DOMParser();

  const sharedStringsXml = await zip.file("xl/sharedStrings.xml")?.async("text");
  const sharedStrings = sharedStringsXml
    ? Array.from(
        parser.parseFromString(sharedStringsXml, "application/xml").getElementsByTagName("si"),
      ).map(textoDosNos)
    : [];

  const sheetXml = await zip.file(nomeAba)!.async("text");
  const doc = parser.parseFromString(sheetXml, "application/xml");

  const grid: string[][] = [];
  for (const rowEl of Array.from(doc.getElementsByTagName("row"))) {
    const linha: string[] = [];
    for (const cellEl of Array.from(rowEl.getElementsByTagName("c"))) {
      const ref = cellEl.getAttribute("r") ?? "";
      const idx = ref ? colunaDaRef(ref) : linha.length;
      const tipo = cellEl.getAttribute("t");
      let valor: string;
      if (tipo === "inlineStr") {
        valor = textoDosNos(cellEl.getElementsByTagName("is")[0] ?? null);
      } else {
        const raw = cellEl.getElementsByTagName("v")[0]?.textContent ?? "";
        valor = tipo === "s" ? (sharedStrings[Number(raw)] ?? "") : raw;
      }
      while (linha.length < idx) linha.push("");
      linha[idx] = valor;
    }
    grid.push(linha);
  }
  return grid;
}

export async function lerXlsxBuffer(buf: ArrayBuffer): Promise<string[][]> {
  try {
    return await lerXlsxBufferExcelJS(buf);
  } catch {
    return lerXlsxBufferFallback(buf);
  }
}

// Grid cru do arquivo: linha 0 é o cabeçalho, célula sempre string.
export async function lerPlanilha(file: File): Promise<string[][]> {
  const nome = file.name.toLowerCase();
  if (nome.endsWith(".csv")) return lerCsv(await file.text());
  if (nome.endsWith(".xls")) throw new PlanilhaFormatoAntigo();
  return lerXlsxBuffer(await file.arrayBuffer());
}

export async function gerarXlsx(
  linhas: (string | number)[][],
  aba: string,
): Promise<ArrayBuffer> {
  const ExcelJS = await carregarExcelJS();
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(aba);
  ws.addRows(linhas);
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}
