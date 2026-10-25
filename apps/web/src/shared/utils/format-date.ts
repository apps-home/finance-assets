// Datas de calendário (ex.: pagamento de proventos) chegam como 00:00 UTC.
// Formatar em UTC evita exibir o dia anterior em fusos negativos (Brasil).
export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
    new Date(value)
  )
}

/** Converte a data para o valor de um `<input type="date">` (YYYY-MM-DD) */
export function toDateInputValue(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10)
}
