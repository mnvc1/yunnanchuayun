(() => {
  const grid = document.getElementById("newGrid");
  if (!grid) return;

  const products = [
    {
      id: "puer-sheng-2026",
      name: "普洱生茶 · 春山青韵",
      desc: "花香蜜甜、回甘快，适合盖碗快出汤。",
      price: 129,
      tag: "普洱",
      image: "assets/images/new-1.jpg",
    },
    {
      id: "dianhong-golden",
      name: "滇红 · 金芽蜜香",
      desc: "蜜香明显、甜润顺滑，早餐搭配很舒服。",
      price: 89,
      tag: "滇红",
      image: "assets/images/new-2.jpg",
    },
    {
      id: "white-coldbrew",
      name: "云南白茶 · 冷泡清甜",
      desc: "毫香清透，冷泡 2–4 小时很适合夏天。",
      price: 76,
      tag: "白茶",
      image: "assets/images/new-3.jpg",
    },
  ];

  const esc = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const ph = (src, alt) =>
    `<img src="${src}" alt="${esc(alt)}" loading="lazy" onerror="this.remove();" />`;

  grid.innerHTML = products
    .map(
      (p) => `
        <article class="media-card">
          ${ph(p.image, p.name)}
          <div class="media-card-body">
            <div class="media-card-title">${esc(p.name)}</div>
            <div class="muted small">${esc(p.desc)}</div>
            <div class="tea-tags" style="margin-top:10px">
              <span class="pill">${esc(p.tag)}</span>
              <span class="pill">￥${Number(p.price).toFixed(0)}</span>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
})();
