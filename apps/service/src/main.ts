import 'dotenv/config'

import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { EnvService } from './infra/env/env.service'
import { AllExceptionsFilter } from './infra/http/all-exceptions.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const env = app.get(EnvService)
  const PORT = env.get('PORT')

  app.enableCors({
    origin: env.get('CORS_ORIGINS'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )

  app.useGlobalFilters(new AllExceptionsFilter())

  await app.listen(PORT)
  Logger.log(`Application is running on: http://localhost:${PORT}`, 'Bootstrap')
}

bootstrap()
