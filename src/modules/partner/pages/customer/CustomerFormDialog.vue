<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Alert02Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import Spinner from '@/components/ui/spinner/Spinner.vue'
import type { CustomerCreatePayload, CustomerDetail, CustomerListItem } from '@/core/types/customer.types'
import { normalizeError } from '@/lib/errors'
import { customerService } from '../../services/customer.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  selectedCustomer?: CustomerListItem
}>()
const emit = defineEmits<{
  saved: [result: { type: 'created' | 'updated'; customer: CustomerListItem }]
}>()

const initialForm = (): CustomerCreatePayload => ({
  name: '',
  type: 'individual',
  contact_person: '',
  phone: '',
  email: '',
  tax_id: '',
  address: '',
  postal_code: '',
  credit_limit: 0,
  payment_term_days: 0,
  notes: '',
  is_active: true,
})

const form = reactive<CustomerCreatePayload>(initialForm())
const loading = ref(false)
const loadingFetch = ref(false)
const loadingFetchError = ref(false)
const errors = ref<Record<string, string>>({})
const generalError = ref('')
const isEdit = computed(() => !!props.selectedCustomer)

function resetForm() {
  Object.assign(form, initialForm())
  errors.value = {}
  generalError.value = ''
  loading.value = false
  loadingFetch.value = false
  loadingFetchError.value = false
}

async function fetchCustomer() {
  if (!props.selectedCustomer) return

  loadingFetch.value = true
  loadingFetchError.value = false
  generalError.value = ''

  try {
    const customer: CustomerDetail = await customerService.edit(props.selectedCustomer.id)
    Object.assign(form, {
      name: customer.name,
      type: customer.type,
      contact_person: customer.contact_person ?? '',
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      tax_id: customer.tax_id ?? '',
      address: customer.address ?? '',
      postal_code: customer.postal_code ?? '',
      credit_limit: Number(customer.credit_limit) || 0,
      payment_term_days: customer.payment_term_days ?? 0,
      notes: customer.notes ?? '',
      is_active: customer.is_active,
    })
  } catch (error) {
    generalError.value = normalizeError(error).message
    loadingFetchError.value = true
  } finally {
    loadingFetch.value = false
  }
}

watch(open, async (isOpen) => {
  if (!isOpen) return
  resetForm()
  await fetchCustomer()
})

