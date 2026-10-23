import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  Logger
} from '@nestjs/common'

import { toHttpException } from './to-http-exception'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse()

    if (exception instanceof HttpException) {
      return response.status(exception.getStatus()).json(this.toBody(exception))
    }

    const httpException = toHttpException(
      exception instanceof Error ? exception : new Error(String(exception))
    )

    if (httpException.getStatus() >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception)
      )
    }

    return response
      .status(httpException.getStatus())
      .json(this.toBody(httpException))
  }

  private toBody(exception: HttpException) {
    const body = exception.getResponse()

    return typeof body === 'object'
      ? body
      : {
          statusCode: exception.getStatus(),
          message: body,
          error: exception.name
        }
  }
}
