import { env } from '@finance-assets-web/env/web'
import axios from 'axios'

export const n8nApiClient = axios.create({
  baseURL: env.N8N_URL,
  timeout: 60000 // 60 segundos
})
