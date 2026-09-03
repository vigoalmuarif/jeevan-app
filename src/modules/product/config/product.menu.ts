import type { MenuNode } from "@/core/types/menu.types";

export const productMenu: MenuNode = {
  key: 'product',
  label: 'Produk',
  icon: 'Package',
  module: 'product',
  children: [
    {
      key: 'product.list',
      label: 'Daftar Produk',
      icon: 'List',
      routeName: 'products.index',
      permission: 'product.view',
    },
    {
      key: 'product.categories',
      label: 'Kategori',
      icon: 'Tag',
      routeName: 'products.categories.index',
      permission: 'product.category.view',
    },
    {
      key: 'product.units',
      label: 'Satuan',
      icon: 'Ruler',
      routeName: 'products.units.index',
      permission: 'product.unit.view',
    },
    {
      key: 'product.brands',
      label: 'Merek',
      icon: 'Bookmark',
      routeName: 'products.brands.index',
      permission: 'product.brand.view',
    },
  ],
}