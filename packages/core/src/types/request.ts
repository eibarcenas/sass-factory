export type RequestStatus = 'pending' | 'reviewing' | 'approved'

export type RequestItem = {
  product_id: string
  product_name: string
  quantity: number
  unit_price?: number
  total?: number
}

export type CatalogRequest = {
  id: string
  hash: string
  business_id: string
  storefront_slug: string
  items: RequestItem[]
  total?: number
  customer_message?: string
  status: RequestStatus
  created_at: string
}
