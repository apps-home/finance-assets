import { type NextRequest, NextResponse } from 'next/server'

import { getMonthDateRange } from '@/shared/utils/get-month-date-range'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    const currency = searchParams.get('currency') || 'USD'
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

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })

    if (!res.ok) {
      const errorBody = await res.text().catch(() => '')
      console.error(
        `[get-currency] Erro na AwesomeAPI: ${apiUrl} | Status: ${res.status} ${res.statusText} | Resposta: ${errorBody}`
      )
      return NextResponse.json(
        {
          error: 'Failed to fetch currency data',
          status: res.status,
          statusText: res.statusText,
          details: errorBody
        },
        { status: res.status >= 400 && res.status < 600 ? res.status : 500 }
      )
    }

    const data = await res.json()

    if (!data || data.length === 0) {
      console.warn(`[get-currency] Nenhum dado encontrado para ${apiUrl}`)
      return NextResponse.json(
        { error: 'No currency data found', url: apiUrl },
        { status: 404 }
      )
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error('[get-currency] Erro inesperado:', error)
    return NextResponse.json(
      {
        error: 'Internal server error fetching currency data',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
