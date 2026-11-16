(function(){
  var els = document.querySelectorAll('.rv');
  if (!('IntersectionObserver' in window)) { els.forEach(function(e){ e.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function(es){ es.forEach(function(en){ if (en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } }); }, { threshold: .08 });
    els.forEach(function(e){ io.observe(e); });
  }
  var b = document.getElementById('burger'), n = document.getElementById('nav');
  if (b && n) {
    b.addEventListener('click', function(){ var o = n.classList.toggle('open'); b.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    n.addEventListener('click', function(e){ if (e.target.tagName === 'A') { n.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } });
  }
  var cur = document.body.getAttribute('data-page');
  document.querySelectorAll('nav a[data-p]').forEach(function(a){ if (a.getAttribute('data-p') === cur) a.setAttribute('aria-current', 'page'); });
})();
