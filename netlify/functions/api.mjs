import fs from "fs";
import path from "path";

const DB_FILE = "/tmp/ak_buffaloes_serverless_db.json";

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (e) {
    console.error("Error reading serverless DB:", e);
  }
  return {};
}

function writeDb(db) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db), "utf-8");
  } catch (e) {
    console.error("Error writing serverless DB:", e);
  }
}

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  const p = event.path || "";

  // 1. Session endpoint
  if (p.endsWith("/api/auth/session")) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ user: null }),
    };
  }

  // 2. Data endpoint: /api/data
  if (p.endsWith("/api/data") || event.body) {
    let body = {};
    try {
      body = event.body ? JSON.parse(event.body) : {};
    } catch {
      body = {};
    }

    const { table, operation, values, filters = [], ordering, limit } = body;
    if (!table) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: [], error: null }),
      };
    }

    const db = readDb();
    if (!db[table]) db[table] = [];
    let records = db[table];

    // SELECT
    if (operation === "select" || !operation) {
      let filtered = records;
      if (Array.isArray(filters) && filters.length > 0) {
        filtered = filtered.filter((r) =>
          filters.every(({ column, value }) => String(r[column]) === String(value))
        );
      }
      if (limit && Number(limit) > 0) {
        filtered = filtered.slice(0, Number(limit));
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: filtered, error: null, count: filtered.length }),
      };
    }

    // INSERT / UPSERT
    if (operation === "insert" || operation === "upsert") {
      const inputs = Array.isArray(values) ? values : [values];
      for (const input of inputs) {
        if (!input) continue;
        const item = {
          created_at: new Date().toISOString(),
          ...input,
          id: String(input.id || Math.random().toString(36).slice(2, 10)),
          updated_at: new Date().toISOString(),
        };
        const idx = records.findIndex((r) => String(r.id) === String(item.id));
        if (idx >= 0) {
          records[idx] = { ...records[idx], ...item };
        } else {
          records.push(item);
        }
      }
      db[table] = records;
      writeDb(db);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: inputs, error: null, count: inputs.length }),
      };
    }

    // UPDATE
    if (operation === "update") {
      const valObj = values || {};
      records = records.map((item) => {
        const matches = Array.isArray(filters) && filters.every(({ column, value }) => String(item[column]) === String(value));
        if (matches) {
          return { ...item, ...valObj, updated_at: new Date().toISOString() };
        }
        return item;
      });
      db[table] = records;
      writeDb(db);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: [valObj], error: null, count: 1 }),
      };
    }

    // DELETE
    if (operation === "delete") {
      if (Array.isArray(filters) && filters.length > 0) {
        records = records.filter(
          (item) => !filters.every(({ column, value }) => String(item[column]) === String(value))
        );
        db[table] = records;
        writeDb(db);
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ data: [], error: null, count: 0 }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: records, error: null }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ ok: true }),
  };
};
