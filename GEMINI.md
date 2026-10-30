# Jeevan App — Frontend Context & Architecture Rules

Repository ini adalah Single Page Application (SPA) Point of Sale multi-tenant berbasis Vue 3, Vite, TypeScript, Tailwind CSS, Pinia, dan shadcn-vue.

## 1. Directory Structure

- `src/core/`: Fondasi aplikasi global yang digunakan lintas modul:
  - `src/core/api/`: Setup Axios client (`axios.ts`) dengan `baseURL: /api/v1`, `withCredentials: true`, dan Sanctum CSRF handler (`ensureCsrfCookie()`).
  - `src/core/stores/`: State management Pinia (`auth.store.ts`, `merchant.store.ts`, `loading.store.ts`).
  - `src/core/router/`: Konfigurasi rute (`route.ts`) dan navigasi guards (`guards.ts`).
  - `src/core/composables/`: Reusable composables (`useCan.ts`, `useMenu.ts`, `useDataTable.ts`, `useComboBox.ts`).
  - `src/core/layouts/`: Layout utama (`DashboardLayout.vue`, `AuthLayout.vue`).
  - `src/core/types/`: Definisi tipe data domain inti (`auth.types.ts`, `merchant.types.ts`, dll.).
- `src/modules/<module-name>/`: Modul fungsional vertikal (misal: `auth`, `merchant`, `operational`, `product`, `partner`, `inventory`, `purchase`):
  - `pages/`: Halaman dan komponen dialog modul terkait.
  - `services/`: Komunikasi HTTP endpoint modul terkait.
  - `routes/`: Definisi rute Vue Router per modul.
  - `types/`: Tipe data spesifik modul.
- `src/components/`:
  - `ui/`: Komponen primitif `shadcn-vue` (reka-ui).
  - `data-table/`: Reusable server/client table TanStack.
  - `server-combobox/`: Searchable async select component.

## 2. Multi-Tenant Context & Auth Guardrails

1. **Sanctum SPA Session:**
   - Autentikasi menggunakan cookie sesi HttpOnly dari Sanctum.
   - **DILARANG** menyimpan access token, session secret, atau credential di `localStorage` / `sessionStorage`.
2. **Context Resolution:**
   - Context merchant di-load via `authStore.hydrate()` (`GET /api/v1/auth/me`) atau `merchantService.getContext(merchant)` (`GET /api/v1/merchants/{merchant}/context`).
   - Cek permission di template menggunakan composable `useCan()` atau `authStore.hasPermission(...)`.
   - Cek modul aktif menggunakan `merchantStore.hasModule(...)`.
3. **Response & Error Handling:**
   - Semua request mengikuti response envelope `API_SPEC.md`:
     - Sukses: `res.data.data`
     - Error: tangkap payload `err.response?.data?.error` (`code`, `message`, `details`).

## 3. Exact Verification Commands (Run from `jeevan-app/` directory)

- **Development Server:** `npm run dev`
- **Fast Build Check:** `npx vite build`
- **Full Production Build & Type-Check:** `npm run build` (menjalankan `vue-tsc -b && vite build`)
- **Type-Check Only:** `npx vue-tsc -b --noEmit`
- **Preview Production Build:** `npm run preview`
