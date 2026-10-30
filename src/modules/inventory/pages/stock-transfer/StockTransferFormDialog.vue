<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  Add01Icon,
  Delete03Icon,
  WarehouseIcon,
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ServerComboBox from "@/components/server-combobox/ServerComboBox.vue";
import Spinner from "@/components/ui/spinner/Spinner.vue";
import { normalizeError } from "@/lib/errors";
import { toast } from "vue-sonner";
import type { ComboboxFetcher } from "@/core/composables/useComboBox";
import { stockTransferService } from "../../services/stock-transfer.service";
import type {
  StockTransfer,
  StockTransferItem,
  StockTransferOptions,
  StockTransferPayload,
  StockTransferProductOption,
} from "../../types/stock-transfer.types";

const open = defineModel<boolean>("open", { default: false });
const props = defineProps<{
  selectedTransfer?: { id: number } | null;
  options: StockTransferOptions;
}>();
const emit = defineEmits<{ saved: [transfer: StockTransfer] }>();

type DraftItem = {
  selection: string;
  product_variant_id: number | null;
  unit_id: number | null;
  unit_quantity: number | string;
  notes: string;
};
type Draft = {
  from_warehouse_id: string;
  to_warehouse_id: string;
  transfer_date: string;
  notes: string;
  items: DraftItem[];
};
const emptyItem = (): DraftItem => ({
  selection: "",
  product_variant_id: null,
  unit_id: null,
  unit_quantity: "",
  notes: "",
});
const initialDraft = (): Draft => ({
  from_warehouse_id: "",
  to_warehouse_id: "",
  transfer_date: new Date().toISOString().slice(0, 10),
  notes: "",
  items: [emptyItem()],
});
const form = reactive<Draft>(initialDraft());
const selectedOptions = reactive<Record<string, StockTransferProductOption>>(
  {},
);
const errors = ref<Record<string, string>>({});
const generalError = ref("");
const loading = ref(false);
const loadingDetail = ref(false);
const isEdit = computed(() => !!props.selectedTransfer);
const warehouseOptions = computed(() =>
  props.options.warehouses.map((w) => ({
    value: String(w.id),
    label: w.code ? `${w.name} (${w.code})` : w.name,
  })),
);
const fetchProducts: ComboboxFetcher = (search, params, requestOptions) =>
  form.from_warehouse_id
    ? stockTransferService.searchProductOptions(
        search,
        {
          ...params,
          warehouse_id: Number(form.from_warehouse_id),
          destination_warehouse_id: form.to_warehouse_id
            ? Number(form.to_warehouse_id)
            : undefined,
        },
        requestOptions,
      )
    : Promise.resolve([]);

