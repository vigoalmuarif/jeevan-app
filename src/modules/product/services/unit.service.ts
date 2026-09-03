import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type { Unit } from '@/core/types/product.types'

export const unitService = {
  async getData() {
    const { data } = await api.get<ServerTableResponse<Unit>>('/units')
    return data
  },

  async store(payload: {name: string, code: string}) {
    const { data } = await api.post<{ data: Unit}>('/units', payload)
    return data
  },

  async update(payload: {name: string, code: string, is_active: boolean}, id: number) {
    const { data } = await api.patch<{ data: Unit}>(`/units/${id}`, payload)
    return data
  },

  async delete(id: number) {
    const { data } = await api.delete(`/units/${id}`)
    return data
  },

}