/* CAR EXPRESS homepage slider. Self-contained; safe if the page body is rewritten. */
(function(){
  var DUR = 6500, i = 0, timer = null;
  var paused = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hero(){ return document.getElementById("cxHero"); }
  function list(sel){ var h = hero(); return h ? Array.prototype.slice.call(h.querySelectorAll(sel)) : []; }

  function go(n){
    var s = list(".cx-slide"), t = list(".cx-tick");
    if(!s.length) return;
    i = (n + s.length) % s.length;
    s.forEach(function(el,k){ el.classList.toggle("is-active", k === i); });
    t.forEach(function(el,k){
      el.setAttribute("aria-selected", k === i ? "true" : "false");
      el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
    });
    schedule();
  }
  function schedule(){
    clearTimeout(timer);
    if(paused) return;
    timer = setTimeout(function(){ go(i + 1); }, DUR);
  }
  function setPaused(p){
    paused = p;
    var h = hero(); if(h) h.classList.toggle("cx-paused", p);
    if(p) clearTimeout(timer); else go(i);
  }

  document.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest("[data-cx]") : null;
    if(!b) return;
    var a = b.getAttribute("data-cx");
    if(a === "next") go(i + 1);
    else if(a === "prev") go(i - 1);
    else if(a === "pp") setPaused(!paused);
    else if(a === "tick") go(Number(b.getAttribute("data-i")) || 0);
  });

  var x0 = null;
  document.addEventListener("pointerdown", function(e){
    if(e.pointerType !== "mouse" && hero() && hero().contains(e.target)) x0 = e.clientX;
  });
  document.addEventListener("pointerup", function(e){
    if(x0 === null) return;
    var dx = e.clientX - x0; x0 = null;
    if(Math.abs(dx) > 50) go(i + (dx < 0 ? 1 : -1));
  });
  document.addEventListener("visibilitychange", function(){
    if(document.hidden) clearTimeout(timer); else if(!paused) go(i);
  });

  window.addEventListener("load", function(){
    var h = hero(); if(!h) return;
    if(paused) h.classList.add("cx-paused","cx-noauto");
    go(0);
  });
})();
