import { PartialType } from '@nestjs/mapped-types'

import { CreateAssetPayload } from './create-asset.dto'

export class UpdateAssetPayload extends PartialType(CreateAssetPayload) {}
