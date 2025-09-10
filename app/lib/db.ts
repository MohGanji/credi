import { PrismaClient } from '../generated/prisma';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'test' 
      ? [] 
      : process.env.LOG_LEVEL === 'debug' 
        ? ['query', 'info', 'warn', 'error']
        : process.env.LOG_LEVEL === 'info'
          ? ['warn', 'error']
          : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;

export default prisma;