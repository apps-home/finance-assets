import { env } from '@finance-assets-web/env/web'
import { createAuthClient } from 'better-auth/react'

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

export const authClient = createAuthClient({
  baseURL: getBaseURL()
})

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
  updateSession
} = authClient
