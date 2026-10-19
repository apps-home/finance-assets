import { ReadableStream } from 'node:stream/web'

import type { DomainStorage } from '@/core/domain/storage/domain-storage.interface'

export class FakeStorage implements DomainStorage {
  public files = new Map<string, Buffer>()

  async upload(
    bucket: string,
    key: string,
    body: Buffer,
    _contentType: string
  ): Promise<void> {
    this.files.set(`${bucket}/${key}`, body)
  }

  async download(bucket: string, key: string): Promise<ReadableStream> {
    const file = this.files.get(`${bucket}/${key}`)

    if (!file) {
      throw new Error(`File not found: ${bucket}/${key}`)
    }

    return new ReadableStream({
      start(controller) {
        controller.enqueue(file)
        controller.close()
      }
    })
  }

  async delete(bucket: string, key: string): Promise<void> {
    this.files.delete(`${bucket}/${key}`)
  }

  async getSignedUrl(
    bucket: string,
    key: string,
    _expiresIn?: number
  ): Promise<string> {
    return `https://fake-storage.test/${bucket}/${key}`
  }

  async getSignedPutUrl(
    bucket: string,
    key: string,
    _expiresIn?: number
  ): Promise<string> {
    return `https://fake-storage.test/${bucket}/${key}`
  }
}
