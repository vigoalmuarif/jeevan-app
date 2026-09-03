import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type { Brand } from '@/core/types/product.types'

export const brandService = {
  async getData() {
    const { data } = await api.get<ServerTableResponse<Brand>>('/brands')
    return data
  },

  async store(payload: { name: string }) {
    const { data } = await api.post<{ data: Brand}>('/brands', payload)
    return data
  },

  async update(payload: { name: string, is_active: boolean }, id: number) {
    const { data } = await api.patch<{ data: Brand}>(`/brands/${id}`, payload)
    return data
  },

  async delete(id: number) {
    const { data } = await api.delete(`/brands/${id}`)
    return data
  },

}