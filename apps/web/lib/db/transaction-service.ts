import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function runInTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn);
}
