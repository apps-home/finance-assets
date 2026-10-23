import { apiClient } from '@/infrastructure/services/api-client'
import {
  changePassword,
  deleteUser,
  listSessions,
  revokeOtherSessions,
  revokeSession,
  updateUser
} from '@/shared/lib/auth-client'

import type {
  ChangePasswordDTO,
  UploadAvatarResponse,
  UserSession
} from './types'

const BASE_URL = '/users'

/**
 * Envia o arquivo do avatar para o storage
 */
export async function uploadUserAvatar(
  id: string,
  data: FormData
): Promise<UploadAvatarResponse> {
  const response = await apiClient.patch<UploadAvatarResponse>(
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

/**
 * Atualiza a imagem de perfil do usuário autenticado
 */
export async function updateUserAvatar(image: string): Promise<void> {
  const { error } = await updateUser({ image })

  if (error) {
    throw new Error(error.message || 'Erro ao atualizar foto de perfil')
  }
}

/**
 * Lista as sessões ativas do usuário
 */
export async function listUserSessions(): Promise<UserSession[]> {
  const response = await listSessions()
  return response.data ?? []
}

/**
 * Encerra uma sessão específica
 */
export async function revokeUserSession(token: string): Promise<void> {
  await revokeSession({ token })
}

/**
 * Encerra todas as sessões, exceto a atual
 */
export async function revokeOtherUserSessions(): Promise<void> {
  await revokeOtherSessions()
}

/**
 * Altera a senha do usuário e encerra as demais sessões
 */
export async function changeUserPassword(
  data: ChangePasswordDTO
): Promise<void> {
  const { error } = await changePassword({
    ...data,
    revokeOtherSessions: true
  })

  if (error) {
    throw new Error(error.message || 'Erro ao alterar senha')
  }
}

/**
 * Exclui a conta do usuário
 */
export async function deleteUserAccount(password: string): Promise<void> {
  const { error } = await deleteUser({ password })

  if (error) {
    throw new Error(error.message || 'Erro ao excluir conta')
  }
}
