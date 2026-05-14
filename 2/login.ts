import cloud from "@lafjs/cloud";
import { createHash } from "crypto";

const db = cloud.database();

type HeadersLike = Record<string, string | string[] | undefined>;

type LoginBody = {
  username?: string;
  password?: string;
  code?: string;
  uuid?: string;
};

type FunctionContext = {
  body?: LoginBody | string | unknown;
  headers?: HeadersLike;
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

const parseBody = (raw: unknown): LoginBody => {
  if (raw == null || raw === "") return {};
  if (typeof raw === "string") {
    try {
      const o = JSON.parse(raw) as unknown;
      return o && typeof o === "object" ? (o as LoginBody) : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") {
    const r = raw as { constructor?: { name?: string }; toString?: (enc?: string) => string };
    if (r.constructor?.name === "Buffer" && typeof r.toString === "function") {
      try {
        const o = JSON.parse(r.toString("utf8")) as unknown;
        return o && typeof o === "object" ? (o as LoginBody) : {};
      } catch {
        return {};
      }
    }
    return raw as LoginBody;
  }
  return {};
};

const pickHeader = (h: HeadersLike | undefined, key: string) => {
  if (!h) return "";
  const direct = h[key];
  const v = direct ?? h[key.toLowerCase()] ?? h[key.toUpperCase()];
  return Array.isArray(v) ? (v[0] ?? "") : v ?? "";
};

const sha256Hex = async (plain: string) => {
  try {
    return createHash("sha256").update(plain).digest("hex");
  } catch {
    const subtle = (globalThis as any)?.crypto?.subtle;
    if (!subtle) throw new Error("sha256 runtime not supported");
    const enc = new TextEncoder();
    const buf = await subtle.digest("SHA-256", enc.encode(plain));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
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
    const username = asString(body.username).trim();
    const password = asString(body.password);
    const code = asString(body.code).trim();
    const uuid = asString(body.uuid).trim();

    // 查询验证码，有则删除（与云函数规则一致：type + 文档 _id + code）
    const { deleted } = await db.collection("codes").where({ type: 1, _id: uuid, code }).remove();
    if (deleted !== 1) return { error: "验证码不正确！" };

    if (!username || !password) return { error: "用户名或密码不能为空" };

    const pwdHash = await sha256Hex(password);
    const { data: user } = await db.collection("users").where({ username }).getOne();

    const uid = (user as any)?._id ?? (user as any)?.id;
    if (!user || uid == null || uid === "") return { error: "用户名或密码错误" };
    const storedPwd = String((user as any).password ?? "");
    if (storedPwd !== pwdHash) return { error: "用户名或密码错误" };
    if ((user as any).lock === 1) return { error: "用户已被锁定，请联系管理员！" };

    const ip =
      pickHeader(ctx.headers, "x-real-ip") ||
      pickHeader(ctx.headers, "x-forwarded-for") ||
      pickHeader(ctx.headers, "cf-connecting-ip");
    if (ip) {
      await db.collection("users").where({ _id: uid }).update({ lastIp: ip });
    }

    const { password: _pwd, ...safeUser } = user as any;

    return {
      ok: true,
      msg: "登录成功！",
      data: safeUser,
    };
  } catch (err: any) {
    return { error: err?.message ? `服务器异常：${String(err.message)}` : "Internal Server Error" };
  }
}
