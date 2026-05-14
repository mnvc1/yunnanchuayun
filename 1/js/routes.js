(() => {
  const wrap = document.getElementById("routeGrid");
  if (!wrap) return;

  const routes = [
    {
      title: "古道风味线（文化向）",
      days: "2–3 天",
      theme: "茶马古道 · 集市 · 博物馆",
      nodes: ["城市博物馆/茶文化馆", "老街集市体验", "古道节点打卡", "茶席体验/品鉴课"],
      tips: ["走茶马古道，探访古村落与马帮遗存；体验普洱茶制茶工艺，聆听驮茶传说，感受千年茶香里的民族交融与岁月印记。"],
    },
    {
      title: "茶山清晨线（风土向）",
      days: "1–2 天",
      theme: "茶园日出 · 采摘 · 制茶",
      nodes: ["茶园晨雾拍摄", "采摘体验", "杀青/揉捻观摩", "新茶试饮与购买"],
      tips: ["晨雾中登茶山，观云海日出，沾露采青；体验手工制茶，品第一泡春鲜，感受茶园风土与山头气韵。"],
    },
    {
      title: "名茶品鉴线（学习向）",
      days: "半天–1 天",
      theme: "三款对比 · 香气训练 · 冲泡方法",
      nodes: ["认识茶类与器具", "对比品饮（普洱/滇红/白茶）", "记录风味轮", "带走冲泡小卡片"],
      tips: ["对比品鉴普洱、滇红等名茶，学习看茶、闻香、品味技巧；探访茶厂，了解山头风格与工艺差异，提升专业鉴茶力。"],
    },
  ];

  const tpl = (r) => `
    <details class="route-card">
      <summary>
        <div class="route-title">
          <span>${r.title}</span>
          <span class="pill">${r.days}</span>
        </div>
        <div class="muted small">${r.theme}</div>
      </summary>
      <div class="route-body">
        <div class="route-cols">
          <div>
            <div class="muted small">路线节点</div>
            <ol class="route-steps">
              ${r.nodes.map((n) => `<li>${n}</li>`).join("")}
            </ol>
          </div>
          <div>
            <div class="muted small">体验建议</div>
            <ul class="list">
              ${r.tips.map((t) => `<li>${t}</li>`).join("")}
            </ul>
          </div>
        </div>
      </div>
    </details>
  `;

  wrap.innerHTML = routes.map(tpl).join("");
})();
