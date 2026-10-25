import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type { CustomerCreatePayload, CustomerDetail, CustomerListItem } from '@/core/types/customer.types'

export const customerService = {
  async getData() {
    const { data } = await api.get<ServerTableResponse<CustomerListItem>>('/partner/customers')
    return data
  },

  async store(payload: CustomerCreatePayload) {
    const { data } = await api.post<{ data: CustomerListItem }>('/partner/customers', payload)
    return data.data
  },

  async edit(id: number | string) {
    const { data } = await api.get<{ data: CustomerDetail }>(`/partner/customers/${id}/edit`)
    return data.data
  },

  async show(id: number | string) {
    const { data } = await api.get<{ data: CustomerDetail }>(`/partner/customers/${id}`)
    return data.data
  },

  async update(id: number | string, payload: CustomerCreatePayload) {
    const { data } = await api.patch<{ data: CustomerDetail }>(`/partner/customers/${id}`, payload)
    return data.data
  },

  async delete(id: number | string) {
    const { data } = await api.delete(`/partner/customers/${id}`)
    return data
  },
}
