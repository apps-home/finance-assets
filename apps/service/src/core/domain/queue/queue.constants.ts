export const QUEUES = {
  ASSET_PROCESSING: 'asset-processing',
  DIVIDEND_PROCESSING: 'dividend-processing'
} as const

export const JOBS = {
  ASSET: {
    UPDATE_PRICE: 'update-price'
  },
  DIVIDEND: {
    SYNC: 'sync-dividends'
  }
} as const
