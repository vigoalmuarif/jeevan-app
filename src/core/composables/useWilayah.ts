// core/composables/useWilayah.ts
import { ref } from 'vue'
import type { WilayahKelurahan } from '../types/wilayah.types'
import { wilayahService } from '../services/wilayah.service'

export interface WilayahSelected {
  village_code: string | null
  village_name: string | null
  district_code: string | null
  district_name: string | null
  regency_code: string | null
  regency_name: string | null
  province_code:  string | null
  province_name:  string | null
}

export function useWilayah(initialKelurahan?: WilayahKelurahan | null) {
  const selected = ref<WilayahSelected>({
    village_code: initialKelurahan?.village_code ?? null,
    village_name: initialKelurahan?.village_name ?? null,
    district_code: initialKelurahan?.district_code ?? null,
    district_name: initialKelurahan?.district_name ?? null,
    regency_code: initialKelurahan?.regency_code ?? null,
    regency_name: initialKelurahan?.regency_name ?? null,
    province_code:  initialKelurahan?.province_code  ?? null,
    province_name:  initialKelurahan?.province_name  ?? null,
  })

  // Dipanggil saat user pilih dari combobox
  function onKelurahanSelect(option: WilayahKelurahan | null) {
    if (!option) {
      reset()
      return
    }

    selected.value = {
      village_code: option.village_code,
      village_name: option.village_name,
      district_code: option.district_code,
      district_name: option.district_name,
      regency_code: option.regency_code,
      regency_name: option.regency_name,
      province_code:  option.province_code,
      province_name:  option.province_name,
    }
  }

  function reset() {
    selected.value = {
      village_code: null,
      village_name: null,
      district_code: null,
      district_name: null,
      regency_code: null,
      regency_name: null,
      province_code:  null,
      province_name:  null,
    }
  }

  return {
    selected,
    fetcher: wilayahService.searchKelurahan,
    onKelurahanSelect,
    reset,
  }
}