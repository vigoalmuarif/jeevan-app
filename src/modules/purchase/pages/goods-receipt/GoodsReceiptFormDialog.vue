<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Add01Icon, Delete03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ComboboxSelect from '@/components/ui/combobox/ComboboxSelect.vue'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import MoneyInput from '@/components/ui/input-group/MoneyInput.vue'
import { Textarea } from '@/components/ui/textarea'
import ServerComboBox from '@/components/server-combobox/ServerComboBox.vue'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import { normalizeError } from '@/lib/errors'
import type { ComboboxFetcher } from '@/core/composables/useComboBox'
import { toast } from 'vue-sonner'
import { goodsReceiptService } from '../../services/goods-receipt.service'
import { purchaseOrderService } from '../../services/purchase-order.service'
import type {
  GoodsReceipt,
  GoodsReceiptItemPayload,
  GoodsReceiptListItem,
  GoodsReceiptOptions,
  GoodsReceiptPayload,
  GoodsReceiptProductOption,
} from '../../types/goods-receipt.types'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  selectedReceipt?: GoodsReceiptListItem
  options: GoodsReceiptOptions
  initialPurchaseOrderId?: string
}>()
const emit = defineEmits<{ saved: [receipt: GoodsReceipt] }>()

type DraftItem = {
  selection: string | null
  purchase_order_item_id?: number | null
  product_variant_id: number | null
  unit_id: number | null
  unit_quantity: number | string
  unit_price: number | string
  discount_type: 'percent' | 'amount' | ''
  discount_value: number | string
  tax_rate: number | string
  notes: string
}
type Draft = {
  purchase_order_id: string
  supplier_id: string
  warehouse_id: string
  receipt_date: string
  delivery_note_number: string
  is_tax_inclusive: boolean
  discount_type: 'percent' | 'amount' | ''
  discount_value: number | string
  notes: string
  items: DraftItem[]
}

const emptyItem = (): DraftItem => ({
  selection: '',
  purchase_order_item_id: null,
  product_variant_id: null,
  unit_id: null,
  unit_quantity: '',
  unit_price: 0,
  discount_type: '',
  discount_value: 0,
  tax_rate: '',
  notes: '',
})
const initialDraft = (): Draft => ({
  purchase_order_id: '',
  supplier_id: '',
  warehouse_id: '',
  receipt_date: new Date().toISOString().slice(0, 10),
  delivery_note_number: '',
  is_tax_inclusive: false,
  discount_type: '',
  discount_value: 0,
  notes: '',
  items: [emptyItem()],
})
const form = reactive<Draft>(initialDraft())
const selectedProductOptions = reactive<Record<string, GoodsReceiptProductOption>>({})
const loading = ref(false)
const loadingFetch = ref(false)
const loadingFetchError = ref(false)
const errors = ref<Record<string, string>>({})
const generalError = ref('')
const isEdit = computed(() => !!props.selectedReceipt)
const currencyFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const numberFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 })
const purchaseOrderOptions = computed(() => [
  ...(!props.options.settings?.require_po ? [{ value: 'none', label: 'Tanpa Purchase Order (Penerimaan Langsung)' }] : []),
  ...(props.options.orders ?? []).map(order => ({
    value: String(order.id),
    label: `PO ${order.document_number} (${order.order_date})`,
  })),
])
const selectedPurchaseOrder = computed(() => {
  const orderId = Number(form.purchase_order_id)
  return (props.options.orders ?? []).find(order => order.id === orderId)
})
const supplierOptions = computed(() => props.options.suppliers.map(supplier => ({
  value: String(supplier.id),
  label: `${supplier.name}${supplier.code ? ` (${supplier.code})` : ''}`,
})))
const warehouseOptions = computed(() => props.options.warehouses.map(warehouse => ({
  value: String(warehouse.id),
  label: `${warehouse.name}${warehouse.code ? ` (${warehouse.code})` : ''}`,
})))
const discountOptions = [
  { value: 'none', label: 'Tanpa diskon' },
  { value: 'percent', label: 'Persentase (%)' },
  { value: 'amount', label: 'Nominal (Rp)' },
]
const itemDiscountOptions = [
  { value: 'none', label: '—' },
  { value: 'percent', label: '%' },
  { value: 'amount', label: 'Rp' },
]
const fetchProductUnits: ComboboxFetcher = (search, params, requestOptions) =>
  goodsReceiptService.searchProductUnits(search, {
    ...params,
    supplier_id: form.supplier_id || undefined,
  }, requestOptions)

