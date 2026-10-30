import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
  },
})

// Sanctum SPA: ambil CSRF cookie sebelum request yang mengubah state
export async function ensureCsrfCookie() {
  await axios.get(
    `${(import.meta.env.VITE_API_URL ?? '').replace(/\/api(\/v1)?\/?$/, '')}/sanctum/csrf-cookie`,
    { withCredentials: true }
  )
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // biarkan komponen/store yang handle redirect,
      // hindari side-effect global di sini agar tidak bentrok dgn router guard
    }
    return Promise.reject(error)
  }
)

export default api