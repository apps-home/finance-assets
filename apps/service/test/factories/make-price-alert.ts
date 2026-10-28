import {
  PriceAlert,
  PriceAlertDirection,
  type PriceAlertProps,
  PriceAlertStatus
} from '@/modules/assets/price-alert/domain/price-alert.entity'

export function makePriceAlert(
  override: Partial<PriceAlertProps> & Pick<PriceAlertProps, 'userId'>
): PriceAlert {
  const now = new Date()

  return new PriceAlert({
    id: crypto.randomUUID(),
    marketAssetId: crypto.randomUUID(),
    assetId: crypto.randomUUID(),
    wishlistId: null,
    targetPrice: 40,
    direction: PriceAlertDirection.BELOW,
    status: PriceAlertStatus.ARMED,
    lastTriggeredAt: null,
    lastTriggeredPrice: null,
    triggerCount: 0,
    createdAt: now,
    updatedAt: now,
    ...override
  })
}
