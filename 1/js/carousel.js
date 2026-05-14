(() => {
  const root = document.querySelector("[data-carousel]");
  if (!root) return;

  const track = root.querySelector(".carousel-track");
  const slides = Array.from(root.querySelectorAll(".carousel-slide"));
  const btnPrev = root.querySelector(".carousel-btn.prev");
  const btnNext = root.querySelector(".carousel-btn.next");
  const dotsWrap = root.querySelector(".carousel-dots");
  if (!track || slides.length === 0 || !dotsWrap) return;

  let index = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
  if (index === -1) index = 0;

  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "dot";
    b.setAttribute("aria-label", `切换到第 ${i + 1} 张`);
    b.addEventListener("click", () => go(i));
    dotsWrap.appendChild(b);
    return b;
  });

  const setActive = () => {
    slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    track.style.transform = `translateX(${-index * 100}%)`;
  };

  const go = (next) => {
    index = (next + slides.length) % slides.length;
    setActive();
    restart();
  };

  btnPrev?.addEventListener("click", () => go(index - 1));
  btnNext?.addEventListener("click", () => go(index + 1));

  let timer = 0;
  const start = () => {
    stop();
    timer = window.setInterval(() => go(index + 1), 4500);
  };
  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = 0;
  };
  const restart = () => {
    if (!document.hidden) start();
  };

  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  // Basic swipe support
  let startX = 0;
  let moved = false;
  root.addEventListener(
    "touchstart",
    (e) => {
      startX = e.touches[0]?.clientX ?? 0;
      moved = false;
    },
    { passive: true }
  );
  root.addEventListener(
    "touchmove",
    (e) => {
      const x = e.touches[0]?.clientX ?? 0;
      if (Math.abs(x - startX) > 12) moved = true;
    },
    { passive: true }
  );
  root.addEventListener(
    "touchend",
    (e) => {
      if (!moved) return;
      const endX = e.changedTouches[0]?.clientX ?? 0;
      const dx = endX - startX;
      if (dx > 35) go(index - 1);
      if (dx < -35) go(index + 1);
    },
    { passive: true }
  );

  setActive();
  start();
})();
