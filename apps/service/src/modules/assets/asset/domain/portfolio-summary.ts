import type { AssetHTTPResponse } from './asset.mapper'
import type { AssetWithCategory } from './asset.repository'

export interface PortfolioPosition {
  id: string
  name: string
  ticker: string
  broker: string | null
  categoryName: string
  categoryType: string
  /** Valores já convertidos para BRL */
  investedValue: number
  currentBalance: number
  profitLoss: number
  profitabilityPercentage: number | null
  portfolioPercentage: number
  monthChangePercentage: number | null
}

export interface PortfolioAllocation {
  key: string
  name: string
  currentBalance: number
  percentage: number
  profitLoss: number
  assetsCount: number
}

export interface FixedIncomePosition {
  id: string
  name: string
  ticker: string
  broker: string | null
  categoryName: string
  currency: string
  originalBalance: number
  currentBalance: number
  percentage: number
}

export interface MacroAllocation {
  variableBalance: number
  variablePercentage: number
  fixedBalance: number
  fixedPercentage: number
  totalBalance: number
}

export interface FixedIncomeSummary {
  currentBalance: number
  assetsCount: number
  positions: FixedIncomePosition[]
  allocationByCurrency: PortfolioAllocation[]
  allocationByBroker: PortfolioAllocation[]
}

export interface PortfolioSummary {
  /** Carteira de mercado: tudo exceto renda fixa/caixa. Valores em BRL */
  totals: {
    investedValue: number
    currentBalance: number
    profitLoss: number
    profitabilityPercentage: number | null
    assetsCount: number
  }
  /** Renda fixa / caixa detalhado */
  fixedIncome: FixedIncomeSummary
  /** Alocação macro: Renda Variável vs Renda Fixa */
  macroAllocation: MacroAllocation
  allocationByCategory: PortfolioAllocation[]
  allocationByBroker: PortfolioAllocation[]
  topHoldings: PortfolioPosition[]
  bestPerformers: PortfolioPosition[]
  worstPerformers: PortfolioPosition[]
  monthMovers: {
    gainers: PortfolioPosition[]
    losers: PortfolioPosition[]
  }
}

const RANKING_SIZE = 5

type SummaryInput = AssetHTTPResponse & {
  category: AssetWithCategory['category']
}

const round = (value: number) => Number(value.toFixed(2))

function toAllocations(
  positions: Array<PortfolioPosition & { groupKey: string; groupName: string }>,
  total: number
): PortfolioAllocation[] {
  const groups = new Map<string, PortfolioAllocation>()

  for (const position of positions) {
    const group = groups.get(position.groupKey) ?? {
      key: position.groupKey,
      name: position.groupName,
      currentBalance: 0,
      percentage: 0,
      profitLoss: 0,
      assetsCount: 0
    }

    group.currentBalance += position.currentBalance
    group.profitLoss += position.profitLoss
    group.assetsCount += 1
    groups.set(position.groupKey, group)
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      currentBalance: round(group.currentBalance),
      profitLoss: round(group.profitLoss),
      percentage: total > 0 ? round((group.currentBalance / total) * 100) : 0
    }))
    .sort((a, b) => b.currentBalance - a.currentBalance)
}

