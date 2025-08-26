import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Invoice } from './types';
import { amountToWords } from './amountToWords';

// helpers
const mm = (v: number) => `${v}mm`;
const pct = (n: number) => `${n}%`;

// column titles + widths (%) in the order you want
const HEADERS = ["S.No.", "PARTICULARS", "", "", "Period", "Rate", "Amount Rs.", "Ps."];
const COL = [6, 46, 8, 8, 10, 8, 10, 4];

// If your viewer still shows faint dots, bump to 1.1
const BORDER_PT = 1;

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    padding: mm(12.7),
    backgroundColor: '#fff',
  },

  // ───── Top band (title + bill no/date)
  topBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderWidth: BORDER_PT,
    borderColor: '#000',
    marginBottom: mm(2),
    padding: mm(2),
  },
  titleBlock: { flex: 1, alignItems: 'center' },
  billBlock: { alignItems: 'flex-end', fontSize: 10 },

  // ───── Supplier / Receiver block
  supplierReceiver: {
    flexDirection: 'row',
    borderWidth: BORDER_PT,
    borderColor: '#000',
    marginBottom: mm(2),
  },
  supplier: {
    flex: 1,
    borderRightWidth: BORDER_PT,
    borderColor: '#000',
    padding: mm(2),
  },
  receiver: { flex: 1, padding: mm(2) },
  headerBar: {
    fontWeight: 'bold',
    fontSize: 10,
    backgroundColor: '#eee',
    paddingBottom: mm(1),
    marginBottom: mm(1),
  },

  // ───── Main table (single-line separators)
  mainTable: {
    borderWidth: BORDER_PT,
    borderColor: '#000',
    marginBottom: mm(2),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: BORDER_PT,
    borderColor: '#000',
    minHeight: mm(7),
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: mm(1),
  },
  cell: {
    justifyContent: 'center',
    padding: mm(1),
  },
  vSep: { borderRightWidth: BORDER_PT, borderColor: '#000' },
  headerText: { fontWeight: 'bold', fontSize: 12, textAlign: 'center' },
  center: { textAlign: 'center' },
  right: { textAlign: 'right' },

  // ───── Footer band
  footer: {
    flexDirection: 'row',
    borderWidth: BORDER_PT,
    borderColor: '#000',
    padding: mm(2),
    marginTop: mm(2),
  },
  amountWords: { flex: 3, fontSize: 9, textTransform: 'uppercase' },
  amountNum: { flex: 1, fontSize: 10, textAlign: 'right' },
});

export function InvoicePdfDocument({ inv }: { inv: Invoice }) {
  const totalAmount = inv.items.reduce((sum, i) => sum + (i.amountRs || 0), 0);
  const words = inv.amountInWords || amountToWords(totalAmount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Top band */}
        <View style={styles.topBand}>
          <View style={styles.titleBlock}>
            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>INVOICE</Text>
            <Text style={{ fontSize: 10 }}>Catering</Text>
          </View>
          <View style={styles.billBlock}>
            <Text>{`BILL-${inv.billNo}`}</Text>
            <Text>{`Date: ${inv.billDate}`}</Text>
          </View>
        </View>

        {/* ── Supplier / Receiver */}
        <View style={styles.supplierReceiver}>
          <View style={styles.supplier}>
            <Text style={styles.headerBar}>Detail Of Services Supplier</Text>
            <Text>{inv.supplier.name}</Text>
            <Text>{inv.supplier.address}</Text>
            <Text>Mob: {inv.supplier.mobile}</Text>
            {!!inv.supplier.state && <Text>State: {inv.supplier.state}</Text>}
            {!!inv.supplier.gstin && <Text>GSTIN: {inv.supplier.gstin}</Text>}
            {!!inv.supplier.pan && <Text>PAN: {inv.supplier.pan}</Text>}
          </View>
          <View style={styles.receiver}>
            <Text style={styles.headerBar}>Details of Receiver (Billed to)</Text>
            <Text>Name: {inv.receiver.name}</Text>
            <Text>Address: {inv.receiver.address}</Text>
            {!!inv.receiver.state && <Text>State: {inv.receiver.state}</Text>}
            {!!inv.receiver.mobile && <Text>MOB: {inv.receiver.mobile}</Text>}
            <Text>GSTIN/Unique ID: {inv.receiver.gstin || ''}</Text>
            <Text>PAN: {inv.receiver.pan || ''}</Text>
          </View>
        </View>

        {/* ── Main table */}
        <View style={styles.mainTable}>
          {/* header */}
          <View style={[styles.row, { borderTopWidth: BORDER_PT }]}>
            {HEADERS.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.headerCell,
                  { width: pct(COL[i]) },
                  ...(i < HEADERS.length - 1 ? [styles.vSep] : []),
                ]}
              >
                <Text style={styles.headerText}>{h || ' '}</Text>
              </View>
            ))}
          </View>

          {/* body rows */}
          {inv.items.map((it, i) => (
            <View key={i} style={styles.row}>
              {[0,1,2,3,4,5,6,7].map(j => (
                <View
                  key={j}
                  style={[
                    styles.cell,
                    { width: pct(COL[j]) },
                    ...(j < HEADERS.length - 1 ? [styles.vSep] : []),
                  ]}
                >
                  <Text style={j === 0 ? styles.center : j === 6 || j === 7 ? styles.right : undefined}>
                    {j === 0 ? it.sno :
                     j === 1 ? it.particulars :
                     j === 4 ? (it.period || '') :
                     j === 5 ? (it.rate ?? '') :
                     j === 6 ? (it.amountRs ?? 0).toFixed(2) :
                     j === 7 ? (it.ps ?? 0) : ''}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          {/* total row */}
          <View style={styles.row}>
            {[0,1,2,3,4,5,6,7].map(j => (
              <View
                key={j}
                style={[
                  styles.cell,
                  { width: pct(COL[j]) },
                  ...(j < HEADERS.length - 1 ? [styles.vSep] : []),
                ]}
              >
                <Text style={j === 1 ? styles.right : j === 6 || j === 7 ? styles.right : undefined}>
                  {j === 1 ? 'TOTAL' :
                   j === 6 ? totalAmount.toFixed(2) :
                   j === 7 ? '0' : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Footer */}
        <View style={styles.footer}>
          <Text style={styles.amountWords}>{words}</Text>
          <Text style={styles.amountNum}>{totalAmount.toFixed(2)} Rs. | 0 Ps.</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateInvoicePdfBlob(inv: Invoice): Promise<{ blob: Blob; filename: string }> {
  const { pdf } = await import('@react-pdf/renderer');
  const doc = <InvoicePdfDocument inv={inv} />;
  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();
  return { blob, filename: `invoice_${inv.billNo}.pdf` };
}
