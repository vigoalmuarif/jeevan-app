// Modules/Branch/resources/composables/useBranchDetail.ts

import { ref, reactive } from 'vue'
import type {
  BranchInfo,
  BranchOperational,
  BranchResources,
  BranchSnapshot,
  BranchDetailTab,
} from '@/core/types/branch.types'
import api from '../api/axios'

export function useBranchDetail(branchId: number) {

  // -------------------------------------------------------
  // State: data per tab
  // -------------------------------------------------------
  const profile     = ref<BranchInfo | null>(null)
  const operational = ref<BranchOperational | null>(null)
  const resources   = ref<BranchResources | null>(null)
  const snapshot    = ref<BranchSnapshot | null>(null)

  // -------------------------------------------------------
  // State: loading & error per tab
  // -------------------------------------------------------
  const loading = reactive<Record<BranchDetailTab, boolean>>({
    profile:     false,
    operational: false,
    resources:   false,
    snapshot:    false,
  })

  const error = reactive<Record<BranchDetailTab, string | null>>({
    profile:     null,
    operational: null,
    resources:   null,
    snapshot:    null,
  })

  // -------------------------------------------------------
  // State: cache flag — tab mana yang sudah pernah di-fetch
  // -------------------------------------------------------
  const loaded = reactive<Record<BranchDetailTab, boolean>>({
    profile:     false,
    operational: false,
    resources:   false,
    snapshot:    false,
  })

  // -------------------------------------------------------
  // Fetch functions
  // -------------------------------------------------------
  async function fetchProfile() {
    if (loaded.profile) return  // sudah ada di cache, skip

    loading.profile = true
    error.profile   = null

    try {
      const res  = await api.get(`/branches/${branchId}`)
      profile.value  = res.data.data
      loaded.profile = true
    } catch {
      error.profile = 'Gagal memuat data cabang.'
    } finally {
      loading.profile = false
    }
  }

  async function fetchOperational() {
    if (loaded.operational) return

    loading.operational = true
    error.operational   = null

    try {
      const res = await api.get(`/branches/${branchId}/operational`)
      operational.value  = res.data.data
      loaded.operational = true
    } catch {
      error.operational = 'Gagal memuat data operasional.'
    } finally {
      loading.operational = false
    }
  }

  async function fetchResources() {
    if (loaded.resources) return

    loading.resources = true
    error.resources   = null

    try {
      const res = await api.get(`/branches/${branchId}/resources`)
      resources.value  = res.data.data
      loaded.resources = true
    } catch {
      error.resources = 'Gagal memuat sumber daya cabang.'
    } finally {
      loading.resources = false
    }
  }

  async function fetchSnapshot() {
    if (loaded.snapshot) return

    loading.snapshot = true
    error.snapshot   = null

    try {
      const res = await api.get(`/branches/${branchId}/snapshot`)
      snapshot.value  = res.data.data
      loaded.snapshot = true
    } catch {
      error.snapshot = 'Gagal memuat ringkasan penjualan.'
    } finally {
      loading.snapshot = false
    }
  }

  // -------------------------------------------------------
  // Invalidate: paksa re-fetch tab tertentu
  // (dipakai setelah edit data)
  // -------------------------------------------------------
  function invalidate(tab: BranchDetailTab) {
    loaded[tab] = false
  }

  function invalidateAll() {
    (Object.keys(loaded) as BranchDetailTab[]).forEach(tab => {
      loaded[tab] = false
    })
  }

  // -------------------------------------------------------
  // Entry point: dipanggil dari event @tab-change di page
  // -------------------------------------------------------
  function onTabChange(tab: BranchDetailTab) {
    switch (tab) {
      case 'profile':     return fetchProfile()
      case 'operational': return fetchOperational()
      case 'resources':   return fetchResources()
      case 'snapshot':    return fetchSnapshot()
    }
  }

  return {
    // data
    profile, operational, resources, snapshot,
    // state
    loading, error, loaded,
    // actions
    fetchProfile, onTabChange, invalidate, invalidateAll,
  }
}