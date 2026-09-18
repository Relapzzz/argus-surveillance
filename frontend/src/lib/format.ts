import type { EntityType } from '@/api/types'

const zone = { timeZone: 'Asia/Kolkata' }
const dateFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', ...zone })
const dayFormat = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', ...zone })
const timeFormat = new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, ...zone })
const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const counter = new Intl.NumberFormat('en-IN')

export const parseTime = (value: string) => new Date(/([+-]\d\d:\d\d|Z)$/.test(value) ? value : value + '+05:30')
export const formatDate = (value: string) => dateFormat.format(parseTime(value))
export const formatDay = (value: string | Date) => dayFormat.format(typeof value === 'string' ? parseTime(value) : value)
export const formatTime = (value: string) => timeFormat.format(parseTime(value))
export const formatDateTime = (value: string) => `${formatDate(value)}, ${formatTime(value)}`
export const formatInr = (amount: number) => rupees.format(amount)
export const formatCount = (n: number) => counter.format(n)
export const formatPhone = (number: string) => /^\d{10}$/.test(number) ? `${number.slice(0, 5)} ${number.slice(5)}` : number
export const formatPlate = (plate: string) => plate.replace(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/, '$1 $2 $3 $4')
export const formatLabel = (type: EntityType, label: string) => type === 'phone' ? formatPhone(label) : type === 'vehicle' ? formatPlate(label) : label
export const plural = (n: number, one: string, many = one + 's') => `${formatCount(n)} ${n === 1 ? one : many}`
