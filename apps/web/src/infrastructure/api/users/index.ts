import { apiClient } from '@/infrastructure/services/api-client'

const BASE_URL = '/users'

export async function uploadUserAvatar(
	id: string,
	data: FormData
): Promise<{
	file_name: string
}> {
	const response = await apiClient.patch(
		`${BASE_URL}/${id}/upload-avatar`,
		data,
		{
			headers: {
				'Content-Type': 'multipart/form-data'
			}
		}
	)

	return response.data
}
