import api from '@/core/api/axios'
import type { ServerTableResponse } from '@/core/types/data-table.types'
import type { Product } from '@/core/types/product.types'

export interface ProductVariantPayload {
  sku: string
  name?: string
  is_default?: boolean
  base_unit_id: number
  barcode?: string
  cost: number
  default_price: number
  additional_units: Array<{
    unit_id: number
    conversion_value: number
    barcode?: string
    cost: number
    default_price: number
  }>
  images?: File[]
}

export interface ProductPayload {
  type: 'product' | 'service'
  name: string
  description?: string
  brand_id: number | null
  category_ids: number[]
  supplier_ids?: number[]
  track_stock: boolean
  is_taxable: boolean
  tax_rate: number | null
  min_stock: number | null
  weight: number | null
  is_active?: boolean
  sku?: string
  base_unit_id?: number
  barcode?: string
  cost?: number
  default_price?: number
  variants?: ProductVariantPayload[]
}

function appendFormValue(formData: FormData, key: string, value: unknown) {
  if (value === undefined) return
  if (value instanceof File) {
    formData.append(key, value)
    return
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => appendFormValue(formData, `${key}[${index}]`, item))
    return
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([childKey, childValue]) => appendFormValue(formData, `${key}[${childKey}]`, childValue))
    return
  }
  formData.append(
    key,
    value === null ? '' : typeof value === 'boolean' ? (value ? '1' : '0') : String(value),
  )
}

function toProductFormData(payload: Partial<ProductPayload>, images: File[], removeImageIds: number[] = []) {
  const formData = new FormData()
  const emptyArrays: string[] = []
  Object.entries(payload).forEach(([key, value]) => {
    if (Array.isArray(value) && value.length === 0) {
      emptyArrays.push(key)
      return
    }
    appendFormValue(formData, key, value)
  })
  emptyArrays.forEach((key, index) => formData.append(`__empty_arrays[${index}]`, key))
  images.forEach((file, index) => formData.append(`images[${index}]`, file))
  removeImageIds.forEach((id, index) => formData.append(`remove_image_ids[${index}]`, String(id)))
  return formData
}

export const productService = {
  async getData(params?: Record<string, unknown>) {
    const { data } = await api.get<ServerTableResponse<Product>>('/products', { params })
    return data
  },
  async show(id: number) {
    const { data } = await api.get<{ data: Product }>(`/products/${id}`)
    return data.data
  },
  async store(payload: ProductPayload) {
    const { data } = await api.post<{ data: Product }>('/products', payload)
    return data.data
  },
  async storeWithImages(payload: ProductPayload, images: File[]) {
    const { data } = await api.post<{ data: Product }>('/products', toProductFormData(payload, images))
    return data.data
  },
  async update(id: number, payload: Partial<ProductPayload>) {
    const { data } = await api.patch<{ data: Product }>(`/products/${id}`, payload)
    return data.data
  },
  async updateWithImages(id: number, payload: Partial<ProductPayload>, images: File[], removeImageIds: number[]) {
    const formData = toProductFormData(payload, images, removeImageIds)
    const { data } = await api.post<{ data: Product }>(`/products/${id}`, formData)
    return data.data
  },
  async delete(id: number) {
    return api.delete(`/products/${id}`)
  },
  async addVariant(productId: number, payload: ProductVariantPayload) {
    const formData = new FormData()
    Object.entries(payload).forEach(([key, value]) => appendFormValue(formData, key, value))
    const { data } = await api.post<{ data: Product }>(`/products/${productId}/variants`, formData)
    return data.data
  },
  async updateVariantImages(productId: number, variantId: number, images: File[] = [], removeImageIds: number[] = []) {
    const formData = new FormData()
    images.forEach((file, index) => formData.append(`images[${index}]`, file))
    removeImageIds.forEach((id, index) => formData.append(`remove_image_ids[${index}]`, String(id)))
    formData.append('_method', 'PATCH')
    const { data } = await api.post<{ data: Product }>(`/products/${productId}/variants/${variantId}`, formData)
    return data.data
  },
  async addVariantUnit(variantId: number, payload: { unit_id: number; conversion_value: number; barcode?: string; cost: number; default_price: number }) {
    const { data } = await api.post<{ data: unknown }>(`/variants/${variantId}/units`, payload)
    return data.data
  },
  async updateVariantUnit(variantUnitId: number, payload: { conversion_value: number; barcode?: string | null; cost: number; default_price: number }) {
    const { data } = await api.patch<{ data: unknown }>(`/variant-units/${variantUnitId}`, payload)
    return data.data
  },
  async deleteVariantUnit(variantUnitId: number) {
    return api.delete(`/variant-units/${variantUnitId}`)
  },
  async deactivateVariant(productId: number, variantId: number) {
    return api.delete(`/products/${productId}/variants/${variantId}`)
  },
  async setVariantActive(productId: number, variantId: number, is_active: boolean) {
    const { data } = await api.patch<{ data: Product }>(`/products/${productId}/variants/${variantId}`, { is_active })
    return data.data
  },
  async priceLists() {
    const { data } = await api.get<{ data: Array<{ id: number; name: string; code?: string | null; is_default: boolean; is_active: boolean }> }>('/price-lists')
    return data.data
  },
  async createPriceList(payload: { name: string; code?: string; is_default: boolean }) {
    const { data } = await api.post<{ data: { id: number; name: string; code?: string | null; is_default: boolean; is_active: boolean } }>('/price-lists', payload)
    return data.data
  },
  async createUnitPrice(variantUnitId: number, payload: { price_list_id: number | null; branch_id: number | null; min_qty: number; price: number; pricing_mode: 'fixed' | 'margin' | 'follow_center'; reason?: string }) {
    const { data } = await api.post<{ data: unknown }>(`/variant-units/${variantUnitId}/prices`, payload)
    return data.data
  },
  async deleteUnitPrice(variantUnitId: number, priceId: number) {
    return api.delete(`/variant-units/${variantUnitId}/prices/${priceId}`)
  },
  async includeVariantAtBranch(branchId: number, variantId: number, overrideType: 'include' | 'exclude') {
    const { data } = await api.put<{ data: unknown }>(`/branches/${branchId}/product-overrides/${variantId}`, { override_type: overrideType })
    return data.data
  },
  async clearVariantBranchOverride(branchId: number, variantId: number) {
    return api.delete(`/branches/${branchId}/product-overrides/${variantId}`)
  },
  async productAvailabilityAtBranch(branchId: number) {
    const { data } = await api.get<{ data: Array<{ product_variant_id: number; sku: string; source: string | null; override_type: 'include' | 'exclude' | null; is_available: boolean }> }>(`/branches/${branchId}/product-availability`)
    return data.data
  },
}
