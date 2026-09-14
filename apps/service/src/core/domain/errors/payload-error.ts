export class PayloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = PayloadError.name
  }
}