async function handleSubmit() {
  loading.value = true
  errors.value = {}
  generalError.value = ''

  try {
    const payload = {
      ...form,
      name: form.name.trim(),
    }
    const customer = isEdit.value && props.selectedCustomer
      ? await customerService.update(props.selectedCustomer.id, payload)
      : await customerService.store(payload)
    emit('saved', { type: isEdit.value ? 'updated' : 'created', customer })
    open.value = false
    resetForm()
  } catch (error) {
    const normalized = normalizeError(error)
    if (normalized.status === 422) {
      errors.value = normalized.errors
    } else {
      generalError.value = normalized.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
      <DialogContent class="max-h-[90vh] sm:max-w-3xl overflow-y-auto" @interact-outside.prevent>
      <DialogHeader class="pr-8">
        <DialogTitle>{{ isEdit ? 'Ubah customer' : 'Tambah customer' }}</DialogTitle>
        <DialogDescription>
          {{ isEdit ? 'Perbarui identitas, kontak, dan informasi pembayaran customer.' : 'Isi identitas, kontak, dan informasi pembayaran customer.' }}
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
        <Alert v-if="generalError" variant="destructive">
          <HugeiconsIcon :icon="Alert02Icon" aria-hidden="true" />
          <AlertTitle>Customer belum tersimpan</AlertTitle>
          <AlertDescription class="flex flex-wrap items-center justify-between gap-3">
            <span>{{ generalError }}</span>
            <Button v-if="loadingFetchError" type="button" variant="outline" size="sm" @click="fetchCustomer">
              Coba lagi
            </Button>
          </AlertDescription>
        </Alert>

        <div v-if="loadingFetch" class="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground" role="status">
          <Spinner /> Memuat data customer...
        </div>

        <template v-else-if="!loadingFetchError">
        <FieldSet class="rounded-xl border bg-card p-4 sm:p-5">
          <FieldLegend class="mb-0 text-sm font-semibold tracking-tight">Informasi customer</FieldLegend>
          <p class="-mt-3 text-sm text-muted-foreground">Data utama untuk mengenali customer dan narahubungnya.</p>
          <FieldGroup class="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel for="customer-code">Kode customer</FieldLabel>
              <Input
                id="customer-code"
                :model-value="isEdit ? (selectedCustomer?.code ?? '') : 'Dibuat otomatis'"
                readonly
                :disabled="!isEdit"
                aria-describedby="customer-code-help"
              />
              <p id="customer-code-help" class="text-sm text-muted-foreground">
                {{ isEdit ? 'Kode dibuat oleh sistem dan tidak dapat diubah.' : 'Sistem membuat kode 8 karakter dari huruf kapital dan angka saat disimpan.' }}
              </p>
            </Field>
            <Field :data-invalid="!!errors.name">
              <FieldLabel for="customer-name" required>Nama</FieldLabel>
              <Input
                id="customer-name"
                v-model="form.name"
                placeholder="Nama customer"
                maxlength="150"
                autocomplete="organization"
                :aria-invalid="!!errors.name"
                :disabled="loading"
              />
              <FieldError v-if="errors.name">{{ errors.name }}</FieldError>
            </Field>
            <Field :data-invalid="!!errors.type">
              <FieldLabel for="customer-type" required>Jenis customer</FieldLabel>
              <Select v-model="form.type" :disabled="loading">
                <SelectTrigger id="customer-type" :aria-invalid="!!errors.type">
                  <SelectValue placeholder="Pilih jenis customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="individual">Perorangan</SelectItem>
                    <SelectItem value="company">Perusahaan</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldError v-if="errors.type">{{ errors.type }}</FieldError>
            </Field>
            <Field :data-invalid="!!errors.contact_person">
              <FieldLabel for="customer-contact" optional>Nama kontak</FieldLabel>
              <Input
                id="customer-contact"
                v-model="form.contact_person"
                placeholder="Nama narahubung"
                maxlength="150"
                autocomplete="name"
                :aria-invalid="!!errors.contact_person"
                :disabled="loading"
              />
              <FieldError v-if="errors.contact_person">{{ errors.contact_person }}</FieldError>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet class="rounded-xl border bg-card p-4 sm:p-5">
          <FieldLegend class="mb-0 text-sm font-semibold tracking-tight">Kontak dan alamat</FieldLegend>
          <p class="-mt-3 text-sm text-muted-foreground">Informasi untuk menghubungi customer dan keperluan administrasi.</p>
          <FieldGroup class="grid gap-4 sm:grid-cols-2">
            <Field :data-invalid="!!errors.phone">
              <FieldLabel for="customer-phone" optional>Nomor telepon</FieldLabel>
              <Input id="customer-phone" v-model="form.phone" type="tel" placeholder="08xxxxxxxxxx" maxlength="25" autocomplete="tel" :aria-invalid="!!errors.phone" :disabled="loading" />
              <FieldError v-if="errors.phone">{{ errors.phone }}</FieldError>
            </Field>
            <Field :data-invalid="!!errors.email">
              <FieldLabel for="customer-email" optional>Email</FieldLabel>
              <Input id="customer-email" v-model="form.email" type="email" placeholder="nama@email.com" maxlength="150" autocomplete="email" :aria-invalid="!!errors.email" :disabled="loading" />
              <FieldError v-if="errors.email">{{ errors.email }}</FieldError>
            </Field>
            <Field :data-invalid="!!errors.tax_id">
              <FieldLabel for="customer-tax-id" optional>NPWP</FieldLabel>
              <Input id="customer-tax-id" v-model="form.tax_id" placeholder="Nomor identitas pajak" maxlength="30" :aria-invalid="!!errors.tax_id" :disabled="loading" />
              <FieldError v-if="errors.tax_id">{{ errors.tax_id }}</FieldError>
            </Field>
            <Field :data-invalid="!!errors.postal_code">
              <FieldLabel for="customer-postal-code" optional>Kode pos</FieldLabel>
              <Input id="customer-postal-code" v-model="form.postal_code" placeholder="Kode pos" maxlength="10" autocomplete="postal-code" :aria-invalid="!!errors.postal_code" :disabled="loading" />
              <FieldError v-if="errors.postal_code">{{ errors.postal_code }}</FieldError>
            </Field>
            <Field class="sm:col-span-2" :data-invalid="!!errors.address">
              <FieldLabel for="customer-address" optional>Alamat</FieldLabel>
              <Textarea id="customer-address" v-model="form.address" placeholder="Alamat lengkap customer" :aria-invalid="!!errors.address" :disabled="loading" />
              <FieldError v-if="errors.address">{{ errors.address }}</FieldError>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet class="rounded-xl border bg-card p-4 sm:p-5">
          <FieldLegend class="mb-0 text-sm font-semibold tracking-tight">Pembayaran dan status customer</FieldLegend>
          <p class="-mt-3 text-sm text-muted-foreground">Atur batas kredit, tempo pembayaran, catatan, dan status akun.</p>
          <FieldGroup class="grid gap-4 sm:grid-cols-2">
            <Field :data-invalid="!!errors.credit_limit">
              <FieldLabel for="customer-credit-limit" optional>Limit kredit</FieldLabel>
              <Input id="customer-credit-limit" v-model.number="form.credit_limit" type="number" min="0" step="0.01" inputmode="decimal" :aria-invalid="!!errors.credit_limit" :disabled="loading" />
              <FieldError v-if="errors.credit_limit">{{ errors.credit_limit }}</FieldError>
            </Field>
            <Field :data-invalid="!!errors.payment_term_days">
              <FieldLabel for="customer-payment-term" optional>Tempo pembayaran</FieldLabel>
              <Input id="customer-payment-term" v-model.number="form.payment_term_days" type="number" min="0" max="65535" step="1" inputmode="numeric" :aria-invalid="!!errors.payment_term_days" :disabled="loading" />
              <FieldError v-if="errors.payment_term_days">{{ errors.payment_term_days }}</FieldError>
            </Field>
            <Field class="sm:col-span-2" :data-invalid="!!errors.notes">
              <FieldLabel for="customer-notes" optional>Catatan</FieldLabel>
              <Textarea id="customer-notes" v-model="form.notes" placeholder="Catatan tambahan" :aria-invalid="!!errors.notes" :disabled="loading" />
              <FieldError v-if="errors.notes">{{ errors.notes }}</FieldError>
            </Field>
            <Field orientation="horizontal" class="sm:col-span-2">
              <Switch id="customer-active" v-model="form.is_active" :disabled="loading" />
              <FieldLabel for="customer-active">Customer aktif</FieldLabel>
            </Field>
          </FieldGroup>
        </FieldSet>
        </template>

        <DialogFooter class="">
          <Button type="button" variant="outline" :disabled="loading" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading || loadingFetch || loadingFetchError || !form.name.trim()">
            <Spinner v-if="loading" data-icon="inline-start" />
            {{ loading ? (isEdit ? 'Memperbarui...' : 'Menyimpan...') : (isEdit ? 'Simpan perubahan' : 'Simpan customer') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
