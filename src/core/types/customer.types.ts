export interface CustomerListItem {
  id: number
  code: string
  name: string
  type: 'individual' | 'company'
  contact_person: string | null
  phone: string | null
  email: string | null
  customer_group_id: number | null
  region_id: number | null
  credit_limit: number | string
  payment_term_days: number
  is_active: boolean
}

export interface CustomerCreatePayload {
  name: string
  type: 'individual' | 'company'
  contact_person: string
  phone: string
  email: string
  tax_id: string
  address: string
  postal_code: string
  credit_limit: number
  payment_term_days: number
  notes: string
  is_active: boolean
}

export interface CustomerDetail extends CustomerListItem {
  tax_id: string | null
  address: string | null
  postal_code: string | null
  notes: string | null
  created_at?: string | null
  updated_at?: string | null
}
