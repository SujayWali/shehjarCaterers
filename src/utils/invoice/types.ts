export type Party = {
  name: string;
  address: string;
  state?: string;
  mobile?: string;
  gstin?: string;
  pan?: string;
};

export type LineItem = {
  sno: number;
  particulars: string;
  period?: string;
  rate?: number | string;
  amountRs: number;
  ps?: number;
};

export type Invoice = {
  billNo: string;
  billDate: string; // "03-12-2024"
  supplier: Party;
  receiver: Party;
  items: LineItem[];
  amountInWords: string; // e.g., "TEN THOUSAND ONLY"
};
