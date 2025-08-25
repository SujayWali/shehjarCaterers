export type MenuRow = {
  date: string;
  particulars: string;
  menu: string;
  time: string;
  numPersons: number;
};

export type MenuDoc = {
  id?: string;
  userId: string;
  clientName: string;
  rows: MenuRow[];
  pdfUrl?: string;
  docxUrl?: string;
  createdAt: number;
  updatedAt: number;
};
