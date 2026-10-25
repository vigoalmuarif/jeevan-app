<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { normalizeError } from "@/lib/errors";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { computed, onMounted, ref } from "vue";
import { Switch } from "@/components/ui/switch";
import { watch } from "vue";
import { Textarea } from "@/components/ui/textarea";
import ServerComboBox from "@/components/server-combobox/ServerComboBox.vue";
import { VisuallyHidden } from "reka-ui";
import { toast } from "vue-sonner";
import { router } from "@/core/router/route";
import { useRoute } from "vue-router";
import { supplierService } from "../../services/supplier.service";
import type { Supplier, SupplierPayload } from "@/core/types/supplier.types";
import { wilayahService } from "@/core/services/wilayah.service";
import InputGroup from "@/components/ui/input-group/InputGroup.vue";
import InputGroupInput from "@/components/ui/input-group/InputGroupInput.vue";
import InputGroupAddon from "@/components/ui/input-group/InputGroupAddon.vue";

const props = defineProps<{
  selectedSupplier?: Supplier;
  id?: number;
}>();

const route = useRoute();

const loading = ref(false);
const loadingFetch = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");
const isEdit = computed(() => route.params.id);
const regions = wilayahService.searchKabupaten;

const initialSupplier = {
  code: "",
  name: "",
  contact_person: "",
  email: "",
  phone: "",
  tax_id: null,
  address: "",
  region_code: null,
  postal_code: "",
  payment_term_days: undefined,
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  notes: "",
  created_by: "",
  is_active: true,
};

const initialRegion = ref({
  nama: '',
  kode: ''
});

const supplier = ref<SupplierPayload>({ ...initialSupplier });

