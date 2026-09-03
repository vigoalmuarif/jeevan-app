import type { BranchInfo } from "./branch.types";

export interface MerchantInfo {
  id: number;
  ulid: string;
  name: string;
  industry_package_code: string;
  email: string;
  phone: string;
  address: string
  city: string
  province: string
  country: string
  postal_code:number
  logo: string
  timezone: string
  currency: string
  locale: string
  status: string
  metadata: unknown
  created_at: string
  updated_at: string
}

export interface MerchantRegister {
    name: string
    industry_package_code: string
}

export interface MerchantRegisterResponse {
    merchant: MerchantInfo
    active_branch: BranchInfo
}