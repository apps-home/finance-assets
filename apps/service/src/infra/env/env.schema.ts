import { z } from 'zod'

export const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string('DATABASE_URL is required'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string('REDIS_PASSWORD is required'),

  // Market Data
  ALPHA_VANTAGE_API_KEY: z.string('ALPHA_VANTAGE_API_KEY is required'),
  BRAPI_TOKEN: z.string('BRAPI_TOKEN is required'),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string('R2_ACCOUNT_ID is required'),
  R2_ACCESS_KEY_ID: z.string('R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string('R2_SECRET_ACCESS_KEY is required')
})

export type Env = z.infer<typeof envSchema>
