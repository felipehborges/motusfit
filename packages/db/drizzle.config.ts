import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './migrations',
  dbCredentials: {
    // Migrations em dev rodam contra o mesmo banco que a API usa;
    // sem DATABASE_URL, drizzle-kit não é usado (PGlite aplica via migrate() programático).
    url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/motusfit',
  },
});
