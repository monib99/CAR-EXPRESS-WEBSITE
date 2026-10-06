/* CAR EXPRESS: a single car page (car.html?id=...) and the 360 page (view360.html). */
(function(){
  var C = window.CE || {};
  var esc = function(s){ return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];}); };
  var money = function(n){ return "\u00A3" + Number(n||0).toLocaleString("en-GB"); };
  var $ = function(s,r){ return (r||document).querySelector(s); };
  var $$ = function(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
  var title = function(c){ return [c.year,c.make,c.model].filter(Boolean).join(" "); };
  var full  = function(c){ return [c.year,c.make,c.model,c.variant].filter(Boolean).join(" "); };
  var wa = function(m){ return "https://wa.me/" + (C.whatsapp||"") + (m ? "?text=" + encodeURIComponent(m) : ""); };
  var main = document.getElementById("cpMain");
  if(!main) return;
  var mode = main.getAttribute("data-mode") || "car";
  var id = new URLSearchParams(location.search).get("id");

  function hdr(){ return {headers:{apikey:C.supabaseKey, Authorization:"Bearer " + C.supabaseKey}, cache:"no-store"}; }
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
  var has360 = function(c){ return (c.spin && c.spin.length >= 4) || !!c.spinEmbed; };
  function ytId(u){ return ((String(u||"").match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/)||[])[1]) || ""; }

  /* ---------- cards (used for similar cars and the 360 list) ---------- */
  function card(c,i,href){
    var img = (c.photos && c.photos[0]) ? esc(c.photos[0]) : "logo-silver.png";
    var url = href || ("car.html?id=" + encodeURIComponent(c.id));
    var miles = Number(String(c.mileage||"").replace(/[^0-9.]/g,""));
    var specs = [c.year, miles>0 ? miles.toLocaleString("en-GB")+" mi" : null, c.fuel, c.transmission, c.engine].filter(Boolean);
    return '<article class="cx-card" style="--i:' + i + '"><a class="pic" href="' + url + '"><span class="tag">' + money(c.price) + '</span>' +
      (has360(c) ? '<span class="has360">360\u00B0</span>' : '') + '<img src="' + img + '" alt="' + esc(full(c)) + '" loading="lazy"' + (!c.photos||!c.photos[0] ? ' style="object-fit:contain;padding:24px"' : '') + '></a>' +
      '<div class="body">' + (c.body ? '<div class="kind">' + esc(c.body) + '</div>' : '') + '<h3>' + esc(title(c)) + '</h3>' + (c.variant ? '<div class="var">' + esc(c.variant) + '</div>' : '') +
      '<ul class="specs">' + specs.map(function(s){ return '<li>' + esc(s) + '</li>'; }).join("") + '</ul>' +
      '<div class="acts"><a class="cx-btn sm" href="' + url + '">' + (href ? 'Turn it 360\u00B0' : 'View car') + '</a></div></div></article>';
  }

  /* ---------- lightbox ---------- */
  var lb = { list:[], i:0 };
  function lbOpen(i, list){
    lb.list = list; lb.i = i;
    var o = document.getElementById("cxLb");
    if(!o){ o = document.createElement("div"); o.id = "cxLb"; o.className = "lb"; o.innerHTML = '<button class="x" aria-label="Close">\u2715</button><button class="p" aria-label="Previous">\u2039</button><img alt=""><button class="n" aria-label="Next">\u203A</button>'; document.body.appendChild(o);
      o.addEventListener("click", function(e){ var t = e.target;
        if(t.classList.contains("p")) lbOpen((lb.i - 1 + lb.list.length) % lb.list.length, lb.list);
        else if(t.classList.contains("n")) lbOpen((lb.i + 1) % lb.list.length, lb.list);
        else o.classList.remove("on"); }); }
    o.querySelector("img").src = list[i]; o.classList.add("on");
  }
  document.addEventListener("keydown", function(e){
    var o = document.getElementById("cxLb"); if(!o || !o.classList.contains("on")) return;
    if(e.key === "Escape") o.classList.remove("on");
    if(e.key === "ArrowRight") lbOpen((lb.i + 1) % lb.list.length, lb.list);
    if(e.key === "ArrowLeft") lbOpen((lb.i - 1 + lb.list.length) % lb.list.length, lb.list);
  });

  /* ---------- the car page ---------- */
  function carPage(car, cars){
    var photos = car.photos || [], name = full(car), sold = car.status === "sold";
    document.title = name + " | Car Express";
    var tabs = [];
    if(has360(car)) tabs.push(["spin","\uD83D\uDD04 360\u00B0 view"]);
    tabs.push(["photos","\uD83D\uDCF7 Photos" + (photos.length ? " (" + photos.length + ")" : "")]);
    if(ytId(car.video) || (car.video && !/youtu/.test(car.video))) tabs.push(["video","\u25B6 Video"]);
    var first = tabs[0][0];

    var photoPanel = photos.length
      ? '<div class="cp-main" id="cpPhoto"><img id="cpImg" src="' + esc(photos[0]) + '" alt="' + esc(name) + '"><button class="nv p" aria-label="Previous photo">\u2039</button><button class="nv n" aria-label="Next photo">\u203A</button><span class="cnt" id="cpCnt">1 / ' + photos.length + '</span></div>' +
        (photos.length > 1 ? '<div class="cp-thumbs">' + photos.map(function(u,i){ return '<button class="' + (i===0?'on':'') + '" data-i="' + i + '" aria-label="Photo ' + (i+1) + '"><img src="' + esc(u) + '" alt="" loading="lazy"></button>'; }).join("") + '</div>' : '')
      : '<div class="cp-empty"><div><img src="logo-silver.png" alt="Car Express"><p>Photos of this car are on their way. Message us and we\u2019ll send some over.</p></div></div>';

    var spinPanel = has360(car) ? (car.spinEmbed
      ? '<div class="cp-embed"><iframe src="' + esc(car.spinEmbed) + '" title="360 view" allowfullscreen loading="lazy"></iframe></div>'
      : '<div id="cpSpin"></div>') : '';
    var vid = ytId(car.video);
    var videoPanel = vid ? '<div class="cp-video"><iframe src="https://www.youtube.com/embed/' + vid + '?rel=0" title="Video of the ' + esc(name) + '" allowfullscreen loading="lazy"></iframe></div>'
      : (car.video ? '<div class="cp-video"><video src="' + esc(car.video) + '" controls playsinline></video></div>' : '');

    var miles = Number(String(car.mileage||"").replace(/[^0-9.]/g,""));
    var specs = [["Year",car.year],["Mileage",miles>0?miles.toLocaleString("en-GB")+" miles":null],["Fuel",car.fuel],["Gearbox",car.transmission],["Engine",car.engine],["Body",car.body],["Doors",car.doors]].filter(function(x){ return x[1]; });
    var desc = String(car.description||"").split(/\n\s*\n/).filter(Boolean).map(function(p){ return '<p>' + esc(p).replace(/\n/g,"<br>") + '</p>'; }).join("");
    var others = cars.filter(function(c){ return String(c.id) !== String(car.id) && c.status !== "sold"; }).slice(0,3);

    main.innerHTML = '<div class="cx-wrap cp"><div class="cp-crumb"><a href="index.html">Home</a> / <a href="stock.html">Cars for sale</a> / ' + esc(title(car)) + '</div>' +
      '<div class="cp-grid"><div class="cp-media"><div class="cp-tabs">' + tabs.map(function(t){ return '<button class="cp-tab' + (t[0]===first?' on':'') + '" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join("") + '</div>' +
      (has360(car) ? '<div class="cp-panel' + (first==="spin"?' on':'') + '" data-panel="spin">' + spinPanel + '</div>' : '') +
      '<div class="cp-panel' + (first==="photos"?' on':'') + '" data-panel="photos">' + photoPanel + '</div>' +
      (videoPanel ? '<div class="cp-panel" data-panel="video">' + videoPanel + '</div>' : '') + '</div>' +
      '<div class="cp-info"><h1>' + esc(title(car)) + '</h1>' + (car.variant ? '<p class="cp-var">' + esc(car.variant) + '</p>' : '') +
      '<div><span class="cp-price">' + money(car.price) + '</span>' + (sold ? '<span class="cp-sold">Sold</span>' : '') + '</div>' +
      (specs.length ? '<div class="cp-specs">' + specs.map(function(s){ return '<div><small>' + esc(s[0]) + '</small><b>' + esc(s[1]) + '</b></div>'; }).join("") + '</div>' : '') +
      (desc ? '<div class="cp-desc">' + desc + '</div>' : '') +
      '<div class="cp-acts">' + (sold ? '<a class="cx-btn" href="stock.html">See cars in stock</a>' :
        '<a class="cx-btn" target="_blank" rel="noopener" href="' + wa("Hi, I'd like more information about the " + name + " (" + money(car.price) + ").") + '">Enquire on WhatsApp</a>' +
        '<a class="cx-btn ghost" target="_blank" rel="noopener" href="' + wa("Hi, I'd like to book a test drive in the " + name + ".") + '">Book a test drive</a>' +
        '<a class="cx-btn ghost" target="_blank" rel="noopener" href="' + wa("Hi, I'd like to make an offer on the " + name + " (listed at " + money(car.price) + ").") + '">Make an offer</a>') + '</div>' +
      '<ul class="cp-trust"><li>Serviced, MOT\u2019d and HPI checked before sale</li><li>Part exchange welcome. <a target="_blank" rel="noopener" href="' + wa("Hi, I'd like my car valued against the " + name + ".") + '" style="color:#fff;border-bottom:2px solid var(--cx-red)">Value my car</a></li><li>Free delivery within 50 miles</li></ul></div></div>' +
      (others.length ? '<div class="cp-more" data-reveal><h2>Other cars you may like</h2><div class="cars-grid">' + others.map(function(c,i){ return card(c,i); }).join("") + '</div></div>' : '') + '</div>';
    if(window.CEwatch) window.CEwatch();

    /* tabs */
    var spinMounted = false;
    function openTab(t){
      $$(".cp-tab").forEach(function(b){ b.classList.toggle("on", b.getAttribute("data-tab") === t); });
      $$(".cp-panel").forEach(function(p){ p.classList.toggle("on", p.getAttribute("data-panel") === t); });
      if(t === "spin" && !spinMounted && !car.spinEmbed){ spinMounted = true; window.CEspin && window.CEspin($("#cpSpin"), car.spin); }
    }
    $$(".cp-tab").forEach(function(b){ b.addEventListener("click", function(){ openTab(b.getAttribute("data-tab")); }); });
    openTab(first);

    /* photos */
    if(photos.length){
      var idx = 0, img = $("#cpImg"), cnt = $("#cpCnt");
      var show = function(i){ idx = (i + photos.length) % photos.length; img.style.opacity = 0; setTimeout(function(){ img.src = photos[idx]; img.style.opacity = 1; }, 120);
        if(cnt) cnt.textContent = (idx+1) + " / " + photos.length; $$(".cp-thumbs button").forEach(function(b,k){ b.classList.toggle("on", k === idx); });
        var tb = $(".cp-thumbs button.on"); if(tb && tb.scrollIntoView) tb.scrollIntoView({block:"nearest", inline:"center", behavior:"smooth"}); };
      $(".nv.p").addEventListener("click", function(e){ e.stopPropagation(); show(idx - 1); });
      $(".nv.n").addEventListener("click", function(e){ e.stopPropagation(); show(idx + 1); });
      $$(".cp-thumbs button").forEach(function(b){ b.addEventListener("click", function(){ show(Number(b.getAttribute("data-i"))); }); });
      $("#cpPhoto").addEventListener("click", function(){ lbOpen(idx, photos); });
      var x0 = null, box = $("#cpPhoto");
      box.addEventListener("pointerdown", function(e){ if(e.pointerType !== "mouse") x0 = e.clientX; });
      box.addEventListener("pointerup", function(e){ if(x0 === null) return; var dx = e.clientX - x0; x0 = null; if(Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1)); });
    }
  }

  function notFound(cars){
    var rel = cars.filter(function(c){ return c.status !== "sold"; }).slice(0,3);
    main.innerHTML = '<div class="cx-wrap cp"><div class="txt2"><h1 class="cx-h" style="font-size:clamp(36px,5vw,64px);margin-bottom:14px">Car not found</h1><p>This car may have sold. Message us and we\u2019ll tell you what\u2019s similar.</p>' +
      '<div class="cx-actions"><a class="cx-btn" target="_blank" rel="noopener" href="' + wa("Hi, I was looking at a car on your website that's no longer showing. What do you have similar?") + '">Message us</a><a class="cx-btn ghost" href="stock.html">See cars in stock</a></div></div>' +
      (rel.length ? '<div class="cp-more"><h2>In stock now</h2><div class="cars-grid">' + rel.map(function(c,i){ return card(c,i); }).join("") + '</div></div>' : '') + '</div>';
  }

  /* ---------- the 360 page ---------- */
  function spinPage(car, cars){
    if(!car){
      var list = cars.filter(function(c){ return c.status !== "sold" && has360(c); });
      main.innerHTML = '<div class="cx-wrap cp"><div class="cp-crumb"><a href="index.html">Home</a> / 360\u00B0 view</div><h1 class="cx-h" style="font-size:clamp(40px,6vw,76px);margin-bottom:12px">Turn the car, 360\u00B0</h1>' +
        '<p style="max-width:34em;margin:0 0 30px">Pick a car and drag to turn it all the way round, outside and in.</p>' +
        (list.length ? '<div class="cars-grid">' + list.map(function(c,i){ return card(c,i,"view360.html?id=" + encodeURIComponent(c.id)); }).join("") + '</div>' :
          '<div class="cars-empty"><h3>360\u00B0 views are coming</h3><p>We\u2019re adding them car by car. In the meantime, every car has photos you can swipe through.</p><a class="cx-btn" href="stock.html">See cars in stock</a></div>') + '</div>';
      document.title = "360\u00B0 view | Car Express";
      return;
    }
    if(!has360(car)){ location.replace("car.html?id=" + encodeURIComponent(car.id)); return; }
    var name = full(car);
    document.title = name + " 360\u00B0 | Car Express";
    main.innerHTML = '<div class="cx-wrap cp"><div class="cp-crumb"><a href="index.html">Home</a> / <a href="view360.html">360\u00B0 view</a> / ' + esc(title(car)) + '</div>' +
      '<div class="cp-grid"><div>' + (car.spinEmbed ? '<div class="cp-embed"><iframe src="' + esc(car.spinEmbed) + '" title="360 view" allowfullscreen></iframe></div>' : '<div id="cpSpin"></div>') + '</div>' +
      '<div class="cp-info"><h1>' + esc(title(car)) + '</h1>' + (car.variant ? '<p class="cp-var">' + esc(car.variant) + '</p>' : '') + '<div><span class="cp-price">' + money(car.price) + '</span></div>' +
      '<div class="cp-acts"><a class="cx-btn" href="car.html?id=' + encodeURIComponent(car.id) + '">Full details and photos</a><a class="cx-btn ghost" target="_blank" rel="noopener" href="' + wa("Hi, I've been looking at the " + name + " on your website. Is it still available?") + '">Ask about it</a></div></div></div></div>';
    if(!car.spinEmbed && window.CEspin) window.CEspin($("#cpSpin"), car.spin);
  }

  loadStock().then(function(cars){
    if(mode === "spin"){ spinPage(id ? cars.filter(function(c){ return String(c.id) === String(id); })[0] : null, cars); return; }
    var car = cars.filter(function(c){ return String(c.id) === String(id); })[0];
    if(!car) notFound(cars); else carPage(car, cars);
  });
})();
