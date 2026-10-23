import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { changeUserPassword, deleteUserAccount } from '../api'
import type { ChangePasswordDTO } from '../api/types'

export function useChangePassword() {
  return useMutation({
    mutationFn: (dto: ChangePasswordDTO) => changeUserPassword(dto),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao alterar senha')
    }
  })
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (password: string) => deleteUserAccount(password),
    onSuccess: () => {
      toast.success('Conta excluída com sucesso')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir conta')
    }
  })
}
