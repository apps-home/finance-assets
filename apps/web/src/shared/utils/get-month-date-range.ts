/**
 * Retorna o primeiro e último dia de um mês no formato YYYYMMDD
 * para uso na API de cotações
 */
export function getMonthDateRange(month: number, year: number) {
	// Primeiro dia do mês
	const startDate = new Date(year, month - 1, 1)

	// Último dia do mês (dia 0 do próximo mês = último dia do mês atual)
	const endDate = new Date(year, month, 0)

	const formatDate = (date: Date) => {
		const y = date.getFullYear()
		const m = String(date.getMonth() + 1).padStart(2, '0')
		const d = String(date.getDate()).padStart(2, '0')
		return `${y}${m}${d}`
	}

	return {
		startDate: formatDate(startDate),
		endDate: formatDate(endDate)
	}
}
