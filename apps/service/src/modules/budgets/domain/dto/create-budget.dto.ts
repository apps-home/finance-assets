export class CreateBudgetPayload {
  categoryId: string
  month: number
  year: number
  amount: number
  exchangeRate?: number | null
  dividendAmount?: number | null
}
