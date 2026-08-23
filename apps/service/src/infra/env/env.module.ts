import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { envSchema } from './env.schema'
import { EnvService } from './env.service'

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true
    })
  ],
  providers: [EnvService],
  exports: [EnvService]
})
export class EnvModule {}
