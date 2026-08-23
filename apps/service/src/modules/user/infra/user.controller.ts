import { Readable } from 'node:stream'
import {
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Patch,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'

import { DownloadUserAvatarUseCase } from '../application/use-cases/download-avatar'
import { FindUserByIdUseCase } from '../application/use-cases/find-user'
import { FindUserByEmailUseCase } from '../application/use-cases/find-user-by-email'
import { ListUsersUseCase } from '../application/use-cases/list-users'
import { UploadUserAvatarUseCase } from '../application/use-cases/upload-user-avatar'

@Controller('users')
export class UserController {
  constructor(
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly uploadUserAvatarUseCase: UploadUserAvatarUseCase,
    private readonly downloadUserAvatarUseCase: DownloadUserAvatarUseCase
  ) {}

  @Get()
  async list() {
    const result = await this.listUsersUseCase.execute()

    return result.value
  }

  @Get('by-email')
  async findByEmail(@Query('email') email: string) {
    const result = await this.findUserByEmailUseCase.execute(email)

    if (result.isLeft()) {
      throw new NotFoundException(result.value.message)
    }

    return result.value
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const result = await this.findUserByIdUseCase.execute(id)

    if (result.isLeft()) {
      throw new NotFoundException(result.value.message)
    }

    return result.value
  }

  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter(_req, file, callback) {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new Error('Invalid file type'), false)
        }

        if (typeof file.filename !== 'string') {
          return callback(new Error('Invalid file name'), false)
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
    @UploadedFile() file: Express.Multer.File
  ) {
    const result = await this.uploadUserAvatarUseCase.execute({
      userId: id,
      file
    })

    if (result.isLeft()) {
      throw new InternalServerErrorException(result.value.message)
    }

    return {
      file_name: result.value.fileName
    }
  }

  @Get(':id/download-avatar')
  async downloadAvatar(@Param('id') id: string) {
    const result = await this.downloadUserAvatarUseCase.execute({
      userId: id
    })

    if (result.isLeft()) {
      throw new InternalServerErrorException(result.value.message)
    }

    const stream = Readable.fromWeb(result.value.file)

    return new StreamableFile(stream, {
      type: 'application/octet-stream',
      disposition: 'attachment; filename="avatar.png"'
    })
  }
}
