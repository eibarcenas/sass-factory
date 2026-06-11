import { BusinessType } from '@eguru/core'

export const BUSINESS_NAME_MAX_LENGTH = 20

export const BUSINESS_TYPES: { key: BusinessType; label: string; emoji: string }[] = [
  { key: BusinessType.Heladeria,   label: 'Heladería',   emoji: '🍦' },
  { key: BusinessType.Barberia,    label: 'Barbería',    emoji: '💈' },
  { key: BusinessType.Estetica,    label: 'Estética',    emoji: '💅' },
  { key: BusinessType.Restaurante, label: 'Restaurante', emoji: '🍽️' },
  { key: BusinessType.Panaderia,   label: 'Panadería',   emoji: '🥐' },
  { key: BusinessType.Gym,         label: 'Gimnasio',    emoji: '💪' },
  { key: BusinessType.Mecanico,    label: 'Mecánico',    emoji: '🔧' },
  { key: BusinessType.Otro,        label: 'Otro',        emoji: '🏪' },
]

export const TYPE_LABELS: Record<string, string> = {
  heladeria: 'Heladería', barberia: 'Barbería', estetica: 'Estética',
  restaurante: 'Restaurante', panaderia: 'Panadería', gym: 'Gimnasio',
  mecanico: 'Mecánico', otro: 'Otro',
}

export const MEXICO_STATES = [
  'Ciudad de México', 'Estado de México', 'Jalisco', 'Nuevo León', 'Puebla',
  'Guanajuato', 'Chihuahua', 'Baja California', 'Veracruz', 'Sonora',
  'Tamaulipas', 'Coahuila', 'Michoacán', 'Oaxaca', 'Chiapas',
  'Guerrero', 'Hidalgo', 'Sinaloa', 'San Luis Potosí', 'Tabasco',
  'Yucatán', 'Querétaro', 'Morelos', 'Durango', 'Zacatecas',
  'Aguascalientes', 'Quintana Roo', 'Tlaxcala', 'Nayarit', 'Campeche',
  'Colima', 'Baja California Sur',
]
