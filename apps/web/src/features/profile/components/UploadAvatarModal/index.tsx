'use client'

import { Button } from '@lib/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@lib/ui/components/dialog'
import { Input } from '@lib/ui/components/input'
import { Upload } from 'lucide-react'
import { useState } from 'react'

import { useUploadAvatar } from '@/features/profile/hooks/use-avatar'

interface UploadAvatarModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

export function UploadAvatarModal({
  open,
  onOpenChange,
  userId
}: UploadAvatarModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const { mutateAsync: uploadAvatar, isPending: isUploading } =
    useUploadAvatar()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (file) {
      setSelectedFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await uploadAvatar({ userId, file: selectedFile })

      onOpenChange(false)
      setSelectedFile(null)
      setPreview(null)
    } catch {
      // o erro já é exibido pelo toast do hook
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null)
      setPreview(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Foto de Perfil</DialogTitle>
          <DialogDescription>
            Selecione uma nova foto para o seu perfil
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            {preview ? (
              <div
                className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-border shadow-lg"
                onClick={() =>
                  document.getElementById('avatar-upload')?.click()
                }
              >
                <img
                  src={preview}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div
                className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-border border-dashed bg-muted"
                onClick={() =>
                  document.getElementById('avatar-upload')?.click()
                }
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
              </div>
            )}

            <div className="w-full">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="avatar-upload"
                disabled={isUploading}
              />
              <label htmlFor="avatar-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full cursor-pointer"
                  onClick={() =>
                    document.getElementById('avatar-upload')?.click()
                  }
                  disabled={isUploading}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivo
                </Button>
              </label>
            </div>

            {selectedFile && (
              <p className="text-center text-muted-foreground text-sm">
                {selectedFile.name}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? 'Enviando...' : 'Enviar Foto'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
