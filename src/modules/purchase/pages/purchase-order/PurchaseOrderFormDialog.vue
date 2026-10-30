<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Add01Icon,
  Delete03Icon,
  File01Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import ServerComboBox from "@/components/server-combobox/ServerComboBox.vue";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { normalizeError } from "@/lib/errors";
import { toast } from "vue-sonner";
import type { ComboboxFetcher } from "@/core/composables/useComboBox";
import { goodsReceiptService } from "../../services/goods-receipt.service";
import { purchaseOrderService } from "../../services/purchase-order.service";
import type {
  PurchaseOrder,
  PurchaseOrderItemPayload,
  PurchaseOrderListItem,
  PurchaseOrderOptions,
  PurchaseOrderPayload,
} from "../../types/purchase-order.types";
import type { GoodsReceiptProductOption } from "../../types/goods-receipt.types";

const open = defineModel<boolean>("open", { default: false });
const props = defineProps<{
  selectedOrder?: PurchaseOrderListItem;
  options: PurchaseOrderOptions;
}>();
const emit = defineEmits<{ saved: [order: PurchaseOrder] }>();

type DraftItem = {
  selection: string | null;
  product_variant_id: number | null;
  unit_id: number | null;
  unit_quantity: number | string;
  unit_price: number | string;
  discount_type: "percent" | "amount" | "";
  discount_value: number | string;
  tax_rate: number | string;
  notes: string;
};

type Draft = {
  supplier_id: string;
  warehouse_id: string;
  branch_id: string;
  order_date: string;
  expected_date: string;
  is_tax_inclusive: boolean;
  discount_type: "percent" | "amount" | "";
  discount_value: number | string;
  notes: string;
  items: DraftItem[];
};

function currentLocalDate() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const emptyItem = (): DraftItem => ({
  selection: "",
  product_variant_id: null,
  unit_id: null,
  unit_quantity: "",
  unit_price: 0,
  discount_type: "",
  discount_value: 0,
  tax_rate: "",
  notes: "",
});

const initialDraft = (): Draft => ({
  supplier_id: "",
  warehouse_id: "",
  branch_id: "",
  order_date: currentLocalDate(),
  expected_date: "",
  is_tax_inclusive: props.options.settings?.prices_include_tax ?? false,
  discount_type: "",
  discount_value: 0,
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
const sourcePurchaseRequests = ref<
  NonNullable<PurchaseOrder["purchase_requests"]>
>([]);

const isEdit = computed(() => !!props.selectedOrder);
const currencyFormat = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const numberFormat = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 4,
});
const supplierOptions = computed(() =>
  props.options.suppliers.map((supplier) => ({
    value: String(supplier.id),
    label: `${supplier.name}${supplier.code ? ` (${supplier.code})` : ""}`,
  })),
);
const warehouseOptions = computed(() =>
  props.options.warehouses.map((warehouse) => ({
    value: String(warehouse.id),
    label: warehouse.name,
  })),
);
const branchOptions = computed(() => [
  { value: "", label: "Tanpa cabang" },
  ...props.options.branches.map((branch) => ({
    value: String(branch.id),
    label: branch.name,
  })),
]);
const discountOptions = [
  { value: "none", label: "Tanpa diskon" },
  { value: "percent", label: "Persentase (%)" },
  { value: "amount", label: "Nominal (Rp)" },
];
const itemDiscountOptions = [
  { value: "none", label: "—" },
  { value: "percent", label: "%" },
  { value: "amount", label: "Rp" },
];

function unitOptions(item: DraftItem) {
  return (findOption(item.selection)?.units ?? []).map((unit) => ({
    value: String(unit.unit_id),
    label: `${unit.unit_name} (${unit.unit_code})`,
  }));
}

const fetchProductUnits: ComboboxFetcher = (search, params, requestOptions) =>
  goodsReceiptService.searchProductUnits(
    search,
    {
      ...params,
      supplier_id: form.supplier_id || undefined,
    },
    requestOptions,
  );

function setHeaderDiscountType(value: unknown) {
  form.discount_type = value === "percent" || value === "amount" ? value : "";
}

function setItemDiscountType(item: DraftItem, value: unknown) {
  item.discount_type = value === "percent" || value === "amount" ? value : "";
}

