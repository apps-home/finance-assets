export function formatQuantity(value: number, maximumFractionDigits = 5) {
  return value.toLocaleString('pt-BR', { maximumFractionDigits })
}
