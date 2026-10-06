/* CAR EXPRESS homepage: live stock, hero slider, finder, cards, panels. */
(function(){
  var C = window.CE || {};
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); };
  var money = function(n){ return "\u00A3" + Number(n||0).toLocaleString("en-GB"); };
  var wa = function(m){ return "https://wa.me/" + (C.whatsapp||"") + (m ? "?text=" + encodeURIComponent(m) : ""); };
  var title = function(c){ return [c.year,c.make,c.model].filter(Boolean).join(" "); };
  var full  = function(c){ return [c.year,c.make,c.model,c.variant].filter(Boolean).join(" "); };
  var $ = function(s){ return document.querySelector(s); };

  var state = { cars:[], body:"all", max:0, ceil:0 };

  /* ---- stock ---- */
  function load(){
    return fetch(C.supabaseUrl + "/rest/v1/public_stock?id=eq.stock&select=data",
      {headers:{apikey:C.supabaseKey, Authorization:"Bearer " + C.supabaseKey}, cache:"no-store"})
      .then(function(r){ return r.ok ? r.json() : []; })
      .then(function(rows){ var d = rows && rows[0] && rows[0].data; return Array.isArray(d) ? d : []; })
      .catch(function(){ return []; })
      .then(function(cars){
        if(cars.length) return cars;
        return fetch("stock.json",{cache:"no-store"}).then(function(r){ return r.ok ? r.json() : []; })
          .then(function(d){ return Array.isArray(d) ? d : (d.vehicles || []); }).catch(function(){ return []; });
      });
  }
  var avail = function(){ return state.cars.filter(function(c){ return c.status !== "sold"; }); };

  /* ---- split headline into animated words ---- */
  function splitHeadline(){
    var h = $(".hx-copy h1"); if(!h || h.getAttribute("data-split")) return;
    var words = h.textContent.trim().split(/\s+/);
    h.innerHTML = words.map(function(w,i){ return '<span class="w" style="--i:' + i + '">' + esc(w) + '</span>'; }).join(" ");
    h.setAttribute("data-split","1");
  }

  /* ---- hero visual: live cars when there are photos ---- */
  var hx = { i:0, timer:null, paused:reduce, n:0 };
  function buildSlides(){
    var withPhoto = avail().filter(function(c){ return c.photos && c.photos[0]; }).slice(0,5);
    var host = $("#hxFrame"); if(!host || !withPhoto.length) return;
    var slides = withPhoto.map(function(c,k){
      var miles = Number(String(c.mileage||"").replace(/[^0-9.]/g,""));
      var spec = [c.year, miles>0 ? miles.toLocaleString("en-GB")+" mi" : null, c.fuel, c.transmission, c.engine].filter(Boolean).join("  \u00B7  ");
      return '<div class="hx-slide' + (k===0?' is-active':'') + '" aria-label="' + (k+1) + ' of ' + withPhoto.length + '">' +
        '<div class="hx-img" style="background-image:url(\'' + esc(c.photos[0]) + '\')"></div>' +
        '<div class="hx-info"><div class="hx-price">' + money(c.price) + '</div><h3>' + esc(title(c)) + '</h3>' +
        '<p class="hx-spec">' + esc([c.variant, spec].filter(Boolean).join("  \u00B7  ")) + '</p>' +
        '<a class="cx-btn sm" href="car.html?id=' + encodeURIComponent(c.id) + '">View this car</a></div></div>';
    }).join("");
    host.innerHTML = slides;
    hx.n = withPhoto.length; hx.i = 0;
    var ctrl = $("#hxCtrl");
    ctrl.innerHTML = '<div class="hx-bars" role="tablist">' + withPhoto.map(function(c,k){
      return '<button class="hx-bar" role="tab" data-hx="go" data-i="' + k + '" aria-selected="' + (k===0) + '" aria-label="Car ' + (k+1) + '"></button>'; }).join("") + '</div>' +
      '<button class="hx-arrow" data-hx="prev" aria-label="Previous car"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button class="hx-arrow" data-hx="next" aria-label="Next car"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>';
    if(hx.n > 1) hxSchedule(); else ctrl.style.display = "none";
  }
  function hxGo(n){
    if(!hx.n) return;
    hx.i = (n + hx.n) % hx.n;
    document.querySelectorAll(".hx-slide").forEach(function(s,k){ s.classList.toggle("is-active", k === hx.i); });
    document.querySelectorAll(".hx-bar").forEach(function(b,k){
      b.setAttribute("aria-selected", k === hx.i ? "true" : "false");
      b.style.animation = "none"; void b.offsetWidth; b.style.animation = "";
    });
    hxSchedule();
  }
  function hxSchedule(){ clearTimeout(hx.timer); if(hx.paused) return; hx.timer = setTimeout(function(){ hxGo(hx.i + 1); }, 6500); }
  document.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("[data-hx]") : null; if(!b) return;
    var a = b.getAttribute("data-hx");
    if(a === "next") hxGo(hx.i + 1); else if(a === "prev") hxGo(hx.i - 1); else if(a === "go") hxGo(Number(b.getAttribute("data-i")) || 0);
  });
  document.addEventListener("visibilitychange", function(){ if(document.hidden) clearTimeout(hx.timer); else hxSchedule(); });
  var x0 = null;
  document.addEventListener("pointerdown", function(e){ var v = $("#hxVisual"); if(e.pointerType !== "mouse" && v && v.contains(e.target)) x0 = e.clientX; });
  document.addEventListener("pointerup", function(e){ if(x0 === null) return; var dx = e.clientX - x0; x0 = null; if(Math.abs(dx) > 50) hxGo(hx.i + (dx < 0 ? 1 : -1)); });

  /* 3D tilt that follows the pointer */
  function tilt(){
    var v = $("#hxVisual"), f = $("#hxFrame"); if(!v || !f || reduce) return;
    v.addEventListener("pointermove", function(e){
      if(e.pointerType !== "mouse") return;
      var r = v.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      f.style.transform = "rotateY(" + (x * 9) + "deg) rotateX(" + (-y * 7) + "deg)";
    });
    v.addEventListener("pointerleave", function(){ f.style.transform = ""; });
  }

  /* ---- finder + cards ---- */
  function bodies(){
    var set = {}; avail().forEach(function(c){ if(c.body) set[c.body] = 1; });
    return Object.keys(set).sort();
  }
  function buildFinder(){
    var cars = avail();
    var chips = $("#hxChips"); if(!chips) return;
    chips.innerHTML = ['all'].concat(bodies()).map(function(b){
      return '<button class="hx-chip" data-body="' + esc(b) + '" aria-pressed="' + (b === state.body) + '">' + (b === "all" ? "All cars" : esc(b)) + '</button>'; }).join("");
    var top = cars.reduce(function(m,c){ return Math.max(m, Number(c.price)||0); }, 0);
    state.ceil = top ? Math.ceil(top / 1000) * 1000 : 0;
    var r = $("#hxPrice");
    if(state.ceil){
      r.min = 1000; r.max = state.ceil; r.step = 500; r.value = state.ceil; state.max = 0;
      r.disabled = false;
    } else { r.disabled = true; $("#hxPriceOut").textContent = "Any"; }
  }
  function matches(){
    return avail().filter(function(c){
      return (state.body === "all" || c.body === state.body) && (!state.max || Number(c.price) <= state.max);
    });
  }
  var lastCount = -1;
  function render(){
    var list = matches(), all = avail(), grid = $("#carsGrid");
    var cnt = $("#hxCount"); if(cnt){ cnt.textContent = list.length; }
    var meta = $("#carsMeta");
    if(!all.length){
      grid.innerHTML = '<div class="cars-empty"><h3>Our latest stock is on its way online</h3><p>Cars are arriving and being prepared right now. Message us and we\u2019ll tell you what\u2019s coming in this week.</p>' +
        '<a class="cx-btn" target="_blank" rel="noopener" href="' + wa("Hi, what stock do you have available at the moment?") + '">Ask what\u2019s available</a></div>';
      if(meta) meta.innerHTML = "";
      return;
    }
    if(meta) meta.innerHTML = 'Showing <b>' + Math.min(list.length, 6) + '</b> of <b>' + list.length + '</b> matching ' + (list.length === 1 ? 'car' : 'cars') +
      (list.length > 6 ? ' &middot; <a class="link" href="stock.html" style="color:#fff;border-bottom:2px solid var(--cx-red)">See all</a>' : '');
    if(!list.length){
      grid.innerHTML = '<div class="cars-empty"><h3>Nothing matches that yet</h3><p>Try a different body type or a higher price, or tell us what you want and we\u2019ll look out for it.</p>' +
        '<a class="cx-btn" target="_blank" rel="noopener" href="' + wa("Hi, I'm looking for a car. Can you let me know what's coming in?") + '">Message us</a></div>';
      return;
    }
    grid.innerHTML = list.slice(0,6).map(card).join("");
  }
  function card(c,i){
    var img = (c.photos && c.photos[0]) ? esc(c.photos[0]) : "car-01.jpg";
    var miles = Number(String(c.mileage||"").replace(/[^0-9.]/g,""));
    var specs = [c.year, (miles>0 && isFinite(miles)) ? miles.toLocaleString("en-GB")+" mi" : null, c.fuel, c.transmission, c.engine]
      .filter(function(x){ return x !== null && x !== undefined && String(x).trim() !== ""; });
    var msg = "Hi, I'm interested in the " + full(c) + " (" + money(c.price) + "). Is it still available?";
    var url = "car.html?id=" + encodeURIComponent(c.id);
    return '<article class="cx-card" style="--i:' + i + '"><a class="pic" href="' + url + '">' +
      '<span class="tag">' + money(c.price) + '</span>' +
      '<img src="' + img + '" alt="' + esc(full(c)) + '" loading="lazy"></a>' +
      '<div class="body">' + (c.body ? '<div class="kind">' + esc(c.body) + '</div>' : '') +
      '<h3>' + esc(title(c)) + '</h3>' + (c.variant ? '<div class="var">' + esc(c.variant) + '</div>' : '') +
      '<ul class="specs">' + specs.map(function(s){ return '<li>' + esc(s) + '</li>'; }).join("") + '</ul>' +
      '<div class="acts"><a class="cx-btn sm" target="_blank" rel="noopener" href="' + wa(msg) + '">Enquire</a>' +
      '<a class="cx-btn sm ghost" href="' + url + '">Details</a></div></div></article>';
  }
  document.addEventListener("click", function(e){
    var ch = e.target.closest ? e.target.closest(".hx-chip") : null;
    if(ch){ state.body = ch.getAttribute("data-body");
      document.querySelectorAll(".hx-chip").forEach(function(x){ x.setAttribute("aria-pressed", x === ch ? "true" : "false"); });
      render(); return; }
    var p = e.target.closest ? e.target.closest(".panel") : null;
    if(p){ document.querySelectorAll(".panel").forEach(function(x){ x.classList.toggle("is-open", x === p); }); }
  });
  document.addEventListener("input", function(e){
    if(e.target.id !== "hxPrice") return;
    var v = Number(e.target.value);
    state.max = (v >= state.ceil) ? 0 : v;
    $("#hxPriceOut").textContent = state.max ? "Up to " + money(state.max) : "Any price";
    render();
  });
  document.addEventListener("keydown", function(e){
    var p = e.target.closest ? e.target.closest(".panel") : null;
    if(p && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); p.click(); }
  });

  /* ---- boot ---- */
  splitHeadline(); tilt();
  var wrapAll = $("#carsGrid");
  load().then(function(cars){
    state.cars = cars;
    var n = avail().length;
    buildSlides(); buildFinder(); render();
    var sc = $("#statCars");
    if(sc){
      if(n > 0){ var seen = new IntersectionObserver(function(es){ if(es[0].isIntersecting){ window.CEcount(sc, n); seen.disconnect(); } }); seen.observe(sc); }
      else { var box = sc.closest(".stat"); if(box) box.style.display = "none"; }
    }
  });
})();