function findOption(selection: string | null) {
  return selection ? selectedProductOptions[selection] : undefined;
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
    Object.assign(item, emptyItem());
    return;
  }
  if (selectedProductIds(item).includes(option.product_variant_id)) {
    item.selection =
      item.product_variant_id === null ? "" : String(item.product_variant_id);
    toast.warning("Produk tersebut sudah ada dalam daftar Purchase Order.");
    return;
  }

  item.selection = String(option.product_variant_id);
  selectedProductOptions[item.selection] = option;
  item.product_variant_id = option.product_variant_id;
  const baseUnit = option.units.find((unit) => unit.is_base) ?? option.units[0];
  item.unit_id = baseUnit?.unit_id ?? null;
  // Prefill default purchase cost dari data unit
  item.unit_price = Number(baseUnit?.unit_cost) || 0;
  item.tax_rate =
    option.tax_rate === null || option.tax_rate === undefined
      ? Number(props.options.settings?.default_tax_rate ?? 11)
      : Number(option.tax_rate);
}

watch(
  () => form.supplier_id,
  (supplierId, previousSupplierId) => {
    if (previousSupplierId && supplierId !== previousSupplierId) {
      for (const item of form.items) setSelectedOption(item, null);
    }
  },
);

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
    item.unit_price = Number(selectedUnit.unit_cost) || 0;
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
  sourcePurchaseRequests.value = [];
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

function discount(amount: number, type: string, value: number) {
  if (type === "percent") return Math.min(amount, (amount * value) / 100);
  if (type === "amount") return Math.min(amount, value);
  return 0;
}

function lineSubtotal(item: DraftItem) {
  const gross =
    Math.max(0, Number(item.unit_quantity) || 0) *
    Math.max(0, Number(item.unit_price) || 0);
  return (
    gross -
    discount(gross, item.discount_type, Number(item.discount_value) || 0)
  );
}

const summary = computed(() => {
  const rowValues = form.items.map((item) => {
    return {
      afterDiscount: lineSubtotal(item),
      taxRate: Math.max(0, Number(item.tax_rate) || 0),
    };
  });
  const basis = rowValues.reduce((sum, row) => sum + row.afterDiscount, 0);
  const totalDiscount = discount(
    basis,
    form.discount_type,
    Number(form.discount_value) || 0,
  );
  const totals = rowValues.reduce(
    (sum, row) => {
      const share = basis > 0 ? (totalDiscount * row.afterDiscount) / basis : 0;
      const net = Math.max(0, row.afterDiscount - share);
      const subtotal = form.is_tax_inclusive
        ? net / (1 + row.taxRate / 100)
        : net;
      const tax = form.is_tax_inclusive
        ? net - subtotal
        : (subtotal * row.taxRate) / 100;
      return {
        subtotal: sum.subtotal + subtotal,
        tax: sum.tax + tax,
        total: sum.total + subtotal + tax,
      };
    },
    { subtotal: 0, tax: 0, total: 0 },
  );
  return { ...totals, basis, discount: totalDiscount };
});

function validateForm(): boolean {
  const validationErrors: Record<string, string> = {};

  if (!form.supplier_id)
    validationErrors.supplier_id = "Supplier wajib dipilih.";
  if (!form.warehouse_id)
    validationErrors.warehouse_id = "Gudang tujuan wajib dipilih.";
  if (!form.order_date)
    validationErrors.order_date = "Tanggal order wajib diisi.";
  if (
    form.expected_date &&
    form.order_date &&
    form.expected_date < form.order_date
  ) {
    validationErrors.expected_date =
      "Estimasi kedatangan tidak boleh sebelum tanggal order.";
  }
  if (
    form.discount_type &&
    (Number(form.discount_value) < 0 ||
      !Number.isFinite(Number(form.discount_value)))
  ) {
    validationErrors.discount_value =
      "Nilai diskon harus berupa angka nol atau lebih.";
  }
  if (form.items.length === 0)
    validationErrors.items = "Tambahkan minimal satu barang.";

  const productIds = new Set<number>();
  form.items.forEach((item, index) => {
    const prefix = `items.${index}`;
    if (!item.product_variant_id) {
      validationErrors[`${prefix}.product_variant_id`] =
        "Produk wajib dipilih.";
    } else if (productIds.has(item.product_variant_id)) {
      validationErrors[`${prefix}.product_variant_id`] =
        "Produk sudah ada dalam daftar Purchase Order.";
    } else {
      productIds.add(item.product_variant_id);
    }
    if (!item.unit_id) {
      validationErrors[`${prefix}.unit_id`] = "Satuan wajib dipilih.";
    }
    const quantity = Number(item.unit_quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      validationErrors[`${prefix}.unit_quantity`] =
        "Jumlah harus lebih dari 0.";
    }
    const unitPrice = Number(item.unit_price);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      validationErrors[`${prefix}.unit_price`] =
        "Harga beli harus berupa angka nol atau lebih.";
    }
    if (
      item.discount_type &&
      (!Number.isFinite(Number(item.discount_value)) ||
        Number(item.discount_value) < 0)
    ) {
      validationErrors[`${prefix}.discount_value`] =
        "Nilai diskon harus berupa angka nol atau lebih.";
    }
    if (item.tax_rate !== "") {
      const taxRate = Number(item.tax_rate);
      if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) {
        validationErrors[`${prefix}.tax_rate`] =
          "Pajak harus di antara 0 dan 100.";
      }
    }
  });

  errors.value = validationErrors;
  if (Object.keys(validationErrors).length > 0) {
    generalError.value =
      "Periksa kembali data yang ditandai sebelum menyimpan.";
    return false;
  }

  return true;
}

