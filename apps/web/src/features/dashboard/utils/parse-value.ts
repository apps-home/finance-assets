export const parseValue = (value: string): number => {
	const cleaned = value.replace(/\./g, '').replace(',', '.')
	return Number.parseFloat(cleaned) || 0
}
