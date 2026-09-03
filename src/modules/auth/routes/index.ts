import type { RouteRecordRaw } from "vue-router";

export const authRoutes: RouteRecordRaw[] = [
   {
    path: "/auth",
    name: "auth",
    component: () => import('@/core/layouts/AuthLayout.vue'),
    children: [
      {
        path: "login",
        name: "auth.login",
        meta: { requiresGuest: true },
        component: () => import('@/modules/auth/pages/LoginPage.vue'),
      },
      {
        path: "register",
        name: "auth.register",
        meta: { requiresGuest: true },
        component: () => import('@/modules/auth/pages/SignupPage.vue'),
      },
    ],
  },
]