function findOption(item: DraftItem) {
  return item.selection ? selectedOptions[item.selection] : undefined;
}
function unitOptions(item: DraftItem) {
  return (findOption(item)?.units ?? []).map((unit) => ({
    value: String(unit.unit_id),
    label: `${unit.unit_name} (${unit.unit_code})`,
  }));
}
function formatStock(value: number | string | null) {
  return value === null
    ? "-"
    : new Intl.NumberFormat("id-ID", { maximumFractionDigits: 4 }).format(
        Number(value),
      );
}
function selectedUnit(item: DraftItem) {
  return findOption(item)?.units.find((unit) => unit.unit_id === item.unit_id)
}
function stockInSelectedUnit(item: DraftItem, baseStock: number | string | null) {
  const conversionRate = Number(selectedUnit(item)?.conversion_rate ?? 1)
  return conversionRate > 0 ? Number(baseStock ?? 0) / conversionRate : 0
}
function formatItemStock(item: DraftItem, baseStock: number | string | null) {
  const unit = selectedUnit(item)
  return `${formatStock(stockInSelectedUnit(item, baseStock))} ${unit?.unit_code ?? unit?.unit_name ?? 'unit'}`
}
function formatOptionStock(option: StockTransferProductOption, baseStock: number | string | null) {
  const unit = option.units.find((item) => item.is_base) ?? option.units[0]
  return `${formatStock(baseStock)} ${unit?.unit_code ?? unit?.unit_name ?? 'unit'}`
}
function validateStockAvailability() {
  const validationErrors: Record<string, string> = {}
  form.items.forEach((item, index) => {
    const option = findOption(item)
    const requested = Number(item.unit_quantity)
    const available = stockInSelectedUnit(item, option?.source_stock_quantity ?? 0)
    if (option && item.unit_id && requested > available + 0.0000001) {
      validationErrors[`items.${index}.unit_quantity`] = `Stok tidak cukup. Maksimal ${formatItemStock(item, option.source_stock_quantity)}.`
    }
  })
  errors.value = { ...errors.value, ...validationErrors }
  return Object.keys(validationErrors).length === 0
}
function selectedProductIds(item: DraftItem) {
  return form.items
    .filter((other) => other !== item && other.product_variant_id !== null)
    .map((other) => other.product_variant_id as number);
}
function selectProduct(
  item: DraftItem,
  option: StockTransferProductOption | null,
) {
  if (!option) {
    item.selection = "";
    item.product_variant_id = null;
    item.unit_id = null;
    return;
  }
  if (selectedProductIds(item).includes(option.product_variant_id)) {
    toast.warning("Produk tersebut sudah ada dalam daftar transfer.");
    return;
  }
  item.selection = String(option.product_variant_id);
  selectedOptions[item.selection] = option;
  item.product_variant_id = option.product_variant_id;
  item.unit_id =
    option.units.find((unit) => unit.is_base)?.unit_id ??
    option.units[0]?.unit_id ??
    null;
}
function addItem() {
  form.items.push(emptyItem());
}
function removeItem(index: number) {
  if (form.items.length > 1) form.items.splice(index, 1);
}
function reset() {
  Object.assign(form, initialDraft());
  Object.keys(selectedOptions).forEach((key) => delete selectedOptions[key]);
  errors.value = {};
  generalError.value = "";
}
async function loadDetail() {
  if (!props.selectedTransfer) return;
  loadingDetail.value = true;
  try {
    const transfer = await stockTransferService.show(props.selectedTransfer.id);
    Object.assign(form, {
      from_warehouse_id: String(transfer.from_warehouse_id),
      to_warehouse_id: String(transfer.to_warehouse_id),
      transfer_date: transfer.transfer_date,
      notes: transfer.notes ?? "",
      items: transfer.items.map((item: StockTransferItem) => {
        const selection = String(item.product_variant_id);
        selectedOptions[selection] = {
          product_variant_id: item.product_variant_id,
          product_name: item.product_name ?? "",
          variant_name: item.variant_name ?? null,
          sku: item.sku ?? "",
          label: `${item.product_name ?? ""} / ${item.variant_name ?? ""} · SKU ${item.sku ?? ""}`,
          stock_quantity: 0,
          source_stock_quantity: 0,
          destination_stock_quantity: null,
          units: [
            {
              unit_id: item.unit_id,
              unit_name: item.unit_name ?? "",
              unit_code: item.unit_code ?? "",
              conversion_rate: item.conversion_rate ?? 1,
              is_base: true,
              unit_cost: null,
            },
          ],
        };
        return {
          selection,
          product_variant_id: item.product_variant_id,
          unit_id: item.unit_id,
          unit_quantity: item.unit_quantity,
          notes: item.notes ?? "",
        };
      }),
    });
  } catch (error) {
    generalError.value = normalizeError(error).message;
  } finally {
    loadingDetail.value = false;
  }
}
watch(open, (value) => {
  if (value) props.selectedTransfer ? void loadDetail() : reset();
  else reset();
});
watch(
  () => form.from_warehouse_id,
  (warehouseId, previousWarehouseId) => {
    if (!previousWarehouseId || warehouseId === previousWarehouseId) return;

    form.items.forEach((item) => Object.assign(item, emptyItem()));
    Object.keys(selectedOptions).forEach((key) => delete selectedOptions[key]);
  },
);
async function submit() {
  errors.value = {};
  generalError.value = "";
  if (!validateStockAvailability()) return;
  loading.value = true;
  const payload: StockTransferPayload = {
    from_warehouse_id: Number(form.from_warehouse_id),
    to_warehouse_id: Number(form.to_warehouse_id),
    transfer_date: form.transfer_date,
    notes: form.notes || null,
    items: form.items.map((item) => ({
      product_variant_id: Number(item.product_variant_id),
      unit_id: Number(item.unit_id),
      unit_quantity: Number(item.unit_quantity),
      notes: item.notes || null,
    })),
  };
  try {
    const saved = isEdit.value
      ? await stockTransferService.update(props.selectedTransfer!.id, payload)
      : await stockTransferService.store(payload);
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
      class="max-h-[92dvh] w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] min-w-0 overflow-x-hidden overflow-y-auto sm:max-w-7xl"
    >
      <DialogHeader class="min-w-0">
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          >
            <HugeiconsIcon :icon="WarehouseIcon" aria-hidden="true" />
          </div>
          <div class="flex min-w-0 flex-col gap-1">
            <DialogTitle>{{
              isEdit ? "Ubah Transfer Stok" : "Buat Transfer Stok Baru"
            }}</DialogTitle>
            <DialogDescription>
              Kirim stok dari gudang asal ke gudang tujuan melalui proses kirim
              dan terima.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div
        v-if="loadingDetail"
        class="flex min-h-48 items-center justify-center"
      >
        <Spinner class="size-8" />
      </div>
      <form v-else class="flex min-w-0 flex-col gap-5" @submit.prevent="submit">
        <Alert v-if="generalError" variant="destructive"
          ><AlertTitle>Terjadi kesalahan</AlertTitle
          ><AlertDescription>{{ generalError }}</AlertDescription></Alert
        >
        <section class="overflow-hidden rounded-xl border">
          <header class="bg-primary/5 px-4 py-3">
            <h3 class="text-sm font-semibold">Informasi Transfer Stok</h3>
            <p class="text-xs text-muted-foreground">
              Tentukan gudang asal, gudang tujuan, dan tanggal transfer.
            </p>
          </header>
          <div class="p-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field
                ><FieldLabel required>Gudang Asal</FieldLabel
                ><ComboboxSelect
                  v-model="form.from_warehouse_id"
                  :options="warehouseOptions"
                  placeholder="Pilih gudang asal"
                  search-placeholder="Cari gudang..." /><FieldError
                  :errors="[errors.from_warehouse_id]"
              /></Field>
              <Field
                ><FieldLabel required>Gudang Tujuan</FieldLabel
                ><ComboboxSelect
                  v-model="form.to_warehouse_id"
                  :options="
                    warehouseOptions.filter(
                      (w) => w.value !== form.from_warehouse_id,
                    )
                  "
                  placeholder="Pilih gudang tujuan"
                  search-placeholder="Cari gudang..." /><FieldError
                  :errors="[errors.to_warehouse_id]"
              /></Field>
              <Field
                ><FieldLabel required>Tanggal Transfer</FieldLabel
                ><Input v-model="form.transfer_date" type="date" /><FieldError
                  :errors="[errors.transfer_date]"
              /></Field>
            </div>
          </div>
        </section>
        <section class="overflow-hidden rounded-xl border">
          <header
            class="flex flex-wrap items-center justify-between gap-3 bg-primary/5 px-4 py-3"
          >
            <div>
              <h3 class="text-sm font-semibold">Item Transfer</h3>
              <p class="text-xs text-muted-foreground">
                Tambahkan produk, satuan, jumlah, dan catatan untuk setiap
                baris.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              :disabled="!form.from_warehouse_id"
              @click="addItem"
            >
              <HugeiconsIcon
                :icon="Add01Icon"
                data-icon="inline-start"
                aria-hidden="true"
              />
              Tambah Item
            </Button>
          </header>
          <div class="overflow-x-auto rounded-lg border">
            <table class="min-w-[900px] w-full text-sm">
              <thead class="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th class="p-3">Produk / Varian</th>
                  <th class="w-40 p-3">Satuan</th>
                  <th class="w-32 p-3 text-right">Jumlah</th>
                  <th class="w-56 p-3">Catatan</th>
                  <th class="w-12 p-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y">
                <tr
                  v-for="(item, index) in form.items"
                  :key="index"
                  class="align-top"
                >
                  <td class="p-2">
                    <ServerComboBox
                      :key="`${form.from_warehouse_id}-${index}`"
                      v-model="item.selection"
                      :fetcher="fetchProducts"
                      :params="{ warehouse_id: Number(form.from_warehouse_id) }"
                      value-key="product_variant_id"
                      label-key="label"
                      :exclude-values="selectedProductIds(item)"
                      :initial-option="findOption(item)"
                      :disabled="!form.from_warehouse_id"
                      placeholder="Cari produk, SKU..."
                      search-placeholder="Cari produk, varian, atau SKU..."
                      @select="
                        (option) =>
                          selectProduct(
                            item,
                            option as StockTransferProductOption,
                          )
                      "
                      ><template #option="{ option }"
                        ><div class="min-w-0">
                          <div class="truncate font-medium">
                            {{ option.label }}
                          </div>
                          <div
                            class="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground"
                          >
                            <span class="rounded-sm bg-muted px-1.5 py-0.5"
                              >Asal:
                              {{ formatOptionStock(option, option.source_stock_quantity) }}</span
                            ><span class="rounded-sm bg-muted px-1.5 py-0.5"
                              >Tujuan:
                              {{ formatOptionStock(option, option.destination_stock_quantity) }}</span
                            >
                          </div>
                        </div></template
                      ></ServerComboBox
                    >
                    <div
                      v-if="findOption(item)"
                      class="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground"
                    >
                      <span class="rounded-md bg-muted px-1.5 py-0.5"
                        >Asal:
                        {{ formatItemStock(item, findOption(item)?.source_stock_quantity ?? null) }}</span
                      ><span class="rounded-md bg-muted px-1.5 py-0.5"
                        >Tujuan:
                        {{ formatItemStock(item, findOption(item)?.destination_stock_quantity ?? null) }}</span
                      >
                    </div>
                    <p
                      v-if="errors[`items.${index}.product_variant_id`]"
                      class="mt-1 text-xs text-destructive"
                    >
                      {{ errors[`items.${index}.product_variant_id`] }}
                    </p>
                  </td>
                  <td class="p-2">
                    <ComboboxSelect
                      :model-value="item.unit_id ? String(item.unit_id) : ''"
                      :options="unitOptions(item)"
                      :disabled="!item.selection"
                      placeholder="Pilih satuan"
                      @update:model-value="
                        (value) => (item.unit_id = value ? Number(value) : null)
                      "
                    />
                  </td>
                  <td class="p-2">
                    <Input
                      v-model="item.unit_quantity"
                      type="number"
                      min="0"
                      step="any"
                      class="text-right"
                    />
                    <p
                      v-if="errors[`items.${index}.unit_quantity`]"
                      class="mt-1 text-xs text-destructive"
                    >
                      {{ errors[`items.${index}.unit_quantity`] }}
                    </p>
                  </td>
                  <td class="p-2">
                    <Input v-model="item.notes" placeholder="Catatan item..." />
                  </td>
                  <td class="p-2 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      :disabled="form.items.length <= 1"
                      @click="removeItem(index)"
                      ><HugeiconsIcon :icon="Delete03Icon"
                    /></Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <Field
          ><FieldLabel>Catatan transfer</FieldLabel
          ><Textarea
            v-model="form.notes"
            rows="2"
            placeholder="Catatan umum transfer..." /><FieldError
            :errors="[errors.notes]"
        /></Field>
        <DialogFooter
          ><Button
            type="button"
            variant="outline"
            :disabled="loading"
            @click="open = false"
            >Batal</Button
          ><Button
            type="submit"
            :disabled="
              loading || !form.from_warehouse_id || !form.to_warehouse_id
            "
            ><Spinner v-if="loading" />
            {{ loading ? "Menyimpan..." : "Simpan Draft" }}</Button
          ></DialogFooter
        >
      </form>
    </DialogContent>
  </Dialog>
</template>
