import { ReadableStream } from 'node:stream/web'

export abstract class DomainStorage {
  abstract upload(
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string
  ): Promise<void>
  abstract download(bucket: string, key: string): Promise<ReadableStream>
  abstract delete(bucket: string, key: string): Promise<void>
  abstract getSignedUrl(
    bucket: string,
    key: string,
    expiresIn?: number
  ): Promise<string>
  abstract getSignedPutUrl(
    bucket: string,
    key: string,
    expiresIn?: number
  ): Promise<string>
}
