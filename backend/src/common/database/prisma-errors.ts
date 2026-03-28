import { Prisma } from "@prisma/client";

const databaseUnavailablePattern =
  /can't reach database server|connection refused|econnrefused|localhost:5432|timed out/i;

export function isPrismaDatabaseUnavailableError(error: unknown) {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P1001" || error.code === "P1002" || databaseUnavailablePattern.test(error.message);
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return databaseUnavailablePattern.test(error.message);
  }

  if (error instanceof Error) {
    return databaseUnavailablePattern.test(error.message);
  }

  return false;
}