async function fetchOrder() {
  if (!props.selectedOrder) return;
  loadingFetch.value = true;
  loadingFetchError.value = false;
  try {
    const order = await purchaseOrderService.show(props.selectedOrder.id);
    const items = order.items.map((item) => {
      const selection = String(item.product_variant_id);
      const option: GoodsReceiptProductOption = {
        selection,
        label: `${item.product_name ?? "Produk tidak tersedia"}${item.variant_name ? ` / ${item.variant_name}` : ""} · SKU ${item.sku ?? "-"}`,
        product_id: 0,
        product_name: item.product_name ?? "Produk tidak tersedia",
        product_variant_id: item.product_variant_id,
        variant_name: item.variant_name ?? null,
        sku: item.sku ?? "",
        units: [
          {
            unit_id: item.unit_id,
            unit_name: item.unit_name ?? "Satuan tidak tersedia",
            unit_code: item.unit_code ?? "",
            conversion_rate: item.conversion_rate,
            is_base: false,
            unit_cost: item.unit_price,
          },
        ],
        tax_rate: Number(item.tax_rate),
      };
      selectedProductOptions[selection] = option;
      return {
        selection,
        product_variant_id: item.product_variant_id,
        unit_id: item.unit_id,
        unit_quantity: Number(item.unit_quantity),
        unit_price: Number(item.unit_price),
        discount_type: item.discount_type ?? "",
        discount_value: Number(item.discount_value),
        tax_rate: Number(item.tax_rate),
        notes: item.notes ?? "",
      };
    });

    Object.assign(form, {
      supplier_id: String(order.supplier_id),
      warehouse_id: String(order.warehouse_id),
      branch_id: order.branch_id ? String(order.branch_id) : "",
      order_date: order.order_date,
      expected_date: order.expected_date ?? "",
      is_tax_inclusive: order.is_tax_inclusive,
      discount_type: order.discount_type ?? "",
      discount_value: Number(order.discount_value),
      notes: order.notes ?? "",
      items: items.length > 0 ? items : [emptyItem()],
    });
    sourcePurchaseRequests.value = order.purchase_requests ?? [];
  } catch (error) {
    loadingFetchError.value = true;
    generalError.value = normalizeError(error).message;
  } finally {
    loadingFetch.value = false;
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    if (props.selectedOrder) {
      void fetchOrder();
    } else {
      resetForm();
    }
  } else {
    resetForm();
  }
});

