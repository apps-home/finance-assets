import { prismaAuth, prismaFinanceAssets } from '@lib/db'
import { Global, Module } from '@nestjs/common'

const FinanceAssetsProvider = {
  provide: 'prismaFinanceAssets',
  useValue: prismaFinanceAssets
}

const AuthProvider = {
  provide: 'prismaAuth',
  useValue: prismaAuth
}

@Global()
@Module({
  providers: [FinanceAssetsProvider, AuthProvider],
  exports: [FinanceAssetsProvider, AuthProvider]
})
export class PrismaModule {}
