export function formatCurrency(valueInMinorUnit: number, currency: string = 'INR'): string {
  const valueInMajor = valueInMinorUnit / 100;
  
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valueInMajor);
}
