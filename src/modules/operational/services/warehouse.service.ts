import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type { WarehouseInfo, WarehousePayload } from '@/core/types/warehouse.types'

export const warehouseService = {
  async getData() {
    const { data } = await api.get<ServerTableResponse<WarehouseInfo>>('/warehousees')
    return data
  },

  async store(payload: WarehousePayload) {
    const { data } = await api.post<{ data: WarehouseInfo}>(`/warehouses`, payload)
    return data
  },

  async edit(id: string) {
    const { data } = await api.get<{ data: WarehouseInfo}>(`/warehouses/${id}/edit`)
    return data
  },

  async update(payload: WarehousePayload, id: string) {
    const { data } = await api.patch<{ data: WarehouseInfo }>(`/warehouses/${id}`, payload)
    return data
  },

  async delete(id: number) {
    const { data } = await api.delete(`/brands/${id}`)
    return data
  },

}