/* upgrade.js — Carnet Riga & Stockholm : météo réelle, hors-ligne réel, itinéraires piétons, budget SEK, étape "maintenant" */
(() => {
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS = { get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}, set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}} };
const START = new Date(2026, 9, 24);
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const tripIdx = () => { const n=new Date(); const i=Math.round((new Date(n.getFullYear(),n.getMonth(),n.getDate())-START)/864e5); return i>=0&&i<itineraryData.length?i:-1; };

/* ---------- données ---------- */
itineraryData.forEach((d,i)=>{ d.date=new Date(2026,9,24+i); d.city=['j4','j5','j6','j7'].includes(d.id)?'sto':'rig'; });
itineraryData.find(d=>d.id==='j5').steps[1].time='12h15'; // relève de la garde

/* ---------- head / CSS ---------- */
const vp=$('meta[name=viewport]'); if(vp) vp.content='width=device-width, initial-scale=1, viewport-fit=cover';
document.head.insertAdjacentHTML('beforeend','<link rel="apple-touch-icon" href="./icon-180.png"><meta name="apple-mobile-web-app-title" content="Riga &amp; Stockholm">');
const st=document.createElement('style'); st.textContent=`
.net-bar{display:none;background:#2C221E;color:#FFF;text-align:center;font-size:.74rem;font-weight:700;padding:7px 12px}
.pedometer-pill{cursor:default}
.wx{margin:0 0 12px}
.leg{font-size:.72rem;color:var(--accent-forest);font-weight:700;margin:-2px 0 8px}
.step-item.now{background:var(--bg-gold-light);box-shadow:inset 3px 0 0 var(--accent-terra)}
.expense-form{grid-template-columns:1.3fr .8fr .75fr auto}
.expense-form select{padding:10px 6px;border-radius:10px;border:1.5px solid var(--border-soft);font-family:inherit;font-weight:600;font-size:.85rem;background:#FFF}
.bud-bar{height:10px;background:var(--bg-warm);border-radius:99px;overflow:hidden;margin:2px 0 4px}
.bud-bar>div{height:100%;width:0;background:linear-gradient(90deg,var(--accent-forest),var(--accent-gold));transition:width .5s var(--spring)}
.pack-row{display:flex;gap:10px;align-items:flex-start;font-size:.84rem;padding:8px 0;border-bottom:1px dashed var(--border-soft)}
.pack-row input{width:20px;height:20px;accent-color:var(--accent-forest);flex-shrink:0}
.ess li{font-size:.82rem;color:var(--text-muted);margin:0 0 7px 18px}`;
document.head.appendChild(st);

/* ---------- UI injectée ---------- */
const pill=$('#stepCounterPill'); pill.id='clockPill'; pill.removeAttribute('onclick'); pill.removeAttribute('title'); // l'ancien compteur de pas était factice
$('header.hero-header').insertAdjacentHTML('afterend','<div class="net-bar" id="netBar">📴 Hors-ligne — carnet, cartes déjà vues, météo et taux gardés en cache</div>');
$('.map-controls-bar').insertAdjacentHTML('beforeend','<button class="btn-map-ctrl" id="btnOffline" style="grid-column:1/-1" onclick="saveMapOffline()">📥 Sauver la carte du jour hors-ligne</button>');
$('.converter-box p').id='rateNote';
$('.expense-form').insertAdjacentHTML('beforebegin','<div class="bud-bar"><div id="budFill"></div></div><div id="budText" style="font-size:.78rem;color:var(--text-muted);margin-bottom:6px"></div>');
$('#expAmount').placeholder='Montant';
$('#expAmount').insertAdjacentHTML('afterend','<select id="expCur"><option>€</option><option>SEK</option></select>');
const PACK=["Carte d'identité / passeport en cours de validité","Cartes d'embarquement Ryanair dans l'appli + enregistrement en ligne","Petit sac cabine aux dimensions Ryanair (à vérifier dans l'appli)","Carte bancaire sans contact (Suède : quasi 100 % sans espèces)","Carte européenne d'assurance maladie (CEAM)","Chargeur + batterie externe (GPS + carte = batterie)","Veste imperméable, bonnet, gants : 5–10 °C et nuit dès 16 h","Applis SL (Stockholm) et Mobilly (Riga) installées","Carnet ouvert une fois en Wi-Fi + bouton « 📥 Carte hors-ligne » pour chaque jour"];
let packed=LS.get('rs_pack',{}); window.togglePack=i=>{packed[i]=!packed[i];LS.set('rs_pack',packed);};
$('#tab-infos').insertAdjacentHTML('afterbegin',`<div class="info-card"><h2>✅ Avant de partir</h2><p class="lead">Coche au fur et à mesure (sauvegardé sur le téléphone).</p>${PACK.map((t,i)=>`<label class="pack-row"><input type="checkbox" ${packed[i]?'checked':''} onchange="togglePack(${i})"><span>${esc(t)}</span></label>`).join('')}</div>
<div class="info-card"><h2>🆘 Essentiels sur place</h2><ul class="ess"><li><strong>Urgences :</strong> 112 (Lettonie et Suède).</li><li><strong>Décalage :</strong> Stockholm = Riga − 1 h. Changement d'heure le dimanche 25 oct. dans les deux pays.</li><li><strong>Prises :</strong> type C/F, 230 V, comme en France.</li><li><strong>Paiement :</strong> carte sans contact partout ; en Suède certains lieux refusent le cash.</li><li><strong>📲 Installer le carnet :</strong> iPhone : Safari → Partager → « Sur l'écran d'accueil ». Android : Chrome → ⋮ → « Installer l'application ».</li></ul></div>`);

