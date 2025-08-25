'use client';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import { Button, Grid, TextField, Typography } from '@mui/material';

export function MenuRowFields() {
  const { control } = useFormContext();
  const { fields, append, remove } = useFieldArray({ name: 'rows', control });

  return (
    <>
      <Typography variant="h6" sx={{ mt: 2 }}>Rows</Typography>
      {fields.map((f, idx) => (
        <Grid container spacing={2} key={f.id} sx={{ mb: 1 }}>
          <Grid item xs={12} sm={2}>
            <Controller name={`rows.${idx}.date`} control={control} render={({ field }) => (
              <TextField {...field} label="Date (YYYY-MM-DD)" fullWidth />
            )}/>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Controller name={`rows.${idx}.particulars`} control={control} render={({ field }) => (
              <TextField {...field} label="Particulars" fullWidth />
            )}/>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Controller name={`rows.${idx}.menu`} control={control} render={({ field }) => (
              <TextField {...field} label="Menu" fullWidth multiline minRows={2} />
            )}/>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Controller name={`rows.${idx}.time`} control={control} render={({ field }) => (
              <TextField {...field} label="Time" fullWidth />
            )}/>
          </Grid>
          <Grid item xs={12} sm={1.5 as any}>
            <Controller name={`rows.${idx}.numPersons`} control={control} render={({ field }) => (
              <TextField {...field} type="number" label="No. of persons" fullWidth />
            )}/>
          </Grid>
          <Grid item xs={12} sm={0.5 as any}>
            <Button onClick={() => remove(idx)}>Remove</Button>
          </Grid>
        </Grid>
      ))}
      <Button variant="outlined" onClick={() => append({ date:'', particulars:'', menu:'', time:'', numPersons:0 })}>Add Row</Button>
    </>
  );
}
