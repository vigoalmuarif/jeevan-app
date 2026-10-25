<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Alert02Icon,
  Add01Icon,
  Delete03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import ServerComboBox from "@/components/server-combobox/ServerComboBox.vue";
import ComboboxSelect from "@/components/ui/combobox/ComboboxSelect.vue";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { normalizeError } from "@/lib/errors";
import type { ComboboxFetcher } from "@/core/composables/useComboBox";
import { stockAdjustmentService } from "../../services/stock-adjustment.service";
import type {
  StockAdjustment,
  StockAdjustmentListItem,
  StockAdjustmentOptions,
  StockAdjustmentPayload,
  StockAdjustmentProductOption,
  StockAdjustmentUnitOption,
} from "../../types/stock-adjustment.types";

const open = defineModel<boolean>("open", { default: false });
const props = defineProps<{
  selectedAdjustment?: StockAdjustmentListItem;
  options: StockAdjustmentOptions;
}>();
const emit = defineEmits<{ saved: [adjustment: StockAdjustment] }>();

interface DraftItem {
  selection: string | number;
  product_variant_id: number | null;
  product_option: StockAdjustmentProductOption | null;
  units: StockAdjustmentUnitOption[];
  stock_quantity: number;
  unit_id: number | null;
  direction: "increase" | "decrease";
  unit_quantity: number | string;
  unit_cost: number | string | null;
  notes: string;
}

interface DraftForm {
  branch_id: string;
  warehouse_id: string;
  adjustment_date: string;
  reason: string;
  notes: string;
  items: DraftItem[];
}

const emptyItem = (): DraftItem => ({
  selection: "",
  product_variant_id: null,
  product_option: null,
  units: [],
  stock_quantity: 0,
  unit_id: null,
  direction: "increase",
  unit_quantity: "",
  unit_cost: null,
  notes: "",
});
const initialForm = (): DraftForm => ({
  branch_id: "",
  warehouse_id: "",
  adjustment_date: new Date().toISOString().slice(0, 10),
  reason: "correction",
  notes: "",
  items: [emptyItem()],
});
const form = reactive<DraftForm>(initialForm());
const loading = ref(false);
const loadingFetch = ref(false);
const loadingFetchError = ref(false);
const errors = ref<Record<string, string>>({});
const generalError = ref("");
const isEdit = computed(() => !!props.selectedAdjustment);
const isOpeningStock = computed(() => form.reason === "opening_stock");
const visibleWarehouses = computed(() =>
  props.options.warehouses.filter(
    (warehouse) =>
      !form.branch_id || String(warehouse.branch_id) === form.branch_id,
  ),
);
const branchOptions = computed(() =>
  props.options.branches.map((branch) => ({
    value: String(branch.id),
    label: `${branch.name} (${branch.code})`,
  })),
);
const warehouseOptions = computed(() =>
  visibleWarehouses.value.map((warehouse) => ({
    value: String(warehouse.id),
    label: `${warehouse.name} (${warehouse.code})`,
  })),
);
const reasonOptions = computed(() =>
  props.options.reasons.map((reason) => ({
    value: reason.value,
    label: reason.label,
  })),
);
const directionOptions = [
  { value: "increase", label: "Tambah (+)" },
  { value: "decrease", label: "Kurangi (−)" },
];
const includeUnstockedVariants = computed(() =>
  ["opening_stock", "found"].includes(form.reason),
);
const quantityFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 4,
});

function resetForm() {
  Object.assign(form, initialForm());
  errors.value = {};
  generalError.value = "";
  loading.value = false;
  loadingFetch.value = false;
  loadingFetchError.value = false;
}

function initialProductOption(
  item: DraftItem,
): StockAdjustmentProductOption | null {
  return item.product_option;
}

const searchProductOptions: ComboboxFetcher = async (
  search,
  _params,
  requestOptions,
) => {
  if (!form.warehouse_id) return [];
  return stockAdjustmentService.searchProductOptions(
    search,
    {
      warehouse_id: Number(form.warehouse_id),
      reason: form.reason,
      per_page: 15,
    },
    requestOptions,
  );
};

