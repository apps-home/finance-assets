import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

import { EnvService } from '@/infra/env/env.service'

import type {
  N8nRequestConfig,
  N8nResponse,
  N8nWebhookOptions
} from './n8n.types'

@Injectable()
export class N8nProvider {
  private readonly logger = new Logger(N8nProvider.name)
  private readonly baseUrl: string

  constructor(
    private readonly httpService: HttpService,
    private readonly env: EnvService
  ) {
    this.baseUrl = this.env.get('N8N_URL').replace(/\/+$/, '')
  }

  /**
   * Dispara um webhook do n8n de forma semântica.
   * Converte caminhos como "assets/notify" em "{baseUrl}/webhook/assets/notify".
   */
  async triggerWebhook<TResponse = unknown, TPayload = unknown>(
    path: string,
    payload: TPayload,
    options?: N8nWebhookOptions
  ): Promise<N8nResponse<TResponse>> {
    const cleanPath = path.replace(/^\/+/, '')
    const prefix = options?.isTestMode ? 'webhook-test' : 'webhook'
    const endpoint = `${prefix}/${cleanPath}`

    return this.post<TResponse, TPayload>(endpoint, payload, {
      headers: options?.headers,
      timeout: options?.timeout
    })
  }

  /**
   * POST genérico para a base URL do n8n.
   */
  async post<TResponse = unknown, TBody = unknown>(
    endpoint: string,
    body: TBody,
    config?: N8nRequestConfig
  ): Promise<N8nResponse<TResponse>> {
    const url = this.resolveUrl(endpoint)

    try {
      this.logger.log(`POST to n8n: ${url}`)

      const response = await firstValueFrom(
        this.httpService.post<TResponse>(url, body, {
          ...config,
          headers: this.buildHeaders(config),
          validateStatus: () => true
        })
      )

      const isOk = response.status >= 200 && response.status < 300
      const errorText = !isOk
        ? typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data)
        : undefined

      if (!isOk) {
        this.logger.warn(
          `n8n POST request to ${url} responded with status ${response.status}: ${errorText}`
        )
      }

      return {
        ok: isOk,
        status: response.status,
        data: isOk ? response.data : undefined,
        errorText
      }
    } catch (error) {
      this.logger.error(
        `Failed to POST to n8n endpoint (${url}):`,
        error instanceof Error ? error.message : error
      )

      return {
        ok: false,
        status: 500,
        errorText: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * GET genérico para a base URL do n8n.
   */
  async get<TResponse = unknown>(
    endpoint: string,
    config?: N8nRequestConfig
  ): Promise<N8nResponse<TResponse>> {
    const url = this.resolveUrl(endpoint)

    try {
      this.logger.log(`GET from n8n: ${url}`)

      const response = await firstValueFrom(
        this.httpService.get<TResponse>(url, {
          ...config,
          headers: this.buildHeaders(config),
          validateStatus: () => true
        })
      )

      const isOk = response.status >= 200 && response.status < 300
      const errorText = !isOk
        ? typeof response.data === 'string'
          ? response.data
          : JSON.stringify(response.data)
        : undefined

      if (!isOk) {
        this.logger.warn(
          `n8n GET request to ${url} responded with status ${response.status}: ${errorText}`
        )
      }

      return {
        ok: isOk,
        status: response.status,
        data: isOk ? response.data : undefined,
        errorText
      }
    } catch (error) {
      this.logger.error(
        `Failed to GET from n8n endpoint (${url}):`,
        error instanceof Error ? error.message : error
      )

      return {
        ok: false,
        status: 500,
        errorText: error instanceof Error ? error.message : String(error)
      }
    }
  }

  private resolveUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint
    }

    const cleanEndpoint = endpoint.replace(/^\/+/, '')
    return `${this.baseUrl}/${cleanEndpoint}`
  }

  private buildHeaders(config?: N8nRequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(config?.headers as Record<string, string>)
    }

    if (config?.apiKey) {
      headers['X-N8N-API-KEY'] = config.apiKey
    }

    return headers
  }
}
