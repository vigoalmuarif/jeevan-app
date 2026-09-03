import { useAuthStore } from '@/core/stores/auth.store'

/**
 * useCan — composable untuk permission check di level template.
 *
 * Dipakai untuk show/hide action button (tambah, edit, hapus)
 * bukan untuk menu visibility (itu tugas useMenu).
 *
 * @example
 * const { can } = useCan()
 * <Button v-if="can('product.category.create')">Tambah</Button>
 * <Button v-if="can('product.category.delete')">Hapus</Button>
 */
export function useCan() {
  const auth = useAuthStore()

  function can(permission: string): boolean {
    return auth.hasPermission(permission)
  }

  function canAny(...permissions: string[]): boolean {
    return permissions.some(p => auth.hasPermission(p))
  }

  function canAll(...permissions: string[]): boolean {
    return permissions.every(p => auth.hasPermission(p))
  }

  return { can, canAny, canAll }
}