export class BudgetNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = BudgetNotFoundError.name
  }
}
