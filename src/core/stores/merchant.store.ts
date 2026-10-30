import { defineStore } from "pinia";
import type {
  AuthBranch,
  AuthMerchant,
  AuthSubrcription,
} from "../types/auth.types";
import { merchantService } from "@/modules/merchant/sevices/merchant.service";

export const useMerchantStore = defineStore("merchant", {
  state: () => ({
    merchant: null as AuthMerchant | null,
    activeBranch: null as AuthBranch | null,
    branches: [] as AuthBranch[],
    needsSetupWizard: false as boolean,
    subscription: null as AuthSubrcription | null,
    activeModules: [] as string[],
    isWelcome: false as boolean,
  }),

  getters: {
    /**
     * Cek apakah module aktif untuk merchant ini.
     * Dipakai oleh useMenu untuk filter menu berdasarkan module.
     *
     * @example authStore.hasModule('sales')
     */
    hasModule: (state) => (moduleKey: string): boolean => {
      return state.activeModules.includes(moduleKey);
    },
  },

  actions: {
    set(payload: {
      needsSetupWizard: boolean;
      merchant: AuthMerchant;
      activeBranch: AuthBranch;
      subscription: AuthSubrcription;
      activeModules: string[];
    }) {
      this.needsSetupWizard = payload.needsSetupWizard;
      this.merchant = payload.merchant;
      this.activeBranch = payload.activeBranch;
      this.subscription = payload.subscription;
      this.activeModules = payload.activeModules;
    },

    async fetchContext(merchantIdOrSlug: string | number) {
      try {
        const data = await merchantService.getContext(merchantIdOrSlug);
        if (data?.merchant) {
          this.merchant = {
            ...(this.merchant as AuthMerchant),
            ...data.merchant,
          };
        }
        if (Array.isArray(data?.entitled_modules)) {
          this.activeModules = data.entitled_modules;
        }
        return data;
      } catch (err) {
        console.error("Failed to fetch merchant context", err);
        throw err;
      }
    },

    clear(): void {
      this.$reset();
    },
  },
});
