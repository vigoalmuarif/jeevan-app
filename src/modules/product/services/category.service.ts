import api from "@/core/api/axios";
import type { ServerTableResponse } from "@/core/types/data-table.types";
import type { Category } from "@/core/types/product.types";

export const categoryService = {
  async getData() {
    const { data } =
      await api.get<ServerTableResponse<Category>>("/categories");
    return data;
  },

  async store(payload: { name: string; code: string; description: string }) {
    const { data } = await api.post<{ data: Category }>("/categories", payload);
    return data;
  },

  async update(
    payload: { name: string; code: string; description: string; is_active: boolean },
    id: number,
  ) {
    const { data } = await api.patch<{ data: Category }>(
      `/categories/${id}`,
      payload,
    );
    return data;
  },

  async delete(id: number) {
    const { data } = await api.delete(`/categories/${id}`);
    return data;
  },

  async search(query: string, params?: Record<string, unknown>) {
    const { data } = await api.get<{ data: Category[] }>("/categories", {
      params: { search: query, per_page: 15, ...params },
    });
    return data.data;
  },
};
