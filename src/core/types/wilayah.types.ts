import type { ComboboxOption } from '@/core/composables/useComboBox'

export interface Wilayah extends ComboboxOption {
  kode: string
  nama: string
}

export interface WilayahAncestors {
  province:  Wilayah | null
  regency: Wilayah | null
  district: Wilayah | null
  village: Wilayah | null
}

export interface WilayahForm {
  province_code:  string | null
  regency_code: string | null
  district_code: string | null
  village_code: string | null
}

export interface WilayahKelurahan extends ComboboxOption {
  label?: string   // "Menteng, Menteng, Jakarta Pusat, DKI Jakarta"
  village_code: string
  village_name: string
  district_code: string
  district_name: string
  regency_code: string
  regency_name: string
  province_code:  string
  province_name:  string
}
