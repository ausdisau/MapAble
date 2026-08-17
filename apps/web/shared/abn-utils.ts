const ABN_WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

export function stripAbn(abn: string): string {
  return abn.replace(/\s/g, "");
}

export function formatAbn(abn: string): string {
  const digits = stripAbn(abn);
  if (digits.length !== 11) return abn;
  return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
}

export function validateAbnChecksum(abn: string): boolean {
  const digits = stripAbn(abn);
  if (!/^\d{11}$/.test(digits)) return false;

  const nums = digits.split("").map(Number);
  nums[0] -= 1;

  const sum = nums.reduce((acc, digit, i) => acc + digit * ABN_WEIGHTS[i], 0);
  return sum % 89 === 0;
}

export function validateAbn(abn: string): { valid: boolean; error?: string; formatted?: string } {
  const digits = stripAbn(abn);

  if (!digits) {
    return { valid: false, error: "ABN is required" };
  }

  if (!/^\d+$/.test(digits)) {
    return { valid: false, error: "ABN must contain only digits" };
  }

  if (digits.length !== 11) {
    return { valid: false, error: "ABN must be exactly 11 digits" };
  }

  if (!validateAbnChecksum(abn)) {
    return { valid: false, error: "ABN checksum is invalid — please check the number" };
  }

  return { valid: true, formatted: formatAbn(digits) };
}

export interface AbnLookupResult {
  abn: string;
  abnFormatted: string;
  entityName: string;
  businessNames: string[];
  tradingNames: string[];
  abnStatus: string;
  abnStatusEffectiveFrom: string;
  entityTypeCode: string;
  entityTypeDescription: string;
  state: string;
  postcode: string;
  gstRegistered: boolean;
  gstRegisteredFrom: string;
  dgrEndorsed: boolean;
  lastUpdated: string;
  offline?: boolean;
}
