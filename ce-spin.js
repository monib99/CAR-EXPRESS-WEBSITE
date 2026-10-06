/* CAR EXPRESS 360 viewer. Turn the car by dragging, with smooth blending between photos.
   Usage: CEspin(element, ["url1","url2",...], {noAuto:false})  */
(function(){
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function mount(root, urls, opts){
    opts = opts || {};
    var n = urls.length; if(n < 2 || !root) return null;
    root.classList.add("cxs"); root.setAttribute("tabindex","0"); root.setAttribute("role","img"); root.setAttribute("aria-label","360 degree view. Drag or use the arrow keys to turn the car.");
    root.innerHTML = '<div class="cxs-stage"><img class="a" draggable="false" alt=""><img class="b" draggable="false" alt=""></div>' +
      '<div class="cxs-badge">360\u00B0</div><div class="cxs-load"><div><b>Loading the car\u2026</b><div class="bar"><i></i></div></div></div>' +
      '<div class="cxs-hint">\u2194 Drag to turn the car</div>' +
      '<div class="cxs-ctl"><button type="button" data-d="-1" aria-label="Turn left">\u2039</button><button type="button" data-p aria-label="Pause or play">\u275A\u275A</button><button type="button" data-d="1" aria-label="Turn right">\u203A</button></div>';
    var A = root.querySelector(".a"), B = root.querySelector(".b"), load = root.querySelector(".cxs-load"), bar = root.querySelector(".bar i"), hint = root.querySelector(".cxs-hint"), pp = root.querySelector("[data-p]");
    var pos = 0, vel = 0, dragging = false, lastX = 0, auto = !opts.noAuto && !reduce, raf = 0, ready = false, visible = true, loaded = 0, turned = 0;
    var cur = -1, nxt = -1;

    function frame(){
      var p = ((pos % n) + n) % n, i = Math.floor(p), f = p - i, j = (i + 1) % n;
      if(i !== cur){ A.src = urls[i]; cur = i; }
      if(j !== nxt){ B.src = urls[j]; nxt = j; }
      B.style.opacity = f < 0.02 ? 0 : f;
    }
    function tick(){
      raf = requestAnimationFrame(tick);
      if(!ready || !visible) return;
      if(!dragging){
        if(Math.abs(vel) > 0.002){ pos += vel; vel *= 0.94; }
        else if(auto){ pos += 0.045; turned += 0.045; if(turned > n * 1.6){ auto = false; pp.textContent = "\u25B6"; } }
      }
      frame();
    }
    var imgs = urls.map(function(u){
      var im = new Image();
      im.onload = im.onerror = function(){
        loaded++; bar.style.width = (loaded / n * 100) + "%";
        if(loaded === n){ ready = true; load.style.opacity = 0; setTimeout(function(){ load.style.display = "none"; }, 400); }
      };
      im.src = u; return im;
    });
    frame(); tick();

    function stopAuto(){ auto = false; pp.textContent = "\u25B6"; hint.style.opacity = 0; }
    root.addEventListener("pointerdown", function(e){
      if(e.target.closest(".cxs-ctl")) return;
      dragging = true; lastX = e.clientX; vel = 0; stopAuto(); root.classList.add("grabbing");
      try{ root.setPointerCapture(e.pointerId); }catch(_){}
    });
    root.addEventListener("pointermove", function(e){
      if(!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      var d = -dx / root.clientWidth * n * 0.95; pos += d; vel = d;
    });
    function up(){ dragging = false; root.classList.remove("grabbing"); }
    root.addEventListener("pointerup", up); root.addEventListener("pointercancel", up); root.addEventListener("lostpointercapture", up);
    root.addEventListener("keydown", function(e){
      if(e.key === "ArrowRight"){ stopAuto(); vel = 0; pos += 1; }
      if(e.key === "ArrowLeft"){ stopAuto(); vel = 0; pos -= 1; }
    });
    root.addEventListener("click", function(e){
      var b = e.target.closest("button"); if(!b) return;
      if(b.hasAttribute("data-d")){ stopAuto(); vel = Number(b.getAttribute("data-d")) * 0.35; }
      if(b.hasAttribute("data-p")){ auto = !auto; b.textContent = auto ? "\u275A\u275A" : "\u25B6"; if(auto) hint.style.opacity = 1; }
    });
    if("IntersectionObserver" in window){ new IntersectionObserver(function(es){ visible = es[0].isIntersecting; }).observe(root); }
    return { destroy:function(){ cancelAnimationFrame(raf); } };
  }
  window.CEspin = mount;
})();
