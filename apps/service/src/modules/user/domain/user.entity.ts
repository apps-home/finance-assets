export interface UserProps {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export class User implements UserProps {
  private _props: UserProps

  constructor(props: UserProps) {
    this._props = props
  }

  get id(): string {
    return this._props.id
  }

  get name(): string {
    return this._props.name
  }

  get email(): string {
    return this._props.email
  }

  get emailVerified(): boolean {
    return this._props.emailVerified
  }

  get image(): string | null {
    return this._props.image
  }

  get createdAt(): Date {
    return this._props.createdAt
  }

  get updatedAt(): Date {
    return this._props.updatedAt
  }
}
