import { env } from '@finance-assets-web/env/web'
import { prisma } from '@lib/db'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'

import { n8nApiClient } from '@/infrastructure/services/external/n8n-client'

export const auth = betterAuth({
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	trustedOrigins: [
		'http://localhost:3000',
		'http://10.0.2.124:3000',
		'http://local.dev.terraviva:3000',
		'http://192.168.0.6:3000'
	],
	database: prismaAdapter(prisma, {
		provider: 'postgresql'
	}),
	emailAndPassword: {
		enabled: true,
		async sendResetPassword(data) {
			await n8nApiClient.post('/webhook/send-reset-password', {
				data
			})
		}
	},
	plugins: [nextCookies()]
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
