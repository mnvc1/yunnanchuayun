import cloud from "@lafjs/cloud";

const db = cloud.database();

type SendCodeBody = {
  phone?: string;
};

type FunctionContext = {
  body?: SendCodeBody;
  method?: string;
  request?: { method?: string };
  response?: { setHeader?: (k: string, v: string) => void; status?: (code: number) => void };
};

const applyCors = (ctx: FunctionContext | undefined) => {
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

const requestMethod = (ctx: FunctionContext | undefined) =>
  String(ctx?.method ?? ctx?.request?.method ?? "POST").toUpperCase();

const asString = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const parseBody = (raw: unknown): SendCodeBody => {
  if (raw == null || raw === "") return {};
  if (typeof raw === "string") {
    try {
      const o = JSON.parse(raw) as unknown;
      return o && typeof o === "object" ? (o as SendCodeBody) : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    const r = raw as { constructor?: { name?: string }; toString?: (enc?: string) => string };
    if (r.constructor?.name === "Buffer" && typeof r.toString === "function") {
      try {
        const o = JSON.parse(r.toString("utf8")) as unknown;
        return o && typeof o === "object" ? (o as SendCodeBody) : {};
      } catch {
        return {};
      }
    }
    return raw as SendCodeBody;
  }
  return {};
};

const isCNMobile = (p: string) => /^1\d{10}$/.test(p);

const genCode6 = () => {
  const n = Math.floor(Math.random() * 1000000);
  return String(n).padStart(6, "0");
};

export async function main(ctx: FunctionContext) {
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
    const phone = asString(body.phone).trim();

    if (!phone) return { error: "手机号不能为空" };
    if (!isCNMobile(phone)) return { error: "手机号格式不正确" };

    const code = genCode6();
    const now = Date.now();
    const ttlSeconds = 300;

    const doc = {
      type: 1,
      phone,
      code,
      createdAt: now,
      expiresAt: now + ttlSeconds * 1000,
    };

    const { id } = await db.collection("codes").add(doc);

    return {
      ok: true,
      msg: "验证码已发送（演示模式）",
      data: { uuid: id, ttl: ttlSeconds, code },
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { error: msg ? `发送失败：${msg}` : "发送失败" };
  }
}
