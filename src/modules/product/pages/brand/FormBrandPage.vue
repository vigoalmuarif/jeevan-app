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
import { brandService } from "../../services/brand.service";
import { normalizeError } from "@/lib/errors";
import type { Brand } from "@/core/types/product.types";
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
import { Switch } from "@/components/ui/switch"
import { watch } from "vue";
import { VisuallyHidden } from "reka-ui";


const props = defineProps<{
  selectedBrand?: Brand;
}>();
const open = defineModel<boolean>("open");
const emit = defineEmits<{
  saved: [
    data: {
      type: string
      brand: Brand
    }
  ];
}>();

const loading = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");
const isEdit = computed(() => !!props.selectedBrand);

const initialBrand = {
  name: "",
  is_active: true,
};

const brand = ref({ ...initialBrand });

watch(open, (val) => {
  if (isEdit.value) {
    brand.value = {
      name: props.selectedBrand?.name as string,
      is_active: props.selectedBrand?.is_active as boolean,
    };
  } else {
    resetForm();
  }
})


function resetForm() {
  brand.value = { ...initialBrand };
  loading.value = false;
  errors.value = {};
  generalError.value = "";
}

async function handleSubmit() {
  loading.value = true;
  errors.value = {};
  generalError.value = "";

  try {
    if(isEdit.value){
      const res = await brandService.update(brand.value, props.selectedBrand?.id as number);
      const data = res.data;
      emit("saved", { type: 'edited', brand: data });
    }else{
      const res = await brandService.store(brand.value);
      const data = res.data;
      emit("saved", { type: 'created', brand: data });
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
              >{{ isEdit ? "Edit" : "Tambah" }} Merek Produk</DialogTitle
            >
            <DialogDescription aria-describedby="undefined">
              <VisuallyHidden />
            </DialogDescription>
          </DialogHeader>

          <Alert variant="destructive" v-if="!!generalError">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {{ generalError }}
            </AlertDescription>
          </Alert>

          <Field  orientation="horizontal" v-if="isEdit">
            <div class="flex items-center space-x-4">
              <Switch name="isActive" id="isActive" v-model="brand.is_active" />
              <FieldContent>
                <FieldLabel for="isActive">Active</FieldLabel>
              </FieldContent>
            </div>
          </Field>
          <Field :data-invalid="!!errors.name">
            <FieldLabel for="name">Nama Merek</FieldLabel>
            <Input
              v-model="brand.name"
              id="name"
              name="name"
              placeholder="Samsung"
              autocomplete="off"
              aria-invalid
            />
            <FieldError v-if="!!errors.name">{{ errors.name }}</FieldError>
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
