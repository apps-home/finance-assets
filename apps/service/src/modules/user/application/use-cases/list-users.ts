import { Injectable } from '@nestjs/common'
import { Either, right } from '@/core/utils/Either'
import { UserProps } from '../../domain/user.entity'
import { UserMapper } from '../../domain/user.mapper'
import { UserRepository } from '../../domain/user.repository'

type ListUsersResponse = Either<never, UserProps[]>

@Injectable()
export class ListUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(): Promise<ListUsersResponse> {
    const users = await this.userRepository.list()

    return right(users.map(UserMapper.toHTTP))
  }
}
