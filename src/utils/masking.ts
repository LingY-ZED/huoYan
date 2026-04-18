/**
 * 数据脱敏工具函数
 */

export function maskPhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export function maskIdCard(idCard?: string): string {
  if (!idCard) return '';
  return idCard.replace(/^(\d{6})\d{8}(\d{4})$/, '$1********$2');
}

export function maskBankCard(bankCard?: string): string {
  if (!bankCard) return '';
  return bankCard.replace(/^(\d{4})\d+(\d{4})$/, '$1****$2');
}

export function maskEmail(email?: string): string {
  if (!email) return '';
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.length > 1 ? `${name[0]}***` : '***';
  return `${maskedName}@${domain}`;
}

export function maskName(name?: string): string {
  if (!name) return '';
  if (name.length <= 1) return name;
  return name.charAt(0) + '*'.repeat(name.length - 1);
}
