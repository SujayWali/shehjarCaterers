import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { MenuDoc } from '@/types/menu';

const CONTACT_LINE =
  'MOBILE: 9810421233, 7018227126,  EMAIL: shehjarcaterers@gmail.com';

type Col = { pct: number; key: 'date'|'particulars'|'menu'|'time'|'numPersons' };

const COLS: Col[] = [
  { pct: 14, key: 'date' },
  { pct: 16, key: 'particulars' },
  { pct: 42, key: 'menu' },
  { pct: 14, key: 'time' },
  { pct: 14, key: 'numPersons' },
];

// A4 in points
const PAGE_W = 595.28;
const PAGE_H = 841.89;

// margins & sizes
const M = 36; // 0.5 inch
const TOP = PAGE_H - M;
const LEFT = M;
const RIGHT = PAGE_W - M;
const BOTTOM = M;

const HEADER_H = 22;         // header row height
const CELL_PAD_X = 4;
const CELL_PAD_Y = 3;
const BORDER_W = 0.8;

const FS_HEADER = 11;
const FS_CELL = 10;
const FS_TITLE = 24;
const FS_SUB = 20;
const FS_CONTACT = 10;

const LINE_H = (sz: number) => sz * 1.28;

/** Basic word-wrap to maxWidth measured with font */
function wrapText(text: string, font: any, fontSize: number, maxWidth: number): string[] {
  if (!text) return [''];
  const words = text.replace(/\s+/g, ' ').split(' ');
  const lines: string[] = [];
  let current = '';

  words.forEach((w) => {
    const trial = current ? `${current} ${w}` : w;
    const width = font.widthOfTextAtSize(trial, fontSize);
    if (width <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      // if a single word is too long, hard split it
      if (font.widthOfTextAtSize(w, fontSize) > maxWidth) {
        let chunk = '';
        for (const ch of w) {
          const t = chunk + ch;
          if (font.widthOfTextAtSize(t, fontSize) <= maxWidth) chunk = t;
          else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = w;
      }
    }
  });
  if (current) lines.push(current);
  return lines;
}

async function tryEmbedImage(pdfDoc: PDFDocument, path: string) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const bytes = await res.arrayBuffer();
    if (path.toLowerCase().endsWith('.png')) return await pdfDoc.embedPng(bytes);
    return await pdfDoc.embedJpg(bytes);
  } catch {
    return null;
  }
}

/** draw a box with border */
function drawRect(page: any, x: number, y: number, w: number, h: number) {
  page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0,0,0), borderWidth: BORDER_W });
}

