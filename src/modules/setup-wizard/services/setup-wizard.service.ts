
import api from '@/core/api/axios'
import type { SessionResponse } from '@/core/types/auth.types'
import type { SetupWizard } from '@/core/types/setup-wizard.types'

export const SetupWizardService = {
  async setup(payload: SetupWizard) {
    const { data } = await api.post<{ data: SessionResponse }>('/auth/setup-wizard', payload)
    return data
  },

}