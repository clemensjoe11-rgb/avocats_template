(() => {
  document.documentElement.classList.add('js');
  const els=[...document.querySelectorAll('.reveal')];
  if(!('IntersectionObserver' in window) || !els.length){ els.forEach(e=>e.classList.add('in')); return; }
  const io=new IntersectionObserver(es=>{
    es.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); }});
  },{threshold:.2});
  els.forEach(e=>io.observe(e));
})();