import type { BranchInfo } from "./branch.types"
import type { MerchantInfo } from "./merchant.types"

export interface AuthUser {
  id: number
  name: string
  username: string
  email: string
  phone: string | null
  avatar: string
}

export interface AuthMerchant {
  id: number
  industry_package_code: string
  name: string
  logo: string
}

export interface AuthBranch {
  id: number
  code: string
  name: string
}

// AuthSubscription alias
export type AuthSubscription = AuthSubrcription

export interface AuthSubrcription {
  name: string
  status: string
  current_period_start: string
  current_period_end: string
}

export interface SessionResponse {
  needs_setup_wizard: boolean
  user: AuthUser
  merchant: AuthMerchant
  active_branch: AuthBranch
  industry_name: string
  is_all_branches: boolean
  subscription: AuthSubrcription
  roles: string[]
  permissions: string[]
  modules: string[]
}

export interface LoginPayload {
  username: string // email atau username
  password: string
}

export interface RegisterPayload {
  name: string
  phone: string
  email: string
  username: string
  password: string
  password_confirmation: string
}

export interface IndustryPackage {
  code: string
  name: string
}

export interface ApiValidationError {
  message: string
  errors: Record<string, string[]>
}