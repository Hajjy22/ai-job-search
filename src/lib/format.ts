export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function invoiceTotals(
  items: { quantity: number; unit_price: number }[],
  taxRate: number
): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0),
    0
  )
  const tax = subtotal * (Number(taxRate || 0) / 100)
  return { subtotal, tax, total: subtotal + tax }
}

export function isOverdue(invoice: { status: string; due_date: string }): boolean {
  return (
    (invoice.status === 'sent' || invoice.status === 'overdue') &&
    new Date(invoice.due_date + 'T23:59:59') < new Date()
  )
}

export function statusLabel(invoice: { status: string; due_date: string }): string {
  if (isOverdue(invoice)) return 'overdue'
  return invoice.status
}
