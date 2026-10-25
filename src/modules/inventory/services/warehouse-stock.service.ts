import api from '@/core/api/axios'
import type { WarehouseStockFilterOptions, WarehouseStockListItem } from '@/core/types/warehouse-stock.types'
import type { ServerTableResponse } from '@/core/types/data-table.types'

export const warehouseStockService = {
  async getFilterOptions() {
    const { data } = await api.get<{ data: WarehouseStockFilterOptions }>('/warehouse-stocks/options')
    return data.data
  },

  async getData() {
    const { data } = await api.get<ServerTableResponse<WarehouseStockListItem>>('/warehouse-stocks')
    return data
  },
}
