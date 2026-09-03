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