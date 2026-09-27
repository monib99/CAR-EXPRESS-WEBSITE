/* ============================================================
   CAR EXPRESS — site content loader
   Reads what you publish from the app's Website section and applies it
   to the page: hero slide, headings, text, menu, contact details.
   If nothing has been published yet, the page keeps whatever is in the
   HTML, so the site never looks broken.
   ============================================================ */
(function(){
  var C = window.CE || {};
  if(!C.supabaseUrl || !C.supabaseKey) return;

  var esc = function(s){ return String(s==null?'':s)
    .replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  var wa = function(m){ return 'https://wa.me/'+(C.whatsapp||'')+(m?'?text='+encodeURIComponent(m):''); };

  function currentPageName(){
    var f = location.pathname.split('/').pop() || 'index.html';
    return f.replace('.html','').toLowerCase();
  }
  /* index.html is the home page; the rest match by slug */
  function matchPage(site){
    var name = currentPageName();
    if(name==='index' || name==='') name = 'home';
    var p = site.pages.filter(function(x){ return (x.slug||x.id)===name; })[0];
    if(!p && name==='home') p = site.pages[0];
    return p;
  }

  function applySettings(st){
    if(!st) return;
    if(st.phone){
      C.phone = st.phone;
      document.querySelectorAll('.ce-phone, .info-number').forEach(function(e){ e.textContent = st.phone; });
      document.querySelectorAll('a[href^="tel:"]').forEach(function(a){ a.href='tel:'+st.phone.replace(/[^\d+]/g,''); });
    }
    if(st.whatsapp) C.whatsapp = st.whatsapp;
    if(st.email){
      C.email = st.email;
      document.querySelectorAll('.ce-email').forEach(function(e){ e.textContent = st.email; });
      document.querySelectorAll('a[href^="mailto:"]').forEach(function(a){ a.href='mailto:'+st.email; });
    }
    if(st.address && st.address.length){
      C.address = st.address;
      document.querySelectorAll('.ce-address').forEach(function(e){ e.innerHTML = st.address.map(esc).join('<br>'); });
    }
    if(st.hours) document.querySelectorAll('.ce-hours').forEach(function(e){ e.innerHTML = st.hours; });
    if(st.mapsQuery) C.mapsQuery = st.mapsQuery;
    if(st.primaryColour || st.darkColour){
      var css = document.createElement('style');
      css.textContent =
        (st.primaryColour ? '.button,.btn-primary,.price.car-price,.bg-primary,.search-inventory .button{background-color:'+st.primaryColour+'!important;border-color:'+st.primaryColour+'!important}'
          + 'a:hover,.text-primary,.item-title a:hover{color:'+st.primaryColour+'!important}' : '')
        + (st.darkColour ? '.bg-dark,.footer,.topbar,header nav{background-color:'+st.darkColour+'!important}' : '');
      document.head.appendChild(css);
    }
  }

  function applyMenu(site){
    var ul = document.querySelector('nav .menu-links');
    if(!ul || !site.menu || !site.menu.length) return;
    var pageById = {};
    site.pages.forEach(function(p){ pageById[p.id] = p; });
    ul.innerHTML = site.menu.map(function(m){
      var p = pageById[m.page];
      var href = !p ? '#' : ((p.slug||p.id)==='home' ? 'index.html' : (p.slug||p.id)+'.html');
      return '<li><a href="'+href+'">'+esc(m.label)+'</a></li>';
    }).join('');
  }

  /* Hero: photo, video, heading, sub-heading and button */
  function applyHero(sec){
    if(!sec || !sec.slides || !sec.slides.length) return;
    var sl = sec.slides[0];
    var banner = document.querySelector('#ceHeroRow') ? document.querySelector('#ceHeroRow').closest('section, div[style*="background-image"]') : null;
    if(!banner) banner = document.querySelector('section[style*="background-image"], .banner, .home3-banner');

    if(sl.photo && banner){
      banner.style.backgroundImage =
        'linear-gradient(rgba(10,20,45,.62),rgba(10,20,45,.72)), url("'+sl.photo+'")';
      banner.style.backgroundSize = 'cover';
      banner.style.backgroundPosition = 'center';
    }
    if(sl.videoUrl && banner){
      var v = document.createElement('video');
      v.src = sl.videoUrl; v.autoplay = true; v.muted = true; v.loop = true; v.playsInline = true;
      v.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;';
      if(getComputedStyle(banner).position === 'static') banner.style.position = 'relative';
      banner.insertBefore(v, banner.firstChild);
      var content = banner.querySelector('.container');
      if(content){ content.style.position='relative'; content.style.zIndex='2'; }
    }
    var h1 = document.querySelector('.banner-content h1, #ceHeroRow h1');
    if(h1 && sl.heading) h1.textContent = sl.heading;
    var h5 = document.querySelector('.banner-content h5, #ceHeroRow h5');
    if(h5 && sl.sub) h5.textContent = sl.sub;
    var btn = document.querySelector('.app-button .button');
    if(btn && sl.buttonText){
      btn.textContent = sl.buttonText;
      btn.href = (sl.buttonPage==='home' ? 'index.html' : (sl.buttonPage||'stock')+'.html');
    }
  }

  /* Render the sections the template doesn't already cover, into a holder
     appended after the main content. Keeps the template's look. */
  function renderExtraSections(page){
    var host = document.querySelector('#ceSections');
    if(!host){
      host = document.createElement('div'); host.id = 'ceSections';
      var footer = document.querySelector('footer');
      if(footer && footer.parentNode) footer.parentNode.insertBefore(host, footer);
      else document.body.appendChild(host);
    }
    var html = '';
    (page.sections||[]).forEach(function(s){
      if(s.visible === false) return;
      if(s.type==='text'){
        html += '<section class="space-ptb"><div class="container"><div class="row"><div class="col-lg-10 mx-auto">'
             + (s.title?'<h2 class="main-title">'+esc(s.title)+'</h2>':'')
             + (s.body||'').split(/\n\s*\n/).map(function(p){ return '<p>'+esc(p)+'</p>'; }).join('')
             + '</div></div></div></section>';
      }
      else if(s.type==='steps' || s.type==='features'){
        html += '<section class="space-ptb bg-light"><div class="container">'
             + (s.title?'<h2 class="main-title text-center mb-4">'+esc(s.title)+'</h2>':'')
             + '<div class="row">'
             + (s.items||[]).map(function(it,i){
                 return '<div class="col-lg-3 col-sm-6 mb-4"><div class="feature-info">'
                   + (s.type==='steps' ? '<div style="color:var(--ce-red,#DC2226);font-weight:700">Step '+(i+1)+'</div>' : '')
                   + '<h5>'+esc(it.title||'')+'</h5><p>'+esc(it.text||'')+'</p></div></div>';
               }).join('')
             + '</div></div></section>';
      }
      else if(s.type==='gallery' && (s.photos||[]).length){
        html += '<section class="space-ptb"><div class="container">'
             + (s.title?'<h2 class="main-title text-center mb-4">'+esc(s.title)+'</h2>':'')
             + '<div class="row">'
             + s.photos.map(function(p){
                 return '<div class="col-lg-3 col-sm-6 mb-3"><img src="'+esc(p)+'" alt="" class="img-fluid" '
                      + 'style="width:100%;height:200px;object-fit:cover;border-radius:6px" loading="lazy"></div>';
               }).join('')
             + '</div></div></section>';
      }
      else if(s.type==='video' && s.videoUrl){
        var yt = (s.videoUrl.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/)||[])[1];
        html += '<section class="space-ptb bg-light"><div class="container text-center">'
             + (s.title?'<h2 class="main-title mb-4">'+esc(s.title)+'</h2>':'')
             + (yt ? '<div style="position:relative;padding-top:56.25%"><iframe src="https://www.youtube.com/embed/'+yt+'" '
                   + 'style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:8px" allowfullscreen loading="lazy"></iframe></div>'
                   : '<video src="'+esc(s.videoUrl)+'" controls style="width:100%;border-radius:8px"></video>')
             + '</div></section>';
      }
      else if(s.type==='reviews' && (s.items||[]).length){
        html += '<section class="space-ptb"><div class="container">'
             + (s.title?'<h2 class="main-title text-center mb-4">'+esc(s.title)+'</h2>':'')
             + '<div class="row">'
             + s.items.map(function(it){
                 return '<div class="col-lg-4 col-sm-6 mb-3"><div style="border:1px solid #e3e7ef;border-radius:8px;padding:20px;height:100%">'
                   + '<div style="color:#E8B33A;letter-spacing:3px">'+'★'.repeat(Number(it.stars||5))+'</div>'
                   + '<p style="margin:10px 0">'+esc(it.text||'')+'</p>'
                   + '<div style="color:#667;font-weight:600">— '+esc(it.title||'')+'</div></div></div>';
               }).join('')
             + '</div></div></section>';
      }
      else if(s.type==='cta'){
        html += '<section style="padding:54px 0;background:'+((window.CE.primaryColour)||'#DC2226')+';color:#fff">'
             + '<div class="container text-center"><h2 style="color:#fff">'+esc(s.title||'')+'</h2>'
             + (s.buttonText ? '<a class="button" style="background:#fff;color:#17428C" href="'
                 + ((s.buttonPage==='home')?'index.html':(s.buttonPage||'stock')+'.html')+'">'+esc(s.buttonText)+'</a>' : '')
             + '</div></section>';
      }
      else if(s.type==='contact'){
        html += '<section class="space-ptb bg-light"><div class="container">'
             + '<h2 class="main-title text-center mb-4">'+esc(s.title||'Get in touch')+'</h2>'
             + '<div class="row text-center"><div class="col-md-4 mb-3"><h5>Call us</h5><p><a href="tel:'
             + String(C.phone||'').replace(/[^\d+]/g,'')+'">'+esc(C.phone||'')+'</a></p></div>'
             + '<div class="col-md-4 mb-3"><h5>WhatsApp</h5><p><a href="'+wa("Hi, I'd like to ask about a car.")+'" target="_blank" rel="noopener">Message us</a></p></div>'
             + '<div class="col-md-4 mb-3"><h5>Visit us</h5><p>'+(C.address||[]).map(esc).join('<br>')+'</p></div></div>'
             + '</div></section>';
      }
    });
    host.innerHTML = html;
  }

  async function load(){
    try{
      var r = await fetch(C.supabaseUrl+'/rest/v1/public_site?id=eq.site&select=data',
        {headers:{apikey:C.supabaseKey, Authorization:'Bearer '+C.supabaseKey}, cache:'no-store'});
      if(!r.ok) return;
      var rows = await r.json();
      var site = rows && rows[0] && rows[0].data;
      if(!site || !site.pages) return;

      applySettings(site.settings);
      applyMenu(site);

      var page = matchPage(site);
      if(!page) return;

      var hero = (page.sections||[]).filter(function(s){ return s.type==='hero' && s.visible!==false; })[0];
      applyHero(hero);

      // car sections are handled by the stock loader; render the rest
      var extras = Object.assign({}, page, {
        sections: (page.sections||[]).filter(function(s){ return s.type!=='hero' && s.type!=='cars'; })
      });
      renderExtraSections(extras);
    }catch(e){ /* site keeps its built-in content */ }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load);
  else load();
})();
