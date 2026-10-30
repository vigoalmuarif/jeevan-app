

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
    is_primary: boolean
  }[]
  regions?: {
    id: number
    name: string
    code: string
    type: string
  }[]
  region_ids?: number[]
  metadata: unknown
  created_at: string
  updated_at: string
}

export interface WarehousePayload {
  name: string
  code: string
  type?: string
  phone: string
  address: string
  is_active: boolean
  region_ids: number[]
}

export interface WarehouseOption {
  id: number
  name: string
  code: string
  is_active: boolean
  region_ids: number[]
  owner_branch_id?: number | null
  owner_branch_name?: string | null
  owner_branch_code?: string | null
}
