
/* -------------------------------------------------------------------------- */
/* GET — response dari backend                                                */
/* -------------------------------------------------------------------------- */

import type { Region } from "./region.types"

/** Detail lengkap (GET /suppliers/{id}) — juga sumber data untuk form edit. */
export interface Supplier {
  id: number
  code: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  tax_id: string | null
  address: string | null
  region_code: number | null
  postal_code: string | null
  payment_term_days?: number | null | undefined
  bank_name: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  notes: string | null
  is_active: boolean
  created_at?: string | null
  updated_at?: string | null

  /** Hanya ada bila relasinya di-include/eager load oleh backend. */
  region?: {
    kode?: string | null
    nama?: string | null
  } | null
}

/** Baris pada tabel (GET /suppliers). */
export type SupplierListItem = Pick<
  Supplier,
  'id' | 'code' | 'name' | 'contact_person' | 'phone' | 'payment_term_days' | 'is_active'
>



/* -------------------------------------------------------------------------- */
/* CREATE / EDIT — payload ke backend                                         */
/* -------------------------------------------------------------------------- */

export interface SupplierPayload {
  /** Kosong/null = dibuat otomatis oleh backend (SUP-00001). */
  code?: string
  name: string
  contact_person: string | null
  phone: string | null
  email: string | null
  tax_id: string | null
  address: string | null
  region_code: number | null
  postal_code: string | null
  payment_term_days: number | null |undefined
  bank_name: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  notes: string | null
  is_active: boolean
}

/** PATCH: semua field opsional. */
export type SupplierUpdatePayload = Partial<SupplierPayload>

