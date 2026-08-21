export const formatCurrencyInput = (value: string): string => {
	const numbers = value.replace(/\D/g, '')

	const cents = parseInt(numbers, 10) || 0

	const reais = (cents / 100).toFixed(2)

	const [integerPart, decimalPart] = reais.split('.')
	const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

	return `${formattedInteger},${decimalPart}`
}
