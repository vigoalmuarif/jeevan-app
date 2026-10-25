import type { MenuNode } from "@/core/types/menu.types";

export const partnerMenu: MenuNode = {
  key: 'partner',
  label: 'Mitra',
  module: 'partner',
  icon: 'Handshake',
  children: [
    {
      key: 'partner.customers',
      label: 'Customer',
      icon: 'UsersRound',
      routeName: 'partner.customers.index',
      permission: 'partner.customer.view',
    },
    {
      key: 'partner.suppliers',
      label: 'Supplier',
      icon: 'GitBranch',
      routeName: 'partner.suppliers.index',
      permission: 'partner.supplier.view',
    },
  ],
}
