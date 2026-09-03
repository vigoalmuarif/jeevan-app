import type { RouteRecordRaw } from "vue-router";

export const branchRoutes: RouteRecordRaw[] = [
   {
    path: "/operational/branches",
    name: "operational.branches",
    meta: { requiresAuth: true, breadcrumb: 'Daftar Cabang' },
    children: [
      {
        path: "",
        name: "operational.branches.index",
        meta: { requiresAuth: true, permission: 'core.branch.view' },
        component: () => import('@/modules/operational/pages/branch/BranchPage.vue'),
      },
      {
        path: "create",
        name: "operational.branches.create",
        meta: { requiresAuth: true, breadcrumb: 'Tambah Cabang', permission: 'core.branch.create' },
        component: () => import('@/modules/operational/pages/branch/FormBranchPage.vue'),
      },
      {
        path: ":slug/edit",
        name: "operational.branches.edit",
        meta: { requiresAuth: true, breadcrumb: 'Ubah Cabang', permission: 'core.branch.update' },
        component: () => import('@/modules/operational/pages/branch/FormBranchPage.vue'),
      },
    ],
  },
]

