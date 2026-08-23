import { ReadableStream } from 'node:stream/web'
import { Injectable } from '@nestjs/common'

import { DomainStorage } from '@/core/domain/storage/domain-storage.interface'
import {
  StorageBucket,
  StorageFolder
} from '@/core/domain/storage/storage.constant'
import { Either, left, right } from '@/core/utils/Either'

import { UserRepository } from '../../domain/user.repository'
import { UserNotFoundError } from '../errors/user-not-found.error'

interface DownloadUserAvatarRequest {
  userId: string
}

interface DownloadUserAvatarResponse {
  file: ReadableStream
}

type Response = Either<Error | UserNotFoundError, DownloadUserAvatarResponse>

@Injectable()
export class DownloadUserAvatarUseCase {
  constructor(
    private readonly storageService: DomainStorage,
    private readonly userRepository: UserRepository
  ) {}

  async execute(data: DownloadUserAvatarRequest): Promise<Response> {
    const user = await this.userRepository.findById(data.userId)

    if (!user) {
      return left(new UserNotFoundError())
    }

    const fileKey = `${StorageFolder.PUBLIC}/${StorageFolder.USERS}/${StorageFolder.AVATARS}/${data.userId}`

    let file: ReadableStream

    try {
      file = await this.storageService.download(
        StorageBucket.FINANCE_ASSETS,
        fileKey
      )
    } catch (error) {
      return left(error)
    }

    return right({ file })
  }
}
