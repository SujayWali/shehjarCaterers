import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  SectionType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  PageOrientation,
} from 'docx';
import { MenuDoc } from '@/types/menu';

const CONTACT_LINE =
  'MOBILE: 9810421233, 7018227126,  EMAIL: shehjarcaterers@gmail.com';

function cellParagraphs(text: string) {
  const lines = (text ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return (lines.length ? lines : ['—']).map(
    (l) => new Paragraph({ children: [new TextRun({ text: l })] })
  );
}

async function loadLogo(): Promise<ImageRun | null> {
  try {
    const res = await fetch('/logo.jpg');
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    // A4 size in px at 72 DPI: 595 x 842
    // 120% width, 25% height
    return new ImageRun({
      data: new Uint8Array(buf),
      transformation: {
        width: Math.floor(1.2 * 595),
        height: Math.floor(0.25 * 842),
      },
    });
  } catch {
    return null;
  }
}

export async function generateDocx(base: Omit<MenuDoc, 'id'>) {
  const logo = await loadLogo();

  const coverTitle = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'MENU', bold: true, size: 48 })],
    spacing: { before: 200, after: 200 },
  });

  const coverClient = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: base.clientName, bold: true, size: 40 })],
    spacing: { after: 200 },
  });

  const contactLinePara = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: CONTACT_LINE, bold: true })],
    spacing: { after: 200 },
  });

  let logoPara = null;
  if (logo) {
    logoPara = new Paragraph({ alignment: AlignmentType.CENTER, children: [logo] });
  }

  const coverChildren = logoPara
    ? [logoPara, contactLinePara, coverTitle, coverClient]
    : [contactLinePara, coverTitle, coverClient];

  const coverSection = {
    properties: {
      type: SectionType.NEXT_PAGE,
      page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
    },
    children: coverChildren,
  } as const;

  const rowsSorted = [...base.rows].sort((a, b) => a.date.localeCompare(b.date));
  const groups: Record<string, typeof base.rows> = {};
  for (const r of rowsSorted) {
    groups[r.date] = groups[r.date] || [];
    groups[r.date].push(r);
  }

  const tableSections = Object.entries(groups).map(([date, group]) => {
    const headerRow = new TableRow({
      tableHeader: true,
      children: ['Date', 'Particulars', 'Menu', 'Time', 'No. of persons'].map(
        (h) =>
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: h, bold: true })] }),
            ],
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
          })
      ),
    });

    const bodyRows: TableRow[] = group.map((r) => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun(date)] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(r.particulars)] })] }),
          new TableCell({ children: cellParagraphs(r.menu) }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(r.time)] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(String(r.numPersons))] })] }),
        ],
      });
    });

    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...bodyRows],
      borders: {
        top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      },
    });

    return {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 },
          orientation: PageOrientation.PORTRAIT,
        },
      },
      children: [table],
    } as const;
  });

  const doc = new Document({ sections: [coverSection, ...tableSections] });
  const blob = await Packer.toBlob(doc);

  const safeName = base.clientName.trim().replace(/\s+/g, '_');
  const filename = `menu_${safeName}.docx`;
  return { blob, filename };
}
