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
import { branchService } from "../../services/branch.service";
import { normalizeError } from "@/lib/errors";
import type {
  BranchInfo,
  BranchPayload,
  BranchEditResponse,
} from "@/core/types/branch.types";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { computed, onMounted, ref } from "vue";
import { Switch } from "@/components/ui/switch";
import { watch } from "vue";
import { Textarea } from "@/components/ui/textarea";
import { useWilayah } from "@/core/composables/useWilayah";
import ServerComboBox from "@/components/server-combobox/ServerComboBox.vue";
import type { WilayahKelurahan } from "@/core/types/wilayah.types";
import { VisuallyHidden } from "reka-ui";
import { toast } from "vue-sonner";
import { router } from "@/core/router/route";
import { useRoute } from "vue-router";
import Badge from "@/components/ui/badge/Badge.vue";

const props = defineProps<{
  selectedBranch?: BranchInfo;
  id?: number;
}>();

const route = useRoute();

const loading = ref(false);
const loadingFetch = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");
const isEdit = computed(() => route.params.slug);
const villageSelected = ref<WilayahKelurahan>();

const initialBranch = {
  code: "",
  name: "",
  email: "",
  phone: "",
  province_code: "",
  regency_code: "",
  district_code: "",
  village_code: "",
  postal_code: "",
  address: "",
  is_active: true,
  is_main: false,
};

const initialWarehouse = {
  warehouse_code: "",
  warehouse_name: "",
  is_same_address: false,
  warehouse_address: "",
};

const { selected, fetcher, onKelurahanSelect } = useWilayah();

const branch = ref<BranchPayload>({ ...initialBranch });
const warehouse = ref({ ...initialWarehouse });

function resetForm() {
  branch.value = { ...initialBranch };
  loading.value = false;
  errors.value = {};
  generalError.value = "";
}

const handleWarehouseAddress = (e: Event) => {
  const target = e.target as HTMLInputElement;

  if (target.value == "false") {
    return (warehouse.value.warehouse_address = "");
  }

  if (!branch.value.address) {
    toast.warning("Alamat cabang belum diisi");
    warehouse.value.is_same_address = false;
    return;
  }

  warehouse.value.warehouse_address = branch.value.address;
};

