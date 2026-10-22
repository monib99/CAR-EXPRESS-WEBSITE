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
  function open(){ hi.classList.remove("on"); bub.classList.add("on"); badge.style.display = "none"; seen = true; }
  function close(){ bub.classList.remove("on"); }
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
