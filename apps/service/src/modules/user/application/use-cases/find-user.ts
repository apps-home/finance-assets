import { Injectable } from '@nestjs/common'

import { Either, left, right } from '@/core/utils/Either'

import { UserProps } from '../../domain/user.entity'
import { UserMapper } from '../../domain/user.mapper'
import { UserRepository } from '../../domain/user.repository'
import { UserNotFoundError } from '../errors/user-not-found.error'

type FindUserByIdResponse = Either<UserNotFoundError, UserProps>

@Injectable()
export class FindUserByIdUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(id: string): Promise<FindUserByIdResponse> {
    const user = await this.userRepository.findById(id)

    if (!user) {
      return left(new UserNotFoundError('User not found'))
    }

    return right(UserMapper.toHTTP(user))
  }
}
