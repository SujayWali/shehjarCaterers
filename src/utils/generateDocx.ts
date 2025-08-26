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


export const CONTACT_LINE =
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
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: h, bold: true, font: 'Times New Roman', size: 24 })
                ]
              })
            ],
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
          })
      ),
    });

    const span = group.length;
    const bodyRows: TableRow[] = [];
    group.forEach((r, idx) => {
      const cells: TableCell[] = [];
      if (idx === 0) {
        cells.push(
          new TableCell({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: date, font: 'Times New Roman', size: 24 })]
              })
            ],
            rowSpan: span,
          })
        );
      }
      // Particulars cell: center, bold, Times New Roman, size 12
      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: r.particulars, bold: true, font: 'Times New Roman', size: 24 })
              ]
            })
          ]
        })
      );
      // Menu cell: Times New Roman, size 11, spacing below
      const menuLines = (r.menu ?? '').split(/\r?\n/).filter(l => l.trim() !== '');
      const menuParagraphs = menuLines.length
        ? menuLines.map((line, i, arr) =>
            new Paragraph({
              children: [new TextRun({ text: line, font: 'Times New Roman', size: 22 })],
              spacing: i === arr.length - 1 ? { after: 200 } : undefined
            })
          )
        : [new Paragraph({ children: [new TextRun({ text: '—', font: 'Times New Roman', size: 22 })] })];
      cells.push(
        new TableCell({
          children: menuParagraphs
        })
      );
      // Time cell: center
      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: r.time || '', font: 'Times New Roman', size: 22 })]
            })
          ]
        })
      );
      // No. of persons cell: center
      cells.push(
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: r.numPersons === 0 ? '' : String(r.numPersons), font: 'Times New Roman', size: 22 })]
            })
          ]
        })
      );
      bodyRows.push(new TableRow({ children: cells }));
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
