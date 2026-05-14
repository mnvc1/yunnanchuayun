(() => {
  const GATE_KEY = "yntea_login_gate";
  const path = (location.pathname.split("/").pop() || "").toLowerCase();
  if (path === "login.html" || path === "guestbook.html") return;

  const params = new URLSearchParams(location.search);
  if (params.get("gate") === "1") sessionStorage.removeItem(GATE_KEY);
  if (sessionStorage.getItem(GATE_KEY) === "done") return;

  const API_ORIGIN = "https://y9r6v096qg.sealoshzh.site";
  const API_PATHS = { login: "/login", sendCode: "/send_code" };

  const joinUrl = (path) => `${API_ORIGIN.replace(/\/$/, "")}${path}`;
  const endpoint = (pathOrUrl) => {
    const s = String(pathOrUrl || "").trim();
    if (!s) return API_ORIGIN;
    if (/^https?:\/\//i.test(s)) return s;
    return joinUrl(s.startsWith("/") ? s : `/${s}`);
  };

  const readPayload = (data) => {
    if (!data || typeof data !== "object") return { error: "服务器返回异常" };
    if ("error" in data && data.error) return { error: String(data.error) };
    if (data.ok === true) return { ok: true, data: data.data, msg: data.msg };
    return { error: "未知响应格式" };
  };

  const wrap = document.createElement("div");
  wrap.id = "yntea-login-gate";
  wrap.className = "yntea-login-gate";
  wrap.setAttribute("role", "dialog");
  wrap.setAttribute("aria-modal", "true");
  wrap.setAttribute("aria-labelledby", "yntea-gate-title");

  wrap.innerHTML = `
    <div class="login-backdrop" aria-hidden="true">
      <div class="login-backdrop__wash"></div>
      <div class="login-backdrop__blur"></div>
    </div>
    <div class="login-scrim">
      <div class="login-modal">
        <header class="login-modal__head">
          <div class="login-modal__titles">
            <h1 class="login-modal__title" id="yntea-gate-title">登录 </h1>
            <p class="login-modal__sub"></p>
          </div>
          <button type="button" class="login-btn-ghost login-btn-ghost--sm" data-yntea-skip>暂不登录</button>
        </header>
        <p id="yntea-g-alert" class="login-modal-alert" role="status" aria-live="polite" hidden></p>
        <form id="yntea-g-form" class="login-modal-form" autocomplete="on">
          <div class="login-field">
            <label for="yntea-g-username">用户名</label>
            <input id="yntea-g-username" name="username" type="text" autocomplete="username" required />
          </div>
          <div class="login-field">
            <label for="yntea-g-phone">手机号</label>
            <input id="yntea-g-phone" name="phone" type="tel" inputmode="numeric" maxlength="11" placeholder="11位手机号" required />
          </div>
          <div class="login-field login-field--row">
            <div class="login-field__grow">
              <label for="yntea-g-code">验证码</label>
              <input id="yntea-g-code" name="code" type="text" inputmode="numeric" maxlength="6" placeholder="6位验证码" required />
            </div>
            <button class="login-btn-ghost login-btn-ghost--code" type="button" id="yntea-g-send">获取验证码</button>
          </div>
          <div class="login-field">
            <label for="yntea-g-password">密码</label>
            <input id="yntea-g-password" name="password" type="password" autocomplete="current-password" required />
          </div>
          <input type="hidden" id="yntea-g-uuid" value="" />
          <button class="login-btn-primary" type="submit">登录</button>
        </form>
      </div>
    </div>
  `;

  const prevOverflow = document.body.style.overflow;
  document.body.appendChild(wrap);
  document.body.style.overflow = "hidden";

  const onKeyDown = (e) => {
    if (e.key === "Escape") closeGate();
  };
  window.addEventListener("keydown", onKeyDown);

  const $ = (id) => document.getElementById(id);
  const alertEl = $("yntea-g-alert");
  const form = $("yntea-g-form");
  const btnSend = $("yntea-g-send");

  const showAlert = (text, kind) => {
    if (!alertEl) return;
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

  const closeGate = () => {
    window.removeEventListener("keydown", onKeyDown);
    sessionStorage.setItem(GATE_KEY, "done");
    wrap.remove();
    document.body.style.overflow = prevOverflow;
  };

  wrap.querySelector("[data-yntea-skip]")?.addEventListener("click", () => closeGate());

  const onSend = async () => {
    if (typeof axios === "undefined") {
      showAlert("未加载 axios，请检查网络或 CDN。", "error");
      return;
    }
    const phone = String($("yntea-g-phone")?.value || "").trim();
    if (!/^1\d{10}$/.test(phone)) {
      showAlert("请输入正确的 11 位手机号。", "error");
      return;
    }
    if (btnSend) btnSend.disabled = true;
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
      const uuidEl = $("yntea-g-uuid");
      if (uuidEl) uuidEl.value = parsed.data && parsed.data.uuid != null ? String(parsed.data.uuid) : "";
      if (!uuidEl?.value) {
        showAlert("发码成功但未返回 uuid，请检查云函数返回字段。", "error");
        return;
      }
      let hint = parsed.msg || "验证码已发送";
      if (parsed.data && parsed.data.code != null) hint += `（演示模式验证码：${parsed.data.code}）`;
      showAlert(hint, "ok");
    } catch (e) {
      let msg = "请求失败";
      if (axios.isAxiosError?.(e)) {
        const st = e.response?.status;
        const d = e.response?.data;
        if (d && typeof d === "object" && "error" in d && d.error) msg = String(d.error);
        else if (typeof d === "string" && d.includes("Function Not Found"))
          msg = "未找到发码云函数：修改 login-gate.js 中 API_PATHS.sendCode。";
        else if (st === 404) msg = "发码接口 404：请检查 API_PATHS.sendCode。";
        else if (e.message) msg = e.message;
      } else if (e instanceof Error) msg = e.message;
      showAlert(msg, "error");
    } finally {
      if (btnSend) btnSend.disabled = false;
    }
  };

  btnSend?.addEventListener("click", onSend);

  form?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (typeof axios === "undefined") {
      showAlert("未加载 axios，请检查网络或 CDN。", "error");
      return;
    }
    const username = String($("yntea-g-username")?.value || "").trim();
    const password = String($("yntea-g-password")?.value || "");
    const code = String($("yntea-g-code")?.value || "").trim();
    const uuid = String($("yntea-g-uuid")?.value || "").trim();
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
        /* noop */
      }
      showAlert(parsed.msg || "登录成功！", "ok");
      setTimeout(closeGate, 350);
    } catch (e) {
      let msg = "请求失败";
      if (axios.isAxiosError?.(e)) {
        const st = e.response?.status;
        const d = e.response?.data;
        if (d && typeof d === "object" && "error" in d && d.error) msg = String(d.error);
        else if (typeof d === "string" && /Function Not Found/i.test(d)) msg = "未找到登录云函数，请检查 API_PATHS.login。";
        else if (st === 404) msg = "登录接口 404。";
        else if (e.message) msg = e.message;
      } else if (e instanceof Error) msg = e.message;
      showAlert(msg, "error");
    }
  });

  requestAnimationFrame(() => {
    $("yntea-g-username")?.focus();
  });
})();
