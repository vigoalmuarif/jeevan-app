<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { reactive, ref } from "vue";
import { categoryService } from "../../services/category.service";
import { normalizeError } from "@/lib/errors";
import type { Category } from "@/core/types/product.types";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { computed } from "vue";
import { Switch } from "@/components/ui/switch";
import { watch } from "vue"
import { Textarea } from "@/components/ui/textarea";

const props = defineProps<{
  selectedCategory?: Category;
}>();
const open = defineModel<boolean>("open");
const emit = defineEmits<{
  saved: [
    data: {
      type: string;
      category: Category;
    },
  ];
}>();

const loading = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");
const isEdit = computed(() => !!props.selectedCategory);

const initialCategory = {
  name: "",
  description: "",
  is_active: true,
};

const category = ref({ ...initialCategory });

watch(open, (val) => {
  if (isEdit.value) {
    category.value = {
      name: props.selectedCategory?.name as string,
      description: props.selectedCategory?.description as string,
      is_active: props.selectedCategory?.is_active as boolean,
    };
  } else {
    resetForm();
  }
});

function resetForm() {
  category.value = { ...initialCategory };
  loading.value = false;
  errors.value = {};
  generalError.value = "";
}

async function handleSubmit() {
  loading.value = true;
  errors.value = {};
  generalError.value = "";

  try {
    if (isEdit.value) {
      const res = await categoryService.update(
        category.value,
        props.selectedCategory?.id as number,
      );
      const data = res.data;
      emit("saved", { type: "edited", category: data });
    } else {
      const res = await categoryService.store(category.value);
      const data = res.data;
      emit("saved", { type: "created", category: data });
    }

    open.value = false;
  } catch (err) {
    const error = normalizeError(err);
    if (error.status === 422) {
      errors.value = error.errors;
    } else {
      generalError.value = error.message;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      @interact-outside.prevent
      class="sm:max-w-[425px]"
      :show-close-button="!loading"
    >
      <form @submit.prevent="handleSubmit()">
        <FieldGroup>
          <DialogHeader>
            <DialogTitle
              >{{ isEdit ? "Edit" : "Tambah" }} Kategori Produk</DialogTitle
            >
            <DialogDescription>
              Kategorikan produk agar mudah dilacak😊
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive" v-if="!!generalError">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {{ generalError }}
            </AlertDescription>
          </Alert>

          <Field orientation="horizontal" v-if="isEdit">
            <div class="flex items-center space-x-4">
              <Switch
                name="isActive"
                id="isActive"
                v-model="category.is_active"
              />
              <FieldContent>
                <FieldLabel for="isActive">Active</FieldLabel>
              </FieldContent>
            </div>
          </Field>
          <Field :data-invalid="!!errors.name">
            <FieldLabel for="name">Nama Satuan</FieldLabel>
            <Input
              v-model="category.name"
              id="name"
              name="name"
              placeholder="Minuman"
              autocomplete="off"
              aria-invalid
            />
            <FieldError v-if="!!errors.name">{{ errors.name }}</FieldError>
          </Field>
          <Field :data-invalid="!!errors.description">
            <FieldLabel for="description">Kode Satuan</FieldLabel>
            <Textarea
              v-model="category.description"
              id="description"
              name="description"
              placeholder="Dalam bentuk botol, sachet, gelas"
              autocomplete="off"
              aria-invalid
            />
            <FieldError v-if="!!errors.description">{{ errors.description }}</FieldError>
          </Field>
          <DialogFooter>
            <DialogClose as-child>
              <Button variant="outline" :disabled="loading"> Batal </Button>
            </DialogClose>
            <Button type="submit" :disabled="loading">
              <Spinner v-if="loading" />
              {{ loading ? "Menyimpan..." : "Simpan" }}
            </Button>
          </DialogFooter>
        </FieldGroup>
      </form>
    </DialogContent>
  </Dialog>
</template>
