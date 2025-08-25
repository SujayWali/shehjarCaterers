import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { MenuDoc } from '@/types/menu';

const CONTACT_LINE =
  'MOBILE: 9810421233, 7018227126,  EMAIL: shehjarcaterers@gmail.com';

export async function generatePdf(base: Omit<MenuDoc, 'id'>) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Cover Page
  const coverPage = pdfDoc.addPage([595.28, 841.89]); // A4 size
  let y = 700;
  // Logo placeholder (centered)
  // If you want to add an actual image, use pdfDoc.embedPng or embedJpg
  coverPage.drawText('[Logo]', {
    x: 297.64 - 60,
    y: y + 80,
    size: 40,
    font: fontRegular,
    color: rgb(0.7, 0.7, 0.7),
  });
  // Contact line
  coverPage.drawText(CONTACT_LINE, {
    x: 297.64 - (fontBold.widthOfTextAtSize(CONTACT_LINE, 12) / 2),
    y: y + 40,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  // MENU title
  coverPage.drawText('MENU', {
    x: 297.64 - (fontBold.widthOfTextAtSize('MENU', 24) / 2),
    y: y,
    size: 24,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  // Client name
  coverPage.drawText(base.clientName, {
    x: 297.64 - (fontBold.widthOfTextAtSize(base.clientName, 20) / 2),
    y: y - 40,
    size: 20,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  // Table pages per date
  const rowsSorted = [...base.rows].sort((a, b) => a.date.localeCompare(b.date));
  const groups: Record<string, typeof base.rows> = {};
  for (const r of rowsSorted) {
    groups[r.date] = groups[r.date] || [];
    groups[r.date].push(r);
  }

  Object.entries(groups).forEach(([date, group]) => {
    const page = pdfDoc.addPage([595.28, 841.89]);
    let y = 800;
    const headers = ['Date', 'Particulars', 'Menu', 'Time', 'No. of persons'];
    // Draw table header with borders
    headers.forEach((h, i) => {
      page.drawText(h, {
        x: 50 + i * 100,
        y,
        size: 12,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
      // Draw header cell border
      page.drawRectangle({
        x: 50 + i * 100,
        y: y - 2,
        width: 100,
        height: 25,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });
    });
    y -= 25;
    // Table rows
    group.forEach((r, idx) => {
      let x = 50;
      const rowHeight = Math.max(20, ((r.menu ?? '').split(/\r?\n/).length || 1) * 15);
      // Draw row cell borders
      for (let col = 0; col < 5; col++) {
        page.drawRectangle({
          x: 50 + col * 100,
          y: y - 2,
          width: 100,
          height: rowHeight,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });
      }
      // Date cell: only for first row, center
      if (idx === 0) {
        page.drawText(date, {
          x,
          y: y + rowHeight / 2 - 6,
          size: 12,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
      }
      x += 100;
      // Particulars: center, bold, Times New Roman, size 12
      page.drawText(r.particulars, {
        x,
        y: y + rowHeight / 2 - 6,
        size: 12,
        font: fontBold,
        color: rgb(0, 0, 0),
        maxWidth: 90,
      });
      x += 100;
      // Menu: Times New Roman, size 11, spacing below
      const menuLines = (r.menu ?? '').split(/\r?\n/).filter(l => l.trim() !== '');
      if (menuLines.length) {
        menuLines.forEach((line, i) => {
          page.drawText(line, {
            x,
            y: y + rowHeight - (i + 1) * 15,
            size: 11,
            font: fontRegular,
            color: rgb(0, 0, 0),
            maxWidth: 90,
          });
        });
      } else {
        page.drawText('—', {
          x,
          y: y + rowHeight / 2 - 6,
          size: 11,
          font: fontRegular,
          color: rgb(0, 0, 0),
          maxWidth: 90,
        });
      }
      x += 100;
      // Time: center
      page.drawText(r.time || '', {
        x,
        y: y + rowHeight / 2 - 6,
        size: 11,
        font: fontRegular,
        color: rgb(0, 0, 0),
        maxWidth: 90,
      });
      x += 100;
      // No. of persons: center, blank if 0
      page.drawText(r.numPersons === 0 ? '' : String(r.numPersons), {
        x,
        y: y + rowHeight / 2 - 6,
        size: 11,
        font: fontRegular,
        color: rgb(0, 0, 0),
        maxWidth: 90,
      });
      y -= rowHeight;
    });
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const safeName = base.clientName.trim().replace(/\s+/g, '_');
  const filename = `menu_${safeName}.pdf`;
  return { blob, filename };
}
