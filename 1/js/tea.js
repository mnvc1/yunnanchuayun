(() => {
  const grid = document.getElementById("teaGrid");
  const empty = document.getElementById("teaEmpty");
  const search = document.getElementById("teaSearch");
  const seg = document.querySelector(".segmented");
  if (!grid || !empty || !search || !seg) return;

  /** @type {Array<{id:string,type:string,name:string,origin:string,flavor:string[],brew:string,keywords:string[],image?:string}>} */
  const teas = [
    {
      id: "puer-sheng",
      type: "puer",
      name: "普洱生茶",
      origin: "勐海 / 易武 / 景迈",
      flavor: ["花香", "蜜甜", "回甘", "山野气韵"],
      brew: "95–100℃，前几泡快出汤；可随泡数延长浸泡。",
      keywords: ["古树", "山野气韵", "回甘", "汤感"],
      image: "assets/images/tea-1.jpg",
    },
    {
      id: "puer-shou",
      type: "puer",
      name: "普洱熟茶",
      origin: "勐海等",
      flavor: ["陈香", "糯甜", "木质", "醇厚"],
      brew: "95–100℃，建议醒茶/润茶；耐泡度高。",
      keywords: ["陈香", "醇厚", "糯甜", "耐泡"],
      image: "assets/images/tea-2.jpg",
    },
    {
      id: "dianhong",
      type: "black",
      name: "滇红",
      origin: "凤庆等",
      flavor: ["蜜香", "花果香", "甜润", "顺滑"],
      brew: "90–95℃，建议先温润；适合玻璃杯或盖碗。",
      keywords: ["蜜香", "甜润", "花果", "暖感"],
      image: "assets/images/tea-3.jpg",
    },
    {
      id: "yunnan-white",
      type: "white",
      name: "云南白茶",
      origin: "景谷等",
      flavor: ["毫香", "清甜", "花香", "清透"],
      brew: "85–95℃；也可冷泡 2–4 小时。",
      keywords: ["清甜", "毫香", "冷泡", "耐泡"],
      image: "assets/images/tea-4.jpg",
    },
    {
      id: "yunnan-green",
      type: "green",
      name: "云南绿茶",
      origin: "保山/大理等",
      flavor: ["鲜爽", "清香", "豆香", "甘甜"],
      brew: "80–85℃，避免高温久泡导致苦涩。",
      keywords: ["鲜爽", "清香", "清新"],
      image: "assets/images/tea-5.jpg",
    },
  ];

  let filter = "all";
  let q = "";

  const norm = (s) => String(s || "").trim().toLowerCase();

  const match = (t) => {
    if (filter !== "all" && t.type !== filter) return false;
    if (!q) return true;
    const hay = [
      t.name,
      t.origin,
      t.brew,
      t.flavor.join(" "),
      t.keywords.join(" "),
      t.type,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  };

  const labelOf = (type) => {
    switch (type) {
      case "puer":
        return "普洱";
      case "black":
        return "滇红";
      case "white":
        return "白茶";
      case "green":
        return "绿茶";
      default:
        return "其他";
    }
  };

  const card = (t) => {
    const img = t.image
      ? `<img src="${t.image}" alt="${t.name}" loading="lazy" />`
      : `<div class="tea-ph" aria-hidden="true"></div>`;
    return `
      <article class="tea-card">
        <div class="tea-media">
          ${img}
        </div>
        <div class="tea-body">
          <div class="tea-top">
            <h3 class="tea-name">${t.name}</h3>
            <span class="pill">${labelOf(t.type)}</span>
          </div>
          <div class="muted small">产区：${t.origin}</div>
          <div class="tea-tags">
            ${t.flavor.map((x) => `<span class="tag">${x}</span>`).join("")}
          </div>
          <div class="tea-brew">
            <div class="muted small">冲泡建议</div>
            <div>${t.brew}</div>
          </div>
        </div>
      </article>
    `;
  };

  const render = () => {
    const list = teas.filter(match);
    grid.innerHTML = list.map(card).join("");
    empty.hidden = list.length !== 0;
  };

  seg.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLButtonElement)) return;
    const next = t.dataset.filter || "all";
    filter = next;
    Array.from(seg.querySelectorAll(".seg-btn")).forEach((b) =>
      b.classList.toggle("is-active", b === t)
    );
    render();
  });

  const onSearch = () => {
    q = norm(search.value);
    render();
  };
  search.addEventListener("input", onSearch);

  render();
})();
