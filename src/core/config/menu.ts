// import { salesMenu }     from '@/modules/sales/menu'
// import { purchaseMenu }  from '@/modules/purchase/menu'
// import { inventoryMenu } from '@/modules/inventory/menu'
// import { customerMenu }  from '@/modules/customer/menu'
// import { reportMenu }    from '@/modules/report/menu'

import { productMenu } from "@/modules/product/config/product.menu";
import type { MenuNode } from "../types/menu.types";
import { operationalMenu } from "@/modules/operational/config/operational.menu";

/**
 * Composition root seluruh menu aplikasi.
 *
 * Urutan array = urutan tampil di sidebar.
 * Tambah module baru = import fragment + tambah ke array.
 *
 *   Dashboard     → selalu tampil, tanpa gate
 *   Produk        → daftar produk + master produk (kategori, satuan, merek)
 *   Penjualan     → transaksi + retur (module: sales)
 *   Pembelian     → purchase order + retur (module: purchase)
 *   Inventori     → stok + mutasi (module: inventory)
 *   Pelanggan     → CRM (module: customer)
 *   Operasional   → cabang + gudang (infrastruktur merchant)
 *   Laporan       → semua report
 *   Pengaturan    → konfigurasi sistem
 */
export const appMenu: MenuNode[] = [
  // ── Dashboard ────────────────────────────────────────────────
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    routeName: 'dashboard',
  },

  // ── Produk (daftar + master produk) ──────────────────────────
  productMenu,

  // ── Business Modules ─────────────────────────────────────────
  // salesMenu,
  // purchaseMenu,
  // inventoryMenu,
  // customerMenu,

  // ── Infrastruktur Merchant ────────────────────────────────────
  operationalMenu,

  // ── Laporan ──────────────────────────────────────────────────
  // reportMenu,

  // ── Pengaturan ───────────────────────────────────────────────
  {
    key: 'settings',
    label: 'Pengaturan',
    icon: 'Settings',
    routeName: 'settings.index',
    permission: 'setting.view',
  },
]