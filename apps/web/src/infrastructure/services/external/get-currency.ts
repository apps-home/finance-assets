import { toast } from 'sonner'

export interface CurrencyDataResponse {
  code: string
  codein: string
  name: string
  high: string
  low: string
  varBid: string
  pctChange: string
  bid: string
  ask: string
  timestamp: string
  create_date: string
}

interface GetCurrencyDataOptions {
  month?: number
  year?: number
}

export async function getCurrencyData(
  currency: string,
  options?: GetCurrencyDataOptions
): Promise<number> {
  let currencyData = 1

  try {
    const params = new URLSearchParams({ currency })

    if (options?.month && options?.year) {
      params.append('month', options.month.toString())
      params.append('year', options.year.toString())
    }

    const response = await fetch(`/api/get-currency?${params.toString()}`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      console.log(
        `HTTP error! status: ${response.status} ${response.statusText}`
      )
      return 1
    }

    const data: CurrencyDataResponse = await response.json()
    currencyData = parseFloat(data.bid)
    return currencyData
  } catch (error) {
    console.error('Error fetching currency data:', error)
    return 1
  } finally {
    if (currencyData === 1) {
      toast.error(
        'Não foi possível obter a taxa de câmbio. Usando valor 1 como padrão.'
      )
    }
  }
}

export async function getCurrencyQuote(
  currency = 'USD'
): Promise<CurrencyDataResponse | null> {
  try {
    const response = await fetch(`/api/get-currency?currency=${currency}`)
    if (!response.ok) {
      return null
    }
    const data: CurrencyDataResponse = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching currency quote:', error)
    return null
  }
}
