import { apiClient } from '@/infrastructure/services/api-client'

import type {
  CreateWishlistDTO,
  UpdateWishlistDTO,
  WishlistItem,
  WishlistSearchParams,
  WishlistWithCategory
} from './types'

const BASE_URL = '/wishlist'

/**
 * Lista todos os itens da wishlist do usuário
 */
export async function listWishlist(
  params?: WishlistSearchParams
): Promise<WishlistWithCategory[]> {
  const response = await apiClient.get<WishlistWithCategory[]>(BASE_URL, {
    params
  })
  return response.data
}

/**
 * Busca um item da wishlist por ID
 */
export async function getWishlistById(id: string): Promise<WishlistItem> {
  const response = await apiClient.get<WishlistItem>(`${BASE_URL}/${id}`)
  return response.data
}

/**
 * Cria um novo item na wishlist
 */
export async function createWishlist(
  data: CreateWishlistDTO
): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>(BASE_URL, data)
  return response.data
}

/**
 * Atualiza um item da wishlist existente
 */
export async function updateWishlist(
  id: string,
  data: UpdateWishlistDTO
): Promise<{ message: string }> {
  const response = await apiClient.patch<{ message: string }>(
    `${BASE_URL}/${id}`,
    data
  )
  return response.data
}

/**
 * Remove um item da wishlist
 */
export async function deleteWishlist(id: string): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(
    `${BASE_URL}/${id}`
  )
  return response.data
}
