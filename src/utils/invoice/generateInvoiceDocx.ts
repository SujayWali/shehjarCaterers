import {
  AlignmentType,
  BorderStyle,
  Document,
  Packer,
  Paragraph,
  SectionType,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { Invoice } from "./types";
import { amountToWords } from "./amountToWords";

/** twips: 1" = 1440, 1 mm ≈ 56.6929 twips */
const mm = (v: number) => Math.round(v * 56.6929);

// ---- page geometry (A4, 12.7mm margins) ----
const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 12.7;
const CONTENT_W_TW = mm(PAGE_W_MM - 2 * MARGIN_MM); // exact content width in twips

// ---- 8 columns (percentages must sum to 100) ----
const COL_PCT = [6, 46, 8, 8, 10, 8, 10, 4];
const colTwips = (() => {
  const total = COL_PCT.reduce((a, b) => a + b, 0);
  const raw = COL_PCT.map((p) => Math.floor((p / total) * CONTENT_W_TW));
  // ensure perfect fit: hand the rounding remainder to the last column
  const diff = CONTENT_W_TW - raw.reduce((a, b) => a + b, 0);
  raw[raw.length - 1] += diff;
  return raw;
})();

// ---- single border set: outer + inside lines (no per-cell borders) ----
const boxBorders = {
  top: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
  insideH: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
  insideV: { style: BorderStyle.SINGLE, size: 8, color: "000000" },
} as const;

// ---- tiny helpers ----
const run = (text: string, opts: Partial<TextRun> = {}) =>
  new TextRun({ text, ...opts });

const para = (
  text: string,
  opts: { align?: any; bold?: boolean; size?: number } = {}
) =>
  new Paragraph({
    alignment: opts.align ?? AlignmentType.LEFT,
    children: [run(text, { bold: opts.bold, size: opts.size })],
  });

export async function generateInvoiceDocx(
  inv: Invoice
): Promise<{ blob: Blob; filename: string }> {
  const total = inv.items.reduce((s, it) => s + (it.amountRs || 0), 0);
  const words = inv.amountInWords || amountToWords(total);

  /* ────────────────────────── Top band (2 columns: title block + bill/date) */
  const top = new Table({
    width: { size: CONTENT_W_TW, type: WidthType.DXA },
    borders: boxBorders,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            children: [
              para("INVOICE", { align: AlignmentType.CENTER, bold: true, size: 24 }),
              para("Catering", { align: AlignmentType.CENTER, size: 20 }),
            ],
          }),
          new TableCell({
            children: [
              para(`BILL-${inv.billNo}`, { align: AlignmentType.RIGHT, size: 20 }),
              para(`Date: ${inv.billDate}`, { align: AlignmentType.RIGHT, size: 20 }),
            ],
          }),
        ],
      }),
    ],
    // split width ~2/3 : 1/3
    columnWidths: [Math.round((2 / 3) * CONTENT_W_TW), Math.round((1 / 3) * CONTENT_W_TW)],
    layout: TableLayoutType.FIXED,
  });

  /* ────────────────────────── Supplier / Receiver (2 columns) */
  const headerBar = (text: string) =>
    new TableCell({
      children: [
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [run(text, { bold: true, size: 20 })],
          shading: { type: ShadingType.CLEAR, color: "auto", fill: "EEEEEE" },
        }),
      ],
    });

  const supplierReceiver = new Table({
    width: { size: CONTENT_W_TW, type: WidthType.DXA },
    borders: boxBorders,
    columnWidths: [Math.floor(CONTENT_W_TW / 2), CONTENT_W_TW - Math.floor(CONTENT_W_TW / 2)],
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          headerBar("Detail Of Services Supplier"),
          headerBar("Details of Receiver (Billed to)"),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [
              para(inv.supplier.name),
              para(inv.supplier.address),
              inv.supplier.mobile ? para(`Mob: ${inv.supplier.mobile}`) : para(""),
            ],
          }),
          new TableCell({
            children: [
              para(`Name: ${inv.receiver.name}`),
              para(`Address: ${inv.receiver.address}`),
              para(`State: ${inv.receiver.state || ""}`),
              inv.receiver.mobile ? para(`MOB: ${inv.receiver.mobile}`) : para(""),
              para(`GSTIN/Unique ID: ${inv.receiver.gstin || ""}`),
              para(`PAN: ${inv.receiver.pan || ""}`),
            ],
          }),
        ],
      }),
    ],
  });

  /* ────────────────────────── Items table (8 columns, fixed grid) */
  const HEAD = ["S.No.", "PARTICULARS", "", "", "Period", "Rate", "Amount Rs.", "Ps."];

  const headerRow = new TableRow({
    tableHeader: true,
    children: HEAD.map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [run(h || " ", { bold: true, size: 22 })],
            }),
          ],
        })
    ),
  });

  const bodyRows = inv.items.map(
    (it) =>
      new TableRow({
        children: [
          new TableCell({ children: [para(String(it.sno), { align: AlignmentType.CENTER })] }),
          new TableCell({ children: [para(it.particulars)] }),
          new TableCell({ children: [para("")] }),
          new TableCell({ children: [para("")] }),
          new TableCell({ children: [para(it.period || "")] }),
          new TableCell({ children: [para(it.rate != null ? String(it.rate) : "")] }),
          new TableCell({
            children: [para((it.amountRs ?? 0).toFixed(2), { align: AlignmentType.RIGHT })],
          }),
          new TableCell({ children: [para(String(it.ps ?? 0), { align: AlignmentType.RIGHT })] }),
        ],
      })
  );

  const totalRow = new TableRow({
    children: [
      new TableCell({ children: [para("")] }),
      new TableCell({ children: [para("TOTAL", { align: AlignmentType.RIGHT, bold: true })] }),
      new TableCell({ children: [para("")] }),
      new TableCell({ children: [para("")] }),
      new TableCell({ children: [para("")] }),
      new TableCell({ children: [para("")] }),
      new TableCell({
        children: [para(total.toFixed(2), { align: AlignmentType.RIGHT, bold: true })],
      }),
      new TableCell({ children: [para("0", { align: AlignmentType.RIGHT })] }),
    ],
  });

  const itemsTable = new Table({
    width: { size: CONTENT_W_TW, type: WidthType.DXA }, // table owns exact width
    layout: TableLayoutType.FIXED,                      // freeze column grid
    columnWidths: colTwips,                             // 8 columns that fit perfectly
    borders: boxBorders,                                // single set of borders
    rows: [headerRow, ...bodyRows, totalRow],
  });

  /* ────────────────────────── Footer band */
  const footer = new Table({
    width: { size: CONTENT_W_TW, type: WidthType.DXA },
    borders: boxBorders,
    columnWidths: [Math.round((3 / 4) * CONTENT_W_TW), Math.round((1 / 4) * CONTENT_W_TW)],
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [para(words, { size: 18 })] }),
          new TableCell({
            children: [para(`${total.toFixed(2)} Rs. | 0 Ps.`, { align: AlignmentType.RIGHT, size: 18 })],
          }),
        ],
      }),
    ],
  });

  /* ────────────────────────── Document */
  const doc = new Document({
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            size: { width: mm(PAGE_W_MM), height: mm(PAGE_H_MM) },
            margin: {
              top: mm(MARGIN_MM),
              bottom: mm(MARGIN_MM),
              left: mm(MARGIN_MM),
              right: mm(MARGIN_MM),
            },
          },
        },
        children: [top, supplierReceiver, itemsTable, footer],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return { blob, filename: `invoice_${inv.billNo}.docx` };
}
