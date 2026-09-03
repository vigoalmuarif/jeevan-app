import { defineStore } from "pinia";
import type { AuthUser, SessionResponse } from "@/core/types/auth.types";
import { authService } from "@/modules/auth/services/auth.service";
import { useMerchantStore } from "@/core/stores/merchant.store";
import { useLoadingStore } from "@/core/stores/loading.store";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as AuthUser | null,
    roles: [] as string[],
    permissions: [] as string[],
    isAuthenticated: false,
    isHydrated: false, // sudah pernah fetch /auth/me sejak app load
    isAllBranches: true,
  }),

  getters: {
    /**
     * Cek apakah user memiliki permission tertentu.
     * Dipakai oleh useMenu dan useCan composable.
     *
     * @example authStore.hasPermission('category.view')
     */
    hasPermission:
      (state) =>
      (permission: string): boolean => {
        return state.permissions.includes(permission);
      },

    /**
     * Cek apakah user memiliki role tertentu.
     *
     * @example authStore.hasRole('owner')
     */
    hasRole:
      (state) =>
      (role: string): boolean => {
        return state.roles.includes(role);
      },

    can: (state) => (permission: string) =>
      state.permissions.includes(permission),
  },

  actions: {
    async hydrate() {
      const merchantStore = useMerchantStore();
      const loadingStore = useLoadingStore();

      loadingStore.show("Auth Check 🔑");

      try {
        const res = await authService.me();
        const data = res.data;
        loadingStore.show("Yuhuu! OTW Dashboard 🚀");
        this.setFormPayload(data);
      } catch {
        // data tidak valid / belum login — clear store
        loadingStore.show("Silahkan login dulu ya 📢");
        this.clear();
        merchantStore.clear();
      }
    },

    setFormPayload(payload: SessionResponse) {
      const merchantStore = useMerchantStore();
      this.set(
        payload.user,
        payload.roles,
        payload.permissions,
        payload.is_all_branches,
      );
      merchantStore.set({
        needsSetupWizard: payload.needs_setup_wizard,
        merchant: payload.merchant,
        activeBranch: payload.active_branch,
        subscription: payload.subscription,
        activeModules: payload.modules,
      });
    },

    set(
      user: AuthUser,
      roles: string[],
      permissions: string[],
      isAllBranches: boolean,
    ) {
      this.user = user;
      this.roles = roles;
      this.permissions = permissions;
      this.isAllBranches = isAllBranches;
      this.isAuthenticated = true;
      this.isHydrated = true;
    },

    clear(): void {
      this.$reset();
      this.isHydrated = true;
    },
  },
});
