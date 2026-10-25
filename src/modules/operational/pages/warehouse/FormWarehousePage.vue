<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { warehouseService } from "../../services/warehouse.service";
import { regionService } from "../../services/region.service";
import { normalizeError } from "@/lib/errors";
import type {
  WarehouseInfo,
  WarehousePayload,
} from "@/core/types/warehouse.types";
import type { Region } from "@/core/types/region.types";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { computed, onMounted, ref } from "vue";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { VisuallyHidden } from "reka-ui";
import { toast } from "vue-sonner";
import { router } from "@/core/router/route";
import { useRoute } from "vue-router";

const props = defineProps<{
  selectedWarehouse?: WarehouseInfo;
  id?: number;
}>();

const route = useRoute();

const loading = ref(false);
const loadingFetch = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");
const regions = ref<Region[]>([]);
const loadingRegions = ref(false);
const isEdit = computed(() => route.params.id);

const initialWarehouse = {
  code: "",
  name: "",
  phone: "",
  address: "",
  is_active: true,
  region_ids: [],
};

const warehouse = ref<WarehousePayload>({ ...initialWarehouse });

async function fetchRegions() {
  loadingRegions.value = true;
  try {
    regions.value = await regionService.options();
  } catch (error) {
    generalError.value = normalizeError(error).message;
  } finally {
    loadingRegions.value = false;
  }
}

