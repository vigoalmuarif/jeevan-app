import type { WarehouseInfo } from "./warehouse.types"
import type { Wilayah } from "./wilayah.types"


export interface BranchInfo {
  id: number
  merchant_id: number
  name: string
  slug: string
  code: string
  email: string
  phone: string
  logo: string
  is_main: boolean
  is_active: boolean
  region: {
    id: string
    name: string
    code: string
    type: string
  }
  address: {
    street: string
    postal_code: string
    village: Wilayah
    district: Wilayah
    regency: Wilayah
    province: Wilayah
  }
  warehouses_count?: number
  main_warehouse?: WarehouseInfo
  warehouses?: WarehouseInfo[]
  metadata?: unknown
  created_at?: string
  updated_at?: string
}

export interface BranchStorePayload {
  name: string
  code: string
  email: string
  phone: string
  address: string
  village_code:  string | number
  district_code:  string | number
  regency_code:  string | number
  province_code:  string | number
  postal_code:string
  is_active: boolean
  warehouse_code:  string
  warehouse_name:  string
  is_same_address:  boolean
  warehouse_address: string

}

export interface BranchPayload {
  name: string
  code: string
  email: string
  phone: string
  address: string
  village_code:  string | number
  district_code:  string | number
  regency_code:  string | number
  province_code:  string | number
  postal_code:string
  is_main: boolean
  is_active: boolean
}

export interface BranchEditResponse {
  name: string
  code: string
  email: string
  phone: string
  postal_code:string
  is_main: boolean
  is_active: boolean
  address: {
    street: string
    postal_code: string
    village: Wilayah
    district: Wilayah
    regency: Wilayah
    province: Wilayah
  }
}



export interface BranchOperational {
  timezone: string
  transaction_prefix: string
  hours: Record<string, { open: string; close: string; is_closed: boolean }>
}

export interface BranchUser {
  id: number
  name: string
  username: string
  email: string
  phone: string
  status: string
  roles: string[]
}

export interface BranchWarehouse {
  id: number
  code: string
  name: string
  is_main: boolean
  is_active: boolean
}

export interface BranchResources {
  users: BranchUser[]
  warehouses: BranchWarehouse[]
}

export interface BranchSnapshot {
  today_transactions: number
  today_revenue: number
  month_transactions: number
  month_revenue: number
}

export interface BranchCombobox{
  id: number
  name: string
  code: string
}

// Enum tab untuk konsistensi — hindari magic string
export type BranchDetailTab = 'profile' | 'operational' | 'resources' | 'snapshot'