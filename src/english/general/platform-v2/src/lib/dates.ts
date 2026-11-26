/** 本地时区的 YYYY-MM-DD，所有复习调度以天为单位 */
export function todayKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(key: string, days: number): string {
  const parts = key.split('-')
  const year = Number(parts[0] ?? 0)
  const month = Number(parts[1] ?? 1)
  const day = Number(parts[2] ?? 1)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return todayKey(date)
}
