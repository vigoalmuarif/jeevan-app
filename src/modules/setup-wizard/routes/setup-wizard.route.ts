import type { RouteRecordRaw } from "vue-router";

export const setupWizardRoutes: RouteRecordRaw[] = [
   {
    path: "/setup-wizard",
    meta: { requiresAuth: true, requiresSetupWizard: true },
    component: () => import('@/core/layouts/AuthLayout.vue'),
    children: [
      {
        path: "",
        name: "setup_wizard",
        meta: { requiresAuth: true, requiresSetupWizard: true },
        component: () => import('@/modules/setup-wizard/pages/SetupWizardPage.vue'),
      },
    ],
  },
]

