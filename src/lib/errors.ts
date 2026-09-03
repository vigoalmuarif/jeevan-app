import axios from "axios";

export type NormalizedError =
  | {
      type: "network";
      status: 0;
      message: string;
      errors: Record<string, string>;
    }
  | {
      type: "validation";
      status: 422;
      message: string;
      errors: Record<string, string>;
    }
  | {
      type: "unauthorized";
      status: 401;
      message: string;
      errors: Record<string, string>;
    }
  | {
      type: "forbidden";
      status: 403;
      message: string;
      errors: Record<string, string>;
    }
  | {
      type: "server";
      status: number;
      message: string;
      errors: Record<string, string>;
    }
  | {
      type: "unknown";
      status: 0;
      message: string;
      errors: Record<string, string>;
    };

export function normalizeError(error: unknown): NormalizedError {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return {
        type: "network",
        status: 0,
        message: "Koneksi gagal",
        errors: {},
      };
    }

    const status = error.response.status;
    const data = error.response.data;
    const backendMessage = data?.message;

    if (status === 422) {
      // Flatten: { field: string[] } → { field: string }
      const raw: Record<string, string[]> = data?.errors ?? {};
      const errors = Object.fromEntries(
        Object.entries(raw)
          .filter(([, messages]) => messages.length > 0)
          .map(([field, messages]) => [field, messages[0] ?? ""]),
      ) as Record<string, string>;

      return {
        type: "validation",
        status: 422,
        message: backendMessage ?? "Data yang dimasukkan tidak valid.",
        errors,
      };
    }

    if (status === 401) {
      return {
        type: "unauthorized",
        status: 401,
        message: backendMessage ?? "Sesi berakhir, silakan login kembali.",
        errors: {},
      };
    }

    if (status === 403) {
      return {
        type: "forbidden",
        status: 403,
        message: backendMessage ?? "Akses ditolak.",
        errors: {},
      };
    }

    return {
      type: "server",
      status,
      message: backendMessage ?? "Terjadi kesalahan pada server.",
      errors: {},
    };
  }

  return {
    type: "unknown",
    status: 0,
    message: "Terjadi kesalahan.",
    errors: {},
  };
}
