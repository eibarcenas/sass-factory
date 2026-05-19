export interface Item {
  id: string
  businessId: string
  name: string
  price: number
  currency: 'MXN'
  description?: string
  image?: string
  category?: string
  visible: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  businessId: string
  name: string
  order: number
}