function unitsForItem(item: DraftItem) {
  return item.units;
}

function selectedUnitOption(item: DraftItem) {
  return unitsForItem(item).find((option) => option.unit_id === item.unit_id);
}

function currentStock(item: DraftItem) {
  return item.stock_quantity;
}

function stockInSelectedUnit(item: DraftItem, baseQuantity: number) {
  const conversionRate = Number(selectedUnitOption(item)?.conversion_rate ?? 1);
  return conversionRate > 0 ? baseQuantity / conversionRate : baseQuantity;
}

function adjustedStock(item: DraftItem) {
  const quantity = Number(item.unit_quantity);
  const conversionRate = Number(selectedUnitOption(item)?.conversion_rate ?? 1);
  const direction =
    item.direction === "decrease" && !isOpeningStock.value ? -1 : 1;
  return stockInSelectedUnit(
    item,
    currentStock(item) +
      (Number.isFinite(quantity) ? quantity : 0) * conversionRate * direction,
  );
}

function isDuplicateItem(index: number) {
  const variantId = form.items[index]?.product_variant_id;
  return (
    variantId !== null &&
    variantId !== undefined &&
    form.items.some(
      (item, itemIndex) =>
        itemIndex !== index && item.product_variant_id === variantId,
    )
  );
}

function onProductSelected(
  item: DraftItem,
  option: StockAdjustmentProductOption | null,
) {
  if (!option) {
    item.selection = "";
    item.product_variant_id = null;
    item.product_option = null;
    item.units = [];
    item.stock_quantity = 0;
    item.unit_id = null;
    item.unit_cost = null;
    return;
  }
  item.product_variant_id = option.product_variant_id;
  item.selection = option.product_variant_id;
  item.product_option = option;
  item.units = option.units;
  item.stock_quantity = Number(option.stock_quantity);
  const baseUnit =
    unitsForItem(item).find((unit) => unit.is_base) ?? unitsForItem(item)[0];
  item.unit_id = baseUnit?.unit_id ?? null;
  item.unit_cost =
    baseUnit?.unit_cost === null || baseUnit?.unit_cost === undefined
      ? null
      : Number(baseUnit.unit_cost);
}

function onUnitSelected(item: DraftItem, value: unknown) {
  const unitId = Number(value);
  item.unit_id = Number.isFinite(unitId) && unitId > 0 ? unitId : null;
  const selectedUnit = unitsForItem(item).find(
    (unit) => unit.unit_id === item.unit_id,
  );
  item.unit_cost =
    selectedUnit?.unit_cost === null || selectedUnit?.unit_cost === undefined
      ? null
      : Number(selectedUnit.unit_cost);
}

function onDirectionSelected(item: DraftItem, value: string | number) {
  if (value === "increase" || value === "decrease") {
    item.direction = value;
  }
}

function onQuantityChanged(item: DraftItem, value: number | undefined) {
  item.unit_quantity = value ?? "";
}

function addItem() {
  form.items.push(emptyItem());
}

function removeItem(index: number) {
  if (form.items.length > 1) form.items.splice(index, 1);
}

function itemError(index: number) {
  return (
    errors.value[`items.${index}.product_variant_id`] ??
    errors.value[`items.${index}.unit_quantity`] ??
    errors.value[`items.${index}.unit_id`] ??
    ""
  );
}

