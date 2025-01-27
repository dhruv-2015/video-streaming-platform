// import { PrismaClient } from '../generated/client';
// // import { env } from '@repo/env';

// declare global {
//   var cachedPrisma: PrismaClient | undefined;
// }


// export const prisma = new PrismaClient();
// export * from '../generated/client';

import { PrismaClient } from "../generated/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;