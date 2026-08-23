import { env } from '@finance-assets-web/env/web'
import axios, { type AxiosError } from 'axios'

import { authClient, signOut } from '@/shared/lib/auth-client'
import {
  type ApiErrorResponse,
  ErrorCode,
  parseApiError
} from '@/shared/utils/api-error'

export const apiClient = axios.create({
  baseURL: env.NEXT_PUBLIC_SERVER_URL,
  withCredentials: true,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor de requisição - adiciona token de autenticação
apiClient.interceptors.request.use(
  async (config) => {
    const session = await authClient.getSession()
    const token = session?.data?.session?.token

    if (token && typeof token === 'string') {
      config.headers.Authorization = `Bearer ${token}`
      config.headers['user-id'] = session.data?.user?.id
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor de resposta - tratamento de erros centralizado
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const apiError = parseApiError(error)

    // Tratamento específico para erros de autenticação
    if (apiError.statusCode === 401) {
      const session = await authClient.getSession()

      // Verifica se deve forçar logout
      const shouldLogout =
        session?.data &&
        (apiError.code === ErrorCode.SESSION_EXPIRED ||
          error.response?.data?.message?.includes('session has expired') ||
          error.response?.data?.message?.includes('please log in again') ||
          error.response?.data?.error === 'Unauthorized')

      if (shouldLogout) {
        await signOut({
          fetchOptions: {
            onSuccess: () => {
              window.location.href = '/sign-in?reason=session_expired'
            }
          }
        })
      }
    }

    // Tratamento para erro de permissão - redireciona para página de não autorizado
    if (apiError.statusCode === 403) {
      // Pode opcionalmente redirecionar para /unauthorized
      window.location.href = '/unauthorized'
    }

    // Tratamento para erro de recurso não encontrado
    if (apiError.statusCode === 404) {
      // Pode opcionalmente redirecionar para /not-found
      window.location.href = '/not-found'
    }

    // Rejeita com o erro parseado para melhor tratamento nos componentes
    return Promise.reject(apiError)
  }
)