async function fetchAdjustment() {
  if (!props.selectedAdjustment) return;
  loadingFetch.value = true;
  loadingFetchError.value = false;
  try {
    const adjustment: StockAdjustment = await stockAdjustmentService.show(
      props.selectedAdjustment.id,
    );
    const items: DraftItem[] = adjustment.items.map((item) => ({
      ...emptyItem(),
      selection: String(item.product_variant_id),
      product_variant_id: item.product_variant_id,
      unit_id: item.unit_id,
      direction: Number(item.unit_quantity) < 0 ? "decrease" : "increase",
      unit_quantity: Math.abs(Number(item.unit_quantity)),
      unit_cost: item.unit_cost === null ? null : Number(item.unit_cost),
      notes: item.notes ?? "",
    }));
    Object.assign(form, {
      branch_id: adjustment.branch_id ? String(adjustment.branch_id) : "",
      warehouse_id: String(adjustment.warehouse_id),
      adjustment_date: String(adjustment.adjustment_date).slice(0, 10),
      reason: adjustment.reason,
      notes: adjustment.notes ?? "",
      items,
    });
    await Promise.all(
      items.map(async (draftItem, index) => {
        if (!draftItem.product_variant_id) return;
        const [product] = await stockAdjustmentService.searchProductOptions(
          "",
          {
            warehouse_id: Number(adjustment.warehouse_id),
            reason: adjustment.reason,
            product_variant_id: draftItem.product_variant_id,
            per_page: 1,
          },
          {},
        );
        if (!product) {
          throw new Error(
            `Data produk untuk item ${index + 1} tidak tersedia. Periksa status produk atau gudang.`,
          );
        }
        draftItem.product_option = product;
        draftItem.units = product.units;
        draftItem.stock_quantity = Number(product.stock_quantity);
        if (!product.units.some((unit) => unit.unit_id === draftItem.unit_id)) {
          throw new Error(
            `Satuan untuk item ${index + 1} sudah tidak tersedia. Draft tidak dapat dimuat untuk diedit.`,
          );
        }
      }),
    );
  } catch (error) {
    generalError.value =
      error instanceof Error
        ? error.message
        : normalizeError(error).message;
    loadingFetchError.value = true;
  } finally {
    loadingFetch.value = false;
  }
}

watch(open, async (isOpen) => {
  if (!isOpen) return;
  resetForm();
  await fetchAdjustment();
});

watch(
  () => form.branch_id,
  () => {
    if (
      form.warehouse_id &&
      !visibleWarehouses.value.some(
        (warehouse) => String(warehouse.id) === form.warehouse_id,
      )
    ) {
      form.warehouse_id = "";
    }
  },
);

watch(
  () => form.warehouse_id,
  (warehouseId) => {
    const warehouse = props.options.warehouses.find(
      (option) => String(option.id) === warehouseId,
    );
    if (warehouse) form.branch_id = String(warehouse.branch_id);
  },
);

watch(
  () => form.warehouse_id,
  (warehouseId, previousWarehouseId) => {
    if (!previousWarehouseId || warehouseId === previousWarehouseId) return;
    for (const item of form.items) {
      item.selection = "";
      item.product_variant_id = null;
      item.product_option = null;
      item.units = [];
      item.stock_quantity = 0;
      item.unit_id = null;
      item.unit_quantity = "";
      item.unit_cost = null;
    }
  },
);

