import api from "../api/axios";
import type { Wilayah, WilayahAncestors, WilayahKelurahan } from "../types/wilayah.types";
import type {
  ComboboxFetcher,
  ComboboxOption,
} from "../composables/useComboBox";

const wilayahService = {
  // Fetcher khusus search kelurahan dengan context
  searchKelurahan: (async (search, params, options) => {
    const { data } = await api.get<{ data: WilayahKelurahan[] }>(
      "/wilayah/search",
      {
        params: { search, per_page: 15, ...params },
        ...options
      },
    );
    return data.data as ComboboxOption[];
  }) satisfies ComboboxFetcher,

  // Generic fetcher factory — return ComboboxFetcher yang sudah terikat parent_kode
  makeFetcher(parentKode: string): ComboboxFetcher {
    return async (search, params) => {
      const { data } = await api.get<{ data: Wilayah[] }>("/wilayah", {
        params: { parent_kode: parentKode, search, ...params },
      });
      return data.data as ComboboxOption[];
    };
  },

  async getAncestors(kode: string): Promise<WilayahAncestors> {
    const { data } = await api.get<{ data: WilayahAncestors }>(
      "/wilayah/ancestors",
      {
        params: { kode },
      },
    );
    return data.data;
  },
};

export { wilayahService };
