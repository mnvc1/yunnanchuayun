(() => {
  const form = document.getElementById("loginForm");
  const alertEl = document.getElementById("loginAlert");
  const btnSend = document.getElementById("btnSendCode");
  const phoneEl = document.getElementById("phone");
  const codeEl = document.getElementById("code");
  const uuidEl = document.getElementById("uuid");

  if (!form || !alertEl || !btnSend || !phoneEl || !codeEl || !uuidEl) return;

  /** 与已发布云函数同源的站点根地址 */
  const API_ORIGIN = "https://y9r6v096qg.sealoshzh.site";

  /** 若 Sealos / Laf 上函数路径不同，只改这里 */
  const API_PATHS = {
    login: "/login",
    sendCode: "/send_code",
  };

  const url = (path) => `${API_ORIGIN.replace(/\/$/, "")}${path}`;

  /** 支持写完整 URL（另一域名）或相对路径（拼在 API_ORIGIN 后） */
  const endpoint = (pathOrUrl) => {
    const s = String(pathOrUrl || "").trim();
    if (!s) return API_ORIGIN;
    if (/^https?:\/\//i.test(s)) return s;
    return url(s.startsWith("/") ? s : `/${s}`);
  };

  const showAlert = (text, kind) => {
    if (!text) {
      alertEl.hidden = true;
      alertEl.textContent = "";
      alertEl.classList.remove("is-error", "is-ok");
      return;
    }
    alertEl.hidden = false;
    alertEl.textContent = text;
    alertEl.classList.toggle("is-error", kind === "error");
    alertEl.classList.toggle("is-ok", kind === "ok");
  };

  const readPayload = (data) => {
    if (!data || typeof data !== "object") return { error: "服务器返回异常" };
    if ("error" in data && data.error) return { error: String(data.error) };
    if (data.ok === true) return { ok: true, data: data.data, msg: data.msg };
    return { error: "未知响应格式" };
  };

  btnSend.addEventListener("click", async () => {
    if (typeof axios === "undefined") {
      showAlert("未加载 axios，请检查网络或 CDN。", "error");
      return;
    }
    const phone = String(phoneEl.value || "").trim();
    if (!/^1\d{10}$/.test(phone)) {
      showAlert("请输入正确的 11 位手机号。", "error");
      return;
    }
    btnSend.disabled = true;
    showAlert("正在发送验证码…", "ok");
    try {
      const res = await axios.post(
        endpoint(API_PATHS.sendCode),
        { phone },
        { headers: { "Content-Type": "application/json" }, timeout: 20000 },
      );
      const parsed = readPayload(res.data);
      if (parsed.error) {
        showAlert(parsed.error, "error");
        return;
      }
      uuidEl.value = parsed.data && parsed.data.uuid != null ? String(parsed.data.uuid) : "";
      if (!uuidEl.value) {
        showAlert("发码成功但未返回 uuid，请检查云函数返回字段。", "error");
        return;
      }
      let hint = parsed.msg || "验证码已发送";
      if (parsed.data && parsed.data.code != null) {
        hint += `（演示模式验证码：${parsed.data.code}）`;
      }
      showAlert(hint, "ok");
    } catch (e) {
      let msg = "请求失败";
      if (axios.isAxiosError?.(e)) {
        const st = e.response?.status;
        const d = e.response?.data;
        if (d && typeof d === "object" && "error" in d && d.error) msg = String(d.error);
        else if (typeof d === "string" && d.includes("Function Not Found"))
          msg = "未找到发码云函数：请在 Laf/Sealos 发布 send_code，或把 js/login.js 里 API_PATHS.sendCode 改成你的发码地址。";
        else if (st === 404) msg = "发码接口 404：请检查 API_PATHS.sendCode 是否与线上一致。";
        else if (e.message) msg = e.message;
      } else if (e instanceof Error) msg = e.message;
      showAlert(msg, "error");
    } finally {
      btnSend.disabled = false;
    }
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (typeof axios === "undefined") {
      showAlert("未加载 axios，请检查网络或 CDN。", "error");
      return;
    }
    const username = String(document.getElementById("username")?.value || "").trim();
    const password = String(document.getElementById("password")?.value || "");
    const code = String(codeEl.value || "").trim();
    const uuid = String(uuidEl.value || "").trim();

    if (!uuid) {
      showAlert("请先获取验证码（成功后系统会保存 uuid）。", "error");
      return;
    }

    showAlert("正在登录…", "ok");
    try {
      const res = await axios.post(
        endpoint(API_PATHS.login),
        { username, password, code, uuid },
        { headers: { "Content-Type": "application/json" }, timeout: 20000 },
      );
      const parsed = readPayload(res.data);
      if (parsed.error) {
        showAlert(parsed.error, "error");
        return;
      }
      try {
        localStorage.setItem("yntea_user", JSON.stringify(parsed.data ?? null));
      } catch {
        /* ignore quota */
      }
      showAlert(parsed.msg || "登录成功！", "ok");
      setTimeout(() => {
        window.location.href = "index.html";
      }, 400);
    } catch (e) {
      let msg = "请求失败";
      if (axios.isAxiosError?.(e)) {
        const st = e.response?.status;
        const d = e.response?.data;
        if (d && typeof d === "object" && "error" in d && d.error) msg = String(d.error);
        else if (typeof d === "string" && /Function Not Found/i.test(d))
          msg = "未找到登录云函数：请检查 API_PATHS.login 是否与线上一致。";
        else if (st === 404) msg = "登录接口 404：请检查 API_PATHS.login。";
        else if (e.message) msg = e.message;
      } else if (e instanceof Error) msg = e.message;
      showAlert(msg, "error");
    }
  });
})();
