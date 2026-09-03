import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type { BranchEditResponse, BranchInfo, BranchPayload, BranchStorePayload, BranchCombobox } from '@/core/types/branch.types'
import type { Region } from '@/core/types/region.types'

export const regionService = {
  async getData() {
    const { data } = await api.get<ServerTableResponse<Region>>('/regions')
    return data
  },

  async store(payload: BranchStorePayload) {
    const { data } = await api.post<{ data: BranchInfo}>('/branches', payload)
    return data
  },

  async edit(slug: string) {
    const { data } = await api.get<{ data: BranchEditResponse}>(`/branches/${slug}/edit`)
    return data
  },

  async update(payload: BranchPayload, slug: string) {
    const { data } = await api.patch<{ data: BranchPayload }>(`/branches/${slug}`, payload)
    return data
  },

  async delete(id: number) {
    const { data } = await api.delete(`/branches/${id}`)
    return data
  },

}