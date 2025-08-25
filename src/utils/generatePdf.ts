import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { MenuDoc } from '@/types/menu';

const CONTACT_LINE =
  'MOBILE: 9810421233, 7018227126,  EMAIL: shehjarcaterers@gmail.com';

export async function generatePdf(base: Omit<MenuDoc, 'id'>) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Cover Page
  const coverPage = pdfDoc.addPage([595.28, 841.89]); // A4 size
  coverPage.drawText('Shehjar Caterers', {
    x: 50,
    y: 760,
    size: 32,
    font,
    color: rgb(0, 0, 0),
  });
  coverPage.drawText(base.clientName, {
    x: 50,
    y: 710,
    size: 24,
    font,
    color: rgb(0, 0, 0),
  });
  coverPage.drawText(CONTACT_LINE, {
    x: 50,
    y: 680,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });

  // Table Page
  const tablePage = pdfDoc.addPage([595.28, 841.89]);
  const headers = ['Date', 'Particulars', 'Menu', 'Time', 'No. of persons'];
  let y = 800;
  headers.forEach((h, i) => {
    tablePage.drawText(h, {
      x: 50 + i * 100,
      y,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
  });
  y -= 25;
  const rowsSorted = [...base.rows].sort((a, b) => a.date.localeCompare(b.date));
  rowsSorted.forEach((row) => {
    const values = [row.date, row.particulars, row.menu, row.time, String(row.numPersons)];
    values.forEach((v, i) => {
      tablePage.drawText(v, {
        x: 50 + i * 100,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
        maxWidth: 90,
      });
    });
    y -= 20;
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const safeName = base.clientName.trim().replace(/\s+/g, '_');
  const filename = `menu_${safeName}.pdf`;
  return { blob, filename };
}
