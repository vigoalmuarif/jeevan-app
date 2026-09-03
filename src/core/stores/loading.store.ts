import { defineStore } from "pinia";
import { ref } from "vue";

export const useLoadingStore = defineStore("loading", () => {
  const open = ref(false);
  const message = ref<string | null>(null);

  const show = (text: string | null = null): void => {
    message.value = text;
    open.value = true;
  };

  const hide = (): void => {
    open.value = false;
    message.value = null;
  };

  return {
    show,
    hide,
    open,
    message
  };
});
