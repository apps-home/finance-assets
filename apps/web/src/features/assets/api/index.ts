import { apiClient } from '@/infrastructure/services/api-client'

import type {
	Asset,
	AssetHTTPResponse,
	CreateAssetDTO,
	UpdateAssetDTO
} from './types'

const BASE_URL = '/categories'

/**
 * Lista todos os ativos de uma categoria
 */
export async function listAssetsByCategory(
	categoryId: string
): Promise<AssetHTTPResponse[]> {
	const response = await apiClient.get<AssetHTTPResponse[]>(
		`${BASE_URL}/${categoryId}/assets`
	)
	return response.data
}

/**
 * Busca um ativo por ID
 */
export async function getAssetById(
	categoryId: string,
	id: string
): Promise<Asset> {
	const response = await apiClient.get<Asset>(
		`${BASE_URL}/${categoryId}/assets/${id}`
	)
	return response.data
}

/**
 * Cria um novo ativo em uma categoria
 */
export async function createAsset(
	categoryId: string,
	data: CreateAssetDTO
): Promise<void> {
	await apiClient.post(`${BASE_URL}/${categoryId}/assets`, data)
}

/**
 * Atualiza um ativo existente
 */
export async function updateAsset(
	categoryId: string,
	id: string,
	data: UpdateAssetDTO
): Promise<void> {
	await apiClient.patch(`${BASE_URL}/${categoryId}/assets/${id}`, data)
}

/**
 * Remove um ativo
 */
export async function deleteAsset(
	categoryId: string,
	id: string
): Promise<void> {
	await apiClient.delete(`${BASE_URL}/${categoryId}/assets/${id}`)
}
