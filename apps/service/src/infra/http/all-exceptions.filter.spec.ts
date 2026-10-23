import { BadRequestException } from '@nestjs/common'
import { describe, expect, it, vi } from 'vitest'

import { PayloadError } from '@/core/domain/errors/payload-error'
import { AssetNotFoundError } from '@/modules/assets/asset/application/errors/asset-not-found.error'

import { AllExceptionsFilter } from './all-exceptions.filter'

function makeHost() {
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) })
  }

  return { host: host as never, status, json }
}

describe('AllExceptionsFilter', () => {
  const sut = new AllExceptionsFilter()

  it('should keep the status and body of http exceptions', () => {
    const { host, status, json } = makeHost()

    sut.catch(new BadRequestException('Invalid file type'), host)

    expect(status).toHaveBeenCalledWith(400)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Invalid file type' })
    )
  })

  it('should map domain errors that escape a use case', () => {
    const notFound = makeHost()
    const payload = makeHost()

    sut.catch(new AssetNotFoundError(), notFound.host)
    sut.catch(new PayloadError('Invalid payload'), payload.host)

    expect(notFound.status).toHaveBeenCalledWith(404)
    expect(payload.status).toHaveBeenCalledWith(400)
  })

  it('should answer 500 without leaking the message of unexpected errors', () => {
    const { host, status, json } = makeHost()

    sut.catch(new Error('database exploded'), host)

    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Unexpected error' })
    )
  })
})
