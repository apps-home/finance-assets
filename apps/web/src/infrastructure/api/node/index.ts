import type { NodeResponse } from './types'

const BASE_URL = '/api/node'

/**
 * GET - Busca dados do Node
 */
export async function getNode(): Promise<NodeResponse> {
	const response = await fetch(BASE_URL)
	return response.json()
}

/**
 * POST - Cria um recurso no Node
 */
export async function createNode(
	data: Record<string, unknown>
): Promise<NodeResponse> {
	const response = await fetch(BASE_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	return response.json()
}

/**
 * PUT - Atualiza um recurso no Node
 */
export async function updateNode(
	data: Record<string, unknown>
): Promise<NodeResponse> {
	const response = await fetch(BASE_URL, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	return response.json()
}

/**
 * DELETE - Remove um recurso no Node
 */
export async function deleteNode(): Promise<NodeResponse> {
	const response = await fetch(BASE_URL, {
		method: 'DELETE'
	})
	return response.json()
}

/**
 * PATCH - Atualiza parcialmente um recurso no Node
 */
export async function patchNode(
	data: Record<string, unknown>
): Promise<NodeResponse> {
	const response = await fetch(BASE_URL, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	})
	return response.json()
}
