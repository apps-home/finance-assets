import { Module } from '@nestjs/common'

import { CreatePatrimonyItemUseCase } from './application/use-cases/create-patrimony-item'
import { DeletePatrimonyItemUseCase } from './application/use-cases/delete-patrimony-item'
import { FindAllPatrimonyItemsUseCase } from './application/use-cases/find-all-patrimony-items'
import { UpdatePatrimonyItemUseCase } from './application/use-cases/update-patrimony-item'
import { PatrimonyItemRepository } from './domain/patrimony-item.repository'
import { PatrimonyItemController } from './infra/patrimony-item.controller'
import { PrismaPatrimonyItemRepository } from './infra/repositories/prisma.patrimony-item.repository'

@Module({
  controllers: [PatrimonyItemController],
  providers: [
    {
      provide: PatrimonyItemRepository,
      useClass: PrismaPatrimonyItemRepository
    },
    CreatePatrimonyItemUseCase,
    FindAllPatrimonyItemsUseCase,
    UpdatePatrimonyItemUseCase,
    DeletePatrimonyItemUseCase
  ],
  exports: [PatrimonyItemRepository]
})
export class PatrimonyItemModule {}
