<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Add01Icon,
  Delete03Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import ComboboxSelect from "@/components/ui/combobox/ComboboxSelect.vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import MoneyInput from "@/components/ui/input-group/MoneyInput.vue";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import ServerComboBox from "@/components/server-combobox/ServerComboBox.vue";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { normalizeError } from "@/lib/errors";
import { toast } from "vue-sonner";
import type { ComboboxFetcher } from "@/core/composables/useComboBox";
import { goodsReceiptService } from "../../services/goods-receipt.service";
import { purchaseRequestService } from "../../services/purchase-request.service";
import type {
  PurchaseRequest,
  PurchaseRequestItemPayload,
  PurchaseRequestListItem,
  PurchaseRequestOptions,
  PurchaseRequestPayload,
} from "../../types/purchase-request.types";
import type { GoodsReceiptProductOption } from "../../types/goods-receipt.types";

const open = defineModel<boolean>("open", { default: false });
const props = defineProps<{
  selectedRequest?: PurchaseRequestListItem;
  options: PurchaseRequestOptions;
}>();
const emit = defineEmits<{ saved: [request: PurchaseRequest] }>();

type DraftItem = {
  selection: string | null;
  product_variant_id: number | null;
  unit_id: number | null;
  unit_quantity: number | string;
  on_hand_base_quantity: number | string;
  suggested_supplier_id: number | null;
  estimated_unit_price: number | string;
  notes: string;
};

type Draft = {
  warehouse_id: string;
  branch_id: string;
  request_date: string;
  required_date: string;
  notes: string;
  items: DraftItem[];
};

const emptyItem = (): DraftItem => ({
  selection: "",
  product_variant_id: null,
  unit_id: null,
  unit_quantity: "",
  on_hand_base_quantity: 0,
  suggested_supplier_id: null,
  estimated_unit_price: 0,
  notes: "",
});

const initialDraft = (): Draft => ({
  warehouse_id: "",
  branch_id: "",
  request_date: new Date().toISOString().slice(0, 10),
  required_date: "",
  notes: "",
  items: [emptyItem()],
});

const form = reactive<Draft>(initialDraft());
const selectedProductOptions = reactive<
  Record<string, GoodsReceiptProductOption>
>({});
const loading = ref(false);
const loadingFetch = ref(false);
const loadingFetchError = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");

const isEdit = computed(() => !!props.selectedRequest);
const numberFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 4,
});
const warehouseOptions = computed(() =>
  props.options.warehouses.map((warehouse) => ({
    value: String(warehouse.id),
    label: `${warehouse.name}${warehouse.code ? ` (${warehouse.code})` : ""}`,
  })),
);
const branchOptions = computed(() => [
  { value: "", label: "Tanpa cabang" },
  ...props.options.branches.map((branch) => ({
    value: String(branch.id),
    label: `${branch.name}${branch.code ? ` (${branch.code})` : ""}`,
  })),
]);
const supplierOptions = computed(() =>
  props.options.suppliers.map((supplier) => ({
    value: String(supplier.id),
    label: `${supplier.name}${supplier.code ? ` (${supplier.code})` : ""}`,
  })),
);

const fetchProductUnits: ComboboxFetcher = (search, params, requestOptions) =>
  goodsReceiptService.searchProductUnits(search, params, requestOptions);

function findOption(selection: string | null) {
  return selection ? selectedProductOptions[selection] : undefined;
}

function unitOptions(item: DraftItem) {
  return (findOption(item.selection)?.units ?? []).map((unit) => ({
    value: String(unit.unit_id),
    label: `${unit.unit_name} (${unit.unit_code})`,
  }));
}

function selectedProductIds(item: DraftItem) {
  const selectedIds: number[] = [];
  for (const other of form.items) {
    if (other !== item && other.product_variant_id !== null) {
      selectedIds.push(other.product_variant_id);
    }
  }
  return selectedIds;
}

