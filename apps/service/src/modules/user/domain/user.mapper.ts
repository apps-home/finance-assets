import { User, UserProps } from './user.entity'

export class UserMapper {
  static toHTTP(user: User): UserProps {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  }
}
