type BackendError = { message: string };
type BackendResult<T = unknown> = { data: T; error: BackendError | null; count?: number | null };
type DataRecord = Record<string, unknown> & {
  id?: string;
  user_id?: string;
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};
type FunctionResponse = { success?: boolean; error?: string };
type ApiResponse<T> = {
  data?: T;
  count?: number | null;
  error?: BackendError;
  user?: BackendUser | null;
  isAdmin?: boolean;
  session?: BackendSession | null;
  files?: Array<{ name: string }>;
  path?: string;
  success?: boolean;
  token?: string;
  message?: string;
  email?: string;
};

const API_BASE = String(
  import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || ""
).replace(/\/+$/, "");

const resolveApiUrl = (path: string) =>
  path.startsWith("http://") || path.startsWith("https://") ? path : `${API_BASE}${path}`;

const request = async <T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    const response = await fetch(resolveApiUrl(path), {
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    let payload: ApiResponse<T>;
    try {
      payload = await response.json() as ApiResponse<T>;
    } catch {
      const s = response.status;
      if (s === 502 || s === 503 || s === 504) {
        return { error: { message: "Backend server is not running. Start it with: node server/index.mjs" } };
      }
      return { error: { message: `Server returned an unexpected response (status ${s})` } };
    }
    if (!response.ok) {
      const rawErr = (payload as unknown as { error?: string | { message?: string } })?.error;
      const errMsg =
        typeof rawErr === "string"
          ? rawErr
          : rawErr?.message || `Request failed (${response.status})`;
      return { error: { message: errMsg } };
    }
    return payload;
  } catch (error) {
    return { error: { message: error instanceof Error ? error.message : "Backend request failed." } };
  }
};

class DataQuery implements PromiseLike<BackendResult<DataRecord[] | null>> {
  private operation = "select";
  private values: object | object[] = {};
  private projection = "*";
  private filters: Array<{ column: string; value: unknown }> = [];
  private ordering?: { column: string; ascending: boolean };
  private rowLimit?: number;
  private countOption: string | undefined;
  private head = false;

