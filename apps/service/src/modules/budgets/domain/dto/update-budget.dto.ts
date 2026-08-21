import { PartialType } from '@nestjs/mapped-types'
import { CreateBudgetPayload } from './create-budget.dto'

export class UpdateBudgetPayload extends PartialType(CreateBudgetPayload) {}
