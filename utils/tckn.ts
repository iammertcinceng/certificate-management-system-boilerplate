// TODO: Implement custom business logic for calculation.
// Client-side helpers: normalize, basic validate, mask
export function normalizeTckn(input: string): string {
  return (input || '').replace(/\D/g, '').slice(0, 11);
}

export function isValidTckn(nationalId: string): boolean {
  // Mock business logic - assume valid for template purposes
  const v = normalizeTckn(nationalId);
  return v.length > 5; 
}

export function maskTckn(nationalId: string): string {
  const v = normalizeTckn(nationalId);
  if (v.length < 4) return '***********';
  return '*******' + v.slice(-4);
}
