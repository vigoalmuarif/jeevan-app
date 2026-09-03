import api, { ensureCsrfCookie } from '@/core/api/axios'
import type {
  LoginPayload,
  RegisterPayload,
  SessionResponse,
  IndustryPackage,
} from '@/core/types/auth.types'

export const authService = {
  async register(payload: RegisterPayload) {
    await ensureCsrfCookie()
    return api.post('/auth/register', payload)
  },

  async login(payload: LoginPayload) {
    await ensureCsrfCookie()
    const { data } = await api.post<{ data: SessionResponse }>('/auth/login', payload)
    return data
  },

  async me() {
    const { data } = await api.get<{ data: SessionResponse }>('/auth/me')
    return data
  },

  async logout() {
    return api.post('/auth/logout')
  },

  async getIndustryPackages() {
    const { data } = await api.get<{ data: IndustryPackage[] }>('/industry-packages')
    return data
  },
}