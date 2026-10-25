export interface Unit {
    id: number
    merchant_id: number
    name: string
    code: string
    is_system: boolean
    is_active: boolean
}

export interface Category {
    id: number
    merchant_id: number
    name: string
    code: string
    slug: string
    description: string
    is_active: boolean
}

export interface Brand {
    id: number
    merchant_id: number
    name: string
    is_active: boolean
}

export interface ProductUnitPrice {
    id: number
    price_list_id: number | null
    branch_id: number | null
    min_qty: number
    price: number
    pricing_mode: 'fixed' | 'margin' | 'follow_center'
    reason?: string | null
    is_active: boolean
}

export interface ProductVariantUnit {
    id: number
    unit: Pick<Unit, 'id' | 'name' | 'code'>
    conversion_value: number
    is_base: boolean
    barcode?: string | null
    cost: number
    default_price: number
    prices: ProductUnitPrice[]
}

export interface ProductVariant {
    id: number
    sku: string
    name?: string | null
    is_default: boolean
    is_active: boolean
    units: ProductVariantUnit[]
    images: ProductImage[]
}

export interface ProductUnitConversion {
    unit: Pick<Unit, 'id' | 'name' | 'code'>
    conversion_value: number
    is_base: boolean
}

export interface Product {
    id: number
    type: 'product' | 'service'
    name: string
    slug: string
    description?: string | null
    brand?: Pick<Brand, 'id' | 'name'> | null
    categories: Array<Pick<Category, 'id' | 'name'> & { is_primary?: boolean }>
    suppliers?: Array<{ id: number; name: string }>
    track_stock: boolean
    is_taxable: boolean
    tax_rate?: number | string | null
    min_stock?: number | string | null
    weight?: number | string | null
    is_active: boolean
    units?: ProductUnitConversion[]
    variants: ProductVariant[]
    images: ProductImage[]
    created_at?: string
    updated_at?: string
}

export interface ProductImage {
    id: number
    url: string
    original_name: string | null
    sort_order: number
}
