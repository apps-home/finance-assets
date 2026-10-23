import { Module } from '@nestjs/common'

import { DownloadUserAvatarUseCase } from './application/use-cases/download-avatar'
import { FindUserByIdUseCase } from './application/use-cases/find-user'
import { UploadUserAvatarUseCase } from './application/use-cases/upload-user-avatar'
import { UserRepository } from './domain/user.repository'
import { PrismaUserRepository } from './infra/repositories/prisma.user.repository'
import { UserController } from './infra/user.controller'

@Module({
  controllers: [UserController],
  providers: [
    { provide: UserRepository, useClass: PrismaUserRepository },
    FindUserByIdUseCase,
    UploadUserAvatarUseCase,
    DownloadUserAvatarUseCase
  ],
  exports: [UserRepository]
})
export class UserModule {}
