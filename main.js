(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Split text into animated letters ---------- */
  $$(".split").forEach((el) => {
    let i = 0;
    el.innerHTML = el.textContent
      .split(" ")
      .map((word) => `<span class="wd">${[...word].map((c) => `<span class="ch" style="--ci:${i++}">${c}</span>`).join("")}</span>`)
      .join('<span class="sp"></span>');
  });

  /* ---------- Smooth scroll (Lenis) ---------- */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.stop();
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }
  const scrollTo = (target) => {
    if (lenis) lenis.scrollTo(target, { offset: 0 });
    else target.scrollIntoView({ behavior: "smooth" });
  };
  $$('a[href^="#"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      document.body.classList.remove("menu-open");
      scrollTo(target);
    })
  );

  /* ---------- Loader: 0% → 100% → "hello" → reveal ---------- */
  const loader = $("#loader");
  const count = $("#loaderCount");
  const finishLoading = () => {
    loader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    if (lenis) lenis.start();
    setTimeout(() => liquidBurst(900), 500);
  };
  if (reduceMotion) {
    finishLoading();
  } else {
    let p = 0;
    const tick = () => {
      p = Math.min(100, p + Math.max(1, Math.round((100 - p) * 0.045 + Math.random() * 2)));
      count.textContent = p + "%";
      if (p < 100) setTimeout(tick, 40 + Math.random() * 50);
      else setTimeout(() => {
        loader.classList.add("is-hello");
        setTimeout(finishLoading, 2300);
      }, 250);
    };
    tick();
  }

  /* ---------- Liquid distortion on hero title ---------- */
  const turb = $("#liquidTurb");
  const disp = $("#liquidDisp");
  const big = $("#heroBig");
  let liquid = 0, liquidTarget = 0, seed = 3;
  const liquidLoop = () => {
    liquid += (liquidTarget - liquid) * 0.09;
    liquidTarget *= 0.94;
    disp.setAttribute("scale", liquid.toFixed(2));
    if (liquid > 0.5) {
      seed = (seed + 0.15) % 100;
      turb.setAttribute("baseFrequency", `${0.01 + Math.sin(seed) * 0.003} ${0.035 + Math.cos(seed) * 0.01}`);
    }
    requestAnimationFrame(liquidLoop);
  };
  if (!reduceMotion) liquidLoop();
  function liquidBurst(amount) { liquidTarget = Math.max(liquidTarget, amount / 20); }

  let lastX = 0, lastY = 0;
  big.addEventListener("mousemove", (e) => {
    const v = Math.hypot(e.clientX - lastX, e.clientY - lastY);
    lastX = e.clientX; lastY = e.clientY;
    liquidTarget = Math.min(70, liquidTarget + v * 0.6);
  });
  // random idle glitch
  setInterval(() => {
    if (window.scrollY < innerHeight && Math.random() > 0.5) liquidBurst(500 + Math.random() * 500);
  }, 3200);

  /* ---------- Custom cursor ---------- */
  const cursor = $("#cursor");
  const label = $("#cursorLabel");
  if (matchMedia("(hover: hover)").matches) {
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    addEventListener("mousemove", (e) => { tx = e.clientX; ty = e.clientY; });
    const move = () => {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(move);
    };
    move();
    $$("[data-hover], a, button").forEach((el) => {
      el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
    });
    $$("[data-cursor]").forEach((el) => {
      el.addEventListener("mouseenter", () => { label.textContent = el.dataset.cursor; cursor.classList.add("is-label"); });
      el.addEventListener("mouseleave", () => cursor.classList.remove("is-label"));
    });
  }

  /* ---------- Mobile menu ---------- */
  $("#burger").addEventListener("click", () => document.body.classList.toggle("menu-open"));

  /* ---------- Nav: theme switch + hide on scroll down ---------- */
  const nav = $("#nav");
  const hero = $("#hero");
  const contact = $("#contact");
  let lastScroll = 0;
  const onScroll = () => {
    const y = window.scrollY;
    const heroEnd = hero.offsetHeight - 60;
    const inContact = y + 60 >= contact.offsetTop;
    nav.classList.toggle("is-dark", y > heroEnd && !inContact);
    nav.classList.toggle("is-hidden", y > lastScroll && y > heroEnd && !document.body.classList.contains("menu-open"));
    lastScroll = y;
    stackCards();
  };
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Reveal on scroll + counters ---------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-count]", en.target).forEach(countUp);
      io.unobserve(en.target);
    }),
    { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
  );
  $$(".reveal").forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    io.observe(el);
  });
  function countUp(el) {
    const end = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || "0", 10);
    const t0 = performance.now();
    const dur = 1600;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      el.textContent = (end * e).toFixed(dec);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ---------- WORK drips ---------- */
  const drips = $("#workDrips");
  const title = $("#workTitle");
  const buildDrips = () => {
    drips.innerHTML = "";
    const r = title.getBoundingClientRect();
    const pr = drips.getBoundingClientRect();
    const n = innerWidth < 700 ? 14 : 28;
    for (let i = 0; i < n; i++) {
      const d = document.createElement("span");
      const size = 4 + Math.random() * 12;
      d.className = "drip";
      d.style.width = d.style.height = size + "px";
      d.style.left = r.left - pr.left + r.width * (0.04 + Math.random() * 0.92) + "px";
      d.style.top = r.bottom - pr.top - r.height * (0.08 + Math.random() * 0.12) + "px";
      d.style.setProperty("--t", 2.4 + Math.random() * 3 + "s");
      d.style.setProperty("--dl", -Math.random() * 5 + "s");
      d.style.setProperty("--fall", 40 + Math.random() * 120 + "px");
      drips.appendChild(d);
    }
  };
  document.fonts.ready.then(buildDrips);
  addEventListener("resize", () => { clearTimeout(buildDrips.t); buildDrips.t = setTimeout(buildDrips, 200); });

  /* ---------- Stacked cards: scale down the ones underneath ---------- */
  const cards = $$(".card");
  function stackCards() {
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const top = card.getBoundingClientRect().top;
      const nTop = next.getBoundingClientRect().top;
      const k = Math.min(1, Math.max(0, 1 - (nTop - top) / innerHeight));
      card.style.transform = `scale(${1 - k * 0.06})`;
      card.style.filter = `brightness(${1 - k * 0.45})`;
    });
  }

  /* ---------- Fraud chart: scatter with anomaly threshold ---------- */
  const chart = $("#fraudChart");
  if (chart) {
    const rnd = (a, b) => a + Math.random() * (b - a);
    let svg = `<line class="thr" x1="10" x2="290" y1="58" y2="58"/><text class="lbl" x="12" y="50">COST-CALIBRATED THRESHOLD</text>`;
    for (let i = 0; i < 120; i++) {
      const x = rnd(14, 286), y = 120 + (Math.random() + Math.random() - 1) * 50;
      svg += `<circle class="pt" cx="${x.toFixed(1)}" cy="${Math.min(190, Math.max(70, y)).toFixed(1)}" r="2.4"/>`;
    }
    for (let i = 0; i < 7; i++) {
      svg += `<circle class="pt bad" cx="${rnd(20, 280).toFixed(1)}" cy="${rnd(14, 46).toFixed(1)}" r="4"><animate attributeName="r" values="3;5.5;3" dur="${rnd(1.2, 2.2).toFixed(1)}s" repeatCount="indefinite"/></circle>`;
    }
    chart.innerHTML = svg;
  }

  /* ---------- Typing effect in search card ---------- */
  const typeEl = $("#typeTarget");
  const queries = ["federated learning", "anomaly detection", "vision transformers", "LLM + RAG"];
  let qi = 0, ci = 0, del = false;
  const type = () => {
    const q = queries[qi];
    typeEl.textContent = q.slice(0, ci);
    if (!del && ci < q.length) ci++;
    else if (!del) { del = true; return setTimeout(type, 1400); }
    else if (ci > 0) ci--;
    else { del = false; qi = (qi + 1) % queries.length; }
    setTimeout(type, del ? 35 : 85);
  };
  type();

  onScroll();
})();
