export interface Region{
    id: number
    parent_region_id: number | null
    parent?: Pick<Region, 'id' | 'name' | 'code' | 'type'> | null
    code: string
    name: string
    type: string
    is_active: boolean
}

export interface RegionPayload {
    parent_region_id: number | null
    code: string
    name: string
    type: 'province' | 'city' | 'custom'
    is_active: boolean
}