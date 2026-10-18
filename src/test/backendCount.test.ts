import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { rmSync } from "node:fs";
import path from "node:path";

const port = 3101;
const baseUrl = `http://127.0.0.1:${port}`;
const root = "c:/Users/TANVEER/OneDrive/Desktop/ak_buffaloes";
const databasePath = path.join(root, "server", "data", "test-ak-buffalo.sqlite");

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/session`);
      if (response.status >= 200 && response.status < 500) return;
    } catch {
      // Server is still starting.
    }
    await delay(250);
  }
  throw new Error("Server did not start in time.");
}

describe("purchase inquiry counts", () => {
  let serverProcess: ReturnType<typeof spawn> | undefined;

  beforeAll(async () => {
    rmSync(databasePath, { force: true });
    rmSync(`${databasePath}-wal`, { force: true });
    rmSync(`${databasePath}-shm`, { force: true });
    serverProcess = spawn("node", ["server/index.mjs"], {
      cwd: root,
      env: {
        ...process.env,
        ADMIN_PASSWORD: "TestAdminPassword123",
        API_PORT: String(port),
        DATABASE_PATH: databasePath,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    await waitForServer();
  }, 30000);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill("SIGTERM");
      await delay(300);
    }
    rmSync(databasePath, { force: true });
    rmSync(`${databasePath}-wal`, { force: true });
    rmSync(`${databasePath}-shm`, { force: true });
  });

  it("counts only records that match the current filter", async () => {
    const request = async (path: string, init: RequestInit = {}, cookie?: string) => {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: {
          ...(init.headers || {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
      });
      return response;
    };

    const signUp = async (email: string, password: string, fullName: string) => {
      const response = await request("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          options: { data: { full_name: fullName, phone: "9999999999" } },
        }),
      });
      expect(response.status).toBe(201);
      const payload = await response.json();
      return payload.user as { id: string; email: string };
    };

    const login = async (email: string, password: string) => {
      const response = await request("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      expect(response.status).toBe(200);
      const payload = await response.json();
      const sessionCookie = response.headers.get("set-cookie");
      return {
        user: payload.user as { id: string; email: string },
        cookie: sessionCookie ? sessionCookie.split(";")[0] : "",
      };
    };

    const insertInquiry = async (userId: string, name: string, message: string, cookie: string) => {
      const response = await request("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "purchase_inquiries",
          operation: "insert",
          values: {
            user_id: userId,
            name,
            email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
            phone: "9999999999",
            message,
          },
        }),
      }, cookie);
      expect(response.status).toBe(200);
      return response.json();
    };

    const user1 = await signUp("user1@example.com", "Password123", "User One");
    const user2 = await signUp("user2@example.com", "Password123", "User Two");
    const user1Login = await login("user1@example.com", "Password123");
    expect(user1Login.user.id).toBe(user1.id);
    const user2Login = await login("user2@example.com", "Password123");
    await insertInquiry(user1.id, "Alice", "First inquiry from user one", user1Login.cookie);
    await insertInquiry(user1.id, "Alice", "Second inquiry from user one", user1Login.cookie);
    await insertInquiry(user2.id, "Bob", "Only inquiry from user two", user2Login.cookie);

    const response = await request("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "purchase_inquiries",
        operation: "select",
        filters: [{ column: "user_id", value: user1.id }],
        count: "exact",
      }),
    }, user1Login.cookie);
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.count).toBe(2);
  });
});
