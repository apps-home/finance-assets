import { Global, Module } from '@nestjs/common'

import { DomainStorage } from '@/core/domain/storage/domain-storage.interface'

import { R2StorageService } from './r2-storage.service'

@Global()
@Module({
  providers: [
    {
      provide: DomainStorage,
      useClass: R2StorageService
    }
  ],
  exports: [DomainStorage]
})
export class StorageModule {}
