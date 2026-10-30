import { z } from 'zod'

/** Opcional: string vazia (secret não cadastrado no deploy) conta como ausente */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional())

/** Origens padrão do web em dev; produção e IPs da rede entram por CORS_ORIGINS */
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:3000',
  'http://local.dev.terraviva:3000'
]

export const envSchema = z.object({
  PORT: z.coerce.number().default(3333),
  // Origens do web separadas por vírgula (ex.: https://car.exemplo.app,http://192.168.0.4:3000)
  CORS_ORIGINS: z
    .string()
    .optional()
    .transform((value) => {
      const origins = value
        ?.split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean)

      return origins?.length ? origins : DEFAULT_CORS_ORIGINS
    }),
  DATABASE_URL: z.string('DATABASE_URL is required'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string('REDIS_PASSWORD is required'),

  // Market Data
  ALPHA_VANTAGE_API_KEY: z.string('ALPHA_VANTAGE_API_KEY is required'),
  BRAPI_TOKEN: z.string('BRAPI_TOKEN is required'),
  COINGECKO_API_KEY: z.string('COINGECKO_API_KEY is required'),
  POLYGON_API_KEY: z.string('POLYGON_API_KEY is required'),

  // Cloudflare R2
  R2_ACCOUNT_ID: z.string('R2_ACCOUNT_ID is required'),
  R2_ACCESS_KEY_ID: z.string('R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string('R2_SECRET_ACCESS_KEY is required'),

  // n8n Webhook
  N8N_URL: z.url('N8N_URL is required'),

  // Novu (notificações in-app): sem a chave e o identificador, fica desligado
  NOVU_SECRET_KEY: optional(z.string()),
  NOVU_APPLICATION_IDENTIFIER: optional(z.string()),
  // Só para a região EU: https://eu.api.novu.co e wss://eu.socket.novu.co
  NOVU_API_URL: optional(z.url()),
  NOVU_SOCKET_URL: optional(z.url())
})

export type Env = z.infer<typeof envSchema>
