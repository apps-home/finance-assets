import { env } from '@finance-assets-web/env/web'
import { createAppAuthClient } from '@lib/auth/client'

export const authClient = createAppAuthClient({
  fallbackBaseURL: env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
})

export type User = typeof authClient.$Infer.Session.user

export const {
  $ERROR_CODES,
  accountInfo,
  changeEmail,
  changePassword,
  deleteUser,
  getAccessToken,
  getSession,
  linkSocial,
  listAccounts,
  listSessions,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  revokeOtherSessions,
  revokeSession,
  revokeSessions,
  sendVerificationEmail,
  signIn,
  signOut,
  signUp,
  unlinkAccount,
  updateUser,
  useSession,
  verifyEmail,
  updateSession,
  hydrateSession
} = authClient
