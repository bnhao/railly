import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let sqlClient: NeonQueryFunction<false, false> | null = null;

/**
 * Module-level Neon SQL client singleton so API routes avoid re-creating
 * client wrappers on every incoming request.
 */
export function getSql(): NeonQueryFunction<false, false> {
  if (!sqlClient) {
    const databaseUrl = process.env.DATABASE_URL || "";
    sqlClient = neon(databaseUrl);
  }
  return sqlClient;
}
