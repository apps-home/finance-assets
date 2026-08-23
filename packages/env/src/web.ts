import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  server: {
    BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
    BETTER_AUTH_URL: z.url({
      error: 'BETTER_AUTH_URL must be a valid URL'
    }),
    DATABASE_URL: z
      .url({
        error: 'DATABASE_URL must be a valid URL'
      })
      .optional(),
    N8N_URL: z.url({
      error: 'N8N_URL must be a valid URL'
    }),
    NODE_API_URL: z
      .url({
        error: 'NODE_API_URL must be a valid URL'
      })
      .optional()
  },
  client: {
    NEXT_PUBLIC_SERVER_URL: z.url({
      error: 'NEXT_PUBLIC_SERVER_URL must be a valid URL'
    }),
    NEXT_PUBLIC_BASE_URL: z.url({
      error: 'NEXT_PUBLIC_BASE_URL must be a valid URL'
    }),
    NEXT_PUBLIC_BASE_PATH: z.string().default(''),
    NEXT_PUBLIC_AVATAR_URL: z.url({
      error: 'NEXT_PUBLIC_AVATAR_URL must be a valid URL'
    })
  },
  runtimeEnv: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH,
    NEXT_PUBLIC_AVATAR_URL: process.env.NEXT_PUBLIC_AVATAR_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    N8N_URL: process.env.N8N_URL,
    NODE_API_URL: process.env.NODE_API_URL
  }
})
