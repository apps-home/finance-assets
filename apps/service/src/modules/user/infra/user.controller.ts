import { Readable } from 'node:stream'
import { CurrentUserId } from '@lib/auth/nest'
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  StreamableFile,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

import { toHttpException } from '@/infra/http/to-http-exception'

import { DownloadUserAvatarUseCase } from '../application/use-cases/download-avatar'
import { FindUserByIdUseCase } from '../application/use-cases/find-user'
import { UploadUserAvatarUseCase } from '../application/use-cases/upload-user-avatar'

@Controller('users')
export class UserController {
  constructor(
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly uploadUserAvatarUseCase: UploadUserAvatarUseCase,
    private readonly downloadUserAvatarUseCase: DownloadUserAvatarUseCase
  ) {}

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUserId() currentUserId: string
  ) {
    const result = await this.findUserByIdUseCase.execute(currentUserId, id)

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return result.value
  }

  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter(_req, file, callback) {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new BadRequestException('Invalid file type'), false)
        }

        if (typeof file.filename !== 'string') {
          return callback(new BadRequestException('Invalid file name'), false)
        }

        callback(null, true)
      },
      limits: {
        fileSize: 1024 * 1024 * 10, // 10MB,
        files: 1
      }
    })
  )
  @Patch(':id/upload-avatar')
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUserId() currentUserId: string
  ) {
    const result = await this.uploadUserAvatarUseCase.execute({
      currentUserId,
      userId: id,
      file
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    return {
      file_name: result.value.fileName
    }
  }

  @Get(':id/download-avatar')
  async downloadAvatar(
    @Param('id') id: string,
    @CurrentUserId() currentUserId: string
  ) {
    const result = await this.downloadUserAvatarUseCase.execute({
      currentUserId,
      userId: id
    })

    if (result.isLeft()) {
      throw toHttpException(result.value)
    }

    const stream = Readable.fromWeb(result.value.file)

    return new StreamableFile(stream, {
      type: 'application/octet-stream',
      disposition: 'attachment; filename="avatar.png"'
    })
  }
}
