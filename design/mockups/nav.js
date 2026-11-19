const icons={radar:'<path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/><circle cx="12" cy="12" r="10"/>',mapa:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',agenda:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',perfil:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'};
const items=[['radar','Radar','radar.html'],['mapa','Mapa','mapa.html'],['agenda','Agenda','agenda.html'],['perfil','Perfil','perfil.html']];
const cur=document.body.dataset.nav;
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${icons[k]}</svg>`;
const links=items.map(([k,l,h])=>`<a href="${h}" ${k===cur?'aria-current="page"':''}>${svg(k)}<span>${l}</span></a>`).join('');
document.body.insertAdjacentHTML('afterbegin',`<header class="top"><div class="wrap row" style="justify-content:space-between;width:100%"><span class="brand">ECI <b>MyCampus</b></span><nav>${links.replace(/<svg.*?<\/svg>/g,'')}</nav><a class="btn secondary" href="perfil.html">Oscar L.</a></div></header>`);
document.body.insertAdjacentHTML('beforeend',`<nav class="bottom">${links}</nav>`);