async function handleSubmit() {
  loading.value = true;
  errors.value = {};
  generalError.value = "";

  try {
    if (isEdit.value) {
      await branchService.update(branch.value, route.params.id as string);
      isMainIsLabel.value = branch.value.is_main;
      toast.success("Cabang berhasil diperbarui 🎉");
    } else {
      const payload = { ...branch.value, ...warehouse.value };
      await branchService.store(payload);
      router.push({
        name: "operational.branches.index",
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

const fetchBranchById = async () => {
  loadingFetch.value = true;
  generalError.value = "";

  try {
    const res = await branchService.edit(route.params.slug as string);
    syncBranchResponse(res.data);
  } finally {
    loadingFetch.value = false;
  }
};

const isMainIsLabel = ref(false);

function checkIsMain() {
  if (isMainIsLabel.value && !branch.value.is_active) {
    branch.value.is_active = true;
    toast.warning(
      "Cabang Utama gak bisa dinonaktifkan, Silahkan pilih cabang lain sebagai ganti cabang utama.",
    );
    return;
  }

  if (!branch.value.is_active && branch.value.is_main) {
    branch.value.is_active = true;
    return;
  }
}

const syncBranchResponse = (data: BranchEditResponse) => {
  ((branch.value.code = data.code),
    (branch.value.name = data.name),
    (branch.value.email = data.email),
    (branch.value.phone = data.phone),
    (branch.value.province_code = data.address.province?.kode),
    (branch.value.regency_code = data.address.regency?.kode),
    (branch.value.district_code = data.address.district?.kode),
    (branch.value.village_code = data.address.village?.kode),
    (branch.value.postal_code = data.address.postal_code),
    (branch.value.address = data.address.street),
    (branch.value.is_active = data.is_active),
    (branch.value.is_main = data.is_main),
    (selected.value = {
      village_code: data.address.village?.kode,
      village_name: data.address.village?.nama,
      district_code: data.address.district?.kode,
      district_name: data.address.district?.nama,
      regency_code: data.address.regency?.kode,
      regency_name: data.address.regency?.nama,
      province_code: data.address.province?.kode,
      province_name: data.address.province?.nama,
    }));

  isMainIsLabel.value = data.is_main;
};

watch(selected, (val) => {
  branch.value.province_code = val.province_code as string;
  branch.value.regency_code = val.regency_code as string;
  branch.value.district_code = val.district_code as string;
  branch.value.village_code = val.village_code as string;
});

onMounted(async () => {
  if (isEdit.value) {
    await fetchBranchById();
  }
});
</script>

<template>
  <form @submit.prevent="handleSubmit()">
    <Card>
      <FieldGroup class="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Form {{ isEdit ? "Ubah" : "Tambah" }} Cabang</CardTitle>
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
                    <Badge variant="success" v-if="isMainIsLabel"
                      >Cabang Utama</Badge
                    >
                    <div class="flex items-center space-x-4" v-else>
                      <Switch
                        name="isMain"
                        id="isMain"
                        v-model="branch.is_main"
                        key="is_main"
                        @change="checkIsMain()"
                      />
                      <FieldContent>
                        <FieldLabel for="isMain"
                          >Jadikan Cabang Utama</FieldLabel
                        >
                      </FieldContent>
                    </div>
                  </Field>

                  <Field orientation="horizontal">
                    <div class="flex items-center space-x-4">
                      <Switch
                        name="isActive"
                        id="isActive"
                        v-model="branch.is_active"
                        key="is_active"
                        @change="checkIsMain()"
                      />
                      <FieldContent>
                        <FieldLabel for="isActive">Active</FieldLabel>
                      </FieldContent>
                    </div>
                  </Field>

                  <Field :data-invalid="!!errors.code" orientation="responsive">
                    <FieldLabel for="code">Kode Cabang</FieldLabel>
                    <div class="space-y-2">
                      <Input
                        v-model="branch.code"
                        id="code"
                        name="code"
                        placeholder="SBY"
                        autocomplete="off"
                        class="md:min-w-80 lg:min-w-90"
                        @input="branch.code = $event.target.value.toUpperCase()"
                        aria-invalid
                      />
                      <FieldError v-if="!!errors.code">{{
                        errors.code
                      }}</FieldError>
                    </div>
                  </Field>

                  <Field :data-invalid="!!errors.name" orientation="responsive">
                    <FieldLabel for="name">Nama Cabang</FieldLabel>
                    <div class="space-y-2">
                      <Input
                        v-model="branch.name"
                        id="name"
                        name="name"
                        placeholder="Surabaya"
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
                    :data-invalid="!!errors.email"
                    orientation="responsive"
                  >
                    <FieldLabel for="email" optional>Email</FieldLabel>
                    <div class="space-y-2">
                      <Input
                        v-model="branch.email"
                        id="email"
                        type="email"
                        name="email"
                        placeholder="cbg.surabaya@example.com"
                        autocomplete="off"
                        class="md:min-w-80 lg:min-w-90"
                        aria-invalid
                      />
                      <FieldError v-if="!!errors.email">{{
                        errors.email
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
                        v-model="branch.phone"
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
                </FieldGroup>
              </FieldSet>

              <FieldSeparator />

              <FieldSet>
                <FieldLegend>Alamat</FieldLegend>
                <FieldDescription
                  >Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                  Possimus, quasi?</FieldDescription
                >
                <FieldGroup>
                  <Field
                    orientation="responsive"
                    :data-invalid="!!errors.village_code"
                  >
                    <!-- Hanya 1 combobox yang user interact -->
                    <FieldLabel for="village">Kelurahan/Desa</FieldLabel>
                    <div class="space-y-2">
                      <ServerComboBox
                        class="md:min-w-80 lg:min-w-90"
                        v-model="branch.village_code"
                        :fetcher="fetcher"
                        value-key="village_code"
                        label-key="village_name"
                        placeholder="Cari kelurahan..."
                        :initialOption="selected"
                        @select="
                          onKelurahanSelect($event as WilayahKelurahan | null)
                        "
                      >
                        <!-- Custom option slot: tampilkan label lengkap -->
                        <template #option="{ option }">
                          <div class="flex flex-col">
                            <span class="font-medium">{{
                              option.village_name
                            }}</span>
                            <span class="text-xs text-muted-foreground">
                              {{ option.district_name }},
                              {{ option.regency_name }}
                            </span>
                          </div>
                        </template>
                      </ServerComboBox>
                      <FieldError v-if="!!errors.village_code">{{
                        errors.village_code
                      }}</FieldError>
                    </div>
                  </Field>

                  <Field
                    orientation="responsive"
                    :data-invalid="!!errors.district_code"
                  >
                    <FieldLabel for="district">Kecamatan</FieldLabel>
                    <div class="space-y-2">
                      <Select
                        v-model="branch.district_code"
                        id="district"
                        :disabled="true"
                        aria-invalid
                      >
                        <SelectTrigger class="md:min-w-80 lg:min-w-90">
                          <SelectValue placeholder="Kecamatan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem
                              :value="selected.district_code ?? '-'"
                              :key="selected.district_code ?? ('0' as string)"
                            >
                              {{ selected.district_name }}
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldError v-if="!!errors.district_code">{{
                        errors.district_code
                      }}</FieldError>
                    </div>
                  </Field>

                  <Field
                    orientation="responsive"
                    :data-invalid="!!errors.regency_code"
                  >
                    <FieldLabel for="regency">Kabupaten/Kota</FieldLabel>
                    <div class="space-y-2">
                      <Select
                        v-model="branch.regency_code"
                        id="regency"
                        :disabled="true"
                        aria-invalid
                      >
                        <SelectTrigger class="md:min-w-80 lg:min-w-90">
                          <SelectValue placeholder="Kabupaten" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem
                              :value="selected.regency_code ?? '-'"
                              :key="selected.regency_code ?? ('1' as string)"
                            >
                              {{ selected.regency_name }}
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldError v-if="!!errors.regency_code">{{
                        errors.regency_code
                      }}</FieldError>
                    </div>
                  </Field>

                  <Field
                    orientation="responsive"
                    :data-invalid="!!errors.province_code"
                  >
                    <FieldLabel for="province">Provinsi</FieldLabel>
                    <div class="space-y-2">
                      <Select
                        v-model="branch.province_code"
                        id="province"
                        :disabled="true"
                        aria-invalid
                      >
                        <SelectTrigger class="md:min-w-80 lg:min-w-90">
                          <SelectValue placeholder="Provinsi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectItem
                              :value="selected.province_code ?? '-'"
                              :key="selected.province_code ?? ('2' as string)"
                            >
                              {{ selected.province_name }}
                            </SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldError v-if="!!errors.province_code">{{
                        errors.province_code
                      }}</FieldError>
                    </div>
                  </Field>

                  <Field
                    :data-invalid="!!errors.postal_code"
                    orientation="responsive"
                    optional
                  >
                    <FieldLabel for="postal_code" optional>Kode Pos</FieldLabel>
                    <div class="space-y-2">
                      <Input
                        v-model="branch.postal_code"
                        id="postal_code"
                        name="postal_code"
                        placeholder="62435"
                        autocomplete="off"
                        class="md:min-w-80 lg:min-w-90"
                        aria-invalid
                      />
                      <FieldError v-if="!!errors.postal_code">{{
                        errors.postal_code
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
                        v-model="branch.address"
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
                </FieldGroup>
              </FieldSet>

              <FieldSeparator v-if="!isEdit" />

              <FieldSet v-if="!isEdit">
                <FieldLegend>Gudang</FieldLegend>
                <FieldDescription
                  >Lorem, ipsum dolor sit amet consectetur adipisicing elit. Obcaecati facere optio debitis?</FieldDescription
                >
                <FieldGroup>
                  <RadioGroup>
                    <FieldLabel for="new-warehouse">
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>Gudang Baru</FieldTitle>
                          <FieldDescription>
                            Buat gudang baru
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem
                          id="new-warehouse"
                          value="new_warehouse"
                        />
                      </Field>
                    </FieldLabel>
                    <FieldLabel for="warehouse_exists">
                      <Field orientation="horizontal">
                        <FieldContent>
                          <FieldTitle>Gudang Sudah Ada</FieldTitle>
                          <FieldDescription>
                            Assign gudang yang sudah ada.
                          </FieldDescription>
                        </FieldContent>
                        <RadioGroupItem id="warehouse_exists" value="warehouse_exists" />
                      </Field>
                    </FieldLabel>
                  </RadioGroup>
                  <Field
                    :data-invalid="!!errors.warehouse_code"
                    orientation="responsive"
                  >
                    <FieldLabel for="warehouseName">Kode Gudang</FieldLabel>
                    <div class="space-y-2">
                      <Input
                        v-model="warehouse.warehouse_code"
                        id="warehouseName"
                        name="warehouse_code"
                        placeholder="WR-SBY"
                        autocomplete="off"
                        class="md:min-w-80 lg:min-w-90"
                        @input="
                          warehouse.warehouse_code =
                            $event.target.value.toUpperCase()
                        "
                        aria-invalid
                      />
                      <FieldError v-if="!!errors.warehouse_code">{{
                        errors.warehouse_code
                      }}</FieldError>
                    </div>
                  </Field>
                  <Field
                    :data-invalid="!!errors.warehouse_name"
                    orientation="responsive"
                  >
                    <FieldLabel for="warehouseName">Nama Gudang</FieldLabel>
                    <div class="space-y-2">
                      <Input
                        v-model="warehouse.warehouse_name"
                        id="warehouseName"
                        name="warehouse_name"
                        placeholder="Surabaya"
                        autocomplete="off"
                        class="md:min-w-80 lg:min-w-90"
                        aria-invalid
                      />
                      <FieldError v-if="!!errors.warehouse_name">{{
                        errors.warehouse_name
                      }}</FieldError>
                    </div>
                  </Field>
                  <Field orientation="horizontal">
                    <div class="flex items-center space-x-4">
                      <Switch
                        name="is_same_address"
                        id="isSameAddress"
                        v-model="warehouse.is_same_address"
                        @change="(e: Event) => handleWarehouseAddress(e)"
                      />
                      <FieldContent>
                        <FieldLabel for="isSameAddress"
                          >Alamat sama dengan cabang</FieldLabel
                        >
                      </FieldContent>
                    </div>
                  </Field>
                  <Field
                    :data-invalid="!!errors.warehouse_address"
                    orientation="responsive"
                    v-if="!warehouse.is_same_address"
                  >
                    <FieldLabel for="warehouse_address"
                      >Alamat Gudang</FieldLabel
                    >
                    <div class="space-y-2">
                      <Textarea
                        v-model="warehouse.warehouse_address"
                        id="warehouse_address"
                        name="warehouse_address"
                        placeholder="Jl. Pahlawan No. 1"
                        autocomplete="off"
                        class="md:min-w-80 lg:min-w-90"
                        aria-invalid
                      />
                      <FieldError v-if="!!errors.warehouse_address">{{
                        errors.warehouse_address
                      }}</FieldError>
                    </div>
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
