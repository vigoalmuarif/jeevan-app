import type { NavigationGuardWithThis } from "vue-router";
import { useAuthStore } from "@/core/stores/auth.store";
import { useMerchantStore } from "../stores/merchant.store";

export const authGuard: NavigationGuardWithThis<undefined> = async (to) => {
  const authStore = useAuthStore();
  const merchantStore = useMerchantStore();

  // 1. Route tidak ditemukan → biarkan render NotFoundPage
  if (to.name === 'not-found') return true

  // Hydrate session sekali saat page pertama kali dibuka / refresh
  if (!authStore.isHydrated) {
    await authStore.hydrate();
  }

  const requiresAuth = to.meta.requiresAuth === true;
  const requiresGuest = to.meta.requiresGuest === true;
  const requiresSetupWizard = to.meta.requiresSetupWizard === true;
  const module = to.meta.module;
  const permission = to.meta.permission;

  // Route butuh login tapi belum authenticated
  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "auth.login",
      query: { redirect: to.fullPath },
    };
  }

  // udah authenticated tapi blm ada merchant
  if (merchantStore.needsSetupWizard && !requiresSetupWizard) {
    return { name: "setup_wizard" };
  }

  // gak boleh akses kalo udah buat
  if (!merchantStore.needsSetupWizard && requiresSetupWizard) {
    return { name: "dashboard" };
  }

  // Module guard
  if (module && !merchantStore.hasModule(module as string)) {
    return { name: "forbidden", query: { reason: "module" } };
  }

  // Permission guard
  if (permission && !authStore.hasPermission(permission as string)) {
    return { name: "forbidden", query: { reason: "permission" } };
  }

  // Route untuk guest (login/register) tapi sudah authenticated
  if (requiresGuest && authStore.isAuthenticated) {
    return { name: "dashboard" };
  }

  return true;
};
