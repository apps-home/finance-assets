import { env } from '@finance-assets-web/env/web'
import { createAuth } from '@lib/auth/server'
import { prisma } from '@lib/finance-assets-db'

import { n8nApiClient } from '@/infrastructure/services/external/n8n-client'

// Sem cookiePrefix: o cookie continua `better-auth.session_token` e as sessões ativas seguem válidas
export const auth = createAuth({
  appName: 'Finance Assets',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
  prisma,
  async sendResetPassword(data) {
    await n8nApiClient.post('/webhook/send-reset-password', {
      data
    })
  }
})

export default auth

export const {
  accountInfo,
  callbackOAuth,
  changeEmail,
  changePassword,
  deleteUser,
  deleteUserCallback,
  error,
  getAccessToken,
  getSession,
  linkSocialAccount,
  listSessions,
  listUserAccounts,
  ok,
  refreshToken,
  requestPasswordReset,
  requestPasswordResetCallback,
  resetPassword,
  revokeOtherSessions,
  revokeSession,
  revokeSessions,
  sendVerificationEmail,
  setPassword,
  signInEmail,
  signInSocial,
  signOut,
  signUpEmail,
  unlinkAccount,
  updateUser,
  verifyEmail,
  verifyPassword,
  updateSession
} = auth.api
