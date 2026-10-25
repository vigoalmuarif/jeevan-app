import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type { StockMutationFilterOptions, StockMutationListItem } from '@/core/types/stock-mutation.types'

export const stockMutationService = {
  async getData() {
    const { data } = await api.get<ServerTableResponse<StockMutationListItem>>('/stock-mutations')
    return data
  },

  async getFilterOptions() {
    const { data } = await api.get<{ data: StockMutationFilterOptions }>('/stock-mutations/options')
    return data.data
  },
}
