import api, { ensureCsrfCookie } from '@/core/api/axios'
import type {
  LoginPayload,
  SessionResponse,
  IndustryPackage,
} from '@/core/types/auth.types'
import type {  MerchantRegister, MerchantRegisterResponse } from '@/core/types/merchant.types'

export const merchantService = {
  async register(payload: MerchantRegister) {
    const { data } = await api.post<{ data: MerchantRegisterResponse }>('/merchant/store', payload)
    return data
  },

  async login(payload: LoginPayload) {
    await ensureCsrfCookie()
    const { data } = await api.post<SessionResponse>('/auth/login', payload)
    return data
  },

  async me() {
    const { data } = await api.get<SessionResponse>('/auth/me')
    return data
  },

  async logout() {
    return api.post('/auth/logout')
  },

  async getIndustryPackages() {
    const { data } = await api.get<{ data: IndustryPackage[] }>('/industry-packages')
    return data.data
  },
}