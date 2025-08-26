import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { CONTACT_LINE } from './generateDocx';

function decodeHtmlEntities(str: string) {
  return str.replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function formatDescription(html: string) {
  // Remove tags, decode entities, convert bullets to new lines
  let text = html.replace(/<li[^>]*>/g, '\n• ').replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');
  text = decodeHtmlEntities(text);
  return text.trim();
}

  export async function generateQuotationPdf(base: {
    date: string;
    description: string;
    totalCost: string;
  }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let y = 780;
  // Logo
  try {
    const logoUrl = '/logo.jpg';
    const logoRes = await fetch(logoUrl);
    if (logoRes.ok) {
      const logoBytes = await logoRes.arrayBuffer();
      const logoImage = await pdfDoc.embedJpg(logoBytes);
      const logoDims = logoImage.scale(0.60); // Increased size
      // Center logo
      page.drawImage(logoImage, {
        x: (595 - logoDims.width) / 2,
        y: y - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      });
  y -= logoDims.height + 20; // Less space above CONTACT_LINE
    }
  } catch {}

  // Center CONTACT_LINE, bold
  const contactWidth = font.widthOfTextAtSize(CONTACT_LINE, 10);
  page.drawText(CONTACT_LINE, { x: (595 - contactWidth) / 2, y, size: 10, font, color: rgb(0,0,0) });
  y -= 30;
  // Format date as dd-mm-yyyy
  function formatDateDMY(dateStr: string) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }
  page.drawText(`DATE: ${formatDateDMY(base.date)}`, { x: 400, y, size: 12, font });
  y -= 40;
  // Center QUOTATION, black, bold
  const quotationText = 'QUOTATION';
  const quotationWidth = font.widthOfTextAtSize(quotationText, 18);
  page.drawText(quotationText, { x: (595 - quotationWidth) / 2, y, size: 18, font, color: rgb(0,0,0), });
  y -= 30; // Reduce space between QUOTATION and Description
  // Description: wrap long lines
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = base.description;
  const wrapText = (text: string, maxWidth: number, font: any, size: number) => {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (const word of words) {
      const testLine = line + (line ? ' ' : '') + word;
      const width = font.widthOfTextAtSize(testLine, size);
      if (width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = testLine;
      }
    }
    if (line) lines.push(line);
    return lines;
  };
  tempDiv.childNodes.forEach((node) => {
    let text = '';
    if (node.nodeType === 3) {
      text = node.textContent || '';
    } else if (node.nodeType === 1) {
      if ((node as HTMLElement).tagName === 'LI') {
        text = '• ' + node.textContent;
      } else {
        text = (node as HTMLElement).textContent || '';
      }
    }
    const lines = wrapText(text, 495, font, 12);
    for (const line of lines) {
      page.drawText(line, { x: 50, y, size: 12, font });
      y -= 18;
      if (y < 50) break;
    }
  });
  y -= 20;
  // Cost line
  const costLines = wrapText(`Total Estimated Cost = Rs.${base.totalCost}/-`, 495, font, 14);
  for (const line of costLines) {
    page.drawText(line, { x: 50, y, size: 14, font, color: rgb(0, 0, 0) });
    y -= 18;
    if (y < 50) break;
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([
    pdfBytes instanceof Uint8Array
      ? new Uint8Array(pdfBytes as Uint8Array)
      : pdfBytes
  ], { type: 'application/pdf' });
  const filename = `quotation_${base.date.replace(/\//g, '-')}.pdf`;
  return { blob, filename };
}
