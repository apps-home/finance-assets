import { extname } from 'path'
import { Injectable } from '@nestjs/common'

import { DomainStorage } from '@/core/domain/storage/domain-storage.interface'
import {
  StorageBucket,
  StorageFolder
} from '@/core/domain/storage/storage.constant'
import { Either, left, right } from '@/core/utils/Either'

import { UserRepository } from '../../domain/user.repository'
import { UserNotFoundError } from '../errors/user-not-found.error'

interface UploadUserAvatarRequest {
  userId: string
  file: Express.Multer.File
}

interface UploadUserAvatarResponse {
  fileName: string
}

type Response = Either<Error | UserNotFoundError, UploadUserAvatarResponse>

@Injectable()
export class UploadUserAvatarUseCase {
  constructor(
    private readonly storageService: DomainStorage,
    private readonly userRepository: UserRepository
  ) {}

  async execute(data: UploadUserAvatarRequest): Promise<Response> {
    const user = await this.userRepository.findById(data.userId)

    if (!user) {
      return left(new UserNotFoundError())
    }

    const fileExtension = extname(data.file.originalname)
    const fileName = `${data.userId}-${Date.now()}${fileExtension}`
    const fileKey = `${StorageFolder.PUBLIC}/${StorageFolder.USERS}/${StorageFolder.AVATARS}/${fileName}`

    try {
      await this.storageService.upload(
        StorageBucket.FINANCE_ASSETS,
        fileKey,
        data.file.buffer,
        data.file.mimetype
      )
    } catch (error) {
      return left(error)
    }

    return right({ fileName })
  }
}
