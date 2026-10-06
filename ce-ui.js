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
  markCurrent(); setTimeout(markCurrent, 1200); /* again after the app menu loads */

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
    document.body.appendChild(a);
  }
})();
