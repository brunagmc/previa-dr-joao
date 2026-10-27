/* Menus, mega menus e mapa sob clique. */
(()=>{const items=[['btn-esp','mega','li-esp'],['btn-trat','mega-trat','li-trat']].map(([b,m,l])=>({b:document.getElementById(b),m:document.getElementById(m),li:document.getElementById(l),t:0,pt:''}));
const set=(it,v)=>{if(v)items.forEach(o=>{if(o!==it){o.m.classList.remove('open');o.b.setAttribute('aria-expanded','false')}});it.m.classList.toggle('open',v);it.b.setAttribute('aria-expanded',v)};
items.forEach(it=>{[it.li,it.m].forEach(el=>{el.addEventListener('mouseenter',()=>{clearTimeout(it.t);set(it,true)});el.addEventListener('mouseleave',()=>{it.t=setTimeout(()=>set(it,false),180)})});
it.b.addEventListener('pointerdown',e=>it.pt=e.pointerType);
it.b.addEventListener('click',()=>{if(it.pt==='mouse'){set(it,true)}else{set(it,it.b.getAttribute('aria-expanded')!=='true')}it.pt=''});
it.m.addEventListener('focusin',()=>set(it,true));});
document.addEventListener('keydown',e=>{if(e.key==='Escape')items.forEach(it=>{if(it.m.classList.contains('open')){set(it,false);it.b.focus()}})});
document.addEventListener('click',e=>items.forEach(it=>{if(!it.m.contains(e.target)&&!it.li.contains(e.target))set(it,false)}));})();
(()=>{const mm=document.getElementById('mm'),o=document.getElementById('open-mm'),c=document.getElementById('close-mm');
const set=v=>{mm.classList.toggle('open',v);o.setAttribute('aria-expanded',v);document.body.style.overflow=v?'hidden':''};
o.addEventListener('click',()=>set(true));c.addEventListener('click',()=>set(false));mm.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>set(false)));})();

document.querySelectorAll('.map-ph').forEach(function(ph){ph.querySelector('button').addEventListener('click',function(){var f=document.createElement('iframe');f.src=ph.dataset.src;f.title='Mapa do consultório do Dr. João Caetano Canela';f.loading='lazy';f.referrerPolicy='no-referrer-when-downgrade';ph.appendChild(f);this.remove();});});
