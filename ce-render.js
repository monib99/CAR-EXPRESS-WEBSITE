/* CAR EXPRESS: builds the homepage (and any extra pages) from what you publish in the
   portal's Website tab, in the order you set. Falls back to a sensible default. */
(function(){
  var C = window.CE || {};
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var esc = function(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); };
  var money = function(n){ return "\u00A3" + Number(n||0).toLocaleString("en-GB"); };
  var $ = function(s,r){ return (r||document).querySelector(s); };
  var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  var title = function(c){ return [c.year,c.make,c.model].filter(Boolean).join(" "); };
  var full  = function(c){ return [c.year,c.make,c.model,c.variant].filter(Boolean).join(" "); };

  var S = { site:null, cars:[], st:{} };
  var main = document.getElementById("cxMain");
  if(!main) return;
  var params = new URLSearchParams(location.search);
  var slug = main.getAttribute("data-page") || params.get("p") || "home";

  /* ---------- data ---------- */
  function hdr(){ return {headers:{apikey:C.supabaseKey, Authorization:"Bearer " + C.supabaseKey}, cache:"no-store"}; }
  function loadSite(){
    return fetch(C.supabaseUrl + "/rest/v1/public_site?id=eq.site&select=data", hdr())
      .then(function(r){ return r.ok ? r.json() : []; })
      .then(function(rows){ var d = rows && rows[0] && rows[0].data; return d && d.pages ? d : null; })
      .catch(function(){ return null; });
  }
  function loadStock(){
    return fetch(C.supabaseUrl + "/rest/v1/public_stock?id=eq.stock&select=data", hdr())
      .then(function(r){ return r.ok ? r.json() : []; })
      .then(function(rows){ var d = rows && rows[0] && rows[0].data; return Array.isArray(d) ? d : []; })
      .catch(function(){ return []; })
      .then(function(cars){
        if(cars.length) return cars;
        return fetch("stock.json",{cache:"no-store"}).then(function(r){ return r.ok ? r.json() : []; })
          .then(function(d){ return Array.isArray(d) ? d : (d.vehicles || []); }).catch(function(){ return []; });
      });
  }
  var avail = function(){ return S.cars.filter(function(c){ return c.status !== "sold"; }); };

  /* ---------- settings and links ---------- */
  function cfg(){
    var st = (S.site && S.site.settings) || {};
    return {
      phone: st.phone || C.phone || "", whatsapp: (st.whatsapp || C.whatsapp || "").replace(/\D/g,""), email: st.email || C.email || "",
      address: (st.address && st.address.length) ? st.address : (C.address || []),
      hours: st.hours ? esc(st.hours) : (C.hours || ""), maps: st.mapsQuery || C.mapsQuery || ""
    };
  }
  var wa = function(m){ return "https://wa.me/" + cfg().whatsapp + (m ? "?text=" + encodeURIComponent(m) : ""); };
  var KNOWN = {home:"index.html", stock:"stock.html", about:"about.html", contact:"contact.html", faq:"faq.html", view360:"view360.html"};
  function pageHref(id){
    if(!id) return "stock.html";
    var p = S.site && S.site.pages.filter(function(x){ return x.id === id; })[0];
    var sl = p ? (p.slug || p.id) : id;
    return KNOWN[sl] || KNOWN[id] || ("page.html?p=" + encodeURIComponent(sl));
  }

  /* ---------- icons ---------- */
  var ICONS = [
    '<path d="M32 6l20 8v16c0 14-9 24-20 28C21 54 12 44 12 30V14z"/><path d="M22 32l8 8 14-16"/>',
    '<path d="M10 22h40M42 12l10 10-10 10"/><path d="M54 42H14M22 32L12 42l10 10"/>',
    '<path d="M6 40V16h32v24M38 26h12l8 10v4H38"/><circle cx="18" cy="44" r="5"/><circle cx="48" cy="44" r="5"/>',
    '<path d="M32 8l7 15 16 2-12 11 3 16-14-8-14 8 3-16L9 25l16-2z"/>',
    '<path d="M44 8a12 12 0 0 0-11 16L10 47l7 7 23-23a12 12 0 0 0 16-11l-8 8-6-2-2-6z"/>',
    '<circle cx="24" cy="32" r="10"/><path d="M34 32h22M48 32v10M56 32v8"/>'
  ];
  var ico = function(i){ return '<svg class="ico" viewBox="0 0 64 64" aria-hidden="true">' + ICONS[i % ICONS.length] + '</svg>'; };

  /* ---------- default home (used until you publish) ---------- */
  function defaultSections(){
    return [
      {type:"hero", slides:[{heading:"Every car ready before it\u2019s advertised", sub:"Quality used cars in Hemel Hempstead. Small economical cars, family cars and SUVs, fully prepared before they reach the forecourt.", buttonText:"View our cars", buttonPage:"stock"}]},
      {type:"cars", title:"In stock now", limit:6, showAll:true},
      {type:"features", title:"Why buy from Car Express", items:[
        {title:"Prepared before it\u2019s advertised", text:"Every car is serviced, MOT\u2019d and HPI checked before sale."},
        {title:"Part exchange welcome", text:"Thinking of trading in? Message us about your current car."},
        {title:"Free delivery within 50 miles", text:"From Hemel Hempstead. Further away? Get in touch and ask."}]},
      {type:"cta", title:"Looking for something specific?", text:"Tell us what you\u2019re after and we\u2019ll look out for it. New stock arrives most weeks.", buttonText:"Message us on WhatsApp", whatsapp:true}
    ];
  }

  /* ---------- section renderers (return HTML) ---------- */
  function hero(s){
    var slides = (s.slides && s.slides.length) ? s.slides : defaultSections()[0].slides;
    var layers = slides.map(function(sl,i){
      var inner = sl.videoUrl && !/youtu/.test(sl.videoUrl) ? '<video class="hx-photo" src="' + esc(sl.videoUrl) + '" autoplay muted loop playsinline></video>'
                : sl.photo ? '<div class="hx-photo" style="background-image:url(\'' + esc(sl.photo) + '\')"></div>' : '';
      return '<div class="hx-layer' + (i===0?' is-active':'') + '">' + inner + (inner ? '<div class="hx-photo-tint"></div>' : '') + '</div>';
    }).join("");
    var copy = slides.map(function(sl,i){
      var words = String(sl.heading||"").trim().split(/\s+/).map(function(w,k){ return '<span class="w" style="--i:' + k + '">' + esc(w) + '</span>'; }).join(" ");
      var btn = sl.buttonText ? '<a class="cx-btn" href="' + pageHref(sl.buttonPage) + '">' + esc(sl.buttonText) + '</a>' : '';
      return '<div class="hx-s' + (i===0?' is-active':'') + '"><h1>' + words + '</h1>' +
        (sl.sub ? '<p class="hx-sub">' + esc(sl.sub) + '</p>' : '') + (btn ? '<div class="cx-actions">' + btn + '</div>' : '') + '</div>';
    }).join("");
    var ticks = slides.length > 1 ? '<div class="hx-ticks wrapx" role="tablist">' + slides.map(function(sl,i){
      return '<button class="hx-tick" role="tab" data-hs="go" data-i="' + i + '" aria-selected="' + (i===0) + '" aria-label="Slide ' + (i+1) + '"></button>'; }).join("") +
      '<button class="hx-arrow" data-hs="prev" aria-label="Previous slide"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
      '<button class="hx-arrow" data-hs="next" aria-label="Next slide"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button></div>' : '';
    return '<section class="hx" data-sec="hero"><div class="hx-bg"></div><div class="hx-road"></div><div class="hx-layers">' + layers + '</div>' +
      '<div class="cx-wrap hx-grid"><div class="hx-copy">' + copy + '</div>' +
      '<div class="hx-visual" id="hxVisual"><div class="hx-frame" id="hxFrame"><div class="hx-fallback"><i class="hx-streak"></i><i class="hx-streak"></i><i class="hx-streak"></i>' +
      '<img class="hx-logo" src="logo-silver.png" alt="Car Express" width="820" height="232"></div></div><div class="hx-ctrl" id="hxCtrl"></div></div></div>' +
      ticks + '<div class="hx-scroll" aria-hidden="true"></div></section>' + MARQUEE;
  }
  var MQ_ITEMS = ["Serviced","MOT\u2019d","HPI checked","Part exchange welcome","Free delivery within 50 miles","Quality used cars in Hemel Hempstead"];
  var MARQUEE = '<div class="mq" aria-hidden="true"><div class="mq-track">' + [1,2,3,4].map(function(){ return MQ_ITEMS.map(function(t){ return '<span>' + esc(t) + '</span>'; }).join(""); }).join("") + '</div></div>';

  function cars(s){
    return '<section class="sx cars-sec" data-sec="cars"><div class="cx-wrap">' +
      '<div class="sx-head" data-reveal><div><h2>' + esc(s.title || "In stock now") + '</h2><p><b class="cars-total">0</b> cars in stock right now</p></div>' +
      (s.showAll !== false ? '<a class="cx-btn" href="stock.html">View all cars</a>' : '') + '</div>' +
      '<div class="finder-bar" data-reveal><div class="hx-chips"></div><div class="hx-range"><span>Price</span><input type="range" class="f-price" min="1000" max="10000" step="500" value="10000" disabled aria-label="Maximum price"><output class="f-out">Any price</output></div></div>' +
      '<div class="cars-meta"></div><div class="cars-grid"></div></div></section>';
  }
  function text(s){
    var paras = String(s.body||"").split(/\n\s*\n/).filter(Boolean).map(function(p){ return '<p>' + esc(p).replace(/\n/g,"<br>") + '</p>'; }).join("");
    return '<section class="sx" data-sec="text"><div class="cx-wrap"><div class="txt2" data-reveal>' +
      (s.title ? '<h2>' + esc(s.title) + '</h2>' : '') + paras + '</div></div></section>';
  }
  function features(s){
    var items = s.items || [];
    return '<section class="sx why2" data-sec="features"><div class="cx-wrap">' +
      (s.title ? '<div class="sx-head" data-reveal><h2>' + esc(s.title) + '</h2></div>' : '') +
      '<div class="panels" data-reveal>' + items.map(function(it,i){
        return '<div class="panel' + (i===0?' is-open':'') + '" tabindex="0" role="button" aria-label="' + esc(it.title||'') + '">' + ico(i) +
          '<h3>' + esc(it.title||"") + '</h3><p>' + esc(it.text||"") + '</p></div>'; }).join("") + '</div></div></section>';
  }
  function steps(s){
    var items = s.items || [];
    return '<section class="sx" data-sec="steps"><div class="cx-wrap">' +
      (s.title ? '<div class="sx-head" data-reveal><h2>' + esc(s.title) + '</h2></div>' : '') +
      '<div class="steps2">' + items.map(function(it,i){
        return '<div class="step2" data-reveal style="--d:' + (i*.1) + 's"><span class="n">' + (i+1) + '</span><h3>' + esc(it.title||"") + '</h3><p>' + esc(it.text||"") + '</p></div>'; }).join("") + '</div></div></section>';
  }
  function gallery(s){
    var ph = s.photos || [];
    if(!ph.length) return "";
    return '<section class="sx" data-sec="gallery"><div class="cx-wrap">' +
      (s.title ? '<div class="sx-head" data-reveal><h2>' + esc(s.title) + '</h2></div>' : '') +
      '<div class="gal2">' + ph.map(function(u,i){
        return '<button class="g" data-lb="' + i + '" data-reveal style="--d:' + ((i%6)*.06) + 's" aria-label="Open photo ' + (i+1) + '"><img src="' + esc(u) + '" alt="" loading="lazy"></button>'; }).join("") + '</div></div></section>';
  }
  function video(s){
    var u = s.videoUrl || "";
    if(!u) return "";
    var yt = (u.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/) || [])[1];
    var el = yt ? '<iframe src="https://www.youtube.com/embed/' + yt + '" title="Video" allowfullscreen loading="lazy"></iframe>'
                : '<video src="' + esc(u) + '" controls playsinline></video>';
    return '<section class="sx" data-sec="video"><div class="cx-wrap">' + (s.title ? '<div class="sx-head" data-reveal><h2>' + esc(s.title) + '</h2></div>' : '') +
      '<div class="vid2" data-reveal>' + el + '</div></div></section>';
  }
  function reviews(s){
    var items = s.items || [];
    if(!items.length) return "";
    return '<section class="sx why2" data-sec="reviews"><div class="cx-wrap">' + (s.title ? '<div class="sx-head" data-reveal><h2>' + esc(s.title) + '</h2></div>' : '') +
      '<div class="rev2">' + items.map(function(it,i){
        return '<figure data-reveal style="--d:' + (i*.08) + 's"><div class="stars" aria-label="' + Number(it.stars||5) + ' stars">' + "\u2605".repeat(Number(it.stars||5)) + '</div><blockquote>' + esc(it.text||"") + '</blockquote><figcaption>' + esc(it.title||"") + '</figcaption></figure>'; }).join("") + '</div></div></section>';
  }
  function contact(s){
    var c = cfg(), tel = c.phone.replace(/[^\d+]/g,"");
    var box = function(svg,h,body){ return '<div class="ct-box" data-reveal><svg viewBox="0 0 24 24" aria-hidden="true">' + svg + '</svg><h3>' + h + '</h3>' + body + '</div>'; };
    var q = encodeURIComponent(c.maps || (c.address||[]).join(", "));
    return '<section class="sx" data-sec="contact"><div class="cx-wrap">' + '<div class="sx-head" data-reveal><h2>' + esc(s.title || "Get in touch") + '</h2></div>' +
      '<div class="ct-grid">' +
      (c.phone ? box('<path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/>','Call','<p><a href="tel:' + tel + '">' + esc(c.phone) + '</a></p>') : '') +
      (c.whatsapp ? box('<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2z"/>','WhatsApp','<p><a class="cx-btn sm" target="_blank" rel="noopener" href="' + wa("Hi, I'd like to ask about a car.") + '">Message us</a></p>') : '') +
      (c.address.length ? box('<path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7z"/>','Visit','<p>' + c.address.map(esc).join("<br>") + '</p>') : '') +
      (c.email ? box('<path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>','Email','<p><a href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a></p>') : '') +
      (c.hours ? box('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2" fill="none" stroke="#e10600" stroke-width="2"/>','Opening hours','<p>' + c.hours + '</p>') : '') +
      '</div>' + (q ? '<div class="map2" data-reveal><iframe title="Map" loading="lazy" src="https://maps.google.com/maps?q=' + q + '&amp;output=embed"></iframe></div>' : '') +
      '</div></section>';
  }
  function cta(s){
    var href = s.whatsapp ? wa("Hi, I'm looking for a car. Can you let me know what's coming in?") : pageHref(s.buttonPage);
    return '<section class="cta2" data-sec="cta"><div class="cx-wrap" data-reveal><h2>' + esc(s.title || "") + '</h2>' + (s.text ? '<p>' + esc(s.text) + '</p>' : '') +
      (s.buttonText ? '<a class="cx-btn" ' + (s.whatsapp ? 'target="_blank" rel="noopener" ' : '') + 'href="' + href + '">' + esc(s.buttonText) + '</a>' : '') + '</div></section>';
  }
  var RENDER = {hero:hero, cars:cars, text:text, features:features, steps:steps, gallery:gallery, video:video, reviews:reviews, contact:contact, cta:cta};

  /* ---------- behaviour ---------- */
  var hs = { i:0, n:0, timer:null };
  function heroSlides(){
    var root = $('[data-sec="hero"]'); if(!root) return;
    hs.n = $$(".hx-s", root).length; hs.i = 0;
    if(hs.n < 2) return;
    schedule();
  }
  function hsGo(n){
    var root = $('[data-sec="hero"]'); if(!root) return;
    hs.i = (n + hs.n) % hs.n;
    $$(".hx-s", root).forEach(function(e,k){ e.classList.toggle("is-active", k === hs.i); });
    $$(".hx-layer", root).forEach(function(e,k){ e.classList.toggle("is-active", k === hs.i); });
    $$(".hx-tick", root).forEach(function(b,k){
      b.setAttribute("aria-selected", k === hs.i ? "true" : "false");
      b.style.animation = "none"; void b.offsetWidth; b.style.animation = "";
    });
    schedule();
  }
  function schedule(){ clearTimeout(hs.timer); if(reduce || hs.n < 2) return; hs.timer = setTimeout(function(){ hsGo(hs.i + 1); }, 7000); }

  /* live cars in the hero visual */
  var hx = { i:0, n:0, timer:null };
  function buildCarSlider(){
    var host = $("#hxFrame"); if(!host) return;
    var withPhoto = avail().filter(function(c){ return c.photos && c.photos[0]; }).slice(0,5);
    if(!withPhoto.length) return;
    host.innerHTML = withPhoto.map(function(c,k){
      var miles = Number(String(c.mileage||"").replace(/[^0-9.]/g,""));
      var spec = [c.variant, c.year, miles>0 ? miles.toLocaleString("en-GB")+" mi" : null, c.fuel, c.transmission].filter(Boolean).join("  \u00B7  ");
      return '<div class="hx-slide' + (k===0?' is-active':'') + '"><div class="hx-img" style="background-image:url(\'' + esc(c.photos[0]) + '\')"></div>' +
        '<div class="hx-info"><div class="hx-price">' + money(c.price) + '</div><h3>' + esc(title(c)) + '</h3><p class="hx-spec">' + esc(spec) + '</p>' +
        '<a class="cx-btn sm" href="car.html?id=' + encodeURIComponent(c.id) + '">View this car</a></div></div>';
    }).join("");
    hx.n = withPhoto.length; hx.i = 0;
    var ctrl = $("#hxCtrl");
    if(hx.n > 1){
      ctrl.innerHTML = '<div class="hx-bars" role="tablist">' + withPhoto.map(function(c,k){
        return '<button class="hx-bar" role="tab" data-hx="go" data-i="' + k + '" aria-selected="' + (k===0) + '" aria-label="Car ' + (k+1) + '"></button>'; }).join("") + '</div>' +
        '<button class="hx-arrow" data-hx="prev" aria-label="Previous car"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>' +
        '<button class="hx-arrow" data-hx="next" aria-label="Next car"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>';
      hxSchedule();
    }
  }
  function hxGo(n){
    if(!hx.n) return; hx.i = (n + hx.n) % hx.n;
    $$(".hx-slide").forEach(function(s,k){ s.classList.toggle("is-active", k === hx.i); });
    $$(".hx-bar").forEach(function(b,k){ b.setAttribute("aria-selected", k === hx.i ? "true" : "false"); b.style.animation = "none"; void b.offsetWidth; b.style.animation = ""; });
    hxSchedule();
  }
  function hxSchedule(){ clearTimeout(hx.timer); if(reduce) return; hx.timer = setTimeout(function(){ hxGo(hx.i + 1); }, 6500); }
  function tilt(){
    var v = $("#hxVisual"), f = $("#hxFrame"); if(!v || !f || reduce) return;
    v.addEventListener("pointermove", function(e){
      if(e.pointerType !== "mouse") return;
      var r = v.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      f.style.transform = "rotateY(" + (x*9) + "deg) rotateX(" + (-y*7) + "deg)";
    });
    v.addEventListener("pointerleave", function(){ f.style.transform = ""; });
  }

  /* cars section: finder and cards */
  function card(c,i){
    var img = (c.photos && c.photos[0]) ? esc(c.photos[0]) : "car-01.jpg";
    var miles = Number(String(c.mileage||"").replace(/[^0-9.]/g,""));
    var specs = [c.year, (miles>0 && isFinite(miles)) ? miles.toLocaleString("en-GB")+" mi" : null, c.fuel, c.transmission, c.engine]
      .filter(function(x){ return x !== null && x !== undefined && String(x).trim() !== ""; });
    var msg = "Hi, I'm interested in the " + full(c) + " (" + money(c.price) + "). Is it still available?";
    var url = "car.html?id=" + encodeURIComponent(c.id);
    return '<article class="cx-card" style="--i:' + i + '"><a class="pic" href="' + url + '"><span class="tag">' + money(c.price) + '</span>' +
      '<img src="' + img + '" alt="' + esc(full(c)) + '" loading="lazy"></a><div class="body">' +
      (c.body ? '<div class="kind">' + esc(c.body) + '</div>' : '') + '<h3>' + esc(title(c)) + '</h3>' + (c.variant ? '<div class="var">' + esc(c.variant) + '</div>' : '') +
      '<ul class="specs">' + specs.map(function(s){ return '<li>' + esc(s) + '</li>'; }).join("") + '</ul>' +
      '<div class="acts"><a class="cx-btn sm" target="_blank" rel="noopener" href="' + wa(msg) + '">Enquire</a><a class="cx-btn sm ghost" href="' + url + '">Details</a></div></div></article>';
  }
  function initCars(sec, s){
    var all = avail(), st = {body:"all", max:0, ceil:0};
    var limit = s.showAll === false ? 0 : (Number(s.limit) || 6);
    var grid = $(".cars-grid", sec), meta = $(".cars-meta", sec), chipsEl = $(".hx-chips", sec), range = $(".f-price", sec), out = $(".f-out", sec), bar = $(".finder-bar", sec);
    var tot = $(".cars-total", sec);
    if(tot){ if(all.length){ window.CEcount && window.CEcount(tot, all.length); } else { tot.parentNode.style.display = "none"; } }
    var bodies = {}; all.forEach(function(c){ if(c.body) bodies[c.body] = 1; });
    var keys = Object.keys(bodies).sort();
    if(!all.length || (keys.length < 2 && !all.some(function(c){ return Number(c.price) > 0; }))) bar.style.display = "none";
    chipsEl.innerHTML = ["all"].concat(keys).map(function(b){ return '<button class="hx-chip" data-body="' + esc(b) + '" aria-pressed="' + (b==="all") + '">' + (b==="all" ? "All cars" : esc(b)) + '</button>'; }).join("");
    if(keys.length < 2) chipsEl.style.display = "none";
    var top = all.reduce(function(m,c){ return Math.max(m, Number(c.price)||0); }, 0);
    st.ceil = top ? Math.ceil(top/1000)*1000 : 0;
    if(st.ceil){ range.min = 1000; range.max = st.ceil; range.value = st.ceil; range.disabled = false; } else bar.style.display = "none";
    function draw(){
      var list = all.filter(function(c){ return (st.body === "all" || c.body === st.body) && (!st.max || Number(c.price) <= st.max); });
      if(!all.length){
        grid.innerHTML = '<div class="cars-empty"><h3>Our latest stock is on its way online</h3><p>Cars are arriving and being prepared right now. Message us and we\u2019ll tell you what\u2019s coming in this week.</p><a class="cx-btn" target="_blank" rel="noopener" href="' + wa("Hi, what stock do you have available at the moment?") + '">Ask what\u2019s available</a></div>';
        meta.innerHTML = ""; return;
      }
      var shown = limit ? list.slice(0, limit) : list;
      meta.innerHTML = 'Showing <b>' + shown.length + '</b> of <b>' + list.length + '</b> matching ' + (list.length === 1 ? 'car' : 'cars');
      grid.innerHTML = shown.length ? shown.map(card).join("") :
        '<div class="cars-empty"><h3>Nothing matches that yet</h3><p>Try a different type or a higher price, or tell us what you want and we\u2019ll look out for it.</p><a class="cx-btn" target="_blank" rel="noopener" href="' + wa("Hi, I'm looking for a car. Can you let me know what's coming in?") + '">Message us</a></div>';
    }
    sec.addEventListener("click", function(e){
      var ch = e.target.closest(".hx-chip"); if(!ch) return;
      st.body = ch.getAttribute("data-body");
      $$(".hx-chip", sec).forEach(function(x){ x.setAttribute("aria-pressed", x === ch ? "true" : "false"); }); draw();
    });
    range.addEventListener("input", function(){
      var v = Number(range.value); st.max = v >= st.ceil ? 0 : v;
      out.textContent = st.max ? "Up to " + money(st.max) : "Any price"; draw();
    });
    draw();
  }

  /* gallery lightbox */
  var lbPhotos = [], lbIndex = 0;
  function lbOpen(i, photos){
    lbPhotos = photos; lbIndex = i;
    var o = document.getElementById("cxLb");
    if(!o){ o = document.createElement("div"); o.id = "cxLb"; o.className = "lb"; o.innerHTML = '<button class="x" aria-label="Close">\u2715</button><button class="p" aria-label="Previous">\u2039</button><img alt=""><button class="n" aria-label="Next">\u203A</button>'; document.body.appendChild(o); }
    o.querySelector("img").src = photos[i]; o.classList.add("on");
  }
  document.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("[data-hs],[data-hx],.panel,[data-lb],#cxLb") : null; if(!b) return;
    if(b.hasAttribute("data-hs")){ var a = b.getAttribute("data-hs"); if(a==="next") hsGo(hs.i+1); else if(a==="prev") hsGo(hs.i-1); else hsGo(Number(b.getAttribute("data-i"))||0); return; }
    if(b.hasAttribute("data-hx")){ var h = b.getAttribute("data-hx"); if(h==="next") hxGo(hx.i+1); else if(h==="prev") hxGo(hx.i-1); else hxGo(Number(b.getAttribute("data-i"))||0); return; }
    if(b.classList.contains("panel")){ var wrap = b.parentNode; $$(".panel", wrap).forEach(function(x){ x.classList.toggle("is-open", x === b); }); return; }
    if(b.hasAttribute("data-lb")){ var imgs = $$(".gal2 .g img", b.closest(".gal2")).map(function(im){ return im.src; }); lbOpen(Number(b.getAttribute("data-lb")), imgs); return; }
    if(b.id === "cxLb"){
      var t = e.target;
      if(t.classList.contains("p")) lbOpen((lbIndex - 1 + lbPhotos.length) % lbPhotos.length, lbPhotos);
      else if(t.classList.contains("n")) lbOpen((lbIndex + 1) % lbPhotos.length, lbPhotos);
      else b.classList.remove("on");
    }
  });
  document.addEventListener("keydown", function(e){
    var lb = document.getElementById("cxLb");
    if(lb && lb.classList.contains("on")){
      if(e.key === "Escape") lb.classList.remove("on");
      if(e.key === "ArrowRight") lbOpen((lbIndex + 1) % lbPhotos.length, lbPhotos);
      if(e.key === "ArrowLeft") lbOpen((lbIndex - 1 + lbPhotos.length) % lbPhotos.length, lbPhotos);
      return;
    }
    var p = e.target.closest ? e.target.closest(".panel") : null;
    if(p && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); p.click(); }
  });
  var x0 = null;
  document.addEventListener("pointerdown", function(e){ var v = $('[data-sec="hero"]'); if(e.pointerType !== "mouse" && v && v.contains(e.target) && !e.target.closest("#hxVisual")) x0 = e.clientX; });
  document.addEventListener("pointerup", function(e){ if(x0 === null) return; var dx = e.clientX - x0; x0 = null; if(Math.abs(dx) > 60) hsGo(hs.i + (dx < 0 ? 1 : -1)); });
  document.addEventListener("visibilitychange", function(){ if(document.hidden){ clearTimeout(hs.timer); clearTimeout(hx.timer); } else { schedule(); hxSchedule(); } });

  /* ---------- build the page ---------- */
  function build(){
    var site = S.site, sections, pageName = "";
    if(site){
      var pg = site.pages.filter(function(p){ return (p.slug || p.id) === slug || p.id === slug; })[0];
      if(!pg && slug === "home") pg = site.pages[0];
      if(pg){ sections = (pg.sections || []).filter(function(s){ return s.visible !== false; }); pageName = pg.name || ""; }
    }
    if(!sections){
      if(slug !== "home"){ main.innerHTML = '<section class="sx"><div class="cx-wrap"><div class="txt2"><h2>Page not found</h2><p>We couldn\u2019t find that page. <a href="index.html">Go to the homepage</a>.</p></div></div></section>'; return; }
      sections = defaultSections();
    }
    var html = "", hasHero = false;
    sections.forEach(function(s){ if(s.type === "hero") hasHero = true; });
    if(slug !== "home" && !hasHero && pageName) html += '<section class="pg-title"><div class="cx-wrap"><h1>' + esc(pageName) + '</h1></div></section>';
    sections.forEach(function(s,i){ var f = RENDER[s.type]; if(f) html += f(s).replace('data-sec="' + s.type + '"', 'data-sec="' + s.type + '" data-i="' + i + '"'); });
    main.innerHTML = html;
    if(pageName) document.title = pageName + " | Car Express";
    $$('[data-sec="cars"]').forEach(function(sec){ initCars(sec, sections[Number(sec.getAttribute("data-i"))] || {}); });
    heroSlides(); buildCarSlider(); tilt();
    if(window.CEwatch) window.CEwatch();
    /* reveal anything already on screen */
    setTimeout(function(){ if(window.CEwatch) window.CEwatch(); }, 60);
  }

  /* ---------- boot ---------- */
  var done = false;
  function go(){ if(done) return; done = true; build(); }
  var t = setTimeout(function(){ Promise.all([loadStock()]).then(function(r){ S.cars = r[0]; go(); }); }, 2200);
  Promise.all([loadSite(), loadStock()]).then(function(r){ clearTimeout(t); S.site = r[0]; S.cars = r[1]; if(!done) go(); });
})();
