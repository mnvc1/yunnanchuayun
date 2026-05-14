import cloud from "@lafjs/cloud";
import { createHash } from "crypto";

const db = cloud.database();

const applyCors = (ctx) => {
  try {
    const r = ctx?.response;
    if (r?.setHeader) {
      r.setHeader("Access-Control-Allow-Origin", "*");
      r.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      r.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      r.setHeader("Access-Control-Max-Age", "86400");
    }
  } catch {
    /* noop */
  }
};

const requestMethod = (ctx) =>
  String(ctx?.method ?? ctx?.request?.method ?? "POST").toUpperCase();

const asString = (v) => (v === null || v === undefined ? "" : String(v));

const parseBody = (raw) => {
  if (raw == null || raw === "") return {};
  if (typeof raw === "string") {
    try {
      const o = JSON.parse(raw);
      return o && typeof o === "object" ? o : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    const r = raw;
    if (r.constructor?.name === "Buffer" && typeof r.toString === "function") {
      try {
        const o = JSON.parse(r.toString("utf8"));
        return o && typeof o === "object" ? o : {};
      } catch {
        return {};
      }
    }
    return raw;
  }
  return {};
};

const sha256Hex = async (plain) => {
  try {
    return createHash("sha256").update(plain).digest("hex");
  } catch {
    const subtle = globalThis?.crypto?.subtle;
    if (!subtle) throw new Error("sha256 runtime not supported");
    const enc = new TextEncoder();
    const buf = await subtle.digest("SHA-256", enc.encode(plain));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
};

export async function main(ctx) {
  applyCors(ctx);
  if (requestMethod(ctx) === "OPTIONS") {
    try {
      ctx.response?.status?.(204);
    } catch {
      /* noop */
    }
    return "";
  }

  try {
    const body = parseBody(ctx.body);
    const username = asString(body.username).trim();
    const password = asString(body.password);
    const phone = asString(body.phone).trim();
    const lockRaw = Number(body.lock);
    const lock = Number.isFinite(lockRaw) ? (lockRaw === 1 ? 1 : 0) : 0;

    if (!username || !password) return { error: "用户名或密码不能为空" };

    // 检查用户名是否已存在
    const { data: existing } = await db.collection("users").where({ username }).getOne();
    if (existing) return { error: "用户名已存在" };

    const pwdHash = await sha256Hex(password);

    const doc = {
      username,
      password: pwdHash,
      phone,
      lock,
      createdAt: Date.now(),
    };

    const { id } = await db.collection("users").add(doc);

    // 不回传 password
    delete doc.password;

    return {
      ok: true,
      msg: "用户创建成功",
      data: { _id: id, ...doc },
    };
  } catch (err) {
    return { error: err?.message ? `服务器异常：${String(err.message)}` : "Internal Server Error" };
  }
}