function setSelectedOption(
  item: DraftItem,
  option: GoodsReceiptProductOption | null,
) {
  if (!option) {
    item.selection = "";
    item.product_variant_id = null;
    item.unit_id = null;
    item.estimated_unit_price = 0;
    return;
  }
  if (selectedProductIds(item).includes(option.product_variant_id)) {
    item.selection =
      item.product_variant_id === null ? "" : String(item.product_variant_id);
    toast.warning("Produk tersebut sudah ada dalam daftar Purchase Request.");
    return;
  }
  item.selection = String(option.product_variant_id);
  selectedProductOptions[item.selection] = option;
  item.product_variant_id = option.product_variant_id;
  const baseUnit = option.units.find((unit) => unit.is_base) ?? option.units[0];
  item.unit_id = baseUnit?.unit_id ?? null;
  item.estimated_unit_price = Number(baseUnit?.unit_cost) || 0;
}

function setSelectedUnit(item: DraftItem, value: unknown) {
  const unitId = Number(value);
  item.unit_id = Number.isFinite(unitId) && unitId > 0 ? unitId : null;
  const selectedUnit = findOption(item.selection)?.units.find(
    (unit) => unit.unit_id === item.unit_id,
  );
  if (
    selectedUnit &&
    selectedUnit.unit_cost !== null &&
    selectedUnit.unit_cost !== undefined
  ) {
    item.estimated_unit_price = Number(selectedUnit.unit_cost) || 0;
  }
}

function baseQuantity(item: DraftItem) {
  const conversionRate = findOption(item.selection)?.units.find(
    (unit) => unit.unit_id === item.unit_id,
  )?.conversion_rate;
  return (Number(item.unit_quantity) || 0) * (Number(conversionRate) || 1);
}

function resetForm() {
  Object.assign(form, initialDraft());
  Object.keys(selectedProductOptions).forEach(
    (key) => delete selectedProductOptions[key],
  );
  errors.value = {};
  generalError.value = "";
  loadingFetchError.value = false;
}

function addItem() {
  form.items.push(emptyItem());
}

function removeItem(index: number) {
  if (form.items.length > 1) form.items.splice(index, 1);
}

function itemError(index: number) {
  return (
    errors.value[`items.${index}.unit_quantity`] ??
    errors.value[`items.${index}.unit_id`] ??
    errors.value[`items.${index}.product_variant_id`] ??
    ""
  );
}

async function fetchRequest() {
  if (!props.selectedRequest) return;
  loadingFetch.value = true;
  loadingFetchError.value = false;
  try {
    const pr = await purchaseRequestService.show(props.selectedRequest.id);
    const items = pr.items.map((item) => {
      const selection = String(item.product_variant_id);
      const option: GoodsReceiptProductOption = {
        selection,
        label: `${item.product_name ?? "Produk tidak tersedia"}${item.variant_name ? ` / ${item.variant_name}` : ""} · SKU ${item.sku ?? "-"}`,
        product_id: 0,
        product_name: item.product_name ?? "Produk tidak tersedia",
        product_variant_id: item.product_variant_id,
        variant_name: item.variant_name,
        sku: item.sku ?? "",
        units: [
          {
            unit_id: item.unit_id,
            unit_name: item.unit_name ?? "Satuan tidak tersedia",
            unit_code: item.unit_code ?? "",
            conversion_rate: item.conversion_rate,
            is_base: false,
            unit_cost: Number(item.estimated_unit_price) || 0,
          },
        ],
        tax_rate: 0,
      };
      selectedProductOptions[selection] = option;
      return {
        selection,
        product_variant_id: item.product_variant_id,
        unit_id: item.unit_id,
        unit_quantity: Number(item.unit_quantity),
        on_hand_base_quantity: Number(item.on_hand_base_quantity) || 0,
        suggested_supplier_id: item.suggested_supplier_id,
        estimated_unit_price: Number(item.estimated_unit_price) || 0,
        notes: item.notes ?? "",
      };
    });

    Object.assign(form, {
      warehouse_id: String(pr.warehouse_id),
      branch_id: pr.branch_id ? String(pr.branch_id) : "",
      request_date: pr.request_date,
      required_date: pr.required_date ?? "",
      notes: pr.notes ?? "",
      items: items.length > 0 ? items : [emptyItem()],
    });
  } catch (error) {
    loadingFetchError.value = true;
    generalError.value = normalizeError(error).message;
  } finally {
    loadingFetch.value = false;
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    if (props.selectedRequest) {
      void fetchRequest();
    } else {
      resetForm();
    }
  } else {
    resetForm();
  }
});

