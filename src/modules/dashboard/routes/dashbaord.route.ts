import type { RouteRecordRaw } from "vue-router";

export const dashboardRoutes: RouteRecordRaw[] = [
   {
    path: "/",
    meta: { requiresAuth: true },
    component: () => import('@/core/layouts/DashboardLayout.vue'),
    children: [
      {
        path: "",
        name: "dashboard",
        meta: { requiresAuth: true, breadcrumb: 'Dashboard' },
        component: () => import('@/modules/dashboard/pages/DashboardPage.vue'),
      },
    ],
  },
]

