(() => {
  const hero=document.querySelector('.hero'); if(!hero) return;
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let SCALE=1.12, maxShift=40, base=null, tgt=0, cur=0;
  const k=.9, smooth=.14, clamp=(v,a,b)=>Math.min(Math.max(v,a),b);
  const recalc=()=>{ const h=hero.getBoundingClientRect().height; const extra=(SCALE-1)*h/2; maxShift=Math.max(10, Math.min(80, extra-2)); hero.style.setProperty('--hero-scale', SCALE); };
  const compute=y=>{ const r=hero.getBoundingClientRect(), vh=innerHeight; const top=y+r.top, bot=top+r.height;
    if(!((y+vh)>top && y<bot)){ base=null; return; }
    if(base===null) base=y; tgt=clamp((y-base)*k,-maxShift,maxShift); tick(); };
  function tick(){ cur+=(tgt-cur)*smooth; hero.style.setProperty('--hero-y', cur.toFixed(2)+'px'); if(Math.abs(tgt-cur)>.1) requestAnimationFrame(tick); }
  addEventListener('scroll', ()=>compute(scrollY), {passive:true});
  addEventListener('resize', ()=>{ SCALE=innerWidth<768?1.08:1.12; recalc(); compute(scrollY); });
  recalc(); compute(scrollY);
})();