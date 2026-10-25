import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type { Region, RegionPayload } from '@/core/types/region.types'

export const regionService = {
  async getData() {
    const { data } = await api.get<ServerTableResponse<Region>>('/regions')
    return data
  },

  async options() {
    const { data } = await api.get<{ data: Region[] }>('/regions/simple/combobox')
    return data.data
  },

  async store(payload: RegionPayload) {
    const { data } = await api.post<{ data: Region }>('/regions', payload)
    return data.data
  },

  async edit(id: number) {
    const { data } = await api.get<{ data: Region }>(`/regions/${id}/edit`)
    return data.data
  },

  async update(id: number, payload: RegionPayload) {
    const { data } = await api.patch<{ data: Region }>(`/regions/${id}`, payload)
    return data.data
  },

  async delete(id: number) {
    const { data } = await api.delete(`/regions/${id}`)
    return data
  },
}