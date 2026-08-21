import { apiClient } from '@/infrastructure/services/api-client'

import type {
	Budget,
	CreateBudgetDTO,
	ListBudgetsParams,
	UpdateBudgetDTO
} from './types'

const BASE_URL = '/budgets'

/**
 * Lista todos os budgets com filtros opcionais
 */
export async function listBudgets(
	params?: ListBudgetsParams
): Promise<Budget[]> {
	const response = await apiClient.get<Budget[]>(BASE_URL, { params })
	return response.data
}

/**
 * Busca um budget por ID
 */
export async function getBudgetById(id: string): Promise<Budget> {
	const response = await apiClient.get<Budget>(`${BASE_URL}/${id}`)
	return response.data
}

/**
 * Cria um novo budget
 */
export async function createBudget(data: CreateBudgetDTO): Promise<Budget> {
	const response = await apiClient.post<Budget>(BASE_URL, {
		categoryId: data.categoryId,
		month: data.month,
		year: data.year,
		amount: data.amount,
		exchangeRate: data.exchangeRate || 1,
		dividendAmount: data.dividendAmount || 0
	})
	return response.data
}

/**
 * Atualiza um budget existente
 */
export async function updateBudget(
	id: string,
	data: UpdateBudgetDTO
): Promise<Budget> {
	const response = await apiClient.patch<Budget>(`${BASE_URL}/${id}`, data)
	return response.data
}

/**
 * Remove um budget
 */
export async function deleteBudget(id: string): Promise<void> {
	await apiClient.delete(`${BASE_URL}/${id}`)
}
