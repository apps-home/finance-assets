export interface UploadAvatarResponse {
  file_name: string
}

export interface UserSession {
  id: string
  token: string
  userAgent?: string | null
  ipAddress?: string | null
  createdAt: Date
  expiresAt: Date
}

export interface ChangePasswordDTO {
  currentPassword: string
  newPassword: string
}
