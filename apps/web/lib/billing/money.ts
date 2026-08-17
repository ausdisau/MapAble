/**
 * Safe financial arithmetic using integer minor units (cents).
 * Never use floating-point for invoice totals.
 */

export type Cents = number;

const MAX_SAFE_CENTS = Number.MAX_SAFE_INTEGER;

function assertSafeCents(value: number, label = "amount"): asserts value is Cents {
  if (!Number.isFinite(value) || !Number.isInteger(value)) {
    throw new Error(`${label} must be a finite integer (cents)`);
  }
  if (Math.abs(value) > MAX_SAFE_CENTS) {
    throw new Error(`${label} exceeds safe integer range`);
  }
}

export function toCents(dollars: number): Cents {
  if (!Number.isFinite(dollars)) {
    throw new Error("dollars must be finite");
  }
  // Banker's-avoidant: round half away from zero via integer math on millis
  const sign = dollars < 0 ? -1 : 1;
  const abs = Math.abs(dollars);
  const whole = Math.floor(abs);
  const fracMillis = Math.round((abs - whole) * 1000);
  const centsFromFrac = Math.floor((fracMillis + 5) / 10);
  const result = sign * (whole * 100 + centsFromFrac);
  assertSafeCents(result, "toCents");
  return result;
}

export function fromCents(cents: Cents): number {
  assertSafeCents(cents, "cents");
  return cents / 100;
}

export function formatAud(cents: Cents): string {
  assertSafeCents(cents, "cents");
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = abs % 100;
  const formatted = `$${dollars.toLocaleString("en-AU")}.${remainder
    .toString()
    .padStart(2, "0")}`;
  return negative ? `-${formatted}` : formatted;
}

export function addCents(...values: Cents[]): Cents {
  let sum = 0;
  for (const v of values) {
    assertSafeCents(v);
    sum += v;
    assertSafeCents(sum, "sum");
  }
  return sum;
}

export function subtractCents(a: Cents, b: Cents): Cents {
  assertSafeCents(a, "a");
  assertSafeCents(b, "b");
  const result = a - b;
  assertSafeCents(result, "difference");
  return result;
}

export function multiplyCents(cents: Cents, factor: number): Cents {
  assertSafeCents(cents, "cents");
  if (!Number.isFinite(factor)) {
    throw new Error("factor must be finite");
  }
  // quantity * unit rate: round half up on the product in micros
  const product = cents * factor;
  const result = Math.round(product);
  assertSafeCents(result, "product");
  return result;
}

/** Apply basis points (1/100 of a percent) to an amount in cents. */
export function applyBps(cents: Cents, bps: number): Cents {
  assertSafeCents(cents, "cents");
  if (!Number.isInteger(bps)) {
    throw new Error("bps must be an integer");
  }
  // (cents * bps) / 10000 with half-up rounding
  const numerator = cents * bps;
  const result =
    numerator >= 0
      ? Math.floor((numerator + 5000) / 10_000)
      : Math.ceil((numerator - 5000) / 10_000);
  assertSafeCents(result, "bps result");
  return result;
}

export function allocateProportionally(
  totalCents: Cents,
  weights: number[]
): Cents[] {
  assertSafeCents(totalCents, "totalCents");
  if (weights.length === 0) return [];
  const weightSum = weights.reduce((s, w) => s + w, 0);
  if (weightSum <= 0) {
    throw new Error("weights must sum to a positive number");
  }
  const raw = weights.map((w) => (totalCents * w) / weightSum);
  const floored = raw.map((r) => Math.floor(r));
  let remainder = totalCents - floored.reduce((s, v) => s + v, 0);
  // Largest remainder method
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floored];
  for (const { i } of order) {
    if (remainder <= 0) break;
    result[i] += 1;
    remainder -= 1;
  }
  return result;
}

export function sumLineTotals(
  lines: { quantity: number; unitAmountCents: number }[]
): Cents {
  return lines.reduce(
    (sum, line) => addCents(sum, multiplyCents(line.unitAmountCents, line.quantity)),
    0
  );
}

export function calculateGstOnLines(
  lines: { quantity: number; unitAmountCents: number; gstApplicable?: boolean }[],
  gstBps: number
): Cents {
  return lines.reduce((sum, line) => {
    if (!line.gstApplicable) return sum;
    const lineTotal = multiplyCents(line.unitAmountCents, line.quantity);
    return addCents(sum, applyBps(lineTotal, gstBps));
  }, 0);
}

export function invoiceTotals(input: {
  lines: { quantity: number; unitAmountCents: number; gstApplicable?: boolean }[];
  platformFeeBps: number;
  gstBps: number;
  discountCents?: Cents;
  creditCents?: Cents;
  coPaymentCents?: Cents;
}): {
  subtotalCents: Cents;
  discountCents: Cents;
  platformFeeCents: Cents;
  gstCents: Cents;
  coPaymentCents: Cents;
  creditCents: Cents;
  totalPayableCents: Cents;
} {
  const subtotalCents = sumLineTotals(input.lines);
  const discountCents = input.discountCents ?? 0;
  const creditCents = input.creditCents ?? 0;
  const coPaymentCents = input.coPaymentCents ?? 0;
  const afterDiscount = subtractCents(subtotalCents, discountCents);
  const platformFeeCents = applyBps(afterDiscount, input.platformFeeBps);
  const gstCents = calculateGstOnLines(input.lines, input.gstBps);
  const totalPayableCents = addCents(
    afterDiscount,
    platformFeeCents,
    gstCents,
    coPaymentCents,
    -creditCents
  );
  return {
    subtotalCents,
    discountCents,
    platformFeeCents,
    gstCents,
    coPaymentCents,
    creditCents,
    totalPayableCents,
  };
}
