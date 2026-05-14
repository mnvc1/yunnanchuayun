(() => {
  const form = document.getElementById("messageForm");
  const tip = document.getElementById("messageTip");
  if (!form || !tip) return;

  const API_ORIGIN = "https://y9r6v096qg.sealoshzh.site";
  const MESSAGE_PATH = "/message";

  const url = `${API_ORIGIN.replace(/\/$/, "")}${MESSAGE_PATH}`;

  const readPayload = (data) => {
    if (!data || typeof data !== "object") return { error: "服务器返回异常" };
    if ("error" in data && data.error) return { error: String(data.error) };
    if (data.ok === true) return { ok: true, data: data.data, msg: data.msg };
    return { error: "未知响应格式" };
  };

  const showTip = (text, kind) => {
    tip.hidden = !text;
    tip.textContent = text || "";
    tip.classList.remove("is-error", "is-ok");
    if (kind === "error") tip.classList.add("is-error");
    if (kind === "ok") tip.classList.add("is-ok");
  };

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (typeof axios === "undefined") {
      showTip("未加载 axios，请检查网络或 CDN。", "error");
      return;
    }

    const nickname = String(document.getElementById("msgNickname")?.value || "").trim();
    const content = String(document.getElementById("msgContent")?.value || "").trim();
    const phone = String(document.getElementById("msgPhone")?.value || "").trim();
    const email = String(document.getElementById("msgEmail")?.value || "").trim();

    const payload = { nickname, content };
    if (phone) payload.phone = phone;
    if (email) payload.email = email;

    showTip("正在提交…", "ok");
    const btn = form.querySelector('button[type="submit"]');
    if (btn instanceof HTMLButtonElement) btn.disabled = true;

    try {
      const res = await axios.post(url, payload, {
        headers: { "Content-Type": "application/json" },
        timeout: 20000,
      });
      const parsed = readPayload(res.data);
      if (parsed.error) {
        showTip(parsed.error, "error");
        return;
      }
      showTip(parsed.msg || "留言提交成功！", "ok");
      form.reset();
    } catch (e) {
      let msg = "请求失败";
      if (axios.isAxiosError?.(e)) {
        const d = e.response?.data;
        if (d && typeof d === "object" && "error" in d && d.error) msg = String(d.error);
        else if (e.message) msg = e.message;
      } else if (e instanceof Error) msg = e.message;
      showTip(msg, "error");
    } finally {
      if (btn instanceof HTMLButtonElement) btn.disabled = false;
    }
  });
})();
