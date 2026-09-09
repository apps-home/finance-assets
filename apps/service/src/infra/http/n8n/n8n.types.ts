import type { AxiosRequestConfig } from 'axios'

export interface N8nRequestConfig extends AxiosRequestConfig {
  apiKey?: string
}

export interface N8nWebhookOptions {
  isTestMode?: boolean
  headers?: Record<string, string>
  timeout?: number
}

export interface N8nResponse<T = unknown> {
  ok: boolean
  status: number
  data?: T
  errorText?: string
}
