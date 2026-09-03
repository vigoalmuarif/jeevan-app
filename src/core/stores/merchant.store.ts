import { defineStore } from "pinia";
import type {
  AuthBranch,
  AuthMerchant,
  AuthSubrcription,
} from "../types/auth.types";

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
      return state.activeModules.includes(moduleKey)
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
      this.needsSetupWizard = payload.needsSetupWizard;
      this.subscription = payload.subscription;
      this.activeModules = payload.activeModules;
    },

    clear(): void {
      this.$reset();
    },
  },
});
