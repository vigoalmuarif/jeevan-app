import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type { ComboboxFetcher } from '@/core/composables/useComboBox'
import type { StockAdjustment, StockAdjustmentFilterOptions, StockAdjustmentListItem, StockAdjustmentPayload, StockAdjustmentProductOption } from '../types/stock-adjustment.types'

export const stockAdjustmentService = {
  async getFilterOptions() {
    const { data } = await api.get<{ data: StockAdjustmentFilterOptions }>('/stock-adjustments/options')
    return data.data
  },

  searchProductOptions: (async (search, params, options) => {
    const { data } = await api.get<{ data: StockAdjustmentProductOption[] }>('/stock-adjustments/product-options', {
      params: { search, ...params },
      ...options,
    })
    return data.data
  }) satisfies ComboboxFetcher,

  async show(id: number) {
    const { data } = await api.get<{ data: StockAdjustment }>('/stock-adjustments/' + id)
    return data.data
  },

  async store(payload: StockAdjustmentPayload) {
    const { data } = await api.post<{ data: StockAdjustment }>('/stock-adjustments', payload)
    return data.data
  },

  async update(id: number, payload: StockAdjustmentPayload) {
    const { data } = await api.patch<{ data: StockAdjustment }>(`/stock-adjustments/${id}`, payload)
    return data.data
  },

  async delete(id: number) {
    return api.delete(`/stock-adjustments/${id}`)
  },

  async post(id: number) {
    const { data } = await api.post<{ data: StockAdjustment }>(`/stock-adjustments/${id}/post`)
    return data.data
  },

  async void(id: number, voidReason: string) {
    const { data } = await api.post<{ data: StockAdjustment }>(`/stock-adjustments/${id}/void`, { void_reason: voidReason })
    return data.data
  },

  async getData() {
    const { data } = await api.get<ServerTableResponse<StockAdjustmentListItem>>('/stock-adjustments')
    return data
  },
}
