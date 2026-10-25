<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import type { Region, RegionPayload } from "@/core/types/region.types";
import { normalizeError } from "@/lib/errors";
import { regionService } from "../../services/region.service";

const open = defineModel<boolean>("open", { default: false });
const props = defineProps<{ selectedRegion?: Region }>();
const emit = defineEmits<{
  saved: [result: { type: "created" | "updated"; region: Region }];
}>();

const initialForm = (): RegionPayload => ({
  parent_region_id: null,
  code: "",
  name: "",
  type: "custom",
  is_active: true,
});

const form = reactive<RegionPayload>(initialForm());
const regions = ref<Region[]>([]);
const loading = ref(false);
const loadingFetch = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");
const isEdit = computed(() => !!props.selectedRegion);

function resetForm() {
  Object.assign(form, initialForm());
  errors.value = {};
  generalError.value = "";
}

async function loadForm() {
  if (!props.selectedRegion) return;
  loadingFetch.value = true;
  try {
    const region = await regionService.edit(props.selectedRegion.id);
    Object.assign(form, {
      parent_region_id: region.parent_region_id,
      code: region.code,
      name: region.name,
      type: region.type as RegionPayload["type"],
      is_active: region.is_active,
    });
  } catch (error) {
    generalError.value = normalizeError(error).message;
  } finally {
    loadingFetch.value = false;
  }
}

watch(open, async (isOpen) => {
  if (!isOpen) return;
  resetForm();
  try {
    regions.value = await regionService.options();
  } catch (error) {
    generalError.value = normalizeError(error).message;
  }
  await loadForm();
});

async function handleSubmit() {
  loading.value = true;
  errors.value = {};
  generalError.value = "";
  try {
    const payload = {
      ...form,
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
    };
    const region = isEdit.value && props.selectedRegion
      ? await regionService.update(props.selectedRegion.id, payload)
      : await regionService.store(payload);
    emit("saved", { type: isEdit.value ? "updated" : "created", region });
    open.value = false;
  } catch (error) {
    const normalized = normalizeError(error);
    if (normalized.status === 422) errors.value = normalized.errors;
    else generalError.value = normalized.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? "Ubah regional" : "Tambah regional" }}</DialogTitle>
        <DialogDescription>Kelola data regional dan hubungan regional induk.</DialogDescription>
      </DialogHeader>

      <Alert v-if="generalError" variant="destructive">
        <AlertTitle>Regional belum tersimpan</AlertTitle>
        <AlertDescription>{{ generalError }}</AlertDescription>
      </Alert>

      <div v-if="loadingFetch" class="flex min-h-40 items-center justify-center">
        <Spinner class="size-8" />
      </div>

      <form v-else class="space-y-5" @submit.prevent="handleSubmit">
        <FieldGroup>
          <Field :data-invalid="!!errors.name">
            <FieldLabel for="region-name">Nama</FieldLabel>
            <Input id="region-name" v-model="form.name" autocomplete="off" />
            <FieldError v-if="errors.name">{{ errors.name }}</FieldError>
          </Field>

          <Field :data-invalid="!!errors.code">
            <FieldLabel for="region-code">Kode</FieldLabel>
            <Input
              id="region-code"
              v-model="form.code"
              autocomplete="off"
              @input="form.code = form.code.toUpperCase()"
            />
            <FieldError v-if="errors.code">{{ errors.code }}</FieldError>
          </Field>

          <Field :data-invalid="!!errors.type">
            <FieldLabel for="region-type">Tipe</FieldLabel>
            <Select v-model="form.type">
              <SelectTrigger id="region-type"><SelectValue placeholder="Pilih tipe" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="province">Provinsi</SelectItem>
                <SelectItem value="city">Kota</SelectItem>
                <SelectItem value="custom">Lainnya</SelectItem>
              </SelectContent>
            </Select>
            <FieldError v-if="errors.type">{{ errors.type }}</FieldError>
          </Field>

          <Field :data-invalid="!!errors.parent_region_id">
            <FieldLabel for="region-parent">Regional induk (opsional)</FieldLabel>
            <Select
              :model-value="form.parent_region_id === null ? 'none' : String(form.parent_region_id)"
              @update:model-value="form.parent_region_id = $event === 'none' ? null : Number($event)"
            >
              <SelectTrigger id="region-parent"><SelectValue placeholder="Tanpa induk" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa induk</SelectItem>
                <SelectItem
                  v-for="region in regions.filter((item) => item.id !== selectedRegion?.id)"
                  :key="region.id"
                  :value="String(region.id)"
                >
                  {{ region.name }} ({{ region.code }}){{ region.is_active ? "" : " — Nonaktif" }}
                </SelectItem>
              </SelectContent>
            </Select>
            <FieldError v-if="errors.parent_region_id">{{ errors.parent_region_id }}</FieldError>
          </Field>

          <Field orientation="horizontal">
            <Switch id="region-active" v-model="form.is_active" />
            <FieldLabel for="region-active">Aktif</FieldLabel>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="loading" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading">
            <Spinner v-if="loading" />
            {{ loading ? "Menyimpan..." : "Simpan" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
