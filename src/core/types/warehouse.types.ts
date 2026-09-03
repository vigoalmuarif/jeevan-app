

export interface WarehouseInfo {
  id: number
  merchant_id: number
  name: string
  code: string
  type: string
  phone: string
  address: string
  is_main: boolean
  is_active: boolean
  branches?: {
    id: number
    name: string
    code: string
  }
  metadata: unknown
  created_at: string
  updated_at: string
}

export interface WarehousePayload {
  branch_id: number | undefined
  name: string
  code: string
  type?: string
  phone: string
  address: string
  is_main: boolean
  is_active: boolean
}