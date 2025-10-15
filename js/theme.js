(function(){
  const KEY='theme', root=document.documentElement;

  const get=()=>{try{return localStorage.getItem(KEY)}catch(e){return null}};
  const save=t=>{try{localStorage.setItem(KEY,t)}catch(e){}};
  const cur = ()=> root.dataset.theme==='dark'?'dark':'light';
  const set = t=>{root.dataset.theme=t; save(t); ui()};

  function ui(){
    const b=document.getElementById('themeToggle'); if(!b) return;
    const i=b.querySelector('i'); const dark=cur()==='dark';
    if(i) i.className=dark?'bi bi-sun':'bi bi-moon';
    b.setAttribute('aria-pressed', String(dark));
    const y=document.getElementById('y'); if(y) y.textContent=new Date().getFullYear();
  }

  function init(){
    const saved=get(); if(saved) set(saved); else ui();
    const b=document.getElementById('themeToggle');
    if(b && !b.__bound){
      b.addEventListener('click',()=>set(cur()==='dark'?'light':'dark'));
      b.__bound=true;
    }
    const mq=matchMedia('(prefers-color-scheme: dark)');
    mq && mq.addEventListener?.('change', e=>{ if(!get()) set(e.matches?'dark':'light'); });
    addEventListener('storage', e=>{ if(e.key===KEY && e.newValue){ root.dataset.theme=e.newValue; ui(); }});
  }

  document.readyState==='loading' ? addEventListener('DOMContentLoaded', init) : init();
})();