async function submit() {
  loading.value = true;
  errors.value = {};
  generalError.value = "";

  const payload: PurchaseRequestPayload = {
    warehouse_id: Number(form.warehouse_id),
    branch_id: form.branch_id ? Number(form.branch_id) : null,
    request_date: form.request_date,
    required_date: form.required_date || null,
    notes: form.notes || undefined,
    items: form.items.map(
      (item): PurchaseRequestItemPayload => ({
        product_variant_id: Number(item.product_variant_id),
        unit_id: Number(item.unit_id),
        unit_quantity: Number(item.unit_quantity),
        on_hand_base_quantity: Number(item.on_hand_base_quantity) || 0,
        suggested_supplier_id: item.suggested_supplier_id
          ? Number(item.suggested_supplier_id)
          : null,
        estimated_unit_price: Number(item.estimated_unit_price) || null,
        notes: item.notes || undefined,
      }),
    ),
  };

  try {
    const saved =
      isEdit.value && props.selectedRequest
        ? await purchaseRequestService.update(props.selectedRequest.id, payload)
        : await purchaseRequestService.store(payload);

    emit("saved", saved);
    open.value = false;
  } catch (error) {
    const normalized = normalizeError(error);
    errors.value = normalized.errors;
    generalError.value = normalized.message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-[94dvh] max-h-[97dvh] w-[calc(100vw-0.5rem)] max-w-[calc(100vw-0.5rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-7xl"
    >
      <DialogHeader class="border-b px-4 py-4 pr-12 sm:px-6 sm:py-5">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <HugeiconsIcon :icon="ShoppingBag01Icon" aria-hidden="true" />
          </div>
          <div class="flex flex-col gap-1 min-w-0">
            <DialogTitle>{{
              isEdit
                ? `Ubah Purchase Request ${selectedRequest?.document_number}`
                : "Buat Purchase Request Baru"
            }}</DialogTitle>
            <DialogDescription>
              Ajukan permintaan pembelian barang kebutuhan gudang/cabang sebelum
              proses pemesanan.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div
        v-if="loadingFetch"
        class="flex min-h-60 items-center justify-center"
      >
        <Spinner class="size-8" />
      </div>

      <div v-else-if="loadingFetchError" class="flex flex-col gap-4 py-4">
        <Alert variant="destructive">
          <AlertTitle>Gagal memuat Purchase Request</AlertTitle>
          <AlertDescription>{{ generalError }}</AlertDescription>
        </Alert>
        <Button variant="outline" @click="fetchRequest">Coba lagi</Button>
      </div>

      <form
        v-else
        class="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
        @submit.prevent="submit"
      >
        <div class="min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6">
        <Alert v-if="generalError" variant="destructive">
          <AlertTitle>Terjadi kesalahan</AlertTitle>
          <AlertDescription>{{ generalError }}</AlertDescription>
        </Alert>

        <!-- Informasi Dokumen -->
        <section class="shrink-0 overflow-hidden rounded-xl border">
          <header class="bg-primary/5 px-4 py-3">
            <h3 class="text-sm font-semibold">Informasi Purchase Request</h3>
            <p class="text-xs text-muted-foreground">
              Tentukan gudang kebutuhan, cabang peminta, dan jadwal permintaan.
            </p>
          </header>
          <div class="p-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field :data-invalid="!!errors.warehouse_id">
                <FieldLabel required>Gudang Kebutuhan</FieldLabel>
                <ComboboxSelect
                  v-model="form.warehouse_id"
                  :options="warehouseOptions"
                  placeholder="Pilih gudang"
                  search-placeholder="Cari gudang..."
                  :aria-invalid="!!errors.warehouse_id"
                />
                <FieldError :errors="[errors.warehouse_id]" />
              </Field>

              <Field
                v-if="options.branches && options.branches.length > 0"
                :data-invalid="!!errors.branch_id"
              >
                <FieldLabel>Cabang Peminta (Opsional)</FieldLabel>
                <ComboboxSelect
                  v-model="form.branch_id"
                  :options="branchOptions"
                  placeholder="Pilih cabang"
                  search-placeholder="Cari cabang..."
                  :aria-invalid="!!errors.branch_id"
                />
                <FieldError :errors="[errors.branch_id]" />
              </Field>

              <Field :data-invalid="!!errors.request_date">
                <FieldLabel required>Tanggal Permintaan</FieldLabel>
                <Input
                  v-model="form.request_date"
                  type="date"
                  :aria-invalid="!!errors.request_date"
                />
                <FieldError :errors="[errors.request_date]" />
              </Field>

              <Field :data-invalid="!!errors.required_date">
                <FieldLabel>Tanggal Dibutuhkan</FieldLabel>
                <Input
                  v-model="form.required_date"
                  type="date"
                  :aria-invalid="!!errors.required_date"
                />
                <FieldError :errors="[errors.required_date]" />
              </Field>
            </div>
          </div>
        </section>

        <!-- Tabel Item Permintaan -->
        <section class="min-w-0 shrink-0 rounded-xl border">
          <header
            class="flex min-w-0 flex-wrap items-center justify-between gap-3 bg-primary/5 px-4 py-3"
          >
            <div class="min-w-0">
              <h3 class="text-sm font-semibold">Item Purchase Request</h3>
              <p class="text-xs text-muted-foreground">
                Tentukan produk, varian, dan kuantitas yang dibutuhkan.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" @click="addItem">
              <HugeiconsIcon
                :icon="Add01Icon"
                data-icon="inline-start"
                aria-hidden="true"
              />
              Tambah Item
            </Button>
          </header>

          <div
            class="w-full min-w-0 max-w-full overflow-x-auto overflow-y-visible rounded-b-xl border-t overscroll-x-contain"
          >
            <table class="w-full min-w-[1180px] table-fixed text-left text-sm">
              <colgroup>
                <col class="w-[5%]" />
                <col class="w-[30%]" />
                <col class="w-[12%]" />
                <col class="w-[9%]" />
                <col class="w-[14%]" />
                <col class="w-[16%]" />
                <col class="w-[10%]" />
                <col class="w-[4%]" />
              </colgroup>
              <thead class="border-b bg-muted/95 text-xs text-muted-foreground">
                <tr>
                  <th class="w-12 p-3 text-center">No.</th>
                  <th class="p-3">Produk / Varian</th>
                  <th class="p-3">Satuan</th>
                  <th class="p-3 text-right">Jumlah</th>
                  <th class="p-3 text-right">Estimasi Harga</th>
                  <th class="p-3">Supplier Usulan</th>
                  <th class="p-3">Catatan Item</th>
                  <th class="p-3 text-center"></th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="(item, index) in form.items"
                  :key="index"
                  class="align-top hover:bg-muted/10"
                >
                  <td class="p-2 text-center align-top text-muted-foreground">
                    {{ index + 1 }}
                  </td>
                  <td class="w-[30%] min-w-0 p-2 align-top">
                    <ServerComboBox
                      :key="`combobox-${index}`"
                      v-model="item.selection"
                      :fetcher="fetchProductUnits"
                      value-key="selection"
                      label-key="label"
                      :exclude-values="selectedProductIds(item)"
                      :initial-option="findOption(item.selection)"
                      class="w-full min-w-0"
                      placeholder="Cari produk / SKU..."
                      search-placeholder="Cari produk, varian, atau SKU..."
                      :aria-invalid="
                        !!errors[`items.${index}.product_variant_id`]
                      "
                      @select="
                        (opt) =>
                          setSelectedOption(
                            item,
                            opt as GoodsReceiptProductOption,
                          )
                      "
                    />
                    <p
                      v-if="itemError(index)"
                      class="mt-1 text-xs text-destructive"
                    >
                      {{ itemError(index) }}
                    </p>
                  </td>

                  <td class="min-w-0 p-2 align-top">
                    <ComboboxSelect
                      :model-value="item.unit_id ? String(item.unit_id) : ''"
                      :options="unitOptions(item)"
                      placeholder="Pilih satuan"
                      search-placeholder="Cari satuan..."
                      :disabled="!item.selection"
                      :aria-invalid="!!errors[`items.${index}.unit_id`]"
                      @update:model-value="(val) => setSelectedUnit(item, val)"
                    />
                    <p
                      v-if="baseQuantity(item) > 0"
                      class="mt-1 text-[11px] text-muted-foreground"
                    >
                      = {{ numberFormat.format(baseQuantity(item)) }} satuan
                      dasar
                    </p>
                  </td>

                  <td class="min-w-0 p-2 text-right align-top">
                    <Input
                      v-model="item.unit_quantity"
                      type="number"
                      step="any"
                      min="0"
                      class="text-right"
                      placeholder="0"
                    />
                  </td>

                  <td class="min-w-0 p-2 text-right align-top">
                    <MoneyInput
                      v-model="item.estimated_unit_price"
                      class="text-right"
                      placeholder="0"
                    />
                  </td>

                  <td class="min-w-0 p-2 align-top">
                    <ComboboxSelect
                      :model-value="
                        item.suggested_supplier_id
                          ? String(item.suggested_supplier_id)
                          : ''
                      "
                      :options="supplierOptions"
                      placeholder="Pilih supplier (opsional)"
                      search-placeholder="Cari supplier..."
                      @update:model-value="
                        (val) =>
                          (item.suggested_supplier_id = val
                            ? Number(val)
                            : null)
                      "
                    />
                  </td>

                  <td class="min-w-0 p-2 align-top">
                    <Input
                      v-model="item.notes"
                      placeholder="Keterangan..."
                      class=""
                    />
                  </td>

                  <td class="p-2 text-center pt-2.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      class="size-8 text-destructive hover:bg-destructive/10"
                      :disabled="form.items.length <= 1"
                      @click="removeItem(index)"
                    >
                      <HugeiconsIcon :icon="Delete03Icon" aria-hidden="true" />
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Catatan PR -->
        <section class="min-w-0 shrink-0 overflow-hidden rounded-xl border">
          <header class="min-w-0 bg-primary/5 px-4 py-3">
            <h3 class="text-sm font-semibold">Catatan Purchase Request</h3>
            <p class="text-xs text-muted-foreground">
              Tambahkan alasan permintaan atau informasi penting lainnya.
            </p>
          </header>
          <div class="min-w-0 p-4">
            <Field class="min-w-0" :data-invalid="!!errors.notes">
              <Textarea
                v-model="form.notes"
                rows="2"
                placeholder="Alasan permintaan, target penggunaan, atau informasi penting lainnya..."
                class="w-full min-w-0 resize-y"
                :aria-invalid="!!errors.notes"
              />
              <FieldError :errors="[errors.notes]" />
            </Field>
          </div>
        </section>

        </div>
        <DialogFooter class="mx-0 mb-0 shrink-0 border-t px-4 py-4 sm:px-6">
          <Button
            type="button"
            variant="outline"
            :disabled="loading"
            @click="open = false"
          >
            Batal
          </Button>
          <Button type="submit" :disabled="loading">
            <Spinner v-if="loading" data-icon="inline-start" />
            {{ isEdit ? "Simpan Perubahan" : "Simpan Draft PR" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
