import { HttpModule } from '@nestjs/axios'
import { Global, Module } from '@nestjs/common'

import { N8nProvider } from './n8n.provider'

@Global()
@Module({
  imports: [HttpModule],
  providers: [N8nProvider],
  exports: [N8nProvider]
})
export class N8nModule {}
