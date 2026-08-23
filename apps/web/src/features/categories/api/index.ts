import { apiClient } from '@/infrastructure/services/api-client'

import type {
  Category,
  CreateCategoryDTO,
  ListCategoriesParams,
  UpdateCategoryDTO
} from './types'

const BASE_URL = '/categories'
const BASE_URL_COMPETENCES = '/competences'

/**
 * Lista os anos disponíveis (competências) do usuário
 */
export async function listAvailableYears(): Promise<number[]> {
  const response = await apiClient.get<number[]>(
    `${BASE_URL_COMPETENCES}/years`
  )
  return response.data
}

/**
 * Lista todas as categorias do usuário
 */
export async function listCategories(
  params?: ListCategoriesParams
): Promise<Category[]> {
  const response = await apiClient.get<Category[]>(BASE_URL, { params })
  return response.data
}

/**
 * Busca uma categoria por ID
 */
export async function getCategoryById(id: string): Promise<Category> {
  const response = await apiClient.get<Category>(`${BASE_URL}/${id}`)
  return response.data
}

/**
 * Cria uma nova categoria
 */
export async function createCategory(
  data: CreateCategoryDTO
): Promise<Category> {
  const response = await apiClient.post<Category>(BASE_URL, data)
  return response.data
}

/**
 * Atualiza uma categoria existente
 */
export async function updateCategory(
  id: string,
  data: UpdateCategoryDTO
): Promise<Category> {
  const response = await apiClient.patch<Category>(`${BASE_URL}/${id}`, data)
  return response.data
}

/**
 * Remove uma categoria
 */
export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`${BASE_URL}/${id}`)
}
