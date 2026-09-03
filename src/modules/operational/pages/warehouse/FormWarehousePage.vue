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
import { normalizeError } from "@/lib/errors";
import type {
  WarehouseInfo,
  WarehousePayload,
} from "@/core/types/warehouse.types";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { computed, onMounted, ref } from "vue";
import { Switch } from "@/components/ui/switch";
import { watch } from "vue";
import { Textarea } from "@/components/ui/textarea";
import type { WilayahKelurahan } from "@/core/types/wilayah.types";
import { VisuallyHidden } from "reka-ui";
import { toast } from "vue-sonner";
import { router } from "@/core/router/route";
import { useRoute } from "vue-router";
import Badge from "@/components/ui/badge/Badge.vue";
import type { BranchCombobox } from "@/core/types/branch.types";
import { branchService } from "../../services/branch.service";
import { cn } from "@/lib/utils";
import { CheckIcon, Loader2, ChevronsUpDown } from "@lucide/vue";

const props = defineProps<{
  selectedWarehouse?: WarehouseInfo;
  id?: number;
}>();

const route = useRoute();

const loading = ref(false);
const loadingFetch = ref(false);
const loadingFetchBranch = ref(false);
const branchOpen = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");
const isEdit = computed(() => route.params.id);
const selectedBranch = ref<BranchCombobox>();
const branches = ref<BranchCombobox[]>();

const initialWarehouse = {
  branch_id: undefined,
  code: "",
  name: "",
  phone: "",
  address: "",
  is_active: true,
  is_main: false,
};

const warehouse = ref<WarehousePayload>({ ...initialWarehouse });

const fetchBranches = async () => {
  loadingFetchBranch.value = true;
  try {
    const res = await branchService.combobox();

    branches.value = res.data;
  } catch (e) {
    toast.error("Gagal memuat gudang");
  } finally {
    loadingFetchBranch.value = false;
  }
};

fetchBranches();

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
      isMainIsLabel.value = warehouse.value.is_main;
      toast.success("Gudang berhasil diperbarui 🎉");
    } else {
      const payload = { ...warehouse.value, ...warehouse.value };
      await warehouseService.store(payload);
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

const isMainIsLabel = ref(false);

const handleSelectBranch = (data: BranchCombobox) => {
  selectedBranch.value = data;
  warehouse.value.branch_id = selectedBranch.value.id;
  branchOpen.value = false;
};

const fetchWarehouse = async () => {
  loadingFetch.value = true;
  try {
    const res = await warehouseService.edit(route.params.id as string);
    warehouse.value = {
      branch_id: res.data.branch?.id as number,
      name: res.data.name,
      code: res.data.code,
      phone: res.data.phone,
      address: res.data.address,
      is_active: res.data.is_active,
      is_main: res.data.is_main,
    };
    selectedBranch.value = res.data.branch;
  } catch (e) {
    toast.error("Gagal mengambil data, coba lagi");
  } finally {
    loadingFetch.value = false;
  }
};

onMounted(async () => {
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
                    <Badge variant="success" v-if="isMainIsLabel"
                      >Gudang Utama</Badge
                    >
                    <div
                      class="flex items-center space-x-4"
                      v-else
                      v-if="isEdit"
                    >
                      <Switch
                        name="isMain"
                        id="isMain"
                        v-model="warehouse.is_main"
                        key="is_main"
                      />
                      <FieldContent>
                        <FieldLabel for="isMain"
                          >Jadikan Gudang Utama</FieldLabel
                        >
                      </FieldContent>
                    </div>
                  </Field>

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
                    orientation="responsive"
                    :data-invalid="!!errors.branch_id"
                  >
                    <!-- Hanya 1 combobox yang user interact -->
                    <FieldLabel for="branch">Cabang</FieldLabel>
                    <div class="space-y-2">
                      <Popover v-model:open="branchOpen">
                        <PopoverTrigger as-child>
                          <Button
                            variant="outline"
                            id="branch"
                            :aria-expanded="branchOpen"
                            role="combobox"
                            class="justify-between font-normal md:min-w-80 lg:min-w-90"
                            aria-invalid
                          >
                            <span class="truncate">
                              {{ selectedBranch?.name || "Pilih Cabang" }}
                            </span>
                            <ChevronsUpDown
                              class="ml-2 h-4 w-4 shrink-0 opacity-50"
                            />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent class="min-w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Cari Cabang..." />
                            <!-- Loading state -->
                            <div
                              v-if="loadingFetchBranch"
                              class="flex items-center justify-center py-6 text-sm text-muted-foreground"
                            >
                              <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                              Memuat...
                            </div>
                            <CommandList v-else>
                              <CommandEmpty>No results found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  v-for="branch in branches"
                                  :value="branch.id"
                                  :key="branch.id"
                                  class="hover:bg-muted"
                                  @select="handleSelectBranch(branch)"
                                  :data-selected="
                                    selectedBranch?.id === branch.id
                                  "
                                  :data-state="
                                    selectedBranch?.id === branch.id
                                      ? 'checked'
                                      : 'unchecked'
                                  "
                                  >{{ branch.name }}
                                  <CheckIcon
                                    :class="
                                      cn(
                                        'ml-auto',
                                        selectedBranch?.id === branch.id
                                          ? 'opacity-100'
                                          : 'opacity-0',
                                      )
                                    "
                                  />
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <FieldError v-if="!!errors.branch_id">{{
                        errors.branch_id
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
