import { PayloadError } from '@/core/domain/errors/payload-error'
import { Optional } from '@/core/utils/Optional'

export interface CompetenceProps {
  id: string
  categoryId: string
  year: number
}

export class Competence implements CompetenceProps {
  private _props: CompetenceProps

  constructor(props: CompetenceProps) {
    this._props = props
  }

  static create(props: Optional<CompetenceProps, 'id'>): Competence {
    if (!props.year || props.year < 2000 || props.year > 2100) {
      throw new PayloadError('Year must be between 2000 and 2100')
    }

    if (!props.categoryId) {
      throw new PayloadError('Category ID is required')
    }

    return new Competence({
      id: props.id || crypto.randomUUID(),
      categoryId: props.categoryId,
      year: props.year
    })
  }

  get id(): string {
    return this._props.id
  }

  get categoryId(): string {
    return this._props.categoryId
  }

  get year(): number {
    return this._props.year
  }
}