/* ---------- horloge double + réseau ---------- */
const tick=()=>{ const f=z=>new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',timeZone:z}); $('#clockPill').textContent=`🇱🇻 ${f('Europe/Riga')} · 🇸🇪 ${f('Europe/Stockholm')}`; };
const net=()=>{ $('#netBar').style.display=navigator.onLine?'none':'block'; };
addEventListener('online',net); addEventListener('offline',net);

/* ---------- météo réelle (Open-Meteo, mise en cache) ---------- */
const CITY={rig:{lat:56.95,lng:24.11,n:'Riga'},sto:{lat:59.33,lng:18.07,n:'Stockholm'}};
const wmo=c=>c===0?['☀️','Dégagé']:c<=2?['🌤️','Éclaircies']:c===3?['☁️','Couvert']:c<=48?['🌫️','Brouillard']:c<=57?['🌦️','Bruine']:c<=67?['🌧️','Pluie']:c<=77?['🌨️','Neige']:c<=82?['🌦️','Averses']:c<=86?['🌨️','Averses de neige']:['⛈️','Orage'];
let wx=LS.get('rs_wx',{});
const weatherHtml=d=>{ const w=(wx[d.city]||{})[iso(d.date)]; if(!w) return `<span>${d.weather}</span>`; const [i,l]=wmo(w.code);
  return `<span>${i} ${CITY[d.city].n} : ${Math.round(w.lo)}° / ${Math.round(w.hi)}° • ${l}${w.pop>=50?' • ☔ '+w.pop+' %':''}</span><span>💨 ${Math.round(w.wind)} km/h • 🌅 ${w.sun}</span>`; };
const refreshStrip=()=>{ const d=itineraryData.find(x=>x.id===currentDayFilter); if(d) $('#weatherStrip').innerHTML=weatherHtml(d); };
async function loadWeather(){
  await Promise.all(Object.entries(CITY).map(async([k,c])=>{ try{
    const j=await(await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${c.lat}&longitude=${c.lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,sunset&timezone=auto&start_date=2026-10-24&end_date=2026-11-01`)).json();
    const D=j.daily; if(!D) return; wx[k]={};
    D.time.forEach((t,i)=>wx[k][t]={code:D.weather_code[i],hi:D.temperature_2m_max[i],lo:D.temperature_2m_min[i],pop:D.precipitation_probability_max[i],wind:D.wind_speed_10m_max[i],sun:(D.sunset[i]||'').slice(11).replace(':','h')});
  }catch(e){} }));
  LS.set('rs_wx',wx); renderDays(); refreshStrip();
}

/* ---------- distances, temps à pied, liens "Y aller" ---------- */
const dirUrl=(s,prev)=>`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=${(prev&&computeDistanceKm(prev.lat,prev.lng,s.lat,s.lng)<2.5)?'walking':'transit'}`;
const legText=(a,b)=>{ const km=computeDistanceKm(a.lat,a.lng,b.lat,b.lng)*1.3; return km>3?`${km.toFixed(1)} km : plutôt en transport`:`~${Math.max(1,Math.round(km/4.8*60))} min à pied (${km.toFixed(1)} km)`; };

/* ---------- wrappers (le code d'origine reste intact) ---------- */
const _fd=filterDay; window.filterDay=id=>{ _fd(id); refreshStrip(); };
const _rds=renderDaySelector; window.renderDaySelector=()=>{ _rds(); const t=tripIdx();
  document.querySelectorAll('#daySelector .day-pill').forEach(b=>{ const m=/filterDay\('(j\d)'\)/.exec(b.getAttribute('onclick')); if(m&&itineraryData.findIndex(d=>d.id===m[1])===t) b.insertAdjacentText('afterbegin','📍 '); }); };
const _rd=renderDays; window.renderDays=()=>{ _rd();
  const list=currentDayFilter==='all'?itineraryData:itineraryData.filter(d=>d.id===currentDayFilter);
  document.querySelectorAll('#daysContainer .day-card').forEach((card,i)=>{ const day=list[i]; if(!day) return;
    card.querySelector('.day-card-header').insertAdjacentHTML('afterend',`<div class="weather-strip wx">${weatherHtml(day)}</div>`);
    card.querySelectorAll('.step-item').forEach((row,j)=>{ const s=day.steps[j], prev=day.steps[j-1];
      const a=row.querySelector('a.btn-map'); if(a){ a.href=dirUrl(s,prev); a.textContent='🧭 Y aller'; }
      if(prev) row.querySelector('.step-actions').insertAdjacentHTML('beforebegin',`<div class="leg">🚶 ${legText(prev,s)}</div>`); }); });
  updateNextUpBanner(); };

const stepMin=s=>{ const m=/(\d{1,2})h(\d{2})?/.exec(s.time); if(m) return +m[1]*60+(+m[2]||0); const t=s.time.toLowerCase(); return t.includes('matin')?570:t.includes('après')?840:t.includes('fin de')?1020:t.includes('soir')?1140:720; };
window.updateNextUpBanner=()=>{
  const t=tripIdx(), n=new Date(), nm=n.getHours()*60+n.getMinutes();
  const order=t>=0?itineraryData.slice(t).concat(itineraryData.slice(0,t)):itineraryData;
  let D=null,S=null,I=0;
  for(const d of order){ const i=d.steps.findIndex(s=>!checkedSteps[s.id]); if(i>=0){D=d;S=d.steps[i];I=i;break;} }
  document.querySelectorAll('.step-item.now').forEach(e=>e.classList.remove('now'));
  const tag=$('#nextUpTag'), ttl=$('#nextUpTitle'), btn=$('#nextUpMapBtn');
  if(!S){ tag.textContent='🎉 Séjour 100 % complété !'; ttl.textContent='Toutes les étapes ont été cochées ❤️'; btn.onclick=()=>focusStepOnMap('j1',0); return; }
  let when=S.time;
  if(t>=0&&D===itineraryData[t]){ const df=stepMin(S)-nm; when=df>60?`dans ${Math.floor(df/60)} h ${String(df%60).padStart(2,'0')}`:df>0?`dans ${df} min`:'maintenant'; }
  tag.textContent=`🧭 Prochaine étape • ${D.shortLabel} (${when})`; ttl.textContent=S.title; btn.onclick=()=>focusStepOnMap(D.id,I);
  const row=$('#row_'+S.id); if(row) row.classList.add('now');
};

/* ---------- carte : vrais itinéraires piétons + temps de marche + hors-ligne ---------- */
async function upgradeRoute(day){
  const key='rs_route_'+day.id; let r=LS.get(key,null);
  if(!r){ try{
    const c=day.steps.map(s=>s.lng+','+s.lat).join(';');
    const j=await(await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${c}?overview=full&geometries=geojson`)).json();
    const R=j.routes&&j.routes[0]; if(j.code!=='Ok'||!R||R.distance>25000) return;
    r={pts:R.geometry.coordinates.map(p=>[+p[1].toFixed(5),+p[0].toFixed(5)])}; LS.set(key,r);
  }catch(e){return;} }
  if(!mapInstance||mapCurrentDayId!==day.id) return;
  if(routePolyline) mapInstance.removeLayer(routePolyline);
  routePolyline=L.polyline(r.pts,{color:'#2D5A4C',weight:5,opacity:.9}).addTo(mapInstance);
}
const _draw=drawDayOnMap; window.drawDayOnMap=()=>{ _draw(); const d=itineraryData.find(x=>x.id===mapCurrentDayId); if(d) upgradeRoute(d); };
const _upd=updateCouplePositionOnProgram; window.updateCouplePositionOnProgram=f=>{ _upd(f);
  const d=itineraryData.find(x=>x.id===mapCurrentDayId)||itineraryData[0], c=d.steps[mapCurrentStepIdx]||d.steps[0], n=d.steps[mapCurrentStepIdx+1];
  $('#trackerGmapsBtn').href=dirUrl(c,d.steps[mapCurrentStepIdx-1]);
  if(n) $('#trackerNextInfo').insertAdjacentHTML('beforeend',`<br><small>🚶 ${legText(c,n)}</small>`); };
window.saveMapOffline=async()=>{
  const b=$('#btnOffline'), d=itineraryData.find(x=>x.id===mapCurrentDayId), U=new Set();
  const tl=(z,la,lo)=>{const n=2**z,r=la*Math.PI/180;return[Math.floor((lo+180)/360*n),Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n)]};
  d.steps.forEach(s=>[14,15].forEach(z=>{const[x,y]=tl(z,s.lat,s.lng);for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++)U.add(`https://tile.openstreetmap.org/${z}/${x+a}/${y+c}.png`)}));
  const all=[...U]; let i=0;
  for(const u of all){ b.textContent=`📥 ${++i}/${all.length}…`; try{await fetch(u)}catch(e){} await new Promise(r=>setTimeout(r,70)); }
  b.textContent='✅ Carte du jour sauvegardée';
};

/* ---------- taux SEK en direct + budget ---------- */
let rate=parseFloat(localStorage.getItem('rs_rate'))||11.4;
window.convertFromSek=()=>{ $('#eurInput').value=((parseFloat($('#sekInput').value)||0)/rate).toFixed(2); };
window.convertFromEur=()=>{ $('#sekInput').value=Math.round((parseFloat($('#eurInput').value)||0)*rate); };
const showRate=()=>{ $('#rateNote').textContent=`1 € ≈ ${rate.toFixed(2).replace('.',',')} SEK (100 SEK ≈ ${(100/rate).toFixed(2).replace('.',',')} €)`; };
async function loadRate(){ try{ const j=await(await fetch('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=SEK')).json(); if(j.rates&&j.rates.SEK){rate=j.rates.SEK;localStorage.setItem('rs_rate',rate);} }catch(e){} showRate(); convertFromSek(); }
const BOOKED=403, CAP=1100;
window.addExpense=()=>{
  const ti=$('#expTitle'), ai=$('#expAmount'), cur=$('#expCur').value, title=ti.value.trim(); let amt=parseFloat(ai.value);
  if(!title||isNaN(amt)||amt<=0) return;
  const sek=cur==='SEK'?amt:null; if(sek) amt=amt/rate;
  customExpenses.unshift({id:Date.now(),title:sek?`${title} (${Math.round(sek)} SEK)`:title,amount:amt});
  localStorage.setItem(STORAGE_EXPENSES,JSON.stringify(customExpenses)); ti.value=ai.value=''; renderExpenses();
};
window.renderExpenses=()=>{
  const tot=customExpenses.reduce((a,e)=>a+e.amount,0), cap=CAP-BOOKED;
  $('#spentOnSiteVal').textContent=Math.round(tot)+' €';
  $('#budFill').style.width=Math.min(100,tot/cap*100)+'%';
  $('#budText').textContent=tot<=cap?`Reste ~${Math.round(cap-tot)} € sur ~${cap} € prévus sur place (≈ ${Math.round((cap-tot)*rate)} SEK)`:`⚠️ Dépassement de ${Math.round(tot-cap)} € sur le budget prévu`;
  $('#expenseList').innerHTML=customExpenses.length?customExpenses.map(e=>`<div class="expense-row"><span>${esc(e.title)}</span><div><strong>${e.amount.toFixed(2)} €</strong> <button class="btn-del" onclick="deleteExpense(${e.id})">✕</button></div></div>`).join(''):'<p style="font-size:.8rem;color:var(--text-muted);padding-top:10px">Aucune dépense enregistrée pour le moment.</p>';
};

/* ---------- démarrage ---------- */
const t0=tripIdx(); if(t0>=0){ currentDayFilter=itineraryData[t0].id; mapCurrentDayId=currentDayFilter; }
renderDaySelector(); renderMapDaySelector(); renderDays(); renderExpenses(); showRate(); refreshStrip(); tick(); net();
setInterval(tick,30000); setInterval(()=>updateNextUpBanner(),60000);
loadWeather(); loadRate();
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