function resetForm() {
  supplier.value = { ...initialSupplier };
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
      await supplierService.update(supplier.value, route.params.id as string);
      toast.success("Supplier berhasil diperbarui 🎉");
    } else {
      const payload = { ...supplier.value };
      await supplierService.store(payload);
      router.push({
        name: "partner.suppliers.index",
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

const fetchSupplierById = async () => {
  loadingFetch.value = true;
  generalError.value = "";

  try {
    const res = await supplierService.edit(route.params.id as string);
    syncSupplierResponse(res.data);
  } finally {
    loadingFetch.value = false;
  }
};

const syncSupplierResponse = (data: Supplier) => {
  supplier.value.code = data.code;
  supplier.value.name = data.name;
  supplier.value.contact_person = data.contact_person;
  supplier.value.email = data.email;
  supplier.value.phone = data.phone;
  supplier.value.region_code = data.region_code;
  supplier.value.address = data.address;
  supplier.value.postal_code = data.postal_code;
  supplier.value.payment_term_days = data.payment_term_days;
  supplier.value.bank_name = data.bank_name;
  supplier.value.bank_account_name = data.bank_account_name;
  supplier.value.bank_account_number = data.bank_account_number;
  supplier.value.notes = data.notes;
  supplier.value.is_active = data.is_active;

  initialRegion.value.kode = data.region?.kode as string;
  initialRegion.value.nama = data.region?.nama as string;
};

// watch(selected, (val) => {
//   supplier.value.region_code as string = val.regency_id as string;
// });

onMounted(async () => {
  if (isEdit.value) {
    await fetchSupplierById();
  }
});
</script>

<template>
  <form @submit.prevent="handleSubmit()">
    <Card>
      <FieldGroup class="w-full mx-auto lg:px-6 pb-6">
        <CardHeader>
          <CardTitle>Form {{ isEdit ? "Ubah" : "Tambah" }} Supplier</CardTitle>
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
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <FieldGroup>
                    <Field
                      :data-invalid="!!errors.code"
                      orientation="responsive"
                    >
                      <FieldLabel for="code" required>Kode</FieldLabel>
                      <div class="space-y-2">
                        <Input
                          v-model="supplier.code"
                          id="code"
                          name="code"
                          placeholder="ANSM"
                          autocomplete="off"
                          class="md:min-w-80 lg:min-w-90"
                          @input="
                            supplier.code = $event.target.value.toUpperCase()
                          "
                          aria-invalid
                        />
                        <FieldError v-if="!!errors.code">{{
                          errors.code
                        }}</FieldError>
                      </div>
                    </Field>

                    <Field
                      :data-invalid="!!errors.name"
                      orientation="responsive"
                    >
                      <FieldLabel for="name" required>Nama</FieldLabel>
                      <div class="space-y-2">
                        <Input
                          v-model="supplier.name"
                          id="name"
                          name="name"
                          placeholder="PT. Anugrah Semesta"
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
                      <FieldLabel for="email">Email</FieldLabel>
                      <div class="space-y-2">
                        <Input
                          v-model="supplier.email"
                          id="email"
                          type="email"
                          name="email"
                          placeholder="supplier@example.com"
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
                      :data-invalid="!!errors.contact_person"
                      orientation="responsive"
                    >
                      <FieldLabel for="contact_person"
                        >Contact Person</FieldLabel
                      >
                      <div class="space-y-2">
                        <Input
                          v-model="supplier.contact_person"
                          id="contact_person"
                          name="contact_person"
                          placeholder="Jesika"
                          autocomplete="off"
                          class="md:min-w-80 lg:min-w-90"
                          aria-invalid
                        />
                        <FieldError v-if="!!errors.contact_person">{{
                          errors.contact_person
                        }}</FieldError>
                      </div>
                    </Field>

                    <Field
                      :data-invalid="!!errors.phone"
                      orientation="responsive"
                    >
                      <FieldLabel for="phone">Nomor Telepon</FieldLabel>
                      <div class="space-y-2">
                        <Input
                          v-model="supplier.phone"
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
                      orientation="responsive"
                      :data-invalid="!!errors.region_code"
                    >
                      <!-- Hanya 1 combobox yang user interact -->
                      <FieldLabel for="region">Regional</FieldLabel>
                      <div class="space-y-2">
                        <ServerComboBox
                          class="md:min-w-80 lg:min-w-90"
                          v-model="supplier.region_code"
                          :fetcher="regions"
                          value-key="kode"
                          label-key="nama"
                          placeholder="Cari regional..."
                          :initial-option="initialRegion"
                        >
                          <!-- Custom option slot: tampilkan label lengkap -->
                          <template #option="{ option }">
                            <div class="flex flex-col">
                              <span class="font-medium">{{ option.nama }}</span>
                            </div>
                          </template>
                        </ServerComboBox>
                        <FieldError v-if="!!errors.region_code">{{
                          errors.region_code
                        }}</FieldError>
                      </div>
                    </Field>

                    <Field
                      :data-invalid="!!errors.address"
                      orientation="responsive"
                    >
                      <FieldLabel for="address">Alamat</FieldLabel>
                      <div class="space-y-2">
                        <Textarea
                          v-model="supplier.address"
                          id="address"
                          name="address"
                          placeholder="44564"
                          autocomplete="off"
                          class="md:min-w-80 lg:min-w-90"
                          aria-invalid
                        />
                        <FieldError v-if="!!errors.address">{{
                          errors.address
                        }}</FieldError>
                      </div>
                    </Field>

                    <Field
                      :data-invalid="!!errors.postal_code"
                      orientation="responsive"
                    >
                      <FieldLabel for="postal_code">Kode Pos</FieldLabel>
                      <div class="space-y-2">
                        <Input
                          v-model="supplier.postal_code"
                          type="number"
                          id="postal_code"
                          name="postal_code"
                          placeholder="44564"
                          autocomplete="off"
                          class="md:min-w-80 lg:min-w-90"
                          aria-invalid
                        />
                        <FieldError v-if="!!errors.postal_code">{{
                          errors.postal_code
                        }}</FieldError>
                      </div>
                    </Field>
                  </FieldGroup>

                  <FieldGroup>
                    <Field
                      :data-invalid="!!errors.payment_term_days"
                      orientation="responsive"
                    >
                      <FieldLabel for="payment_term_days" required
                        >Payment Term Days</FieldLabel
                      >
                      <div class="space-y-2">
                        <InputGroup class="md:min-w-80 lg:min-w-90">
                          <InputGroupInput
                            v-model="supplier.payment_term_days"
                            type="number"
                            id="payment_term_days"
                            name="payment_term_days"
                            placeholder="30"
                            autocomplete="off"
                            aria-invalid
                          />
                          <InputGroupAddon align="inline-end">
                            Hari
                          </InputGroupAddon>
                        </InputGroup>
                        <FieldError v-if="!!errors.payment_term_days">{{
                          errors.payment_term_days
                        }}</FieldError>
                      </div>
                    </Field>

                    <Field
                      :data-invalid="!!errors.bank_name"
                      orientation="responsive"
                    >
                      <FieldLabel for="bank_name">Nama Bank</FieldLabel>
                      <div class="space-y-2">
                        <Input
                          v-model="supplier.bank_name"
                          id="bank_name"
                          name="bank_name"
                          placeholder="BCA"
                          autocomplete="off"
                          class="md:min-w-80 lg:min-w-90"
                          aria-invalid
                        />
                        <FieldError v-if="!!errors.bank_name">{{
                          errors.bank_name
                        }}</FieldError>
                      </div>
                    </Field>

                    <Field
                      :data-invalid="!!errors.bank_account_name"
                      orientation="responsive"
                    >
                      <FieldLabel for="bank_account_name"
                        >Nama Akun Bank</FieldLabel
                      >
                      <div class="space-y-2">
                        <Input
                          v-model="supplier.bank_account_name"
                          id="bank_account_name"
                          name="bank_account_name"
                          placeholder="Jesika"
                          autocomplete="off"
                          class="md:min-w-80 lg:min-w-90"
                          aria-invalid
                        />
                        <FieldError v-if="!!errors.bank_account_name">{{
                          errors.bank_account_name
                        }}</FieldError>
                      </div>
                    </Field>

                    <Field
                      :data-invalid="!!errors.bank_account_number"
                      orientation="responsive"
                    >
                      <FieldLabel for="bank_account_number"
                        >Nomer Akun Bank</FieldLabel
                      >
                      <div class="space-y-2">
                        <Input
                          v-model="supplier.bank_account_number"
                          type="number"
                          id="bank_account_number"
                          name="bank_account_number"
                          placeholder="1234567"
                          autocomplete="off"
                          class="md:min-w-80 lg:min-w-90"
                          aria-invalid
                        />
                        <FieldError v-if="!!errors.bank_account_number">{{
                          errors.bank_account_number
                        }}</FieldError>
                      </div>
                    </Field>

                    <Field
                      :data-invalid="!!errors.notes"
                      orientation="responsive"
                    >
                      <FieldLabel for="notes">Keterangan</FieldLabel>
                      <div class="space-y-2">
                        <Textarea
                          v-model="supplier.notes"
                          id="notes"
                          name="notes"
                          placeholder="Keterangan"
                          autocomplete="off"
                          class="md:min-w-80 lg:min-w-90"
                          aria-invalid
                        />
                        <FieldError v-if="!!errors.notes">{{
                          errors.notes
                        }}</FieldError>
                      </div>
                    </Field>

                    <Field orientation="horizontal">
                      <div class="flex items-center w-full">
                        <FieldContent>
                          <FieldLabel for="isActive">Active</FieldLabel>
                        </FieldContent>
                        <Switch
                          name="isActive"
                          id="isActive"
                          v-model="supplier.is_active"
                          key="is_active"
                        />
                      </div>
                    </Field>
                    <Button
                      type="submit"
                      :disabled="loading || loadingFetch"
                      class="w-full"
                    >
                      <Spinner v-if="loading" />
                      {{ loading ? "Menyimpan..." : "Simpan" }}
                    </Button>
                  </FieldGroup>
                </div>
              </FieldSet>
            </template>
          </FieldGroup>
        </CardContent>
      </FieldGroup>
    </Card>
  </form>
</template>
