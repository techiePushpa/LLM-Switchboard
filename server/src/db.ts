import { PrismaClient } from "@prisma/client";

// A single shared client avoids exhausting Postgres connections during
// dev-server hot reloads, which is the classic "too many clients" bug.
export const prisma = new PrismaClient();
