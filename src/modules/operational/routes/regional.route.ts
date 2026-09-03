import type { RouteRecordRaw } from "vue-router";

export const regionalRoutes: RouteRecordRaw[] = [
   {
    path: "/operational/regions",
    name: "operational.regions",
    meta: { requiresAuth: true, breadcrumb: 'Daftar Regional' },
    children: [
      {
        path: "",
        name: "operational.regions.index",
        meta: { requiresAuth: true, permission: 'core.regional.view' },
        component: () => import('@/modules/operational/pages/regional/RegionalPage.vue'),
      },
    //   {
    //     path: "create",
    //     name: "operational.regions.create",
    //     meta: { requiresAuth: true, breadcrumb: 'Tambah Regional', permission: 'core.regional.create' },
    //     component: () => import('@/modules/operational/pages/regional/FormWarehousePage.vue'),
    //   },
    //   {
    //     path: ":id/edit",
    //     name: "operational.regions.edit",
    //     meta: { requiresAuth: true, breadcrumb: 'Ubah Regional', permission: 'core.regional.update' },
    //     component: () => import('@/modules/operational/pages/regional/FormWarehousePage.vue'),
    //   },
    ],
  },
]