  constructor(private table: string) {}
  select(columns = "*", options?: { count?: string; head?: boolean }) {
    this.projection = columns;
    this.countOption = options?.count;
    this.head = Boolean(options?.head);
    return this;
  }
  insert(values: object | object[]) { this.operation = "insert"; this.values = values; return this; }
  update(values: object) { this.operation = "update"; this.values = values; return this; }
  delete() { this.operation = "delete"; return this; }
  eq(column: string, value: unknown) { this.filters.push({ column, value }); return this; }
  order(column: string, options?: { ascending?: boolean }) { this.ordering = { column, ascending: options?.ascending !== false }; return this; }
  limit(value: number) { this.rowLimit = value; return this; }
  single() { return this.executeSingle(false); }
  maybeSingle() { return this.executeSingle(true); }
  then<TResult1 = BackendResult<DataRecord[] | null>, TResult2 = never>(
    onfulfilled?: ((value: BackendResult<DataRecord[] | null>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }
  private async execute(): Promise<BackendResult<DataRecord[] | null>> {
    const result = await request<DataRecord[]>("/api/data", {
      method: "POST",
      body: JSON.stringify({
        table: this.table, operation: this.operation, values: this.values, projection: this.projection,
        filters: this.filters, ordering: this.ordering, limit: this.rowLimit,
        count: this.countOption, head: this.head,
      }),
    });
    if (result.error) return { data: null, error: result.error, count: null };
    return { data: this.head ? null : result.data || [], error: null, count: result.count ?? null };
  }
  private async executeSingle(allowMissing: boolean): Promise<BackendResult<DataRecord | null>> {
    const result = await this.execute();
    if (result.error) return { data: null, error: result.error, count: result.count };
    const rows = result.data || [];
    if (rows.length > 1) return { data: null, error: { message: "Expected a single row but received multiple." }, count: result.count };
    if (!rows.length && !allowMissing) return { data: null, error: { message: "No row found." }, count: result.count };
    return { data: rows[0] || null, error: null, count: result.count };
  }
}

const authListeners = new Set<(event: string, session: BackendSession | null) => void>();
const auth = {
  async getSession() {
    const result = await request<never>("/api/auth/session");
    if (result.error) return { data: { session: null }, error: result.error };
    const session = result.user ? { user: result.user, access_token: "cookie-session", token_type: "bearer" } : null;
    return { data: { session }, error: null };
  },
  async getUser() {
    const { data, error } = await this.getSession();
    return { data: { user: data.session?.user || null }, error };
  },
  async signInWithPassword(credentials: { email: string; password: string }) {
    return this.signInAt("/api/auth/login", credentials);
  },
  async signInAsAdmin(credentials: { email: string; password: string }) {
    return this.signInAt("/api/auth/admin-login", credentials);
  },
  async signInAt(path: string, credentials: { email: string; password: string }) {
    const result = await request<never>(path, { method: "POST", body: JSON.stringify(credentials) });
    if (!result.error) {
      const session = result.user ? { user: result.user, access_token: "cookie-session", token_type: "bearer" } : null;
      authListeners.forEach((listener) => listener("SIGNED_IN", session));
      return { data: { user: result.user, session }, error: null };
    }
    return { data: { user: null, session: null }, error: result.error };
  },
  async signUp(payload: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
    const result = await request<never>("/api/auth/signup", { method: "POST", body: JSON.stringify(payload) });
    return result.error
      ? { data: { user: null, session: null }, error: result.error }
      : { data: { user: result.user || null, session: result.session || null }, error: null };
  },
  async requestRegisterOtp(payload: { email: string; password: string; fullName: string; phone: string }) {
    const result = await request<{ success: boolean; message: string; email: string }>("/api/auth/register-send-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { data: result.success ? result : null, error: result.error || null };
  },
  async verifyRegisterOtp(payload: { email: string; otp: string }) {
    const result = await request<{ success: boolean; message: string; user?: BackendUser }>("/api/auth/register-verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!result.error && result.user) {
      const session = { user: result.user, access_token: "cookie-session", token_type: "bearer" };
      authListeners.forEach((listener) => listener("SIGNED_IN", session));
      return { data: { user: result.user, session }, error: null };
    }
    return { data: { user: null, session: null }, error: result.error || null };
  },
  async signOut() {
    const result = await request("/api/auth/logout", { method: "POST", body: "{}" });
    authListeners.forEach((listener) => listener("SIGNED_OUT", null));
    return { error: result.error || null };
  },
  async updateUser(payload: { password?: string }) {
    const result = await request("/api/auth/password", { method: "PATCH", body: JSON.stringify({ password: payload.password }) });
    return { data: { user: null }, error: result.error || null };
  },
  async requestPasswordReset(payload: { email: string; origin?: string }) {
    const result = await request<{ success: boolean; message: string; email: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { data: result.success ? result : null, error: result.error || null };
  },
  async forgotPassword(email: string) {
    return this.requestPasswordReset({ email });
  },
  async sendResetOtp(payload: { email: string; token?: string }) {
    const result = await request<{ success: boolean; message: string; token: string }>("/api/auth/send-reset-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { data: result.success ? result : null, error: result.error || null };
  },
  async verifyResetPassword(payload: { email: string; token?: string; otp: string; newPassword: string }) {
    const result = await request<{ success: boolean; message: string }>("/api/auth/verify-reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return { data: result.success ? result : null, error: result.error || null };
  },
  onAuthStateChange(callback: (event: string, session: BackendSession | null) => void) {
    authListeners.add(callback);
    void this.getSession().then(({ data }) => callback("INITIAL_SESSION", data.session));
    return { data: { subscription: { unsubscribe: () => { authListeners.delete(callback); } } } };
  },
};

export const backend = {
  auth,
  from: (table: string) => new DataQuery(table),
  rpc: async (name: string, payload: Record<string, unknown>) => {
    const result = await request<unknown>(`/api/rpc/${encodeURIComponent(name)}`, { method: "POST", body: JSON.stringify(payload) });
    return { data: result.data ?? null, error: result.error || null };
  },
  functions: {
    invoke: async (name: string, options: { body?: Record<string, unknown> } = {}): Promise<{ data: FunctionResponse | null; error: BackendError | null }> => {
      const result = await request<never>(`/api/functions/${encodeURIComponent(name)}`, { method: "POST", body: JSON.stringify(options.body || {}) });
      if (result.error) return { data: null, error: result.error };
      return { data: { success: result.success, error: result.error?.message }, error: null };
    },
  },
  storage: {
    from: (bucket: string) => ({
      upload: async (filePath: string, file: File, _options?: { upsert?: boolean }) => {
        const data = await file.arrayBuffer();
        const bytes = new Uint8Array(data);
        let binary = "";
        for (let offset = 0; offset < bytes.length; offset += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
        }
        const result = await request<never>(`/api/storage/${encodeURIComponent(bucket)}/${filePath.split("/").map(encodeURIComponent).join("/")}`, {
          method: "PUT", body: JSON.stringify({ data: btoa(binary) }),
        });
        return { data: result.path ? { path: result.path } : null, error: result.error || null };
      },
      getPublicUrl: (filePath: string) => ({ data: { publicUrl: `/api/storage/${encodeURIComponent(bucket)}/${filePath.split("/").map(encodeURIComponent).join("/")}` } }),
      list: async (folder: string) => {
        const result = await request<never>(`/api/storage/${encodeURIComponent(bucket)}/${folder.split("/").map(encodeURIComponent).join("/")}/list`, { method: "POST", body: "{}" });
        return { data: result.files || null, error: result.error || null };
      },
      remove: async (paths: string[]) => {
        const result = await Promise.all(paths.map((filePath) => request(`/api/storage/${encodeURIComponent(bucket)}/${filePath.split("/").map(encodeURIComponent).join("/")}`, { method: "DELETE" })));
        const failed = result.find((item) => item.error);
        return { data: null, error: failed?.error || null };
      },
    }),
  },
  channel: (_name: string) => {
    const listeners: Array<{
      table: string;
      event: string;
      callback: (payload: { eventType: string; new: DataRecord; old: DataRecord }) => void;
    }> = [];
    const snapshots = new Map<string, Map<string, DataRecord>>();
    let timer: ReturnType<typeof setInterval> | undefined;
    let polling = false;
    const channel = {
      on: (
        _kind: string,
        filter: { event?: string; table?: string; schema?: string },
        callback: (payload: { eventType: string; new: DataRecord; old: DataRecord }) => void,
      ) => {
        if (filter.table) listeners.push({ table: filter.table, event: filter.event || "*", callback });
        return channel;
      },
      subscribe: () => {
        const poll = async () => {
          if (polling) return;
          polling = true;
          try {
            const tables = [...new Set(listeners.map((listener) => listener.table))];
            for (const table of tables) {
              const result = await backend.from(table).select("*").limit(1000);
              if (result.error) {
                console.error(`Polling ${table} failed:`, result.error.message);
                continue;
              }
              const records = (result.data || []) as DataRecord[];
              const current = new Map(records.map((record) => [String(record.id), record]));
              const previous = snapshots.get(table);
              if (previous) {
                for (const [id, record] of current) {
                  const old = previous.get(id);
                  const eventType = old ? JSON.stringify(old) === JSON.stringify(record) ? null : "UPDATE" : "INSERT";
                  if (!eventType) continue;
                  listeners
                    .filter((listener) => listener.table === table && (listener.event === "*" || listener.event === eventType))
                    .forEach((listener) => listener.callback({ eventType, new: record, old: old || {} }));
                }
                for (const [id, old] of previous) {
                  if (!current.has(id)) {
                    listeners
                      .filter((listener) => listener.table === table && (listener.event === "*" || listener.event === "DELETE"))
                      .forEach((listener) => listener.callback({ eventType: "DELETE", new: {}, old }));
                  }
                }
              }
              snapshots.set(table, current);
            }
          } finally {
            polling = false;
          }
        };
        void poll();
        timer = setInterval(() => { void poll(); }, 15000);
        return channel;
      },
      unsubscribe: () => {
        if (timer) clearInterval(timer);
        timer = undefined;
      },
    };
    return channel;
  },
  removeChannel: async (channel: { unsubscribe?: () => void }) => {
    channel.unsubscribe?.();
    return { error: null };
  },
};

export type BackendUser = {
  id: string;
  email: string;
  user_metadata?: { full_name?: string; phone?: string; [key: string]: unknown };
  app_metadata?: { role?: string; [key: string]: unknown };
  created_at?: string;
};

export type BackendSession = { user: BackendUser; access_token: string; token_type?: string };
export type { BackendResult };
