import type { AuthBranch, AuthMerchant, AuthSubrcription } from "./auth.types";

export interface SetupWizard {
  name: string;
  industry_package_code: string;
}

export interface SetupWizardResponse {
  needs_setup_wizard: boolean;
  merchant: AuthMerchant;
  active_branch: AuthBranch;
  industry_name: string;
  is_all_branches: boolean;
  subscription: AuthSubrcription;
  roles: string[];
  permissions: string[];
  modules: string[];
}