async function handleSubmit() {
  errors.value = {};
  generalError.value = "";
  if (form.items.some((_, index) => isDuplicateItem(index))) {
    generalError.value =
      "Produk/varian yang sama tidak boleh ditambahkan lebih dari satu kali.";
    return;
  }
  const payload: StockAdjustmentPayload = {
    branch_id: form.branch_id ? Number(form.branch_id) : null,
    warehouse_id: Number(form.warehouse_id),
    adjustment_date: form.adjustment_date,
    reason: form.reason,
    notes: form.notes.trim() || null,
    items: form.items.map((item) => ({
      product_variant_id: Number(item.product_variant_id),
      unit_id: Number(item.unit_id),
      unit_quantity:
        Math.abs(Number(item.unit_quantity)) *
        (item.direction === "decrease" && !isOpeningStock.value ? -1 : 1),
      unit_cost:
        item.unit_cost === "" || item.unit_cost === null
          ? null
          : Number(item.unit_cost),
      notes: item.notes.trim() || null,
    })),
  };

  if (
    !payload.warehouse_id ||
    payload.items.some(
      (item) =>
        !item.product_variant_id || !item.unit_id || !item.unit_quantity,
    )
  ) {
    generalError.value =
      "Lengkapi gudang, produk, satuan, dan jumlah setiap item.";
    return;
  }
  if (
    form.reason === "opening_stock" &&
    payload.items.some(
      (item) =>
        item.unit_quantity <= 0 ||
        item.unit_cost === null ||
        item.unit_cost < 0,
    )
  ) {
    generalError.value =
      "Saldo awal harus berjumlah positif dan memiliki biaya masuk per satuan.";
    return;
  }
  loading.value = true;
  try {
    const saved =
      isEdit.value && props.selectedAdjustment
        ? await stockAdjustmentService.update(
            props.selectedAdjustment.id,
            payload,
          )
        : await stockAdjustmentService.store(payload);
    emit("saved", saved);
    open.value = false;
    resetForm();
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
    <DialogContent
      class="grid-cols-1 max-h-[94dvh] min-w-0 w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:max-w-5xl"
      @interact-outside.prevent
    >
      <DialogHeader class="border-b px-6 py-5 pr-12">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <DialogTitle class="text-lg">{{
              isEdit ? "Ubah draft adjustment" : "Buat adjustment stok"
            }}</DialogTitle>
            <DialogDescription
              >Catat selisih stok fisik untuk satu gudang.</DialogDescription
            >
          </div>
          <span
            class="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
            >Draft</span
          >
        </div>
      </DialogHeader>

      <form
        class="flex min-h-0 w-full min-w-0 flex-col"
        @submit.prevent="handleSubmit"
      >
        <div
          class="max-h-[calc(94dvh-150px)] w-full min-w-0 space-y-5 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
        >
          <Alert v-if="generalError" variant="destructive">
            <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
            <AlertTitle>Adjustment belum tersimpan</AlertTitle>
            <AlertDescription
              class="flex flex-wrap items-center justify-between gap-3"
            >
              <span>{{ generalError }}</span>
              <Button
                v-if="loadingFetchError"
                type="button"
                variant="outline"
                size="sm"
                @click="fetchAdjustment"
                >Coba lagi</Button
              >
            </AlertDescription>
          </Alert>

          <div
            v-if="loadingFetch"
            class="flex min-h-52 items-center justify-center gap-3 text-sm text-muted-foreground"
            role="status"
          >
            <Spinner /> Memuat draft adjustment...
          </div>

          <template v-else-if="!loadingFetchError">
            <section
              class="min-w-0 space-y-4 rounded-xl border bg-muted/20 p-4 sm:p-5"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <span
                    class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                    >1</span
                  >
                  <div>
                    <h3 class="text-sm font-semibold">Header dokumen</h3>
                    <p class="mt-0.5 text-xs text-muted-foreground">
                      Tentukan lokasi dan informasi koreksi stok.
                    </p>
                  </div>
                </div>
                <span
                  v-if="selectedAdjustment"
                  class="shrink-0 rounded-md border bg-background px-2.5 py-1 text-xs font-medium"
                  >{{ selectedAdjustment.document_number }}</span
                >
              </div>
              <div class="grid min-w-0 gap-4 sm:grid-cols-2">
                <Field class="min-w-0 gap-1.5" :data-invalid="false">
                  <FieldLabel for="adjustment-branch" required
                    >Cabang</FieldLabel
                  >
                  <ComboboxSelect
                    v-model="form.branch_id"
                    :options="branchOptions"
                    :disabled="loading"
                    placeholder="Pilih cabang"
                    search-placeholder="Cari cabang..."
                  />
                </Field>
                <Field
                  class="min-w-0 gap-1.5"
                  :data-invalid="!!errors.warehouse_id"
                >
                  <FieldLabel for="adjustment-warehouse" required
                    >Gudang</FieldLabel
                  >
                  <ComboboxSelect
                    v-model="form.warehouse_id"
                    :options="warehouseOptions"
                    :disabled="loading || !form.branch_id"
                    placeholder="Pilih gudang"
                    search-placeholder="Cari gudang..."
                    empty-text="Gudang tidak ditemukan."
                  />
                  <FieldError v-if="errors.warehouse_id">{{
                    errors.warehouse_id
                  }}</FieldError>
                </Field>
                <Field
                  class="min-w-0 gap-1.5"
                  :data-invalid="!!errors.adjustment_date"
                >
                  <FieldLabel for="adjustment-date" required
                    >Tanggal</FieldLabel
                  >
                  <Input
                    id="adjustment-date"
                    v-model="form.adjustment_date"
                    class="w-full"
                    type="date"
                    :aria-invalid="!!errors.adjustment_date"
                    :disabled="loading"
                  />
                  <FieldError v-if="errors.adjustment_date">{{
                    errors.adjustment_date
                  }}</FieldError>
                </Field>
                <Field class="min-w-0 gap-1.5" :data-invalid="!!errors.reason">
                  <FieldLabel for="adjustment-reason" required
                    >Alasan</FieldLabel
                  >
                  <ComboboxSelect
                    v-model="form.reason"
                    :options="reasonOptions"
                    :disabled="loading"
                    placeholder="Pilih alasan"
                    search-placeholder="Cari alasan..."
                  />
                  <FieldError v-if="errors.reason">{{
                    errors.reason
                  }}</FieldError>
                </Field>
                <Field class="min-w-0 gap-1.5 sm:col-span-2">
                  <FieldLabel for="adjustment-notes" optional
                    >Catatan</FieldLabel
                  >
                  <Textarea
                    id="adjustment-notes"
                    v-model="form.notes"
                    class="min-h-20 w-full resize-y"
                    placeholder="Tambahkan konteks untuk koreksi stok ini"
                    :disabled="loading"
                    rows="2"
                  />
                  <FieldError v-if="errors.notes">{{
                    errors.notes
                  }}</FieldError>
                </Field>
              </div>
            </section>

            <section
              class="min-w-0 overflow-hidden rounded-xl border border-primary/20"
            >
              <div
                class="flex flex-wrap items-center justify-between gap-3 bg-primary/5 px-4 py-4 sm:px-5"
              >
                <div class="flex items-start gap-3">
                  <span
                    class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                    >2</span
                  >
                  <div>
                    <h3 class="text-sm font-semibold">Item adjustment</h3>
                    <p class="mt-0.5 text-xs text-muted-foreground">
                      {{
                        isOpeningStock
                          ? "Masukkan jumlah saldo awal yang tersedia dan biaya per satuan untuk menghitung HPP. Produk tanpa saldo di gudang juga dapat dipilih."
                          : includeUnstockedVariants
                            ? "Tentukan penambahan atau pengurangan stok dan jumlahnya. Produk tanpa saldo di gudang juga dapat dipilih untuk mencatat barang ditemukan."
                            : "Tentukan penambahan atau pengurangan stok dan jumlahnya. Pilihan produk dibatasi pada stok gudang yang dipilih."
                      }}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  class="bg-background"
                  :disabled="loading"
                  @click="addItem"
                >
                  <HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" />
                  Tambah item
                </Button>
              </div>

              <div class="space-y-3 p-3 sm:p-4">
                <article
                  v-for="(item, index) in form.items"
                  :key="index"
                  class="min-w-0 space-y-4 rounded-xl border bg-background p-4 shadow-sm sm:p-5"
                >
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex min-w-0 items-center gap-3">
                      <span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {{ String(index + 1).padStart(2, "0") }}
                      </span>
                      <div class="min-w-0">
                        <p class="text-sm font-semibold">Item adjustment</p>
                        <p class="truncate text-xs text-muted-foreground">
                          {{ item.product_option?.label ?? "Pilih produk untuk mengisi rincian item" }}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      class="size-9 shrink-0 text-muted-foreground hover:text-destructive"
                      :disabled="loading || form.items.length === 1"
                      :aria-label="'Hapus item ' + (index + 1)"
                      @click="removeItem(index)"
                    >
                      <HugeiconsIcon :icon="Delete03Icon" aria-hidden="true" />
                    </Button>
                  </div>

                  <Field
                    class="min-w-0 gap-1.5"
                    :data-invalid="!!itemError(index) || isDuplicateItem(index)"
                  >
                    <FieldLabel :for="`adjustment-product-${index}`" required
                      >Produk / varian</FieldLabel
                    >
                    <ServerComboBox
                      :key="`${form.warehouse_id}-${form.reason}-${index}`"
                      :id="`adjustment-product-${index}`"
                      v-model="item.selection"
                      :fetcher="searchProductOptions"
                      value-key="product_variant_id"
                      label-key="label"
                      :initial-option="initialProductOption(item)"
                      :disabled="loading || !form.warehouse_id"
                      placeholder="Pilih produk atau varian"
                      search-placeholder="Cari nama produk atau SKU..."
                      empty-text="Produk tidak ditemukan."
                      :aria-invalid="
                        !!itemError(index) || isDuplicateItem(index)
                      "
                      @select="onProductSelected(item, $event)"
                    />
                    <FieldError v-if="itemError(index)">{{
                      itemError(index)
                    }}</FieldError>
                    <p
                      v-if="isDuplicateItem(index)"
                      class="text-xs text-destructive"
                    >
                      Produk/varian sudah ada di item lain.
                    </p>
                    <p
                      v-if="!form.warehouse_id"
                      class="text-xs text-muted-foreground"
                    >
                      Pilih gudang terlebih dahulu.
                    </p>
                  </Field>

                  <div
                    v-if="item.product_variant_id && item.unit_id"
                    class="grid min-w-0 grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 sm:grid-cols-2"
                  >
                    <div class="min-w-0">
                      <p class="text-xs text-muted-foreground">Stok saat ini</p>
                      <p class="mt-1 truncate text-sm font-semibold">
                        {{ quantityFormat.format(stockInSelectedUnit(item, currentStock(item))) }}
                        {{ selectedUnitOption(item)?.unit_code }}
                      </p>
                    </div>
                    <div class="min-w-0 border-l pl-3">
                      <p class="text-xs text-muted-foreground">Stok setelah adjustment</p>
                      <p
                        class="mt-1 truncate text-sm font-semibold"
                        :class="adjustedStock(item) < -0.00005 ? 'text-destructive' : 'text-foreground'"
                      >
                        {{ quantityFormat.format(adjustedStock(item)) }}
                        {{ selectedUnitOption(item)?.unit_code }}
                      </p>
                    </div>
                  </div>

                  <div class="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-12">
                    <Field
                      v-if="item.product_variant_id && !isOpeningStock"
                      class="min-w-0 gap-1.5"
                      :class="isOpeningStock ? 'lg:col-span-2' : 'lg:col-span-3'"
                    >
                      <FieldLabel :for="`adjustment-type-${index}`" required>
                        Tipe adjustment
                      </FieldLabel>
                      <ComboboxSelect
                        :model-value="item.direction"
                        :options="directionOptions"
                        :disabled="loading"
                        placeholder="Pilih tipe"
                        search-placeholder="Cari tipe..."
                        @update:model-value="onDirectionSelected(item, $event)"
                      />
                    </Field>
                    <Field
                      v-else-if="item.product_variant_id"
                      class="min-w-0 gap-1.5 lg:col-span-2"
                    >
                      <FieldLabel :for="`adjustment-type-${index}`">
                        Tipe adjustment
                      </FieldLabel>
                      <div
                        :id="`adjustment-type-${index}`"
                        class="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm font-medium text-muted-foreground"
                      >
                        Penambahan saldo awal (+)
                      </div>
                    </Field>

                    <Field
                      v-if="item.product_variant_id"
                      class="min-w-0 gap-1.5"
                      :class="isOpeningStock ? 'lg:col-span-2' : 'lg:col-span-3'"
                      :data-invalid="!!errors[`items.${index}.unit_id`]"
                    >
                      <FieldLabel :for="`adjustment-unit-${index}`" required
                        >Satuan</FieldLabel
                      >
                      <ComboboxSelect
                        :model-value="item.unit_id ?? ''"
                        :options="
                          unitsForItem(item).map((unit) => ({
                            value: unit.unit_id,
                            label: `${unit.unit_name} (${unit.unit_code}) · 1 = ${quantityFormat.format(Number(unit.conversion_rate))} dasar`,
                          }))
                        "
                        :disabled="loading"
                        placeholder="Pilih satuan"
                        search-placeholder="Cari satuan..."
                        @update:model-value="onUnitSelected(item, $event)"
                      />
                      <p
                        v-if="selectedUnitOption(item)"
                        class="text-xs text-muted-foreground"
                      >
                        1 {{ selectedUnitOption(item)?.unit_code }} =
                        {{
                          quantityFormat.format(
                            Number(selectedUnitOption(item)?.conversion_rate),
                          )
                        }}
                        satuan dasar
                      </p>
                      <FieldError v-if="errors[`items.${index}.unit_id`]">{{
                        errors[`items.${index}.unit_id`]
                      }}</FieldError>
                    </Field>

                    <Field
                      v-if="item.product_variant_id"
                      class="min-w-0 gap-1.5"
                      :class="isOpeningStock ? 'lg:col-span-2' : 'lg:col-span-3'"
                      :data-invalid="!!errors[`items.${index}.unit_quantity`]"
                    >
                      <FieldLabel
                        :for="`adjustment-quantity-${index}`"
                        required
                        >{{
                          isOpeningStock
                            ? "Jumlah saldo awal"
                            : "Jumlah adjustment"
                        }}</FieldLabel
                      >
                      <NumberField
                        :model-value="item.unit_quantity === '' ? undefined : Number(item.unit_quantity)"
                        :min="1"
                        :step="1"
                        :format-options="{ maximumFractionDigits: 4 }"
                        :disabled="loading"
                        class="min-w-0"
                        @update:model-value="onQuantityChanged(item, $event)"
                      >
                        <NumberFieldContent class="w-full">
                          <NumberFieldDecrement />
                          <NumberFieldInput
                            :id="`adjustment-quantity-${index}`"
                            :aria-invalid="!!errors[`items.${index}.unit_quantity`]"
                            placeholder="0,0000"
                            class="px-8 text-center tabular-nums"
                          />
                          <NumberFieldIncrement />
                        </NumberFieldContent>
                      </NumberField>
                      <FieldError
                        v-if="errors[`items.${index}.unit_quantity`]"
                        >{{
                          errors[`items.${index}.unit_quantity`]
                        }}</FieldError
                      >
                    </Field>

                    <Field
                      v-if="isOpeningStock && item.product_variant_id"
                      class="min-w-0 gap-1.5 lg:col-span-3"
                    >
                      <FieldLabel :for="`adjustment-cost-${index}`" required
                        >Biaya masuk / satuan</FieldLabel
                      >
                      <Input
                        :id="`adjustment-cost-${index}`"
                        v-model.number="item.unit_cost"
                        type="number"
                        min="0"
                        step="1"
                        placeholder="Biaya masuk"
                        class="w-full"
                        required
                        :disabled="loading"
                      />
                    </Field>

                    <Field
                      class="min-w-0 gap-1.5 lg:col-span-3"
                    >
                      <FieldLabel :for="`adjustment-item-notes-${index}`"
                        >Catatan
                        <span class="font-normal text-muted-foreground"
                          >(opsional)</span
                        ></FieldLabel
                      >
                      <Input
                        :id="`adjustment-item-notes-${index}`"
                        v-model="item.notes"
                        maxlength="255"
                        placeholder="Catatan item"
                        class="w-full"
                        :disabled="loading"
                      />
                    </Field>
                  </div>
                </article>
              </div>
              <p v-if="errors.items" class="px-4 pb-3 text-sm text-destructive">
                {{ errors.items }}
              </p>
            </section>
          </template>
        </div>

        <DialogFooter class="border-t bg-muted/20 px-6 pb-7">
          <Button
            type="button"
            variant="outline"
            :disabled="loading"
            @click="open = false"
            >Batal</Button
          >
          <Button
            type="submit"
            :disabled="loading || loadingFetch || loadingFetchError"
          >
            <Spinner v-if="loading" data-icon="inline-start" />
            {{ loading ? "Menyimpan..." : "Simpan draft" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