function setHeaderDiscountType(value: unknown) {
  form.discount_type = value === 'percent' || value === 'amount' ? value : ''
}
function setItemDiscountType(item: DraftItem, value: unknown) {
  item.discount_type = value === 'percent' || value === 'amount' ? value : ''
}

function findOption(selection: string | null) {
  return selection ? selectedProductOptions[selection] : undefined
}
function unitOptions(item: DraftItem) {
  return (findOption(item.selection)?.units ?? []).map(unit => ({
    value: String(unit.unit_id),
    label: `${unit.unit_name} (${unit.unit_code})`,
  }))
}
function setSelectedOption(item: DraftItem, option: GoodsReceiptProductOption | null) {
  if (!option) {
    item.selection = ''
    item.product_variant_id = null
    item.unit_id = null
    item.tax_rate = ''
    return
  }
  item.selection = String(option.product_variant_id)
  selectedProductOptions[item.selection] = option
  item.product_variant_id = option.product_variant_id
  const baseUnit = option.units.find(unit => unit.is_base) ?? option.units[0]
  item.unit_id = baseUnit?.unit_id ?? null
  item.unit_price = Number(baseUnit?.unit_cost) || 0
  item.tax_rate = option.tax_rate === null ? '' : Number(option.tax_rate)
}
watch(() => form.supplier_id, (supplierId, previousSupplierId) => {
  if (!previousSupplierId || supplierId === previousSupplierId) return
  for (const item of form.items) setSelectedOption(item, null)
})
function setSelectedUnit(item: DraftItem, value: unknown) {
  const unitId = Number(value)
  item.unit_id = Number.isFinite(unitId) && unitId > 0 ? unitId : null
  const selectedUnit = findOption(item.selection)?.units.find(unit => unit.unit_id === item.unit_id)
  if (selectedUnit) item.unit_price = Number(selectedUnit.unit_cost) || 0
}
function baseQuantity(item: DraftItem) {
  const conversionRate = findOption(item.selection)?.units
    .find(unit => unit.unit_id === item.unit_id)?.conversion_rate
  return (Number(item.unit_quantity) || 0) * (Number(conversionRate) || 0)
}
function resetForm() {
  Object.assign(form, initialDraft())
  Object.keys(selectedProductOptions).forEach(key => delete selectedProductOptions[key])
  errors.value = {}
  generalError.value = ''
  loadingFetchError.value = false
}
function addItem() {
  form.items.push(emptyItem())
}
function removeItem(index: number) {
  if (form.items.length > 1) form.items.splice(index, 1)
}
function discount(amount: number, type: string, value: number) {
  if (type === 'percent') return Math.min(amount, amount * value / 100)
  if (type === 'amount') return Math.min(amount, value)
  return 0
}
const summary = computed(() => {
  const rowValues = form.items.map(item => {
    const gross = Math.max(0, Number(item.unit_quantity) || 0) * Math.max(0, Number(item.unit_price) || 0)
    const afterDiscount = gross - discount(gross, item.discount_type, Number(item.discount_value) || 0)
    return { afterDiscount, taxRate: Math.max(0, Number(item.tax_rate) || 0) }
  })
  const basis = rowValues.reduce((sum, row) => sum + row.afterDiscount, 0)
  const totalDiscount = discount(basis, form.discount_type, Number(form.discount_value) || 0)
  const totals = rowValues.reduce((sum, row) => {
    const share = basis > 0 ? totalDiscount * row.afterDiscount / basis : 0
    const net = Math.max(0, row.afterDiscount - share)
    const subtotal = form.is_tax_inclusive ? net / (1 + row.taxRate / 100) : net
    const tax = form.is_tax_inclusive ? net - subtotal : subtotal * row.taxRate / 100
    return { subtotal: sum.subtotal + subtotal, tax: sum.tax + tax, total: sum.total + subtotal + tax }
  }, { subtotal: 0, tax: 0, total: 0 })
  return { ...totals, basis, discount: totalDiscount }
})
function itemError(index: number) {
  return errors.value[`items.${index}.unit_quantity`]
    ?? errors.value[`items.${index}.unit_price`]
    ?? errors.value[`items.${index}.unit_id`]
    ?? errors.value[`items.${index}.product_variant_id`]
    ?? ''
}

