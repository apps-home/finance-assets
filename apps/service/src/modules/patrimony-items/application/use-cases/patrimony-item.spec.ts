import { makePatrimonyItem } from '@test/factories/make-patrimony-item'
import { InMemoryPatrimonyItemRepository } from '@test/repositories/in-memory-patrimony-item.repository'
import { beforeEach, describe, expect, it } from 'vitest'

import { PatrimonyItemType } from '../../domain/patrimony-item.entity'
import { PatrimonyItemNotFoundError } from '../errors/patrimony-item-not-found.error'
import { CreatePatrimonyItemUseCase } from './create-patrimony-item'
import { DeletePatrimonyItemUseCase } from './delete-patrimony-item'
import { FindAllPatrimonyItemsUseCase } from './find-all-patrimony-items'
import { UpdatePatrimonyItemUseCase } from './update-patrimony-item'

describe('PatrimonyItem use cases', () => {
  let repository: InMemoryPatrimonyItemRepository
  let createUseCase: CreatePatrimonyItemUseCase
  let findAllUseCase: FindAllPatrimonyItemsUseCase
  let updateUseCase: UpdatePatrimonyItemUseCase
  let deleteUseCase: DeletePatrimonyItemUseCase

  beforeEach(() => {
    repository = new InMemoryPatrimonyItemRepository()
    createUseCase = new CreatePatrimonyItemUseCase(repository)
    findAllUseCase = new FindAllPatrimonyItemsUseCase(repository)
    updateUseCase = new UpdatePatrimonyItemUseCase(repository)
    deleteUseCase = new DeletePatrimonyItemUseCase(repository)
  })

  it('creates and summarizes active physical assets and liabilities', async () => {
    await createUseCase.execute({
      userId: 'user-1',
      name: 'Apartamento',
      type: PatrimonyItemType.REAL_ESTATE,
      currentValue: 450_000,
      purchaseValue: 380_000
    })
    await createUseCase.execute({
      userId: 'user-1',
      name: 'Carro FIPE',
      type: PatrimonyItemType.VEHICLE,
      currentValue: 65_000
    })
    await createUseCase.execute({
      userId: 'user-1',
      name: 'Financiamento Imobiliário',
      type: PatrimonyItemType.LIABILITY,
      currentValue: 180_000
    })
    await createUseCase.execute({
      userId: 'user-1',
      name: 'Notebook antigo (vendido)',
      type: PatrimonyItemType.EQUIPMENT,
      currentValue: 5_000,
      isActive: false
    })

    const result = await findAllUseCase.execute({ userId: 'user-1' })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.items).toHaveLength(4)
      expect(result.value.summary).toEqual({
        totalPhysicalAssets: 515_000,
        totalLiabilities: 180_000,
        netPhysicalBalance: 335_000
      })
    }
  })

  it('enforces ownership on update and delete', async () => {
    const item = makePatrimonyItem({ userId: 'user-1', currentValue: 50_000 })
    await repository.save(item)

    const forbiddenUpdate = await updateUseCase.execute('user-2', item.id, {
      currentValue: 60_000
    })
    expect(forbiddenUpdate.value).toBeInstanceOf(PatrimonyItemNotFoundError)

    const allowedUpdate = await updateUseCase.execute('user-1', item.id, {
      currentValue: 60_000
    })
    expect(allowedUpdate.isRight()).toBe(true)
    expect(repository.items[0].currentValue).toBe(60_000)

    const forbiddenDelete = await deleteUseCase.execute('user-2', item.id)
    expect(forbiddenDelete.value).toBeInstanceOf(PatrimonyItemNotFoundError)

    const allowedDelete = await deleteUseCase.execute('user-1', item.id)
    expect(allowedDelete.isRight()).toBe(true)
    expect(repository.items).toHaveLength(0)
  })
})
