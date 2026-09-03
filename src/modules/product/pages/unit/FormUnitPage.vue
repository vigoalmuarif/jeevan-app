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
import { unitService } from "../../services/unit.service";
import { normalizeError } from "@/lib/errors";
import type { Unit } from "@/core/types/product.types";
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


const props = defineProps<{
  selectedUnit?: Unit;
}>();
const open = defineModel<boolean>("open");
const emit = defineEmits<{
  saved: [
    data: {
      type: string
      unit: Unit
    }
  ];
}>();

const loading = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");
const isEdit = computed(() => !!props.selectedUnit);

const initialUnit = {
  name: "",
  code: "",
  is_active: true,
};

const unit = ref({ ...initialUnit });

watch(open, (val) => {
  if (isEdit.value) {
    unit.value = {
      name: props.selectedUnit?.name as string,
      code: props.selectedUnit?.code as string,
      is_active: props.selectedUnit?.is_active as boolean,
    };
  } else {
    resetForm();
  }
})


function resetForm() {
  unit.value = { ...initialUnit };
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
      const res = await unitService.update(unit.value, props.selectedUnit?.id as number);
      const data = res.data;
      emit("saved", { type: 'edited', unit: data });
    }else{
      const res = await unitService.store(unit.value);
      const data = res.data;
      emit("saved", { type: 'created', unit: data });
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
              >{{ isEdit ? "Edit" : "Tambah" }} Satuan Produk</DialogTitle
            >
            <DialogDescription>
              Pastikan nama dan kode belum tersedia ya😊
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
              <Switch name="isActive" id="isActive" v-model="unit.is_active" />
              <FieldContent>
                <FieldLabel for="isActive">Active</FieldLabel>
              </FieldContent>
            </div>
          </Field>
          <Field :data-invalid="!!errors.name">
            <FieldLabel for="name">Nama Satuan</FieldLabel>
            <Input
              v-model="unit.name"
              id="name"
              name="name"
              placeholder="Kilogram"
              autocomplete="off"
              aria-invalid
            />
            <FieldError v-if="!!errors.name">{{ errors.name }}</FieldError>
          </Field>
          <Field :data-invalid="!!errors.code">
            <FieldLabel for="code">Kode Satuan</FieldLabel>
            <Input
              v-model="unit.code"
              id="code"
              name="code"
              placeholder="kg"
              autocomplete="off"
              aria-invalid
            />
            <FieldError v-if="!!errors.code">{{ errors.code }}</FieldError>
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
