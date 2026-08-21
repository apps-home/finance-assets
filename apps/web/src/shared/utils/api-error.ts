import type { AxiosError } from 'axios'

/**
 * Estrutura padrão de erro da API
 */
export interface ApiErrorResponse {
	statusCode: number
	error: string
	message: string
	details?: Record<string, unknown>
}

/**
 * Códigos de erro conhecidos da aplicação
 */
export enum ErrorCode {
	// Autenticação
	UNAUTHORIZED = 'UNAUTHORIZED',
	SESSION_EXPIRED = 'SESSION_EXPIRED',
	INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

	// Autorização
	FORBIDDEN = 'FORBIDDEN',
	INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

	// Recursos
	NOT_FOUND = 'NOT_FOUND',
	RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

	// Validação
	VALIDATION_ERROR = 'VALIDATION_ERROR',
	INVALID_INPUT = 'INVALID_INPUT',

	// Servidor
	INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
	SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

	// Rede
	NETWORK_ERROR = 'NETWORK_ERROR',
	TIMEOUT = 'TIMEOUT',

	// Genérico
	UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Classe de erro customizada para erros da API
 */
export class ApiError extends Error {
	public readonly statusCode: number
	public readonly code: ErrorCode
	public readonly details?: Record<string, unknown>
	public readonly originalError?: AxiosError

	constructor(
		message: string,
		statusCode: number,
		code: ErrorCode,
		details?: Record<string, unknown>,
		originalError?: AxiosError
	) {
		super(message)
		this.name = 'ApiError'
		this.statusCode = statusCode
		this.code = code
		this.details = details
		this.originalError = originalError
	}

	/**
	 * Verifica se é um erro de autenticação
	 */
	isAuthError(): boolean {
		return [
			ErrorCode.UNAUTHORIZED,
			ErrorCode.SESSION_EXPIRED,
			ErrorCode.INVALID_CREDENTIALS
		].includes(this.code)
	}

	/**
	 * Verifica se é um erro de autorização
	 */
	isForbiddenError(): boolean {
		return [ErrorCode.FORBIDDEN, ErrorCode.INSUFFICIENT_PERMISSIONS].includes(
			this.code
		)
	}

	/**
	 * Verifica se é um erro de recurso não encontrado
	 */
	isNotFoundError(): boolean {
		return [ErrorCode.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND].includes(
			this.code
		)
	}

	/**
	 * Verifica se é um erro de validação
	 */
	isValidationError(): boolean {
		return [ErrorCode.VALIDATION_ERROR, ErrorCode.INVALID_INPUT].includes(
			this.code
		)
	}

	/**
	 * Verifica se é um erro de servidor
	 */
	isServerError(): boolean {
		return this.statusCode >= 500
	}

	/**
	 * Verifica se é um erro de rede
	 */
	isNetworkError(): boolean {
		return [ErrorCode.NETWORK_ERROR, ErrorCode.TIMEOUT].includes(this.code)
	}
}

/**
 * Mapeia status HTTP para ErrorCode
 */
function getErrorCodeFromStatus(status: number): ErrorCode {
	switch (status) {
		case 400:
			return ErrorCode.VALIDATION_ERROR
		case 401:
			return ErrorCode.UNAUTHORIZED
		case 403:
			return ErrorCode.FORBIDDEN
		case 404:
			return ErrorCode.NOT_FOUND
		case 408:
			return ErrorCode.TIMEOUT
		case 500:
			return ErrorCode.INTERNAL_SERVER_ERROR
		case 503:
			return ErrorCode.SERVICE_UNAVAILABLE
		default:
			return ErrorCode.UNKNOWN_ERROR
	}
}

/**
 * Mensagens de erro amigáveis para o usuário
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
	[ErrorCode.UNAUTHORIZED]:
		'Você precisa estar logado para acessar este recurso.',
	[ErrorCode.SESSION_EXPIRED]:
		'Sua sessão expirou. Por favor, faça login novamente.',
	[ErrorCode.INVALID_CREDENTIALS]: 'Email ou senha incorretos.',
	[ErrorCode.FORBIDDEN]: 'Você não tem permissão para acessar este recurso.',
	[ErrorCode.INSUFFICIENT_PERMISSIONS]:
		'Permissões insuficientes para esta ação.',
	[ErrorCode.NOT_FOUND]: 'O recurso solicitado não foi encontrado.',
	[ErrorCode.RESOURCE_NOT_FOUND]: 'O item que você procura não existe.',
	[ErrorCode.VALIDATION_ERROR]: 'Os dados enviados são inválidos.',
	[ErrorCode.INVALID_INPUT]: 'Por favor, verifique os dados informados.',
	[ErrorCode.INTERNAL_SERVER_ERROR]:
		'Ocorreu um erro no servidor. Tente novamente mais tarde.',
	[ErrorCode.SERVICE_UNAVAILABLE]:
		'O serviço está temporariamente indisponível.',
	[ErrorCode.NETWORK_ERROR]: 'Erro de conexão. Verifique sua internet.',
	[ErrorCode.TIMEOUT]: 'A requisição demorou muito. Tente novamente.',
	[ErrorCode.UNKNOWN_ERROR]: 'Ocorreu um erro inesperado.'
}

/**
 * Obtém mensagem de erro amigável
 */
export function getErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		return error.message || ERROR_MESSAGES[error.code]
	}

	if (error instanceof Error) {
		return error.message
	}

	return ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR]
}

/**
 * Converte um AxiosError para ApiError
 */
export function parseApiError(error: AxiosError<ApiErrorResponse>): ApiError {
	// Erro de rede (sem resposta do servidor)
	if (!error.response) {
		if (error.code === 'ECONNABORTED') {
			return new ApiError(
				ERROR_MESSAGES[ErrorCode.TIMEOUT],
				0,
				ErrorCode.TIMEOUT,
				undefined,
				error
			)
		}
		return new ApiError(
			ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
			0,
			ErrorCode.NETWORK_ERROR,
			undefined,
			error
		)
	}

	const { status, data } = error.response
	const code = getErrorCodeFromStatus(status)

	// Usa a mensagem da API se disponível, senão usa a mensagem padrão
	const message = data?.message || ERROR_MESSAGES[code]

	return new ApiError(message, status, code, data?.details, error)
}

/**
 * Type guard para verificar se é um ApiError
 */
export function isApiError(error: unknown): error is ApiError {
	return error instanceof ApiError
}
