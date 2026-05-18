export interface Prospect {
  id: string
  businessId: string
  contactName?: string
  phone?: string
  email?: string
  notes?: string
  status: 'new' | 'contacted' | 'accepted' | 'rejected'
  createdAt: string
}

export interface Click {
  id: string
  businessId: string
  itemId: string
  source: 'storefront' | 'shared_link' | 'whatsapp' | 'demo'
  referrer?: string
  createdAt: string
}
