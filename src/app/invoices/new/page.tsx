"use client";
import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { Box, Typography, TextField, Button, Snackbar, CircularProgress, Grid } from "@mui/material";
import Link from "next/link";

export default function NewInvoicePage() {
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState("");
  const [supplier, setSupplier] = useState({ name: "", address: "", mobile: "" });
  const [receiver, setReceiver] = useState({ name: "", address: "", state: "", mobile: "", gstin: "", pan: "" });
  const [items, setItems] = useState([{ sno: 1, particulars: "", period: "", rate: "", amountRs: 0, ps: 0 }]);
  const [amountInWords, setAmountInWords] = useState("");
  const [totalRs, setTotalRs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState("");

  const handleAddItem = () => {
    setItems([...items, { sno: items.length + 1, particulars: "", period: "", rate: "", amountRs: 0, ps: 0 }]);
  };
  const handleItemChange = (idx: number, field: string, value: any) => {
    const newItems = items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    setItems(newItems);
    if (field === "amountRs" || field === "ps") {
      const total = newItems.reduce((sum, it) => sum + Number(it.amountRs || 0), 0);
      setTotalRs(total);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const invoice = {
        userId: auth.currentUser?.uid,
        billNo,
        billDate,
        supplier,
        receiver,
        items,
        amountInWords,
        totalRs,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await addDoc(collection(db, "invoices"), invoice);
      setSnackbar("Invoice created!");
      setTimeout(() => window.location.href = "/invoices", 1200);
    } catch (e: any) {
      setSnackbar(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
  <Box sx={{ p: { xs: 1, sm: 4 }, maxWidth: 900, mx: "auto" }}>
      <Typography variant="h4" mb={2} textAlign="center">Create New Invoice</Typography>
  <Grid container spacing={2}>
  <Grid item xs={12} sm={6}>
          <TextField label="Bill No" value={billNo} onChange={e => setBillNo(e.target.value)} fullWidth required sx={{ mb: 2 }} />
        </Grid>
  <Grid item xs={12} sm={6}>
          <TextField label="Bill Date" value={billDate} onChange={e => setBillDate(e.target.value)} fullWidth required sx={{ mb: 2 }} />
        </Grid>
  <Grid item xs={12} sm={6}>
          <TextField label="Supplier Name" value={supplier.name} onChange={e => setSupplier({ ...supplier, name: e.target.value })} fullWidth required sx={{ mb: 2 }} />
          <TextField label="Supplier Address" value={supplier.address} onChange={e => setSupplier({ ...supplier, address: e.target.value })} fullWidth required sx={{ mb: 2 }} />
          <TextField label="Supplier Mobile" value={supplier.mobile} onChange={e => setSupplier({ ...supplier, mobile: e.target.value })} fullWidth sx={{ mb: 2 }} />
        </Grid>
  <Grid item xs={12} sm={6}>
          <TextField label="Receiver Name" value={receiver.name} onChange={e => setReceiver({ ...receiver, name: e.target.value })} fullWidth required sx={{ mb: 2 }} />
          <TextField label="Receiver Address" value={receiver.address} onChange={e => setReceiver({ ...receiver, address: e.target.value })} fullWidth required sx={{ mb: 2 }} />
          <TextField label="Receiver State" value={receiver.state} onChange={e => setReceiver({ ...receiver, state: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Receiver Mobile" value={receiver.mobile} onChange={e => setReceiver({ ...receiver, mobile: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Receiver GSTIN" value={receiver.gstin} onChange={e => setReceiver({ ...receiver, gstin: e.target.value })} fullWidth sx={{ mb: 2 }} />
          <TextField label="Receiver PAN" value={receiver.pan} onChange={e => setReceiver({ ...receiver, pan: e.target.value })} fullWidth sx={{ mb: 2 }} />
        </Grid>
  <Grid item xs={12}>
          <Typography variant="h6" mt={2} mb={1}>Line Items</Typography>
          <Box sx={{ overflowX: 'auto' }}>
            {items.map((item, idx) => (
              <Box key={idx} display="flex" gap={1} mb={1} flexDirection={{ xs: 'column', sm: 'row' }}>
              <TextField label="S.No." type="number" value={item.sno} onChange={e => handleItemChange(idx, "sno", Number(e.target.value))} sx={{ width: 80 }} />
              <TextField label="Particulars" value={item.particulars} onChange={e => handleItemChange(idx, "particulars", e.target.value)} sx={{ flex: 2 }} />
              <TextField label="Period" value={item.period} onChange={e => handleItemChange(idx, "period", e.target.value)} sx={{ width: 100 }} />
              <TextField label="Rate" value={item.rate} onChange={e => handleItemChange(idx, "rate", e.target.value)} sx={{ width: 100 }} />
              <TextField label="Amount Rs." type="number" value={item.amountRs} onChange={e => handleItemChange(idx, "amountRs", Number(e.target.value))} sx={{ width: 120 }} />
              <TextField label="Ps." type="number" value={item.ps} onChange={e => handleItemChange(idx, "ps", Number(e.target.value))} sx={{ width: 80 }} />
            </Box>
            ))}
          </Box>
          <Button variant="outlined" onClick={handleAddItem} sx={{ mt: 1 }}>Add Item</Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Amount in Words" value={amountInWords} onChange={e => setAmountInWords(e.target.value)} fullWidth sx={{ mb: 2 }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Total Rs." type="number" value={totalRs} onChange={e => setTotalRs(Number(e.target.value))} fullWidth sx={{ mb: 2 }} />
        </Grid>
      </Grid>
  <Box display="flex" gap={2} mt={3} flexDirection={{ xs: 'column', sm: 'row' }}>
        <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading}>Create Invoice</Button>
        <Button variant="outlined" component={Link} href="/invoices">Cancel</Button>
      </Box>
      {loading && <Box textAlign="center" mt={2}><CircularProgress /></Box>}
      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar("")} message={snackbar} />
    </Box>
  );
}
