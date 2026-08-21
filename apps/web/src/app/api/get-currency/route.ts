import { type NextRequest, NextResponse } from 'next/server'

import { getMonthDateRange } from '@/shared/utils/get-month-date-range'

export async function GET(req: NextRequest) {
	const { searchParams } = req.nextUrl

	const currency = searchParams.get('currency')
	const month = searchParams.get('month')
	const year = searchParams.get('year')

	let apiUrl: string

	if (month && year) {
		// Buscar cotação histórica do mês/ano específico
		const { startDate, endDate } = getMonthDateRange(
			parseInt(month, 10),
			parseInt(year, 10)
		)
		// Busca os fechamentos do mês inteiro, ordenados do mais recente para o mais antigo
		apiUrl = `https://economia.awesomeapi.com.br/json/daily/${currency}-BRL/?start_date=${startDate}&end_date=${endDate}`
	} else {
		// Buscar cotação atual (comportamento padrão)
		apiUrl = `https://economia.awesomeapi.com.br/json/daily/${currency}-BRL/15`
	}

	const res = await fetch(apiUrl)

	if (!res.ok) {
		return NextResponse.json(
			{ error: 'Failed to fetch currency data' },
			{ status: 500 }
		)
	}

	const data = await res.json()

	if (!data || data.length === 0) {
		return NextResponse.json(
			{ error: 'No currency data found' },
			{ status: 404 }
		)
	}

	return NextResponse.json(data[0])
}
