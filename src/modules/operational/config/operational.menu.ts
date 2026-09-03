import type { MenuNode } from "@/core/types/menu.types";

export const operationalMenu: MenuNode = {
  key: 'operational',
  label: 'Operasional',
  module: 'operational',
  icon: 'Building2',
  children: [
    {
      key: 'operational.regions',
      label: 'Regional',
      icon: 'GitBranch',
      routeName: 'operational.regions.index',
      permission: 'core.regional.view',
    },
    {
      key: 'operational.branches',
      label: 'Cabang',
      icon: 'GitBranch',
      routeName: 'operational.branches.index',
      permission: 'core.branch.view',
    },
    {
      key: 'operational.warehouses',
      label: 'Gudang',
      icon: 'Warehouse',
      routeName: 'operational.warehouses.index',
      permission: 'core.warehouse.view',
    },
  ],
}