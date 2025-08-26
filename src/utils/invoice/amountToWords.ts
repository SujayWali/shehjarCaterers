// Basic integer to words converter for INR
const units = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
const teens = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
const thousands = ["", "THOUSAND", "LAKH", "CRORE"];

export function amountToWords(n: number): string {
  if (n === 0) return "ZERO";
  let words = "";
  if (n >= 10000000) {
    words += amountToWords(Math.floor(n / 10000000)) + " CRORE ";
    n %= 10000000;
  }
  if (n >= 100000) {
    words += amountToWords(Math.floor(n / 100000)) + " LAKH ";
    n %= 100000;
  }
  if (n >= 1000) {
    words += amountToWords(Math.floor(n / 1000)) + " THOUSAND ";
    n %= 1000;
  }
  if (n >= 100) {
    words += amountToWords(Math.floor(n / 100)) + " HUNDRED ";
    n %= 100;
  }
  if (n > 0) {
    if (n < 10) words += units[n] + " ";
    else if (n < 20) words += teens[n - 10] + " ";
    else words += tens[Math.floor(n / 10)] + " " + units[n % 10] + " ";
  }
  return words.trim() + " ONLY";
}