export function buildPortfolioSummary(
  assets: SummaryInput[],
  exchangeRates: Map<string, number>
): PortfolioSummary {
  const rateOf = (categoryId: string, currency: string) =>
    currency === 'BRL' ? 1 : (exchangeRates.get(categoryId) ?? 1)

  const converted = assets
    .filter(
      (asset) =>
        asset.isActive &&
        asset.currentBalance !== null &&
        asset.investedValue !== null
    )
    .map((asset) => {
      const rate = rateOf(asset.category.id, asset.category.currency)
      const monthChange =
        asset.currentClosePrice !== null &&
        asset.lastMonthClosePrice !== null &&
        asset.lastMonthClosePrice !== 0
          ? (asset.currentClosePrice / asset.lastMonthClosePrice - 1) * 100
          : null

      return {
        id: asset.id,
        name: asset.name,
        ticker: asset.ticker,
        broker: asset.broker,
        categoryId: asset.category.id,
        categoryName: asset.category.name,
        categoryType: asset.category.type as string,
        currency: asset.category.currency,
        originalBalance: asset.currentBalance as number,
        investedValue: (asset.investedValue as number) * rate,
        currentBalance: (asset.currentBalance as number) * rate,
        profitLoss: (asset.profitLoss as number) * rate,
        profitabilityPercentage: asset.profitabilityPercentage,
        monthChangePercentage: monthChange
      }
    })

  const portfolio = converted.filter((asset) => asset.categoryType !== 'FIXED')
  const fixed = converted.filter((asset) => asset.categoryType === 'FIXED')

  const investedValue = portfolio.reduce((sum, a) => sum + a.investedValue, 0)
  const currentBalance = portfolio.reduce((sum, a) => sum + a.currentBalance, 0)
  const profitLoss = currentBalance - investedValue

  const fixedBalance = round(
    fixed.reduce((sum, a) => sum + a.currentBalance, 0)
  )
  const totalBalance = round(currentBalance + fixedBalance)

  const positions = portfolio.map((asset) => ({
    id: asset.id,
    name: asset.name,
    ticker: asset.ticker,
    broker: asset.broker,
    categoryName: asset.categoryName,
    categoryType: asset.categoryType,
    investedValue: round(asset.investedValue),
    currentBalance: round(asset.currentBalance),
    profitLoss: round(asset.profitLoss),
    profitabilityPercentage:
      asset.profitabilityPercentage !== null
        ? round(asset.profitabilityPercentage)
        : null,
    portfolioPercentage:
      currentBalance > 0
        ? round((asset.currentBalance / currentBalance) * 100)
        : 0,
    monthChangePercentage:
      asset.monthChangePercentage !== null
        ? round(asset.monthChangePercentage)
        : null,
    groupKey: asset.categoryId,
    groupName: asset.categoryName,
    brokerName: asset.broker?.trim() || 'Sem corretora'
  }))

  const rawFixedPositions = fixed
    .map((asset) => ({
      id: asset.id,
      name: asset.name,
      ticker: asset.ticker,
      broker: asset.broker,
      categoryName: asset.categoryName,
      currency: asset.currency,
      originalBalance: round(asset.originalBalance),
      currentBalance: round(asset.currentBalance),
      percentage:
        fixedBalance > 0
          ? round((asset.currentBalance / fixedBalance) * 100)
          : 0,
      groupKey: asset.currency,
      groupName: asset.currency === 'USD' ? 'Dólar (USD)' : 'Real (BRL)',
      brokerName: asset.broker?.trim() || 'Sem corretora'
    }))
    .sort((a, b) => b.currentBalance - a.currentBalance)

  const stripGroup = ({
    groupKey: _groupKey,
    groupName: _groupName,
    brokerName: _brokerName,
    ...position
  }: (typeof positions)[number]): PortfolioPosition => position

  const stripFixedGroup = ({
    groupKey: _groupKey,
    groupName: _groupName,
    brokerName: _brokerName,
    ...position
  }: (typeof rawFixedPositions)[number]): FixedIncomePosition => position

  const withReturn = positions.filter((p) => p.profitabilityPercentage !== null)
  const withMonthChange = positions.filter(
    (p) => p.monthChangePercentage !== null
  )

  const byReturnDesc = [...withReturn].sort(
    (a, b) =>
      (b.profitabilityPercentage as number) -
      (a.profitabilityPercentage as number)
  )
  const byMonthDesc = [...withMonthChange].sort(
    (a, b) =>
      (b.monthChangePercentage as number) - (a.monthChangePercentage as number)
  )

  const macroAllocation: MacroAllocation = {
    variableBalance: round(currentBalance),
    variablePercentage:
      totalBalance > 0 ? round((currentBalance / totalBalance) * 100) : 0,
    fixedBalance,
    fixedPercentage:
      totalBalance > 0 ? round((fixedBalance / totalBalance) * 100) : 0,
    totalBalance
  }

  const fixedAllocationByCurrency = toAllocations(
    rawFixedPositions.map((p) => ({
      ...p,
      investedValue: p.currentBalance,
      profitLoss: 0,
      profitabilityPercentage: 0,
      portfolioPercentage: p.percentage,
      monthChangePercentage: null,
      categoryType: 'FIXED'
    })),
    fixedBalance
  )

  const fixedAllocationByBroker = toAllocations(
    rawFixedPositions.map((p) => ({
      ...p,
      groupKey: p.brokerName,
      groupName: p.brokerName,
      investedValue: p.currentBalance,
      profitLoss: 0,
      profitabilityPercentage: 0,
      portfolioPercentage: p.percentage,
      monthChangePercentage: null,
      categoryType: 'FIXED'
    })),
    fixedBalance
  )

  return {
    totals: {
      investedValue: round(investedValue),
      currentBalance: round(currentBalance),
      profitLoss: round(profitLoss),
      profitabilityPercentage:
        investedValue > 0 ? round((profitLoss / investedValue) * 100) : null,
      assetsCount: portfolio.length
    },
    fixedIncome: {
      currentBalance: fixedBalance,
      assetsCount: fixed.length,
      positions: rawFixedPositions.map(stripFixedGroup),
      allocationByCurrency: fixedAllocationByCurrency,
      allocationByBroker: fixedAllocationByBroker
    },
    macroAllocation,
    allocationByCategory: toAllocations(positions, currentBalance),
    allocationByBroker: toAllocations(
      positions.map((p) => ({
        ...p,
        groupKey: p.brokerName,
        groupName: p.brokerName
      })),
      currentBalance
    ),
    topHoldings: [...positions]
      .sort((a, b) => b.currentBalance - a.currentBalance)
      .slice(0, RANKING_SIZE)
      .map(stripGroup),
    bestPerformers: byReturnDesc.slice(0, RANKING_SIZE).map(stripGroup),
    worstPerformers: [...byReturnDesc]
      .reverse()
      .slice(0, RANKING_SIZE)
      .map(stripGroup),
    monthMovers: {
      gainers: byMonthDesc
        .filter((p) => (p.monthChangePercentage as number) > 0)
        .slice(0, RANKING_SIZE)
        .map(stripGroup),
      losers: [...byMonthDesc]
        .reverse()
        .filter((p) => (p.monthChangePercentage as number) < 0)
        .slice(0, RANKING_SIZE)
        .map(stripGroup)
    }
  }
}
