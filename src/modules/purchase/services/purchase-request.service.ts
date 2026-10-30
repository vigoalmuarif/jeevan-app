import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type {
  ApprovedPurchaseRequestItem,
  ConvertPurchaseRequestPayload,
  PurchaseRequest,
  PurchaseRequestListItem,
  PurchaseRequestOptions,
  PurchaseRequestPayload,
} from '../types/purchase-request.types'
import type { PurchaseOrderListItem } from '../types/purchase-order.types'
import type { ComboboxFetcher } from '@/core/composables/useComboBox'

export type ApprovedItemsFilter = {
  purchase_request_id?: number | null
  warehouse_id?: number | null
  branch_id?: number | null
  product_variant_id?: number | null
}

export const purchaseRequestService = {
  async getOptions() {
    const { data } = await api.get<PurchaseRequestOptions>('/purchase-requests/options')
    return data
  },

  async getApprovedItems(filters: ApprovedItemsFilter = {}) {
    const { data } = await api.get<{ data: ApprovedPurchaseRequestItem[] }>('/purchase-requests/approved-items', {
      params: filters,
    })
    return data.data
  },

  searchApprovedItemFilterOptions: (async (search, params, requestOptions) => {
    const { data } = await api.get<{ data: Array<{ id: number; label: string }> }>(
      '/purchase-requests/approved-items/options',
      { params: { search, ...params }, ...requestOptions },
    )
    return data.data
  }) satisfies ComboboxFetcher,

  async show(id: number) {
    const { data } = await api.get<PurchaseRequest>(`/purchase-requests/${id}`)
    return data
  },

  async store(payload: PurchaseRequestPayload) {
    const { data } = await api.post<PurchaseRequest>('/purchase-requests', payload)
    return data
  },

  async update(id: number, payload: PurchaseRequestPayload) {
    const { data } = await api.put<PurchaseRequest>(`/purchase-requests/${id}`, payload)
    return data
  },

  async delete(id: number) {
    return api.delete(`/purchase-requests/${id}`)
  },

  async submit(id: number) {
    const { data } = await api.post<PurchaseRequest>(`/purchase-requests/${id}/submit`)
    return data
  },

  async approve(id: number) {
    const { data } = await api.post<PurchaseRequest>(`/purchase-requests/${id}/approve`)
    return data
  },

  async reject(id: number, reason: string) {
    const { data } = await api.post<PurchaseRequest>(`/purchase-requests/${id}/reject`, { reason })
    return data
  },

  async cancel(id: number, reason: string) {
    const { data } = await api.post<PurchaseRequest>(`/purchase-requests/${id}/cancel`, { reason })
    return data
  },

  async close(id: number) {
    const { data } = await api.post<PurchaseRequest>(`/purchase-requests/${id}/close`)
    return data
  },

  async convertToOrders(payload: ConvertPurchaseRequestPayload) {
    const { data } = await api.post<{ message: string; data: PurchaseOrderListItem[] }>(
      '/purchase-requests/convert-to-orders',
      payload,
    )
    return data
  },

  async getData() {
    const { data } = await api.get<ServerTableResponse<PurchaseRequestListItem>>('/purchase-requests')
    return data
  },
}
