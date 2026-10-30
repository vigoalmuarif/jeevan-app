import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type { ComboboxFetcher } from '@/core/composables/useComboBox'
import type { StockTransfer, StockTransferOptions, StockTransferPayload, StockTransferProductOption, StockTransferListItem } from '../types/stock-transfer.types'

export const stockTransferService = {
  async getOptions() {
    const { data } = await api.get<{ data: StockTransferOptions }>('/stock-transfers/options')
    return data.data
  },

  searchProductOptions: (async (search, params, options) => {
    const { data } = await api.get<{ data: StockTransferProductOption[] }>('/stock-transfers/product-options', {
      params: { search, ...params }, ...options,
    })
    return data.data
  }) satisfies ComboboxFetcher,

  async show(id: number) {
    const { data } = await api.get<{ data: StockTransfer }>(`/stock-transfers/${id}`)
    return data.data
  },
  async store(payload: StockTransferPayload) {
    const { data } = await api.post<{ data: StockTransfer }>('/stock-transfers', payload)
    return data.data
  },
  async update(id: number, payload: StockTransferPayload) {
    const { data } = await api.patch<{ data: StockTransfer }>(`/stock-transfers/${id}`, payload)
    return data.data
  },
  async delete(id: number) { return api.delete(`/stock-transfers/${id}`) },
  async ship(id: number) {
    const { data } = await api.post<{ data: StockTransfer }>(`/stock-transfers/${id}/ship`)
    return data.data
  },
  async receive(id: number, received: Record<number, number | string>, receive_notes: string | null) {
    const { data } = await api.post<{ data: StockTransfer }>(`/stock-transfers/${id}/receive`, { received, receive_notes })
    return data.data
  },
  async cancel(id: number, reason: string) {
    const { data } = await api.post<{ data: StockTransfer }>(`/stock-transfers/${id}/cancel`, { reason })
    return data.data
  },
  async getInTransit() {
    const { data } = await api.get<{ data: StockTransfer[] }>('/stock-transfers/in-transit')
    return data.data
  },
  async getData() {
    const { data } = await api.get<ServerTableResponse<StockTransferListItem>>('/stock-transfers')
    return data
  },
}