export async function generatePdf(base: Omit<MenuDoc, 'id'>) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // ────────────────── Cover Page
  {
    const cover = pdfDoc.addPage([PAGE_W, PAGE_H]);
    // Calculate heights
    let logoH = 0, logoW = 0;
    const logo = (await tryEmbedImage(pdfDoc, '/logo.jpg')) || (await tryEmbedImage(pdfDoc, '/logo.jpg'));
    if (logo) {
      const maxW = PAGE_W * 0.7;
      const scale = Math.min(1, maxW / logo.width);
      logoW = logo.width * scale;
      logoH = logo.height * scale;
    }
    const spacingLogo = logoH ? 12 : 0;
    const spacingContact = 24;
    const spacingTitle = 16;
    const totalHeight = (logoH ? logoH + spacingLogo : 0)
      + FS_CONTACT + spacingContact
      + FS_TITLE + spacingTitle
      + FS_SUB;
    let y = PAGE_H * 0.6 + totalHeight / 2;

    // Draw logo
    if (logo) {
      cover.drawImage(logo, { x: (PAGE_W - logoW) / 2, y: y - logoH, width: logoW, height: logoH });
      y -= logoH + spacingLogo;
    }
    // Contact line
    cover.drawText(CONTACT_LINE, {
      x: (PAGE_W - fontBold.widthOfTextAtSize(CONTACT_LINE, FS_CONTACT)) / 2,
      y: y - FS_CONTACT,
      size: FS_CONTACT,
      font: fontBold,
      color: rgb(0,0,0),
    });
    y -= FS_CONTACT + spacingContact;
    // MENU title
    cover.drawText('MENU', {
      x: (PAGE_W - fontBold.widthOfTextAtSize('MENU', FS_TITLE)) / 2,
      y: y - FS_TITLE,
      size: FS_TITLE,
      font: fontBold,
      color: rgb(0,0,0),
    });
    y -= FS_TITLE + spacingTitle;
    // Client name
    const client = base.clientName || '';
    cover.drawText(client, {
      x: (PAGE_W - fontBold.widthOfTextAtSize(client, FS_SUB)) / 2,
      y: y - FS_SUB,
      size: FS_SUB,
      font: fontBold,
      color: rgb(0,0,0),
    });
  }

  // ────────────────── Table pages (grouped by date)
  const rowsSorted = [...base.rows].sort((a, b) => a.date.localeCompare(b.date));
  const groups: Record<string, typeof base.rows> = {};
  for (const r of rowsSorted) {
    (groups[r.date] ||= []).push(r);
  }

  // Precompute column widths from percentages
  const contentW = PAGE_W - 2 * M;
  const colW = COLS.map(c => (c.pct / 100) * contentW);

  /** draw header row and return new Y */
  const drawHeader = (page: any, y: number) => {
    let x = LEFT;
    const headers = ['Date', 'Particulars', 'Menu', 'Time', 'No. of persons'];
    for (let i = 0; i < headers.length; i++) {
      drawRect(page, x, y - HEADER_H, colW[i], HEADER_H);
      const text = headers[i];
      const tw = fontBold.widthOfTextAtSize(text, FS_HEADER);
      page.drawText(text, {
        x: x + (colW[i] - tw) / 2,
        y: y - HEADER_H + (HEADER_H - FS_HEADER) / 2,
        size: FS_HEADER,
        font: fontBold,
        color: rgb(0,0,0),
      });
      x += colW[i];
    }
    return y - HEADER_H;
  };

  /** if not enough space for height, add a new page and header; returns {page,y} */
  const ensureSpace = (page: any, y: number, neededH: number) => {
    if (y - neededH < BOTTOM) {
      page = pdfDoc.addPage([PAGE_W, PAGE_H]);
      y = TOP;
      y = drawHeader(page, y);
    }
    return { page, y };
  };

  for (const [date, rows] of Object.entries(groups)) {
    // Create a new page for each date
    let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = TOP;
    y = drawHeader(page, y);

    // Compute wrapped lines & row heights first
    const prepared = rows.map((r) => {
      const menuLinesRaw = (r.menu || '').split(/\r?\n/).filter(Boolean);
      const menuLinesWrapped = menuLinesRaw.flatMap(l => wrapText(l, fontRegular, FS_CELL, colW[2] - 2 * CELL_PAD_X));
      const partLines = wrapText(r.particulars || '', fontBold, FS_CELL, colW[1] - 2 * CELL_PAD_X);
      const timeLines = wrapText(r.time || '', fontRegular, FS_CELL, colW[3] - 2 * CELL_PAD_X);
      const personsLines = wrapText(r.numPersons ? String(r.numPersons) : '', fontRegular, FS_CELL, colW[4] - 2 * CELL_PAD_X);

      const menuH = Math.max(menuLinesWrapped.length * LINE_H(FS_CELL), LINE_H(FS_CELL));
      const partH = Math.max(partLines.length * LINE_H(FS_CELL), LINE_H(FS_CELL));
      const timeH = Math.max(timeLines.length * LINE_H(FS_CELL), LINE_H(FS_CELL));
      const persH = Math.max(personsLines.length * LINE_H(FS_CELL), LINE_H(FS_CELL));

      const rowH = Math.max(menuH, partH, timeH, persH) + 2 * CELL_PAD_Y;
      return { r, rowH, menuLinesWrapped, partLines, timeLines, personsLines };
    });

    const groupH = prepared.reduce((s, p) => s + p.rowH, 0);

    // Draw the Date col as one big merged cell
    let gx = LEFT;
    drawRect(page, gx, y - groupH, colW[0], groupH);
    // center date vertically
    const dateTextH = FS_CELL;
    page.drawText(date, {
      x: gx + CELL_PAD_X,
      y: y - groupH + (groupH - dateTextH) / 2,
      size: FS_CELL,
      font: fontBold,
      color: rgb(0,0,0),
    });
    gx += colW[0];

    // For each row, draw remaining 4 columns
    for (const p of prepared) {
      const { r, rowH, menuLinesWrapped, partLines, timeLines, personsLines } = p;

      let x = LEFT + colW[0];

      // Particulars (bold, centered vertically)
      drawRect(page, x, y - rowH, colW[1], rowH);
      {
        let ty = y - CELL_PAD_Y - FS_CELL;
        for (const line of partLines) {
          page.drawText(line, {
            x: x + CELL_PAD_X,
            y: ty,
            size: FS_CELL,
            font: fontBold,
            color: rgb(0,0,0),
          });
          ty -= LINE_H(FS_CELL);
        }
      }
      x += colW[1];

      // Menu
      drawRect(page, x, y - rowH, colW[2], rowH);
      {
        let ty = y - CELL_PAD_Y - FS_CELL;
        for (const line of menuLinesWrapped) {
          page.drawText(line, {
            x: x + CELL_PAD_X,
            y: ty,
            size: FS_CELL,
            font: fontRegular,
            color: rgb(0,0,0),
          });
          ty -= LINE_H(FS_CELL);
        }
      }
      x += colW[2];

      // Time
      drawRect(page, x, y - rowH, colW[3], rowH);
      {
        let ty = y - CELL_PAD_Y - FS_CELL;
        for (const line of timeLines) {
          page.drawText(line, {
            x: x + CELL_PAD_X,
            y: ty,
            size: FS_CELL,
            font: fontRegular,
            color: rgb(0,0,0),
          });
          ty -= LINE_H(FS_CELL);
        }
      }
      x += colW[3];

      // Persons
      drawRect(page, x, y - rowH, colW[4], rowH);
      {
        let ty = y - CELL_PAD_Y - FS_CELL;
        for (const line of personsLines) {
          page.drawText(line, {
            x: x + CELL_PAD_X,
            y: ty,
            size: FS_CELL,
            font: fontRegular,
            color: rgb(0,0,0),
          });
          ty -= LINE_H(FS_CELL);
        }
      }

      y -= rowH;
    }
    // bottom border of the merged date cell already drawn by its rectangle
    // go to next group
  }

  const bytesRaw = await pdfDoc.save();
  const ab = new ArrayBuffer(bytesRaw.length);
  const bytes = new Uint8Array(ab);
  bytes.set(bytesRaw);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const safe = base.clientName.trim().replace(/\s+/g, '_');
  return { blob, filename: `menu_${safe}.pdf` };
}
