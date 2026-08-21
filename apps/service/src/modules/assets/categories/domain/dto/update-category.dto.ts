import { PartialType } from '@nestjs/mapped-types'
import { CreateCategoryPayload } from './create-category.dto'

export class UpdateCategoryPayload extends PartialType(CreateCategoryPayload) {}
