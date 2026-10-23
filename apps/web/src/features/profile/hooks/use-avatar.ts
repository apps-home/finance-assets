import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { updateUserAvatar, uploadUserAvatar } from '../api'

export function useUploadAvatar() {
  return useMutation({
    mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
      const formData = new FormData()
      formData.append('file', file)

      const { file_name } = await uploadUserAvatar(userId, formData)
      await updateUserAvatar(file_name)
    },
    onSuccess: () => {
      toast.success('Foto de perfil atualizada com sucesso!')
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Erro ao atualizar foto de perfil'
      toast.error(message)
    }
  })
}
