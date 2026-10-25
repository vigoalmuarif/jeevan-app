import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type {
  GoodsReceipt,
  GoodsReceiptListItem,
  GoodsReceiptOptions,
  GoodsReceiptPayload,
  GoodsReceiptProductOption,
} from '../types/goods-receipt.types'
import type { ComboboxFetcher } from '@/core/composables/useComboBox'

export const goodsReceiptService = {
  async getOptions() {
    const { data } = await api.get<{ data: GoodsReceiptOptions }>('/goods-receipts/options')
    return data.data
  },

  searchProductUnits: (async (search, params, requestOptions) => {
    const { data } = await api.get<{ data: GoodsReceiptProductOption[] }>(
      '/goods-receipts/product-units',
      { params: { search, per_page: 30, ...params }, ...requestOptions },
    )
    return data.data.map(option => ({
      ...option,
      selection: String(option.product_variant_id),
      label: `${option.product_name}${option.variant_name ? ` / ${option.variant_name}` : ''} · SKU ${option.sku}`,
    }))
  }) satisfies ComboboxFetcher,

  async show(id: number) {
    const { data } = await api.get<{ data: GoodsReceipt }>(`/goods-receipts/${id}`)
    return data.data
  },

  async store(payload: GoodsReceiptPayload) {
    const { data } = await api.post<{ data: GoodsReceipt }>('/goods-receipts', payload)
    return data.data
  },

  async update(id: number, payload: GoodsReceiptPayload) {
    const { data } = await api.patch<{ data: GoodsReceipt }>(`/goods-receipts/${id}`, payload)
    return data.data
  },

  async delete(id: number) {
    return api.delete(`/goods-receipts/${id}`)
  },

  async post(id: number) {
    const { data } = await api.post<{ data: GoodsReceipt }>(`/goods-receipts/${id}/post`)
    return data.data
  },

  async void(id: number, voidReason: string) {
    const { data } = await api.post<{ data: GoodsReceipt }>(`/goods-receipts/${id}/void`, { void_reason: voidReason })
    return data.data
  },

  async getData() {
    const { data } = await api.get<ServerTableResponse<GoodsReceiptListItem>>('/goods-receipts')
    return data
  },
}
