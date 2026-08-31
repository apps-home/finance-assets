export const formatCurrency = (
  value: number,
  currency: string = 'BRL'
) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency?.toUpperCase() || 'BRL'
  }).format(value)

