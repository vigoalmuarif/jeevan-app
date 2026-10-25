import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type { Supplier, SupplierListItem, SupplierPayload, SupplierUpdatePayload } from '@/core/types/supplier.types'

export const supplierService = {
  async getData() {
    const { data } = await api.get<ServerTableResponse<SupplierListItem>>('/partner/suppliers')
    return data
  },

  async store(payload: SupplierPayload) {
    const { data } = await api.post<{ data: Supplier}>(`/partner/suppliers`, payload)
    return data
  },

  async edit(id: number | string) {
    const { data } = await api.get<{ data: Supplier}>(`/partner/suppliers/${id}/edit`)
    return data
  },

  async update(payload: SupplierUpdatePayload, id: string | number) {
    const { data } = await api.patch<{ data: Supplier }>(`/partner/suppliers/${id}`, payload)
    return data
  },

  async delete(id: number) {
    const { data } = await api.delete(`/partner/suppliers/${id}`)
    return data
  },

}