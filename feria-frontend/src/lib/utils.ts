export const formatCOP = (amount: string | number): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return `$${n.toLocaleString('es-CO')}`
}

export const parseAmount = (amount: string | number): number =>
  typeof amount === 'string' ? parseFloat(amount) : amount
