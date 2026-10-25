<script setup lang="ts">
import { ref, watch } from 'vue'
import { Building03Icon, Call02Icon, Contact01Icon, File01Icon, HashtagIcon, Mail01Icon, UserIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import type { CustomerDetail, CustomerListItem } from '@/core/types/customer.types'
import { normalizeError } from '@/lib/errors'
import { customerService } from '../../services/customer.service'

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{ selectedCustomer?: CustomerListItem }>()
const customer = ref<CustomerDetail | null>(null)
const loading = ref(false)
const errorMessage = ref('')
let requestSequence = 0

function displayValue(value?: string | number | null): string {
  return value === null || value === undefined || String(value).trim() === '' ? 'Belum diisi' : String(value)
}

function formatDate(value?: string | null): string {
  if (!value) return 'Belum tersedia'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Belum tersedia' : new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

async function fetchCustomer() {
  const id = props.selectedCustomer?.id
  const sequence = ++requestSequence
  customer.value = null
  errorMessage.value = ''
  if (!id) {
    errorMessage.value = 'Data customer tidak ditemukan.'
    return
  }
  loading.value = true
  try {
    const result = await customerService.show(id)
    if (sequence === requestSequence && open.value) customer.value = result
  } catch (error) {
    if (sequence === requestSequence && open.value) errorMessage.value = normalizeError(error).message
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

watch([open, () => props.selectedCustomer?.id], ([isOpen]) => {
  if (isOpen) {
    void fetchCustomer()
    return
  }
  requestSequence += 1
  loading.value = false
  customer.value = null
  errorMessage.value = ''
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="flex max-h-[90dvh] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden sm:max-w-3xl">
      <DialogHeader class="shrink-0 px-5 pb-5 pt-6 pr-12 sm:px-7 sm:pb-6 sm:pt-7">
        <div class="flex items-start gap-4">
          <div class="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14">
            <HugeiconsIcon :icon="Building03Icon" :size="26" aria-hidden="true" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <Badge v-if="customer" variant="outline" class="gap-1"><HugeiconsIcon :icon="HashtagIcon" aria-hidden="true" />{{ customer.code }}</Badge>
              <Badge v-if="customer" :variant="customer.is_active ? 'success' : 'secondary'">{{ customer.is_active ? 'Aktif' : 'Nonaktif' }}</Badge>
            </div>
            <DialogTitle class="break-words text-xl font-semibold tracking-tight sm:text-2xl">{{ customer?.name || 'Detail customer' }}</DialogTitle>
            <DialogDescription class="mt-1">Informasi identitas, kontak, dan ketentuan pembayaran customer.</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <Separator />

      <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
        <div v-if="loading" class="grid gap-4 md:grid-cols-2" aria-label="Memuat detail customer">
          <Card v-for="section in 4" :key="section">
            <CardHeader class="gap-2"><Skeleton class="h-5 w-36" /><Skeleton class="h-4 w-52" /></CardHeader>
            <CardContent class="flex flex-col gap-5"><div v-for="row in 3" :key="row" class="flex flex-col gap-2"><Skeleton class="h-3 w-24" /><Skeleton class="h-4 w-40" /></div></CardContent>
          </Card>
        </div>
        <Alert v-else-if="errorMessage" variant="destructive">
          <AlertTitle>Detail customer belum dapat dimuat</AlertTitle>
          <AlertDescription class="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{{ errorMessage }}</span><Button variant="outline" size="sm" @click="fetchCustomer">Coba lagi</Button>
          </AlertDescription>
        </Alert>
        <div v-else-if="customer" class="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader class="flex items-center gap-3">
              <HugeiconsIcon :icon="Contact01Icon" class="text-muted-foreground" aria-hidden="true" />
              <div><CardTitle>Informasi kontak</CardTitle><CardDescription>Cara menghubungi customer</CardDescription></div>
            </CardHeader>
            <CardContent class="flex flex-col gap-4">
              <div class="flex items-start gap-3"><HugeiconsIcon :icon="UserIcon" class="mt-0.5 text-muted-foreground" aria-hidden="true" /><div><p class="text-xs text-muted-foreground">Nama kontak</p><p class="mt-1 text-sm font-medium">{{ displayValue(customer.contact_person) }}</p></div></div>
              <div class="flex items-start gap-3"><HugeiconsIcon :icon="Call02Icon" class="mt-0.5 text-muted-foreground" aria-hidden="true" /><div><p class="text-xs text-muted-foreground">Telepon</p><a v-if="customer.phone" :href="`tel:${customer.phone}`" class="mt-1 block text-sm font-medium text-primary underline-offset-4 hover:underline">{{ customer.phone }}</a><p v-else class="mt-1 text-sm font-medium">Belum diisi</p></div></div>
              <div class="flex items-start gap-3"><HugeiconsIcon :icon="Mail01Icon" class="mt-0.5 text-muted-foreground" aria-hidden="true" /><div><p class="text-xs text-muted-foreground">Email</p><a v-if="customer.email" :href="`mailto:${customer.email}`" class="mt-1 block break-all text-sm font-medium text-primary underline-offset-4 hover:underline">{{ customer.email }}</a><p v-else class="mt-1 text-sm font-medium">Belum diisi</p></div></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader class="flex items-center gap-3"><HugeiconsIcon :icon="Building03Icon" class="text-muted-foreground" aria-hidden="true" /><div><CardTitle>Identitas dan alamat</CardTitle><CardDescription>Data legal dan lokasi customer</CardDescription></div></CardHeader>
            <CardContent class="grid gap-4 sm:grid-cols-2">
              <div><p class="text-xs text-muted-foreground">Jenis customer</p><p class="mt-1 text-sm font-medium">{{ customer.type === 'company' ? 'Perusahaan' : 'Perorangan' }}</p></div>
              <div><p class="text-xs text-muted-foreground">NPWP</p><p class="mt-1 break-words text-sm font-medium">{{ displayValue(customer.tax_id) }}</p></div>
              <div class="sm:col-span-2"><p class="text-xs text-muted-foreground">Alamat</p><p class="mt-1 whitespace-pre-line text-sm font-medium">{{ displayValue(customer.address) }}</p></div>
              <div><p class="text-xs text-muted-foreground">Kode pos</p><p class="mt-1 text-sm font-medium">{{ displayValue(customer.postal_code) }}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader class="flex items-center gap-3"><HugeiconsIcon :icon="File01Icon" class="text-muted-foreground" aria-hidden="true" /><div><CardTitle>Ketentuan pembayaran</CardTitle><CardDescription>Batas kredit yang disepakati</CardDescription></div></CardHeader>
            <CardContent class="grid gap-4 sm:grid-cols-2">
              <div><p class="text-xs text-muted-foreground">Limit kredit</p><p class="mt-1 text-sm font-medium">{{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(customer.credit_limit) || 0) }}</p></div>
              <div><p class="text-xs text-muted-foreground">Tempo pembayaran</p><p class="mt-1 text-sm font-medium">{{ customer.payment_term_days > 0 ? `${customer.payment_term_days} hari` : 'Tunai' }}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Catatan dan aktivitas</CardTitle><CardDescription>Catatan tambahan serta waktu perubahan</CardDescription></CardHeader>
            <CardContent class="flex flex-col gap-4">
              <div><p class="text-xs text-muted-foreground">Catatan</p><p class="mt-1 whitespace-pre-line text-sm font-medium">{{ displayValue(customer.notes) }}</p></div>
              <div><p class="text-xs text-muted-foreground">Dibuat</p><p class="mt-1 text-sm font-medium">{{ formatDate(customer.created_at) }}</p></div>
              <div><p class="text-xs text-muted-foreground">Terakhir diperbarui</p><p class="mt-1 text-sm font-medium">{{ formatDate(customer.updated_at) }}</p></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
