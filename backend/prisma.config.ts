// prisma.config.ts — Prisma 7.x 設定檔
// Prisma 7+ 要求將 datasource url 移至此檔案（schema.prisma 已移除 url 屬性）
// See: https://pris.ly/d/config-datasource

import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrate: {
    async adapter(env: Record<string, string | undefined>) {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const { default: pg } = await import('pg')
      const pool = new pg.Pool({
        connectionString: env.DATABASE_URL ?? process.env.DATABASE_URL,
      })
      return new PrismaPg(pool)
    },
  },
})
