import { z } from 'zod';

/**
 * 環境變數 Zod Schema（帶默認值）
 * 所有後端服務所需的環境變數均在此集中驗證
 */
const envSchema = z.object({
  /** HTTP 伺服器監聽端口，預設 3000 */
  PORT: z
    .string()
    .default('3000')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1).max(65535)),

  /** 執行環境，影響日誌層級和行為 */
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  /** PostgreSQL 連線字串，生產環境必填 */
  DATABASE_URL: z
    .string()
    .default('postgresql://localhost:5432/tachenpmis')
    .describe('PostgreSQL connection string'),

  /** JWT 簽名密鑰，至少 32 字元 */
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET 至少需要 32 個字元')
    .default('dev-secret-key-at-least-32-characters-long!')
    .describe('JWT signing secret — use a strong random string in production'),

  /** 允許的 CORS Origin，"*" 允許所有來源 */
  CORS_ORIGIN: z
    .string()
    .default('*')
    .describe('Allowed CORS origin, use "*" for wildcard or specific URL'),

  /** JWT Access Token 有效期（分鐘），預設 15 分鐘 */
  JWT_ACCESS_EXPIRES_MINUTES: z
    .string()
    .default('15')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1)),

  /** JWT Refresh Token 有效期（天），預設 7 天 */
  JWT_REFRESH_EXPIRES_DAYS: z
    .string()
    .default('7')
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().int().min(1)),
});

/**
 * 驗證並匯出已型別化的環境變數
 * 啟動時若驗證失敗會直接拋出錯誤，阻止服務啟動
 */
function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('環境變數驗證失敗:');
    result.error.errors.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  return result.data;
}

export const config = loadConfig();
export type Config = typeof config;
