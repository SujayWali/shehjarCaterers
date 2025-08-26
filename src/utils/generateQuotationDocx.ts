import {
  AlignmentType,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  SectionType,
  TextRun,
} from 'docx';

const CONTACT_LINE =
  'MOBILE: 9810421233, 7018227126,  EMAIL: shehjarcaterers@gmail.com';

async function loadLogo(): Promise<ImageRun | null> {
  try {
    const res = await fetch('/logo.jpg');
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new ImageRun({
      data: new Uint8Array(buf),
      transformation: { width: 600, height: 150 },
    });
  } catch {
    return null;
  }
}

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

export async function generateQuotationDocx(base: {
  date: string;
  description: string;
  totalCost: string;
}) {
  const logo = await loadLogo();

  const children = [];
  if (logo) {
    children.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [logo] }));
  }
  children.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: CONTACT_LINE, bold: true })], spacing: { after: 200 } }),
    new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `DATE: ${formatDateDMY(base.date)}`, bold: true })], spacing: { after: 200 } }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'QUOTATION', bold: true, size: 36 })], spacing: { after: 200 } })
  );
  children.push(...parseRichTextToParagraphs(base.description));
  children.push(new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: `Total Estimated Cost = Rs.${base.totalCost}/-`, bold: true, size: 28, color: '000000' })], spacing: { after: 200 } }));

// Format date as dd-mm-yyyy
function formatDateDMY(dateStr: string) {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper to parse HTML from rich text editor to docx Paragraphs
function parseRichTextToParagraphs(html: string) {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;
    const paragraphs: Paragraph[] = [];
    body.childNodes.forEach((node: any) => {
      if (node.nodeType === 3) {
        paragraphs.push(new Paragraph({ children: [new TextRun({ text: node.textContent || '', size: 28 })] }));
      } else if (node.nodeType === 1) {
        if ((node as HTMLElement).tagName === 'LI') {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: '• ' + node.textContent, size: 28 })] }));
        } else {
          paragraphs.push(new Paragraph({ children: [new TextRun({ text: (node as HTMLElement).textContent || '', size: 28 })] }));
        }
      }
    });
    return paragraphs;
  } catch {
    // fallback: plain text
    return [new Paragraph({ children: [new TextRun({ text: html.replace(/<[^>]+>/g, ''), size: 28 })] })];
  }
}
  

  const doc = new Document({
    sections: [
      {
        properties: { type: SectionType.NEXT_PAGE },
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  const filename = `quotation_${base.date.replace(/\//g, '-')}.docx`;
  return { blob, filename };
}
