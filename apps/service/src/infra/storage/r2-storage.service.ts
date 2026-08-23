import { ReadableStream } from 'node:stream/web'
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Injectable, Logger } from '@nestjs/common'

import { DomainStorage } from '@/core/domain/storage/domain-storage.interface'

import { EnvService } from '../env/env.service'

@Injectable()
export class R2StorageService implements DomainStorage {
  private readonly logger = new Logger(R2StorageService.name)
  private readonly storage: S3Client
  private readonly accountId: string
  private readonly accessKeyId: string
  private readonly secretAccessKey: string

  constructor(private readonly env: EnvService) {
    this.accountId = this.env.get('R2_ACCOUNT_ID')
    this.accessKeyId = this.env.get('R2_ACCESS_KEY_ID')
    this.secretAccessKey = this.env.get('R2_SECRET_ACCESS_KEY')

    this.storage = new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey
      }
    })
  }

  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<void> {
    this.logger.log(`Uploading file: ${key}`)
    await this.storage.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        ContentDisposition: 'inline'
      })
    )

    this.logger.log(`File uploaded successfully: ${key}`)
  }

  async download(bucket: string, key: string): Promise<ReadableStream> {
    this.logger.log(`Downloading file: ${key}`)
    const fileResponse = await this.storage.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key
      })
    )

    const content = fileResponse.Body

    if (!content) {
      throw new Error('File not found')
    }

    const stream = content.transformToWebStream()

    this.logger.log(`File downloaded successfully: ${key}`)

    return stream as unknown as ReadableStream
  }

  async delete(bucket: string, key: string): Promise<void> {
    this.logger.log(`Deleting file: ${key}`)
    await this.storage.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key
      })
    )

    this.logger.log(`File deleted successfully: ${key}`)
  }

  // Link para download direto do R2
  async getSignedUrl(
    bucket: string,
    key: string,
    expiresIn = 3600
  ): Promise<string> {
    this.logger.log(`Getting signed url for file: ${key}`)
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    })

    const signedUrl = await getSignedUrl(this.storage, command, {
      expiresIn
    })

    this.logger.log(`Signed url for file: ${key}`)

    return signedUrl
  }

  // Link para upload direto para o R2
  async getSignedPutUrl(
    bucket: string,
    key: string,
    expiresIn = 3600
  ): Promise<string> {
    this.logger.log(`Getting signed put url for file: ${key}`)
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key
    })

    const signedUrl = await getSignedUrl(this.storage, command, {
      expiresIn
    })

    this.logger.log(`Signed put url for file: ${key}`)

    return signedUrl
  }
}