function resetForm() {
  warehouse.value = { ...initialWarehouse };
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
      await warehouseService.update(warehouse.value, route.params.id as string);
      toast.success("Gudang berhasil diperbarui 🎉");
    } else {
      await warehouseService.store(warehouse.value);
      router.push({
        name: "operational.warehouses.index",
        query: { isCreated: "true" },
      });
    }
  } catch (err) {
    console.log(err);
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

const fetchWarehouse = async () => {
  loadingFetch.value = true;
  try {
    const res = await warehouseService.edit(route.params.id as string);
    warehouse.value = {
      name: res.data.name,
      code: res.data.code,
      phone: res.data.phone,
      address: res.data.address,
      is_active: res.data.is_active,
      region_ids: res.data.region_ids ?? res.data.regions?.map((region) => region.id) ?? [],
    };
  } catch (e) {
    toast.error("Gagal mengambil data, coba lagi");
  } finally {
    loadingFetch.value = false;
  }
};

onMounted(async () => {
  await fetchRegions();
  if (isEdit.value) {
    await fetchWarehouse();
  }
});
</script>

<template>
  <form @submit.prevent="handleSubmit()">
    <Card>
      <FieldGroup class="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Form {{ isEdit ? "Ubah" : "Tambah" }} Gudang</CardTitle>
          <VisuallyHidden as-child> </VisuallyHidden>
          <CardDescription
            >Lorem ipsum dolor sit, amet consectetur adipisicing elit. Possimus
            explicabo ipsa deleniti!</CardDescription
          >
          <VisuallyHidden as-child> </VisuallyHidden>
        </CardHeader>
        <FieldSeparator />
        <CardContent>
          <FieldGroup>
            <Alert variant="destructive" v-if="!!generalError">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {{ generalError }}
              </AlertDescription>
            </Alert>

            <div
              class="min-h-[60vh] flex items-center justify-center"
              v-if="loadingFetch"
            >
              <Spinner class="size-10" />
            </div>

            <template v-else>
              <FieldSet>
                <FieldLegend>Informasi</FieldLegend>
                <FieldDescription
                  >Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Nobis ut eos rem.</FieldDescription
                >
                <FieldGroup>
                  <Field orientation="horizontal">
                    <div class="flex items-center space-x-4">
                      <Switch
                        name="isActive"
                        id="isActive"
                        v-model="warehouse.is_active"
                        key="is_active"
                      />
                      <FieldContent>
                        <FieldLabel for="isActive">Active</FieldLabel>
                      </FieldContent>
                    </div>
                  </Field>

                  <Field :data-invalid="!!errors.code" orientation="responsive">
                    <FieldLabel for="code">Kode Gudang</FieldLabel>
                    <div class="space-y-2">
                      <Input
                        v-model="warehouse.code"
                        id="code"
                        name="code"
                        placeholder="SBY"
                        autocomplete="off"
                        class="md:min-w-80 lg:min-w-90"
                        @input="
                          warehouse.code = $event.target.value.toUpperCase()
                        "
                        aria-invalid
                      />
                      <FieldError v-if="!!errors.code">{{
                        errors.code
                      }}</FieldError>
                    </div>
                  </Field>

                  <Field :data-invalid="!!errors.name" orientation="responsive">
                    <FieldLabel for="name">Nama Gudang</FieldLabel>
                    <div class="space-y-2">
                      <Input
                        v-model="warehouse.name"
                        id="name"
                        name="name"
                        placeholder="Gudang Surabaya"
                        autocomplete="off"
                        class="md:min-w-80 lg:min-w-90"
                        aria-invalid
                      />
                      <FieldError v-if="!!errors.name">{{
                        errors.name
                      }}</FieldError>
                    </div>
                  </Field>

                  <Field
                    :data-invalid="!!errors.phone"
                    orientation="responsive"
                  >
                    <FieldLabel for="phone" optional>Nomor Telepon</FieldLabel>
                    <div class="space-y-2">
                      <Input
                        v-model="warehouse.phone"
                        id="phone"
                        name="phone"
                        placeholder="081xxxxxx"
                        autocomplete="off"
                        class="md:min-w-80 lg:min-w-90"
                        aria-invalid
                      />
                      <FieldError v-if="!!errors.phone">{{
                        errors.phone
                      }}</FieldError>
                    </div>
                  </Field>

                  <Field
                    :data-invalid="!!errors.address"
                    orientation="responsive"
                  >
                    <FieldLabel for="address">Detail Alamat</FieldLabel>
                    <div class="space-y-2">
                      <Textarea
                        v-model="warehouse.address"
                        id="address"
                        name="address"
                        placeholder="Jl. Pahlawan No. 1"
                        autocomplete="off"
                        class="md:min-w-80 lg:min-w-90"
                        aria-invalid
                      />
                      <FieldError v-if="!!errors.address">{{
                        errors.address
                      }}</FieldError>
                    </div>
                  </Field>

                  <Field :data-invalid="!!errors.region_ids">
                    <FieldLabel>Regional yang dilayani</FieldLabel>
                    <div v-if="loadingRegions" class="text-sm text-muted-foreground">Memuat regional...</div>
                    <div v-else-if="regions.length === 0" class="text-sm text-muted-foreground">Belum ada regional aktif. Tambahkan regional terlebih dahulu.</div>
                    <div v-else class="space-y-2">
                      <label v-for="region in regions" :key="region.id" class="flex items-center gap-3 rounded-md border p-3">
                        <input
                          v-model="warehouse.region_ids"
                          type="checkbox"
                          :value="region.id"
                          :disabled="!region.is_active && !warehouse.region_ids.includes(region.id)"
                          class="size-4 accent-primary"
                        />
                        <span>{{ region.name }} ({{ region.code }})<span v-if="!region.is_active" class="text-muted-foreground"> — Nonaktif</span></span>
                      </label>
                    </div>
                    <FieldError v-if="errors.region_ids">{{ errors.region_ids }}</FieldError>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </template>
          </FieldGroup>
        </CardContent>
        <CardFooter class="justify-end bg-transparent">
          <Button
            type="submit"
            :disabled="loading || loadingFetch"
            class="w-full"
          >
            <Spinner v-if="loading" />
            {{ loading ? "Menyimpan..." : "Simpan" }}
          </Button>
        </CardFooter>
      </FieldGroup>
    </Card>
  </form>
</template>
