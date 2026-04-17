export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 11) return phone;
  return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
}

export function maskBankAccount(account: string): string {
  const compact = account.replace(/\s+/g, "");
  const last4 = compact.slice(-4);
  if (!last4) return account;
  return `****${last4}`;
}

