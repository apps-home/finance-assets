export class CompetenceNotFoundError extends Error {
  constructor() {
    super('Competence not found')
    this.name = 'CompetenceNotFoundError'
  }
}
