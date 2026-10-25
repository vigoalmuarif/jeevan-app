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
    ],
  },
]
