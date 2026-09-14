import 'dotenv/config'

import { HttpException, Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

import { AppModule } from './app.module'
import { EnvService } from './infra/env/env.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const env = app.get(EnvService)
  const PORT = env.get('PORT')

  app.enableCors({
    origin: [
      'https://finance.apps-store.app',
      'http://localhost:3000' // se precisar rodar dev local
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'user-id']
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )

  app.useGlobalFilters({
    catch(exception, host) {
      const ctx = host.switchToHttp()
      const response = ctx.getResponse()

      if (exception instanceof HttpException) {
        const status = exception.getStatus()
        const res = exception.getResponse()

        return response
          .status(status)
          .json(
            typeof res === 'object'
              ? res
              : { statusCode: status, message: res, error: exception.name }
          )
      }

      if (exception instanceof Error) {
        return response.status(400).json({
          statusCode: 400,
          message: exception.message,
          error: 'Bad Request'
        })
      }

      return response.status(500).json({
        statusCode: 500,
        message: exception.message || 'Internal Server Error',
        error: 'Internal Server Error'
      })
    }
  })

  await app.listen(PORT)
  Logger.log(`Application is running on: http://localhost:${PORT}`, 'Bootstrap')
}

bootstrap()