async function submit() {
  errors.value = {};
  generalError.value = "";
  if (!validateForm()) return;

  loading.value = true;

  const payload: PurchaseOrderPayload = {
    supplier_id: Number(form.supplier_id),
    warehouse_id: Number(form.warehouse_id),
    branch_id: form.branch_id ? Number(form.branch_id) : null,
    order_date: form.order_date,
    expected_date: form.expected_date || null,
    is_tax_inclusive: form.is_tax_inclusive,
    discount_type: form.discount_type || undefined,
    discount_value: form.discount_type ? Number(form.discount_value) : 0,
    notes: form.notes || undefined,
    items: form.items.map(
      (item): PurchaseOrderItemPayload => ({
        product_variant_id: Number(item.product_variant_id),
        unit_id: Number(item.unit_id),
        unit_quantity: Number(item.unit_quantity),
        unit_price: Number(item.unit_price),
        discount_type: item.discount_type || undefined,
        discount_value: item.discount_type ? Number(item.discount_value) : 0,
        tax_rate: item.tax_rate !== "" ? Number(item.tax_rate) : undefined,
        notes: item.notes || undefined,
      }),
    ),
  };

  try {
    const saved =
      isEdit.value && props.selectedOrder
        ? await purchaseOrderService.update(props.selectedOrder.id, payload)
        : await purchaseOrderService.store(payload);

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
                ? `Ubah Purchase Order ${selectedOrder?.document_number}`
                : "Buat Purchase Order Baru"
            }}</DialogTitle>
            <DialogDescription>
              Isi data pemesanan barang ke supplier. PO berstatus draft dan
              dapat diubah sebelum disetujui.
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
          <AlertTitle>Gagal memuat Purchase Order</AlertTitle>
          <AlertDescription>{{ generalError }}</AlertDescription>
        </Alert>
        <Button variant="outline" @click="fetchOrder">Coba lagi</Button>
      </div>

      <form
        v-else
        class="flex min-h-0 flex-1 flex-col overflow-hidden"
        @submit.prevent="submit"
      >
        <div
          class="min-h-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-6"
        >
        <Alert v-if="generalError" variant="destructive">
          <AlertTitle>Terjadi kesalahan</AlertTitle>
          <AlertDescription>{{ generalError }}</AlertDescription>
        </Alert>

        <section class="overflow-hidden rounded-xl border">
          <header
            class="flex flex-col gap-3 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <h3 class="text-sm font-semibold">Informasi Purchase Order</h3>
              <p class="text-xs text-muted-foreground">
                Tentukan supplier, tujuan pengiriman, dan jadwal pemesanan.
              </p>
            </div>
            <div
              v-if="sourcePurchaseRequests.length"
              class="flex min-w-0 items-center gap-2 sm:justify-end"
            >
              <HugeiconsIcon
                :icon="File01Icon"
                class="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <span class="shrink-0 text-xs text-muted-foreground"
                >Sumber PR:</span
              >
              <div class="flex min-w-0 flex-wrap gap-1">
                <Badge
                  v-for="request in sourcePurchaseRequests"
                  :key="request.id"
                  variant="outline"
                >
                  {{ request.document_number }}
                </Badge>
              </div>
            </div>
          </header>
          <div class="flex flex-col gap-4 p-4">
            <FieldGroup
              class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <Field :data-invalid="!!errors.supplier_id">
                <FieldLabel required>Supplier</FieldLabel>
                <ComboboxSelect
                  v-model="form.supplier_id"
                  :options="supplierOptions"
                  placeholder="Pilih supplier"
                  search-placeholder="Cari supplier..."
                  :aria-invalid="!!errors.supplier_id"
                />
                <FieldError :errors="[errors.supplier_id]" />
              </Field>

              <Field :data-invalid="!!errors.warehouse_id">
                <FieldLabel required>Gudang Tujuan</FieldLabel>
                <ComboboxSelect
                  v-model="form.warehouse_id"
                  :options="warehouseOptions"
                  placeholder="Pilih gudang"
                  search-placeholder="Cari gudang..."
                  :aria-invalid="!!errors.warehouse_id"
                />
                <FieldError :errors="[errors.warehouse_id]" />
              </Field>

              <Field :data-invalid="!!errors.order_date">
                <FieldLabel required>Tanggal Order</FieldLabel>
                <Input
                  v-model="form.order_date"
                  type="date"
                  :aria-invalid="!!errors.order_date"
                />
                <FieldError :errors="[errors.order_date]" />
              </Field>

              <Field :data-invalid="!!errors.expected_date">
                <FieldLabel>Estimasi Kedatangan</FieldLabel>
                <Input
                  v-model="form.expected_date"
                  type="date"
                  :aria-invalid="!!errors.expected_date"
                />
                <FieldError :errors="[errors.expected_date]" />
              </Field>
            </FieldGroup>

            <FieldGroup
              class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <Field
                v-if="options.branches && options.branches.length > 0"
                :data-invalid="!!errors.branch_id"
              >
                <FieldLabel>Cabang (Opsional)</FieldLabel>
                <ComboboxSelect
                  v-model="form.branch_id"
                  :options="branchOptions"
                  placeholder="Pilih cabang"
                  search-placeholder="Cari cabang..."
                  :aria-invalid="!!errors.branch_id"
                />
                <FieldError :errors="[errors.branch_id]" />
              </Field>

              <Field orientation="horizontal" class="items-center pt-6">
                <Checkbox
                  id="is_tax_inclusive"
                  v-model:checked="form.is_tax_inclusive"
                />
                <FieldLabel for="is_tax_inclusive" class="font-normal">
                  Harga Satuan Termasuk Pajak (Inklusif)
                </FieldLabel>
              </Field>
            </FieldGroup>
          </div>
        </section>

        <!-- Item Purchase Order -->
        <section class="overflow-hidden rounded-xl border">
          <header
            class="flex flex-wrap items-center justify-between gap-3 bg-primary/5 px-4 py-3"
          >
            <div>
              <h3 class="text-sm font-semibold">Item Purchase Order</h3>
              <p class="text-xs text-muted-foreground">
                Tambahkan produk, satuan, jumlah, harga, diskon, dan pajak untuk
                setiap baris.
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

          <FieldError class="px-4 pt-3" :errors="[errors.items]" />

          <div class="overflow-x-auto">
            <table class="w-full min-w-262.5 text-left text-sm">
              <thead class="border-y bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th class="w-12 p-3 text-center">No.</th>
                  <th class="min-w-64 p-3">Produk / Varian</th>
                  <th class="w-32 p-3">Satuan</th>
                  <th class="w-28 p-3 text-right">Jumlah</th>
                  <th class="w-36 p-3 text-right">Harga Beli</th>
                  <th class="w-32 p-3">Diskon</th>
                  <th class="w-24 p-3 text-right">Pajak (%)</th>
                  <th class="w-36 p-3 text-right">Subtotal</th>
                  <th class="w-12 p-3 text-center"></th>
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
                  <td class="p-2">
                    <ServerComboBox
                      :key="`combobox-${form.supplier_id || 'all'}-${index}`"
                      v-model="item.selection"
                      :fetcher="fetchProductUnits"
                      value-key="selection"
                      label-key="label"
                      :exclude-values="selectedProductIds(item)"
                      :initial-option="findOption(item.selection)"
                      placeholder="Cari produk / SKU..."
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
                    <FieldError
                      :errors="[errors[`items.${index}.product_variant_id`]]"
                    />
                  </td>

                  <td class="p-2">
                    <ComboboxSelect
                      :model-value="item.unit_id ? String(item.unit_id) : ''"
                      :options="unitOptions(item)"
                      placeholder="Satuan"
                      search-placeholder="Cari satuan..."
                      :disabled="!item.selection"
                      class=""
                      :aria-invalid="!!errors[`items.${index}.unit_id`]"
                      @update:model-value="(val) => setSelectedUnit(item, val)"
                    />
                    <FieldError :errors="[errors[`items.${index}.unit_id`]]" />
                    <p
                      v-if="baseQuantity(item) > 0"
                      class="mt-1 text-[11px] text-muted-foreground"
                    >
                      = {{ numberFormat.format(baseQuantity(item)) }} satuan
                      dasar
                    </p>
                  </td>

                  <td class="p-2 text-right">
                    <Input
                      v-model="item.unit_quantity"
                      type="number"
                      step="any"
                      min="0"
                      class="text-right"
                      placeholder="0"
                      :aria-invalid="!!errors[`items.${index}.unit_quantity`]"
                    />
                    <FieldError
                      :errors="[errors[`items.${index}.unit_quantity`]]"
                    />
                  </td>

                  <td class="p-2 text-right">
                    <MoneyInput
                      v-model="item.unit_price"
                      class="text-right"
                      placeholder="0"
                      :aria-invalid="!!errors[`items.${index}.unit_price`]"
                    />
                    <FieldError
                      :errors="[errors[`items.${index}.unit_price`]]"
                    />
                  </td>

                  <td class="p-2">
                    <div class="flex gap-1">
                      <ComboboxSelect
                        :model-value="item.discount_type || 'none'"
                        :options="itemDiscountOptions"
                        placeholder="Diskon"
                        search-placeholder="Cari diskon..."
                        class="w-18"
                        @update:model-value="
                          (val) =>
                            setItemDiscountType(item, val === 'none' ? '' : val)
                        "
                      />
                      <Input
                        v-if="item.discount_type"
                        v-model="item.discount_value"
                        type="number"
                        step="any"
                        min="0"
                        class="w-20 text-right"
                        :aria-invalid="
                          !!errors[`items.${index}.discount_value`]
                        "
                      />
                    </div>
                    <FieldError
                      :errors="[errors[`items.${index}.discount_value`]]"
                    />
                  </td>

                  <td class="p-2 text-right">
                    <Input
                      v-model="item.tax_rate"
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      class="text-right"
                      placeholder="11"
                      :aria-invalid="!!errors[`items.${index}.tax_rate`]"
                    />
                    <FieldError :errors="[errors[`items.${index}.tax_rate`]]" />
                  </td>

                  <td class="p-2 text-right font-medium whitespace-nowrap pt-3">
                    {{ currencyFormat.format(lineSubtotal(item)) }}
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

        <!-- Diskon, Catatan, dan Ringkasan -->
        <section class="overflow-hidden rounded-xl border">
          <header class="bg-primary/5 px-4 py-3">
            <h3 class="text-sm font-semibold">
              Diskon, Catatan, dan Ringkasan
            </h3>
            <p class="text-xs text-muted-foreground">
              Tambahkan diskon atau catatan, lalu tinjau total Purchase Order
              sebelum disimpan.
            </p>
          </header>
          <div class="grid grid-cols-1 gap-6 p-4 lg:grid-cols-2">
            <FieldGroup class="flex flex-col gap-4">
              <Field :data-invalid="!!errors.discount_value">
                <FieldLabel>Diskon Keseluruhan (Header)</FieldLabel>
                <div class="flex gap-2">
                  <ComboboxSelect
                    :model-value="form.discount_type || 'none'"
                    :options="discountOptions"
                    placeholder="Pilih diskon"
                    search-placeholder="Cari diskon..."
                    class="w-48"
                    :aria-invalid="!!errors.discount_value"
                    @update:model-value="
                      (val) => setHeaderDiscountType(val === 'none' ? '' : val)
                    "
                  />
                  <Input
                    v-if="form.discount_type"
                    v-model="form.discount_value"
                    type="number"
                    step="any"
                    min="0"
                    class="w-36 text-right"
                    placeholder="0"
                    :aria-invalid="!!errors.discount_value"
                  />
                </div>
                <FieldError :errors="[errors.discount_value]" />
              </Field>

              <Field :data-invalid="!!errors.notes">
                <FieldLabel>Catatan Order</FieldLabel>
                <Textarea
                  v-model="form.notes"
                  rows="3"
                  placeholder="Instruksi pengiriman, syarat pembayaran, atau catatan internal..."
                  :aria-invalid="!!errors.notes"
                />
                <FieldError :errors="[errors.notes]" />
              </Field>
            </FieldGroup>

            <div class="flex justify-end">
              <div
                class="flex w-full max-w-sm flex-col gap-2 rounded-lg border bg-muted/20 p-4 text-sm"
              >
                <div class="mb-1">
                  <h4 class="font-semibold">Ringkasan Purchase Order</h4>
                  <p class="text-xs text-muted-foreground">
                    Perkiraan nilai sebelum dokumen disimpan.
                  </p>
                </div>
                <div class="flex justify-between text-muted-foreground">
                  <span>Subtotal Barang:</span>
                  <span>{{ currencyFormat.format(summary.basis) }}</span>
                </div>
                <div
                  v-if="summary.discount > 0"
                  class="flex justify-between text-destructive"
                >
                  <span>Diskon Header:</span>
                  <span>-{{ currencyFormat.format(summary.discount) }}</span>
                </div>
                <div class="flex justify-between text-muted-foreground">
                  <span>Pajak (PPN):</span>
                  <span>{{ currencyFormat.format(summary.tax) }}</span>
                </div>
                <div
                  class="flex justify-between border-t pt-2 font-semibold text-foreground"
                >
                  <span class="text-base">Grand Total:</span>
                  <span class="text-lg text-primary">{{
                    currencyFormat.format(summary.total)
                  }}</span>
                </div>
              </div>
            </div>
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
            {{ isEdit ? "Simpan Perubahan" : "Simpan Draft PO" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