async function fetchReceipt() {
  if (!props.selectedReceipt) return
  loadingFetch.value = true
  loadingFetchError.value = false
  try {
    const receipt = await goodsReceiptService.show(props.selectedReceipt.id)
    const items = receipt.items.map(item => {
      const selection = String(item.product_variant_id)
      const option: GoodsReceiptProductOption = {
        selection,
        label: `${item.product_name ?? 'Produk tidak tersedia'}${item.variant_name ? ` / ${item.variant_name}` : ''} · SKU ${item.sku ?? '-'}`,
        product_id: 0,
        product_name: item.product_name ?? 'Produk tidak tersedia',
        product_variant_id: item.product_variant_id,
        variant_name: item.variant_name,
        sku: item.sku ?? '',
        units: [{
          unit_id: item.unit_id,
          unit_name: item.unit_name ?? 'Satuan tidak tersedia',
          unit_code: item.unit_code ?? '',
          conversion_rate: item.conversion_rate,
          is_base: false,
          unit_cost: item.unit_cost,
        }],
        tax_rate: Number(item.tax_rate),
      }
      selectedProductOptions[selection] = option
      return {
        selection,
        purchase_order_item_id: (item as any).purchase_order_item_id ?? null,
        product_variant_id: item.product_variant_id,
        unit_id: item.unit_id,
        unit_quantity: Number(item.unit_quantity),
        unit_price: Number(item.unit_price),
        discount_type: item.discount_type ?? '',
        discount_value: Number(item.discount_value),
        tax_rate: Number(item.tax_rate),
        notes: item.notes ?? '',
      }
    })
    Object.assign(form, {
      purchase_order_id: receipt.purchase_order_id ? String(receipt.purchase_order_id) : '',
      supplier_id: String(receipt.supplier_id),
      warehouse_id: String(receipt.warehouse_id),
      receipt_date: receipt.receipt_date.slice(0, 10),
      delivery_note_number: receipt.delivery_note_number ?? '',
      is_tax_inclusive: receipt.is_tax_inclusive,
      discount_type: receipt.discount_type ?? '',
      discount_value: Number(receipt.discount_value),
      notes: receipt.notes ?? '',
      items,
    })
  } catch (error) {
    generalError.value = normalizeError(error).message
    loadingFetchError.value = true
  } finally {
    loadingFetch.value = false
  }
}

async function onSelectPurchaseOrder(value: unknown) {
  const orderId = value === 'none' ? '' : String(value ?? '')
  form.purchase_order_id = orderId
  if (!orderId) return

  loadingFetch.value = true
  try {
    const po = await purchaseOrderService.show(Number(orderId))
    form.supplier_id = String(po.supplier_id)
    form.warehouse_id = String(po.warehouse_id)
    form.is_tax_inclusive = po.is_tax_inclusive

    const openItems = po.items.filter(item => Number(item.remaining_base_quantity) > 0)
    if (openItems.length > 0) {
      form.items = openItems.map(item => {
        const selection = String(item.product_variant_id)
        const option: GoodsReceiptProductOption = {
          selection,
          label: `${item.product_name ?? 'Produk'}${item.variant_name ? ` / ${item.variant_name}` : ''} · SKU ${item.sku ?? '-'}`,
          product_id: 0,
          product_name: item.product_name ?? '',
          product_variant_id: item.product_variant_id,
          variant_name: item.variant_name ?? null,
          sku: item.sku ?? '',
          units: [
            {
              unit_id: item.unit_id,
              unit_name: item.unit_name ?? '',
              unit_code: item.unit_code ?? '',
              conversion_rate: item.conversion_rate,
              is_base: false,
              unit_cost: item.unit_price,
            },
          ],
          tax_rate: Number(item.tax_rate),
        }
        selectedProductOptions[selection] = option

        return {
          selection,
          purchase_order_item_id: item.id,
          product_variant_id: item.product_variant_id,
          unit_id: item.unit_id,
          unit_quantity: Number(item.remaining_unit_quantity),
          unit_price: Number(item.unit_price),
          discount_type: (item.discount_type as any) ?? '',
          discount_value: Number(item.discount_value),
          tax_rate: Number(item.tax_rate),
          notes: item.notes ?? '',
        }
      })
    }
  } catch (err) {
    toast.error(normalizeError(err).message)
  } finally {
    loadingFetch.value = false
  }
}

