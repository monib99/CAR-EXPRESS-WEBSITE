/* CAR EXPRESS shared interactions: header, mobile menu, scroll reveal, floating WhatsApp. */
(function(){
  var C = window.CE || {};
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* header shrinks on scroll */
  var h = document.getElementById("cxHeader");
  function onScroll(){ if(h) h.classList.toggle("scrolled", window.scrollY > 24); }
  onScroll(); window.addEventListener("scroll", onScroll, {passive:true});

  /* mobile menu (delegated, so it survives the page being rewritten) */
  document.addEventListener("click", function(e){
    var b = e.target.closest && e.target.closest(".cx-burger");
    if(b){ var open = document.body.classList.toggle("menu-open"); b.setAttribute("aria-expanded", open); return; }
    if(e.target.closest && e.target.closest(".cx-nav a")) document.body.classList.remove("menu-open");
  });

  /* highlight the current page in the menu */
  function markCurrent(){
    var f = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll(".cx-nav .menu-links a").forEach(function(a){
      var t = (a.getAttribute("href") || "").toLowerCase();
      a.classList.toggle("is-current", t === f || (f === "" && t === "index.html"));
    });
  }
  window.CEmark = markCurrent; markCurrent(); setTimeout(markCurrent, 1200);

  /* scroll reveal */
  var io = null;
  if("IntersectionObserver" in window && !reduce){
    io = new IntersectionObserver(function(es){
      es.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add("in"); io.unobserve(en.target); } });
    }, {threshold:.12, rootMargin:"0px 0px -6% 0px"});
  }
  function watch(){
    document.querySelectorAll("[data-reveal]:not(.in)").forEach(function(el){
      if(io) io.observe(el); else el.classList.add("in");
    });
  }
  window.CEwatch = watch; watch();

  /* cursor spotlight on cards and panels */
  document.addEventListener("pointermove", function(e){
    var t = e.target.closest ? e.target.closest(".cx-card,.panel") : null;
    if(!t) return;
    var r = t.getBoundingClientRect();
    t.style.setProperty("--mx", (e.clientX - r.left) + "px");
    t.style.setProperty("--my", (e.clientY - r.top) + "px");
  }, {passive:true});

  /* animated number */
  window.CEcount = function(el, to){
    if(reduce){ el.textContent = to; return; }
    var t0 = null, d = 1100;
    function step(ts){
      if(!t0) t0 = ts;
      var p = Math.min((ts - t0) / d, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  /* floating WhatsApp button */
  if(C.whatsapp){
    var a = document.createElement("a");
    a.className = "cx-wa"; a.target = "_blank"; a.rel = "noopener"; a.setAttribute("aria-label","Message us on WhatsApp");
    a.href = "https://wa.me/" + C.whatsapp + "?text=" + encodeURIComponent("Hi, I'd like to ask about a car.");
    a.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6c-.2.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.6.3.1.2.1.8-.1 1.4z"/></svg>';
    a.innerHTML += '<span class="cx-wa-t">WhatsApp us</span>';
    document.body.appendChild(a);
  }
})();

/* ---- v3 effects: progress bar, split headings, hero tilt/counter, magnetic buttons ---- */
(function(){
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var bar = document.createElement("div"); bar.className = "ce-progress"; document.body.appendChild(bar);
  addEventListener("scroll", function(){ var h = document.documentElement; var m = h.scrollHeight - h.clientHeight; bar.style.width = (m > 0 ? h.scrollTop / m * 100 : 0) + "%"; }, {passive:true});
  if(reduce) return;
  function split(){
    document.querySelectorAll(".sx-head h2:not(.split)").forEach(function(h){
      if(h.children.length) return;
      var words = h.textContent.trim().split(/\s+/);
      h.innerHTML = words.map(function(w,i){ return '<span style="--w:' + i + '">' + w.replace(/</g,"&lt;") + '&nbsp;</span>'; }).join("");
      h.classList.add("split");
      if("IntersectionObserver" in window){ new IntersectionObserver(function(es,o){ es.forEach(function(e){ if(e.isIntersecting){ h.classList.add("in"); o.disconnect(); } }); },{threshold:.3}).observe(h); } else h.classList.add("in");
    });
  }
  function tilt(){
    var hero = document.querySelector('[data-sec="hero"]'), vis = document.getElementById("hxVisual");
    if(!hero || !vis || hero.__fx) return; hero.__fx = 1;
    hero.addEventListener("pointermove", function(e){
      if(e.pointerType !== "mouse") return; var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      vis.style.transform = "perspective(1200px) rotateY(" + (x*5) + "deg) rotateX(" + (-y*4) + "deg) translate(" + (x*-10) + "px," + (y*-8) + "px)";
    });
    hero.addEventListener("pointerleave", function(){ vis.style.transform = ""; });
    var n = vis.querySelectorAll(".hx-slide").length, ctrl = vis.querySelector(".hx-ctrl");
    if(n > 1 && ctrl && !vis.querySelector(".hx-count")){
      var c = document.createElement("div"); c.className = "hx-count"; c.innerHTML = "<b>01</b> / " + (n < 10 ? "0" : "") + n; vis.appendChild(c);
      new MutationObserver(function(){ var k = Array.prototype.findIndex.call(vis.querySelectorAll(".hx-slide"), function(s){ return s.classList.contains("is-active"); }); c.innerHTML = "<b>" + (k+1 < 10 ? "0" : "") + (k+1) + "</b> / " + (n < 10 ? "0" : "") + n; }).observe(vis, {subtree:true, attributes:true, attributeFilter:["class"]});
    }
  }
  function mag(){
    document.querySelectorAll(".cx-btn:not([data-mag])").forEach(function(b){
      b.setAttribute("data-mag","1");
      b.addEventListener("pointermove", function(e){ if(e.pointerType !== "mouse") return; var r = b.getBoundingClientRect(); b.style.transform = "translate(" + ((e.clientX - r.left - r.width/2) * .18) + "px," + ((e.clientY - r.top - r.height/2) * .25) + "px)"; });
      b.addEventListener("pointerleave", function(){ b.style.transform = ""; });
    });
  }
  function all(){ split(); tilt(); mag(); }
  all(); new MutationObserver(function(){ clearTimeout(all.t); all.t = setTimeout(all, 150); }).observe(document.body, {childList:true, subtree:true});
})();

/* ---- Zack: the Car Express helper ---- */
(function(){
  var C = window.CE || {};
  if(document.getElementById("zack")) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function wa(m){ return "https://wa.me/" + (window.CE && window.CE.whatsapp || C.whatsapp || "") + (m ? "?text=" + encodeURIComponent(m) : ""); }
  var z = document.createElement("div"); z.id = "zack"; z.className = "zk";
  z.innerHTML =
    '<div class="zk-hi" id="zkHi">Hi, I\u2019m Zack! \uD83D\uDC4B Tap me</div><div class="zk-bub" id="zkBub" role="dialog" aria-label="Chat with Zack"><button class="zk-x" aria-label="Close">✕</button>' +
        '<b><i></i>Hi, I’m Zack! 👋</b><p class="zk-msg">Happy to help you find your next car. What would you like to know?</p>' +
    '<div class="zk-q"><a href="stock.html">What’s in stock?</a>' +
    '<a target="_blank" rel="noopener" href="' + wa("Hi, I’d like to part exchange my car. Can you help?") + '">Part exchange</a>' +
    '<button type="button" data-a="hours">Opening hours</button>' +
    '<a target="_blank" rel="noopener" href="' + wa("Hi, I’d like to ask about a car.") + '">WhatsApp us</a>' +
    '<a href="tel:' + String(C.phone || "").replace(/[^0-9+]/g, "") + '">Call us</a></div></div>' +
    '<button class="zk-car" id="zkCar" aria-label="Chat with Zack"><span class="zk-badge" id="zkBadge">1</span>' +
    '<span class="zk-img" id="zkMedia"></span></button>';
  document.body.appendChild(z);
  (function(){
    var m = z.querySelector("#zkMedia"), ua = navigator.userAgent, safari = /^((?!chrome|android|crios|fxios|edg).)*(safari|applewebkit)/i.test(ua) && (/iPhone|iPad|iPod|Macintosh/.test(ua));
    var okVideo = !safari && !!document.createElement("video").canPlayType && document.createElement("video").canPlayType('video/webm; codecs="vp9"');
    if(okVideo){
      m.innerHTML = '<video muted loop playsinline autoplay preload="auto" poster="zack-poster.webp" width="560" height="385" aria-label="Zack, your Car Express helper"><source src="zack.webm" type="video/webm"></video>';
      var v = m.firstChild; v.muted = true; var p = v.play && v.play(); if(p && p.catch) p.catch(function(){});
    } else {
      m.innerHTML = '<img src="' + (safari ? "zack-safari.webp" : "zack-poster.webp") + '" alt="Zack, your Car Express helper" width="560" height="385">';
    }
  })();
  var bub = z.querySelector("#zkBub"), car = z.querySelector("#zkCar"), badge = z.querySelector("#zkBadge"), hi = z.querySelector("#zkHi"), seen = false;
  function open(){ z.classList.remove("zk-sm"); hi.classList.remove("on"); bub.classList.add("on"); badge.style.display = "none"; seen = true; }
  function close(){ bub.classList.remove("on"); setTimeout(function(){ if(window.scrollY > 380) z.classList.add("zk-sm"); }, 50); }
  car.addEventListener("click", function(){ bub.classList.contains("on") ? close() : open(); });
  z.querySelector(".zk-x").addEventListener("click", close);
  z.addEventListener("click", function(e){
    var b = e.target.closest("[data-a=hours]"); if(!b) return;
    var h = (window.CE && window.CE.hours) || C.hours || "";
    var p = z.querySelector(".zk-msg"); p.innerHTML = "We’re open:<br>" + h; 
  });
  document.addEventListener("keydown", function(e){ if(e.key === "Escape") close(); });
  /* greet after a moment, once per visit */
  var shown = false; try{ shown = sessionStorage.getItem("zkGreeted"); }catch(e){}
  if(!shown) setTimeout(function(){ if(!seen){ open(); try{ sessionStorage.setItem("zkGreeted","1"); }catch(e){} } }, 2500);
  /* pop up when the visitor first moves the mouse, or hovers Zack */
  var moved = false;
  document.addEventListener("pointermove", function(e){
    if(moved || e.pointerType !== "mouse") return; moved = true;
    var sh = false; try{ sh = sessionStorage.getItem("zkGreeted"); }catch(x){}
    if(!sh && !seen && !z.classList.contains("zk-sm")) setTimeout(function(){ if(!seen){ open(); try{ sessionStorage.setItem("zkGreeted","1"); }catch(x){} } }, 700);
  }, {passive:true});
  car.addEventListener("pointerenter", function(e){ if(e.pointerType === "mouse" && !bub.classList.contains("on")){ z.classList.remove("zk-sm"); open(); } });
  /* shrink while reading the stock further down the page */
  function small(){
    var sm = window.scrollY > 380 && !bub.classList.contains("on");
    z.classList.toggle("zk-sm", sm);
  }
  window.addEventListener("scroll", function(){
    if(window.scrollY > 380 && bub.classList.contains("on")) close();
    small();
  }, {passive:true});
  small();
  if(reduce) return;
  /* look towards the pointer */
  var img = z.querySelector(".zk-img");
  document.addEventListener("pointermove", function(e){
    if(e.pointerType !== "mouse") return;
    var r = car.getBoundingClientRect(), x = (e.clientX - (r.left + r.width/2)) / innerWidth, y = (e.clientY - (r.top + r.height/2)) / innerHeight;
    img.style.setProperty("--rx", (y * -6).toFixed(2) + "deg"); img.style.setProperty("--ry", (x * 10).toFixed(2) + "deg");
  }, {passive:true});
  /* a little rev every so often */
  setInterval(function(){ if(!bub.classList.contains("on")){ car.classList.add("rev"); setTimeout(function(){ car.classList.remove("rev"); }, 900); } }, 9000);
})();

/* ---- side bar: quick links down the right edge (cars, call, email, social) ---- */
(function(){
  var bar = null;
  function build(){
  var C = window.CE || {}; var soc = C.social || {};
  var P = {"instagram": "M7.03.084c-1.277.06-2.149.264-2.91.563a5.9 5.9 0 0 0-2.124 1.388 5.9 5.9 0 0 0-1.38 2.127C.321 4.926.12 5.8.064 7.076s-.069 1.688-.063 4.947.021 3.667.083 4.947c.061 1.277.264 2.149.563 2.911.308.789.72 1.457 1.388 2.123a5.9 5.9 0 0 0 2.129 1.38c.763.295 1.636.496 2.913.552 1.278.056 1.689.069 4.947.063s3.668-.021 4.947-.082c1.28-.06 2.147-.265 2.91-.563a5.9 5.9 0 0 0 2.123-1.388 5.9 5.9 0 0 0 1.38-2.129c.295-.763.496-1.636.551-2.912.056-1.28.07-1.69.063-4.948-.006-3.258-.02-3.667-.081-4.947-.06-1.28-.264-2.148-.564-2.911a5.9 5.9 0 0 0-1.387-2.123 5.86 5.86 0 0 0-2.128-1.38C19.074.322 18.202.12 16.924.066 15.647.009 15.236-.006 11.977 0S8.31.021 7.03.084m.14 21.693c-1.17-.05-1.805-.245-2.228-.408a3.7 3.7 0 0 1-1.382-.895 3.7 3.7 0 0 1-.9-1.378c-.165-.423-.363-1.058-.417-2.228-.06-1.264-.072-1.644-.08-4.848-.006-3.204.006-3.583.061-4.848.05-1.169.246-1.805.408-2.228.216-.561.477-.96.895-1.382a3.7 3.7 0 0 1 1.379-.9c.423-.165 1.057-.361 2.227-.417 1.265-.06 1.644-.072 4.848-.08 3.203-.006 3.583.006 4.85.062 1.168.05 1.804.244 2.227.408.56.216.96.475 1.382.895s.681.817.9 1.378c.165.422.362 1.056.417 2.227.06 1.265.074 1.645.08 4.848.005 3.203-.006 3.583-.061 4.848-.051 1.17-.245 1.805-.408 2.23-.216.56-.477.96-.896 1.38a3.7 3.7 0 0 1-1.378.9c-.422.165-1.058.362-2.226.418-1.266.06-1.645.072-4.85.079s-3.582-.006-4.848-.06m9.783-16.192a1.44 1.44 0 1 0 1.437-1.442 1.44 1.44 0 0 0-1.437 1.442M5.839 12.012a6.161 6.161 0 1 0 12.323-.024 6.162 6.162 0 0 0-12.323.024M8 12.008A4 4 0 1 1 12.008 16 4 4 0 0 1 8 12.008", "facebook": "M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a9 9 0 0 1 1.141.195v3.325a9 9 0 0 0-.653-.036 27 27 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.7 1.7 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647", "tiktok": "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07", "youtube": "M23.498 6.186a3.02 3.02 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.02 3.02 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.02 3.02 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.02 3.02 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814M9.545 15.568V8.432L15.818 12z"};
  var items = [];
  items.push(["Cars for sale", "stock.html", '<path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M3 16v-3l2-5h14l2 5v3zM3 16v2h3v-2M18 16v2h3v-2"/><circle cx="7.5" cy="13" r=".9" fill="currentColor"/><circle cx="16.5" cy="13" r=".9" fill="currentColor"/>']);
  if(C.phone) items.push(["Call us", "tel:" + String(C.phone).replace(/[^\d+]/g,""), '<path fill="currentColor" d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z"/>']);
  if(C.email) items.push(["Email us", "mailto:" + C.email, '<path fill="currentColor" d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4.5 7v.1L12 12.4 19.5 7.1V7z"/>']);
  [["instagram","Instagram"],["facebook","Facebook"],["tiktok","TikTok"],["youtube","YouTube"]].forEach(function(k){
    if(soc[k[0]]) items.push([k[1], soc[k[0]], '<path fill="currentColor" d="' + P[k[0]] + '"/>', true]);
  });
  if(!bar){ bar = document.createElement("nav"); bar.className = "cx-side"; bar.setAttribute("aria-label","Quick links"); document.body.appendChild(bar); }
  bar.innerHTML = items.map(function(it){
    return '<a href="' + it[1] + '"' + (it[3] ? ' target="_blank" rel="noopener"' : '') + ' aria-label="' + it[0] + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + it[2] + '</svg><span>' + it[0] + '</span></a>';
  }).join("");
  }
  build(); setTimeout(build,1800); setTimeout(build,4500);
})();
