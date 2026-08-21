import { type NextRequest, NextResponse } from 'next/server'

import { n8nApiClient } from '@/infrastructure/services/external/n8n-client'

export async function POST(req: NextRequest) {
	try {
		const body = await req.json()

		switch (body.mode) {
			case 'year': {
				const response = await n8nApiClient.post(
					'/webhook/generate-insights-annual',
					body
				)

				return NextResponse.json(response.data.data)
			}

			case 'month': {
				const response = await n8nApiClient.post(
					'/webhook/generate-insights-monthly',
					body
				)

				return NextResponse.json(response.data.data)
			}
			default:
				break
		}
	} catch (error) {
		console.error('[generate-insights] Error:', error)

		return NextResponse.json(
			{ error: 'Failed to generate insights' },
			{ status: 500 }
		)
	}
}