watch(open, async isOpen => {
  if (!isOpen) return
  resetForm()
  if (props.selectedReceipt) {
    await fetchReceipt()
  } else if (props.initialPurchaseOrderId) {
    await onSelectPurchaseOrder(props.initialPurchaseOrderId)
  }
})

async function handleSubmit() {
  errors.value = {}
  generalError.value = ''
  if (!form.supplier_id || !form.warehouse_id || form.items.some(item => !item.product_variant_id || !item.unit_id || Number(item.unit_quantity) <= 0)) {
    generalError.value = 'Lengkapi supplier, gudang, produk, satuan, dan jumlah setiap item.'
    return
  }
  const payload: GoodsReceiptPayload = {
    purchase_order_id: form.purchase_order_id ? Number(form.purchase_order_id) : null,
    supplier_id: Number(form.supplier_id),
    warehouse_id: Number(form.warehouse_id),
    receipt_date: form.receipt_date,
    delivery_note_number: form.delivery_note_number.trim() || null,
    is_tax_inclusive: form.is_tax_inclusive,
    discount_type: form.discount_type || null,
    discount_value: Number(form.discount_value) || 0,
    notes: form.notes.trim() || null,
    items: form.items.map(item => ({
      purchase_order_item_id: item.purchase_order_item_id ? Number(item.purchase_order_item_id) : null,
      product_variant_id: Number(item.product_variant_id),
      unit_id: Number(item.unit_id),
      unit_quantity: Number(item.unit_quantity),
      unit_price: Number(item.unit_price) || 0,
      discount_type: item.discount_type || null,
      discount_value: Number(item.discount_value) || 0,
      tax_rate: item.tax_rate === '' ? null : Number(item.tax_rate),
      notes: item.notes.trim() || null,
    } satisfies GoodsReceiptItemPayload)),
  }
  loading.value = true
  try {
    const receipt = isEdit.value && props.selectedReceipt
      ? await goodsReceiptService.update(props.selectedReceipt.id, payload)
      : await goodsReceiptService.store(payload)
    emit('saved', receipt)
    open.value = false
    resetForm()
  } catch (error) {
    const normalized = normalizeError(error)
    if (normalized.status === 422) {
      errors.value = normalized.errors
      generalError.value = normalized.errors.document ?? ''
    } else generalError.value = normalized.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="h-[94dvh] max-h-[97dvh] w-[calc(100vw-0.5rem)] max-w-[calc(100vw-0.5rem)] gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-1.5rem)] lg:max-w-8xl" @interact-outside.prevent>
      <DialogHeader class="border-b px-4 py-4 pr-12 sm:px-6 sm:py-5">
        <DialogTitle>{{ isEdit ? 'Ubah draft penerimaan' : 'Buat penerimaan barang' }}</DialogTitle>
        <DialogDescription>Catat penerimaan dari supplier. Stok baru berubah setelah dokumen diposting.</DialogDescription>
      </DialogHeader>
      <form class="flex min-h-0 flex-1 flex-col overflow-hidden" novalidate @submit.prevent="handleSubmit">
        <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6">
          <Alert v-if="generalError" variant="destructive">
            <AlertTitle>Penerimaan belum tersimpan</AlertTitle>
            <AlertDescription>{{ generalError }}</AlertDescription>
          </Alert>
          <Alert v-if="selectedPurchaseOrder" class="border-primary/30 bg-primary/5">
            <AlertTitle>Penerimaan berasal dari Purchase Order</AlertTitle>
            <AlertDescription class="flex flex-wrap items-center gap-2">
              <span>Referensi PO:</span>
              <Badge variant="outline">{{ selectedPurchaseOrder.document_number }}</Badge>
            </AlertDescription>
          </Alert>
          <div v-if="loadingFetch" class="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Memuat draft...</div>
          <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field class="gap-1.5 sm:col-span-2 lg:col-span-4">
              <FieldLabel for="gr-po">
                Rujukan Purchase Order (PO)
                <span v-if="options.settings?.require_po" class="text-xs font-semibold text-destructive">
                  * Wajib (Pengaturan merchant mewajibkan PO)
                </span>
                <span v-else class="text-xs font-normal text-muted-foreground">
                  (Opsional · Otomatis mengisi supplier, gudang & sisa barang)
                </span>
              </FieldLabel>
              <ComboboxSelect
                :model-value="form.purchase_order_id || 'none'"
                :options="purchaseOrderOptions"
                placeholder="Pilih Purchase Order..."
                search-placeholder="Cari nomor PO..."
                :disabled="loading || isEdit"
                @update:model-value="onSelectPurchaseOrder"
              />
              <FieldError v-if="errors.purchase_order_id">{{ errors.purchase_order_id }}</FieldError>
            </Field>

            <Field class="gap-1.5">
              <FieldLabel for="gr-supplier">Supplier</FieldLabel>
              <ComboboxSelect
                v-model="form.supplier_id"
                :options="supplierOptions"
                placeholder="Pilih supplier"
                search-placeholder="Cari supplier..."
                :disabled="loading"
              />
              <FieldError v-if="errors.supplier_id">{{ errors.supplier_id }}</FieldError>
            </Field>
            <Field class="gap-1.5">
              <FieldLabel for="gr-warehouse">Gudang</FieldLabel>
              <ComboboxSelect
                v-model="form.warehouse_id"
                :options="warehouseOptions"
                placeholder="Pilih gudang"
                search-placeholder="Cari gudang..."
                :disabled="loading"
              />
              <FieldError v-if="errors.warehouse_id">{{ errors.warehouse_id }}</FieldError>
            </Field>
            <Field class="gap-1.5">
              <FieldLabel for="gr-date">Tanggal penerimaan</FieldLabel>
              <Input id="gr-date" v-model="form.receipt_date" type="date" :disabled="loading" />
              <FieldError v-if="errors.receipt_date">{{ errors.receipt_date }}</FieldError>
            </Field>
            <Field class="gap-1.5">
              <FieldLabel for="gr-delivery-note">Nomor surat jalan</FieldLabel>
              <Input id="gr-delivery-note" v-model="form.delivery_note_number" maxlength="50" placeholder="Opsional" :disabled="loading" />
            </Field>
            <Field class="gap-1.5 sm:col-span-2">
              <FieldLabel for="gr-discount-type">Diskon dokumen</FieldLabel>
              <div class="flex gap-2">
                <ComboboxSelect
                  :model-value="form.discount_type || 'none'"
                  :options="discountOptions"
                  placeholder="Tanpa diskon"
                  search-placeholder="Cari jenis diskon..."
                  class="w-36"
                  @update:model-value="setHeaderDiscountType"
                />
                <MoneyInput
                  v-if="form.discount_type === 'amount'"
                  v-model="form.discount_value"
                  class="max-w-56"
                  :disabled="loading || !form.supplier_id"
                />
                <Input
                  v-else
                  v-model.number="form.discount_value"
                  type="number"
                  min="0"
                  step="1"
                  :disabled="!form.discount_type || loading"
                />
              </div>
              <FieldError v-if="errors.discount_value">{{ errors.discount_value }}</FieldError>
            </Field>
            <label class="flex items-center gap-2 self-end pb-2 text-sm">
              <input v-model="form.is_tax_inclusive" type="checkbox" class="size-4 accent-primary" :disabled="loading">
              Harga sudah termasuk pajak
            </label>
            <Field class="gap-1.5 sm:col-span-2 lg:col-span-4">
              <FieldLabel for="gr-notes">Catatan</FieldLabel>
              <Textarea id="gr-notes" v-model="form.notes" rows="2" placeholder="Catatan penerimaan (opsional)" :disabled="loading" />
            </Field>
          </div>

          <section class="overflow-hidden rounded-xl border">
            <div class="flex flex-wrap items-center justify-between gap-3 bg-primary/5 px-4 py-3">
              <div><h3 class="text-sm font-semibold">Item penerimaan</h3><p class="text-xs text-muted-foreground">Pajak kosong mengikuti tarif produk atau default merchant.</p></div>
              <Button type="button" variant="outline" size="sm" :disabled="loading" @click="addItem"><HugeiconsIcon :icon="Add01Icon" data-icon="inline-start" /> Tambah item</Button>
            </div>
            <div class="space-y-3 p-3 xl:hidden">
              <article v-for="(item, index) in form.items" :key="index" class="min-w-0 space-y-3 rounded-lg border bg-background p-3">
                <div class="flex items-center justify-between gap-2">
                  <p class="text-sm font-semibold">Item {{ index + 1 }}</p>
                  <Button type="button" variant="ghost" size="icon" :disabled="loading || form.items.length === 1" :aria-label="`Hapus item ${index + 1}`" @click="removeItem(index)"><HugeiconsIcon :icon="Delete03Icon" /></Button>
                </div>
                <Field class="min-w-0">
                  <FieldLabel>Produk / varian</FieldLabel>
                  <ServerComboBox
                    :key="`${index}-${form.supplier_id}`"
                    v-model="item.selection"
                    :fetcher="fetchProductUnits"
                    value-key="selection"
                    label-key="label"
                    placeholder="Pilih produk dan varian"
                    search-placeholder="Cari produk, SKU, atau satuan..."
                    empty-text="Produk tidak ditemukan."
                    :disabled="loading"
                    :initial-option="findOption(item.selection)"
                    @select="setSelectedOption(item, $event as GoodsReceiptProductOption | null)"
                  >
                    <template #option="{ option }">
                      <div class="flex min-w-0 flex-col">
                        <span class="truncate font-medium">{{ option.product_name }}{{ option.variant_name ? ` / ${option.variant_name}` : '' }}</span>
                        <span class="truncate text-xs text-muted-foreground">SKU {{ option.sku }}</span>
                      </div>
                    </template>
                  </ServerComboBox>
                  <FieldError v-if="errors[`items.${index}.product_variant_id`]">{{ errors[`items.${index}.product_variant_id`] }}</FieldError>
                </Field>
                <div class="grid min-w-0 gap-3 sm:grid-cols-2">
                  <Field class="min-w-0">
                    <FieldLabel>Satuan</FieldLabel>
                    <ComboboxSelect
                      :model-value="item.unit_id === null ? '' : String(item.unit_id)"
                      :options="unitOptions(item)"
                      placeholder="Pilih satuan"
                      search-placeholder="Cari satuan..."
                      :disabled="loading || !findOption(item.selection)?.units.length"
                      @update:model-value="setSelectedUnit(item, $event)"
                    />
                    <FieldError v-if="errors[`items.${index}.unit_id`]">{{ errors[`items.${index}.unit_id`] }}</FieldError>
                  </Field>
                  <Field class="min-w-0">
                    <FieldLabel>Jumlah</FieldLabel>
                    <Input v-model.number="item.unit_quantity" type="number" min="0" step="1" placeholder="0" :disabled="loading" />
                    <FieldError v-if="errors[`items.${index}.unit_quantity`]">{{ errors[`items.${index}.unit_quantity`] }}</FieldError>
                  </Field>
                  <Field class="min-w-0 sm:col-span-2">
                    <FieldLabel>Harga satuan</FieldLabel>
                    <MoneyInput v-model="item.unit_price" class="w-full min-w-0" placeholder="0" :disabled="loading" />
                    <FieldError v-if="errors[`items.${index}.unit_price`]">{{ errors[`items.${index}.unit_price`] }}</FieldError>
                  </Field>
                  <p v-if="item.unit_id && Number(item.unit_quantity) > 0" class="text-xs text-muted-foreground sm:col-span-2">
                    Jumlah stok: {{ numberFormat.format(baseQuantity(item)) }} satuan dasar
                  </p>
                  <Field class="min-w-0">
                    <FieldLabel>Diskon</FieldLabel>
                    <div class="flex min-w-0 gap-1">
                      <ComboboxSelect
                        :model-value="item.discount_type || 'none'"
                        :options="itemDiscountOptions"
                        placeholder="—"
                        search-placeholder="Cari diskon..."
                        class="w-20 shrink-0"
                        @update:model-value="setItemDiscountType(item, $event)"
                      />
                      <MoneyInput v-if="item.discount_type === 'amount'" v-model="item.discount_value" class="min-w-0" :disabled="loading" />
                      <Input v-else v-model.number="item.discount_value" type="number" min="0" step="1" :disabled="!item.discount_type || loading" />
                    </div>
                  </Field>
                  <Field class="min-w-0">
                    <FieldLabel>Pajak %</FieldLabel>
                    <Input v-model="item.tax_rate" type="number" min="0" max="100" step="1" placeholder="Default" :disabled="loading" />
                  </Field>
                  <Field class="min-w-0">
                    <FieldLabel>Catatan</FieldLabel>
                    <Input v-model="item.notes" maxlength="255" placeholder="Opsional" :disabled="loading" />
                  </Field>
                </div>
                <p v-if="itemError(index)" class="text-sm text-destructive">{{ itemError(index) }}</p>
              </article>
            </div>
            <div class="hidden overflow-x-auto xl:block">
              <table class="w-full min-w-[1170px] text-sm">
                <thead class="bg-muted/40 text-left text-xs text-muted-foreground"><tr>
                  <th class="p-2.5">Produk / varian</th><th class="p-2.5">Satuan</th><th class="p-2.5">Jumlah</th><th class="w-56 min-w-56 p-2.5">Harga satuan</th>
                  <th class="p-2.5">Diskon</th><th class="p-2.5">Pajak %</th><th class="p-2.5">Catatan</th><th class="w-10 p-2"></th>
                </tr></thead>
                <tbody class="divide-y">
                  <tr v-for="(item, index) in form.items" :key="index" class="align-top">
                    <td class="min-w-64 p-2">
                      <ServerComboBox
                        :key="`${index}-${form.supplier_id}`"
                        v-model="item.selection"
                        :fetcher="fetchProductUnits"
                        value-key="selection"
                        label-key="label"
                        placeholder="Pilih produk dan varian"
                        search-placeholder="Cari produk, SKU, atau satuan..."
                        empty-text="Produk tidak ditemukan."
                        :disabled="loading"
                        :initial-option="findOption(item.selection)"
                        @select="setSelectedOption(item, $event as GoodsReceiptProductOption | null)"
                      >
                        <template #option="{ option }">
                          <div class="flex min-w-0 flex-col">
                            <span class="font-medium">{{ option.product_name }}{{ option.variant_name ? ` / ${option.variant_name}` : '' }}</span>
                            <span class="text-xs text-muted-foreground">SKU {{ option.sku }}</span>
                          </div>
                        </template>
                      </ServerComboBox>
                      <FieldError v-if="itemError(index)">{{ itemError(index) }}</FieldError>
                    </td>
                    <td class="min-w-40 p-2">
                      <ComboboxSelect
                        :model-value="item.unit_id === null ? '' : String(item.unit_id)"
                        :options="unitOptions(item)"
                        placeholder="Pilih satuan"
                        search-placeholder="Cari satuan..."
                        :disabled="loading || !findOption(item.selection)?.units.length"
                        @update:model-value="setSelectedUnit(item, $event)"
                      />
                      <p v-if="findOption(item.selection)" class="mt-1 text-xs text-muted-foreground">1 {{ findOption(item.selection)?.units.find(unit => unit.unit_id === item.unit_id)?.unit_code }} = {{ numberFormat.format(Number(findOption(item.selection)?.units.find(unit => unit.unit_id === item.unit_id)?.conversion_rate)) }} satuan dasar</p>
                    </td>
                    <td class="w-28 p-2"><Input v-model.number="item.unit_quantity" type="number" min="0" step="1" placeholder="0" :disabled="loading" /><FieldError v-if="errors[`items.${index}.unit_quantity`]">{{ errors[`items.${index}.unit_quantity`] }}</FieldError></td>
                    <td class="w-56 min-w-56 p-2">
                      <MoneyInput v-model="item.unit_price" class="w-full min-w-[13rem]" placeholder="0" :disabled="loading" />
                      <FieldError v-if="errors[`items.${index}.unit_price`]">{{ errors[`items.${index}.unit_price`] }}</FieldError>
                    </td>
                    <td class="w-48 p-2"><div class="flex gap-1">
                      <ComboboxSelect
                        :model-value="item.discount_type || 'none'"
                        :options="itemDiscountOptions"
                        placeholder="—"
                        search-placeholder="Cari diskon..."
                        class="w-24"
                        @update:model-value="setItemDiscountType(item, $event)"
                      />
                      <MoneyInput
                        v-if="item.discount_type === 'amount'"
                        v-model="item.discount_value"
                        class="min-w-0"
                        :disabled="loading"
                      />
                      <Input
                        v-else
                        v-model.number="item.discount_value"
                        type="number"
                        min="0"
                        step="1"
                        :disabled="!item.discount_type || loading"
                      />
                    </div></td>
                    <td class="w-28 p-2"><Input v-model="item.tax_rate" type="number" min="0" max="100" step="1" placeholder="Default" :disabled="loading" /></td>
                    <td class="w-40 p-2"><Input v-model="item.notes" maxlength="255" placeholder="Opsional" :disabled="loading" /></td>
                    <td class="p-2"><Button type="button" variant="ghost" size="icon" :disabled="loading || form.items.length === 1" :aria-label="`Hapus item ${index + 1}`" @click="removeItem(index)"><HugeiconsIcon :icon="Delete03Icon" /></Button></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p v-if="errors.items" class="px-4 pb-3 text-sm text-destructive">{{ errors.items }}</p>
          </section>

          <section class="ml-auto w-full grid max-w-lg gap-2 rounded-lg border p-4 text-sm">
            <div class="flex justify-between"><span class="text-muted-foreground">Dasar diskon header (estimasi)</span><span>{{ currencyFormat.format(summary.basis) }}</span></div>
            <div class="flex justify-between"><span class="text-muted-foreground">Diskon dokumen (estimasi)</span><span>-{{ currencyFormat.format(summary.discount) }}</span></div>
            <div class="flex justify-between"><span class="text-muted-foreground">Pajak (estimasi)</span><span>{{ currencyFormat.format(summary.tax) }}</span></div>
            <div class="flex justify-between border-t pt-2 text-base font-semibold"><span>Total (estimasi)</span><span>{{ currencyFormat.format(summary.total) }}</span></div>
            <p class="text-xs text-muted-foreground">Total final dihitung ulang oleh server dari master produk dan setting pajak.</p>
          </section>
        </div>
        <DialogFooter class="flex-col-reverse gap-3 border-t bg-muted/20 px-4  sm:flex-row sm:justify-end sm:px-6 sm:py-4 mb-0 py-6">
          <Button class="w-full sm:w-auto" type="button" variant="outline" :disabled="loading" @click="open = false">Batal</Button>
          <Button class="w-full sm:w-auto" type="submit" :disabled="loading || loadingFetch || loadingFetchError">
            <Spinner v-if="loading" data-icon="inline-start" />{{ loading ? 'Menyimpan...' : 'Simpan draft' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
