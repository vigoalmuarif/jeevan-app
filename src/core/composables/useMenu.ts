import { computed } from "vue";
import { useAuthStore } from "../stores/auth.store";
import type { MenuNode } from "../types/menu.types";
import { useMerchantStore } from "../stores/merchant.store";
import { appMenu } from "../config/menu";

/**
 * useMenu — composable untuk build filtered menu tree.
 *
 * Logic:
 * 1. Setiap node dicek visibilitasnya (module gate + permission gate)
 * 2. Node group (tanpa routeName) disembunyikan jika semua children tidak visible
 * 3. Filter berjalan rekursif untuk support nested menu
 *
 * Computed — otomatis reaktif terhadap perubahan auth store
 * (misal: role berubah, module diaktifkan/dinonaktifkan)
 */
export function useMenu() {
  const auth = useAuthStore();
  const merchant = useMerchantStore();

  /**
   * Cek apakah satu node boleh ditampilkan.
   * Node visible jika:
   * - Tidak ada module gate, ATAU module aktif untuk merchant
   * - Tidak ada permission gate, ATAU user punya permission
   */
  function isVisible(node: MenuNode): boolean {
    if (node.module && !merchant.hasModule(node.module)) return false;
    if (node.permission && !auth.hasPermission(node.permission)) return false;
    return true;
  }

  /**
   * Filter tree secara rekursif.
   *
   * Aturan untuk group node (tidak punya routeName):
   * - Jika semua children tidak visible → group disembunyikan
   * - Jika minimal 1 child visible → group ditampilkan
   *
   * Ini penting agar group  tidak muncul
   * jika user tidak punya permission ke satu pun child-nya.
   */
  function filterTree(nodes: MenuNode[]): MenuNode[] {
    return nodes.reduce<MenuNode[]>((acc, node) => {
      if (!isVisible(node)) return acc;

      if (node.children?.length) {
        const visibleChildren = filterTree(node.children);

        // Group tanpa children visible dan tanpa routeName → sembunyikan
        if (visibleChildren.length === 0 && !node.routeName) return acc;

        acc.push({ ...node, children: visibleChildren });
        return acc;
      }

      acc.push(node);
      return acc;
    }, []);
  }

  const menu = computed((): MenuNode[] => filterTree(appMenu))

  return { menu };
}
