import { defineStore } from "pinia";
import { ref } from "vue";

export const useLoadingStore = defineStore("app", () => {
  const isLoading = ref(false);
  const message = ref<string | null>(null);

  const show = (text: string | null = null): void => {
    message.value = text;
    isLoading.value = true;
  };

  const hide = (): void => {
    isLoading.value = false;
    message.value = null;
  };
  const appReady = ref(false);

  return {
    appReady,
  };
});
