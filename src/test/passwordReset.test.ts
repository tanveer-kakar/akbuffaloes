import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const port = 3102;
const baseUrl = `http://127.0.0.1:${port}`;
const root = "c:/Users/TANVEER/OneDrive/Desktop/ak_buffaloes";
const databasePath = path.join(root, "server", "data", "test-reset-pwd.sqlite");

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/auth/session`);
      if (response.status >= 200 && response.status < 500) return;
    } catch {
      // Waiting
    }
    await delay(250);
  }
  throw new Error("Server did not start in time.");
}

describe("Password Reset & Email OTP verification flow", () => {
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
        SMTP_PASS: "", // Disable real email sending in unit test
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    await waitForServer();
  });

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
      await delay(500);
    }
    try {
      rmSync(databasePath, { force: true });
      rmSync(`${databasePath}-wal`, { force: true });
      rmSync(`${databasePath}-shm`, { force: true });
    } catch {
      // Windows file lock fallback
    }
  });

  it("should fail forgot-password for nonexistent email", async () => {
    const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "unknownuser999@test.com" }),
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toContain("No account found");
  });

  it("should register a user, request reset link & OTP, verify OTP, and reset password", async () => {
    const testEmail = "farmer_rahul@example.com";
    const initialPassword = "OldPassword123!";
    const newPassword = "NewSecretPassword456!";

    // 1. Sign up user
    const signupRes = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: initialPassword,
        options: { data: { full_name: "Rahul Patil", phone: "9876543210" } },
      }),
    });
    expect(signupRes.status).toBe(201);

    // 2. Request forgot password
    const forgotRes = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, origin: "http://localhost:8080" }),
    });
    expect(forgotRes.status).toBe(200);
    const forgotBody = await forgotRes.json();
    expect(forgotBody.success).toBe(true);

    // Initial reset request should generate token, but NO OTP
    const db1 = new DatabaseSync(databasePath);
    const initialRecord = db1.prepare("SELECT * FROM password_resets WHERE email = ? AND used = 0").get(testEmail) as {
      token: string;
      otp: string;
      used: number;
    };
    db1.close();
    expect(initialRecord).toBeDefined();
    expect(initialRecord.token).toBeTruthy();
    expect(initialRecord.otp).toBe(""); // No OTP sent in initial email!

    // 3. User visits reset page with token, inputs new password, and triggers OTP dispatch
    const otpRes = await fetch(`${baseUrl}/api/auth/send-reset-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, token: initialRecord.token }),
    });
    expect(otpRes.status).toBe(200);
    const otpBody = await otpRes.json();
    expect(otpBody.success).toBe(true);

    // Read the generated OTP from the test sqlite database
    const db2 = new DatabaseSync(databasePath);
    const updatedRecord = db2.prepare("SELECT * FROM password_resets WHERE email = ? AND used = 0").get(testEmail) as {
      token: string;
      otp: string;
      used: number;
    };
    db2.close();
    expect(updatedRecord.otp).toMatch(/^\d{6}$/);

    // 4. Try to verify with wrong OTP
    const wrongOtpRes = await fetch(`${baseUrl}/api/auth/verify-reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        token: updatedRecord.token,
        otp: "000000",
        newPassword,
      }),
    });
    expect(wrongOtpRes.status).toBe(400);
    const wrongOtpBody = await wrongOtpRes.json();
    expect(wrongOtpBody.error).toContain("Invalid OTP code");

    // 5. Verify with correct OTP
    const correctRes = await fetch(`${baseUrl}/api/auth/verify-reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        token: updatedRecord.token,
        otp: updatedRecord.otp,
        newPassword,
      }),
    });
    expect(correctRes.status).toBe(200);
    const correctBody = await correctRes.json();
    expect(correctBody.success).toBe(true);

    // 5. Verify old password fails to log in
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: initialPassword }),
    });
    expect(oldLoginRes.status).toBe(401);

    // 6. Verify new password successfully logs in
    const newLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: newPassword }),
    });
    expect(newLoginRes.status).toBe(200);
    const newLoginBody = await newLoginRes.json();
    expect(newLoginBody.user.email).toBe(testEmail);
  });
});
