import cloud from "@lafjs/cloud";

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

const pickHeader = (h, key) => {
  if (!h) return "";
  const direct = h[key];
  const v = direct ?? h[key.toLowerCase()] ?? h[key.toUpperCase()];
  return Array.isArray(v) ? (v[0] ?? "") : v ?? "";
};

const MAX_CONTENT = 2000;
const MAX_NICKNAME = 64;

const isEmailLike = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

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
    const nickname = asString(body.nickname).trim();
    const content = asString(body.content).trim();
    const phone = asString(body.phone).trim();
    const email = asString(body.email).trim();

    if (!nickname) return { error: "昵称不能为空" };
    if (nickname.length > MAX_NICKNAME) return { error: `昵称不能超过 ${MAX_NICKNAME} 个字符` };

    if (!content) return { error: "留言内容不能为空" };
    if (content.length > MAX_CONTENT) return { error: `留言内容不能超过 ${MAX_CONTENT} 个字符` };

    if (phone && !/^1\d{10}$/.test(phone)) return { error: "手机号格式不正确" };
    if (email && !isEmailLike(email)) return { error: "邮箱格式不正确" };

    const ip =
      pickHeader(ctx.headers, "x-real-ip") ||
      pickHeader(ctx.headers, "x-forwarded-for") ||
      pickHeader(ctx.headers, "cf-connecting-ip");

    const doc = {
      nickname,
      content,
      createdAt: Date.now(),
    };
    if (phone) doc.phone = phone;
    if (email) doc.email = email;
    if (ip) doc.ip = ip;

    const { id } = await db.collection("messages").add(doc);

    return {
      ok: true,
      msg: "留言提交成功！",
      data: { _id: id, ...doc },
    };
  } catch (err) {
    return { error: err?.message ? `服务器异常：${String(err.message)}` : "Internal Server Error" };
  }
}
