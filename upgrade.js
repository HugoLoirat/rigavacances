/* upgrade.js — Carnet Riga & Stockholm : météo réelle, hors-ligne réel, itinéraires piétons, budget SEK, étape "maintenant" */

/* ===== ITINÉRAIRE v2 : départs/retours, bibliothèque, Stockholm détaillé, Flixbus, où manger ===== */
(() => {
const D = id => itineraryData.find(d => d.id === id);
const HR = { lat: 56.9546, lng: 24.1170, q: "Baznīcas iela 1, Rīga" }; // ⚠️ coordonnées approximatives (l'adresse sert pour Google Maps)
const HS = { lat: 59.3331, lng: 17.9806, q: "Scandic Alvik, Gustavslundsvägen 153, Bromma" };
const RIX = { lat: 56.9236, lng: 23.9711, q: "Riga International Airport" };
const ARN = { lat: 59.6498, lng: 17.9238, q: "Stockholm Arlanda Airport" };
const CT = { lat: 59.3308, lng: 18.0572, q: "Cityterminalen, Klarabergsviadukten 72, Stockholm" };
const S = (id, time, title, desc, price, P) => ({ id, time, title, desc, price, lat: P.lat, lng: P.lng, q: P.q, mapQuery: encodeURIComponent(P.q || title) });
const home = (id, H, name, noStart) => { const d = D(id);
  if (!noStart) d.steps.unshift(S(id + "_h0", "Départ", "Départ : " + name, "Point de départ de la journée.", "", H));
  d.steps.push(S(id + "_h1", "Retour", "Retour : " + name, "Fin de journée : retour à pied, en transport ou en Bolt (voir le trajet juste au-dessus).", "", H)); };
const F = (n, t, p, q) => ({ n, t, p, q: q || n });

// Jour 1 : arrivée → Baznīcas iela 1 puis Vecrīga
Object.assign(D("j1").steps[0], { title: "Arrivée à RIX → Baznīcas iela 1", desc: "Bus 22 (~45 min, e-talons ou appli Mobilly) ou Bolt ~13 €. Dépôt des bagages puis départ en ville.", price: "1,50 € bus / ~13 € Bolt" });
D("j1").steps.splice(1, 0, S("j1_h0", "Dépôt", "Baznīcas iela 1 : poser les bagages", "Point de départ de la balade dans Vecrīga.", "", HR));
D("j1").tip = "💡 Alberta iela (Art nouveau) n'est pas dans la Vieille Ville : ~20 min à pied. Elle est prévue dimanche avec le musée ; si l'énergie est là samedi, ajoutez-la après Saint-Pierre.";
home("j1", HR, "Baznīcas iela 1", true);
// Jours 2, 8, 9
["j2", "j8", "j9"].forEach(id => home(id, HR, "Baznīcas iela 1"));
// Jour 3 : + Bibliothèque nationale
const d3 = D("j3"), i3 = d3.steps.findIndex(s => s.id === "j3_s2");
d3.steps[0].time = "10h30"; d3.steps[i3].time = "12h30";
d3.steps.splice(i3 + 1, 0, S("j3_s2b", "14h00", "Bibliothèque nationale (Gaismas pils)", "Le « Château de Lumière » : architecture spectaculaire et vue depuis le dernier étage (entrée libre : vérifier horaires et pièce d'identité). Traversée à pied par le Pont de Pierre.", "Gratuit", { lat: 56.943, lng: 24.0985, q: "Latvian National Library, Riga" }));
d3.tip = "📚 Bibliothèque ajoutée entre le panorama et Āgenskalns. Si vous êtes fatigués, sautez Kalnciema : c'est l'étape la plus facile à retirer. Spa / Skyline Bar dans l'onglet « Options ».";
home("j3", HR, "Baznīcas iela 1");
// Jour 4 : vol + Flixbus + centre de Stockholm
const d4 = D("j4"), g = id => d4.steps.find(s => s.id === id);
d4.title = "Mardi 27 oct. — Vol, Flixbus, centre de Stockholm & Gamla Stan";
d4.tip = "🚌 Flixbus Arlanda 11h10 → Cityterminalen 11h58 : achetez les billets à l'avance sur l'appli FlixBus. Le centre se fait à pied, prévoyez de bonnes chaussures.";
Object.assign(g("j4_s2"), { time: "14h45", title: "Gamla Stan : Stortorget & ruelles", desc: "Place Stortorget, rue Västerlånggatan, puis Mårten Trotzigs gränd (la ruelle la plus étroite). Un kanelbulle chaud en chemin." });
Object.assign(g("j4_s3"), { time: "15h55", desc: "Coucher du soleil vers 16h10 : arrivez avant. Vue sur l'Hôtel de Ville et Gamla Stan." });
Object.assign(g("j4_s4"), { time: "17h30", desc: "Köttbullar à Södermalm (~45 €/2). Option bon marché : Max ou Pressbyrån (voir « Où manger »)." });
d4.steps = [
  S("j4_a", "07h15", "Départ : Baznīcas iela 1 → aéroport RIX", "Bus 22 (~45 min) ou Bolt ~13 €. Vol à 09h55 : sur place vers 08h00.", "1,50 € bus / ~13 € Bolt", RIX),
  S("j4_b", "09h55 → 10h10", "Vol Ryanair FR4641 RIX → ARN", "Stockholm a 1 h de moins que Riga. Récupérez les bagages, puis suivez les panneaux « Buses / Bussar » vers l'arrêt du Terminal 5.", "Vol payé", ARN),
  S("j4_bb", "10h45", "Arrêt FlixBus à Arlanda : Terminal 5", "D'après Swedavia, les FlixBus s'arrêtent au Terminal 5 (≈ 4 min à pied du terminal), parfois aux Terminal 2 et 4 : l'écran indique le quai exact. Soyez-y à 10h55.", "", { lat: ARN.lat, lng: ARN.lng, q: "Arlanda Airport Terminal 5 bus stop" }),
  S("j4_c", "11h10 → 11h58", "Flixbus Arlanda → Stockholm Cityterminalen", "Arrivée à Cityterminalen (Klarabergsviadukten 72), collé à la gare centrale et à T-Centralen. Quai souvent Gate 1 : à confirmer sur le billet. Billets dans l'appli FlixBus.", "Voir FlixBus", CT),
  S("j4_d", "12h15", "Dépôt des bagages au Scandic Alvik", "Métro ligne verte T-Centralen → Alvik (~12 min). Demandez la consigne : check-in plus tard.", "SL ≈ 4 €", HS),
  S("j4_e", "13h15", "Hötorget & Hötorgshallen", "Place animée et marché couvert : falafels, sandwichs, fruits. Déjeuner pas cher.", "~10–15 € / 2", { lat: 59.3356, lng: 18.0634, q: "Hötorgshallen, Stockholm" }),
  S("j4_f", "13h50", "Drottninggatan → Sergels torg → Kungsträdgården", "Grande rue piétonne, place Sergels torg (Kulturhuset), puis le parc Kungsträdgården.", "Gratuit", { lat: 59.3326, lng: 18.0644, q: "Sergels torg, Stockholm" }),
  g("j4_s2"), g("j4_s3"), g("j4_s4")
];
home("j4", HS, "Scandic Alvik", true);
// Jours 5 et 6
D("j5").steps.find(s => s.id === "j5_s2").time = "12h15";
// Jour 5 : The Viking Museum juste après le ferry, puis le Vasa (ouvert jusqu'à 20h le mercredi)
{ const d5 = D("j5"), iv = d5.steps.findIndex(s => s.id === "j5_s4");
  d5.title = "Mercredi 28 oct. — Relève de la Garde, Ferry, Vikings & Musée Vasa";
  d5.steps[iv].time = "16h00 – 17h45";
  d5.steps.splice(iv, 0, S("j5_s3b", "14h00 – 15h45", "The Viking Museum (Djurgården)", "Exposition interactive sur la vie des Vikings, objets prêtés par le Musée d'Histoire, personnages en costume d'époque et manège-voyage « Ragnfrid's Saga » (≈ 11 min, inclus). Débarquez du ferry à Allmänna gränd (≈ 5 min à pied). Ouvert environ 10h–17h : vérifiez sur thevikingmuseum.com. Paiement sans espèces.", "~33 € / 2", { lat: 59.3266, lng: 18.0952, q: "The Viking Museum, Djurgårdsvägen 48, Stockholm" })); }
// Jour 6 : Skansen (reconstitution de la vie d'autrefois) le matin, gravlax et Kastellet décalés
{ const d6 = D("j6"), g6 = id => d6.steps.find(s => s.id === id);
  d6.title = "Jeudi 29 oct. — Skansen, Gravlax, Îlot de Kastellet & Métro d'Art";
  d6.tip = "🏡 Skansen ferme à 16h : arrivez à l'ouverture (10h) et prévoyez ~3 h. Achetez le billet en ligne (moins cher) et pensez à la carte étudiante.";
  g6("j6_s1").time = "09h30"; g6("j6_s2").time = "13h45"; g6("j6_s3").time = "15h15";
  g6("j6_s3").desc = "Photo sur Skeppsholmsbron, île de Skeppsholmen et citadelle de Kastellet. La golden hour commence vers 15h : la lumière est idéale, arrivez avant le coucher (~16h02).";
  d6.steps.splice(1, 0, S("j6_sk", "10h15 – 13h15", "Skansen : le village d'autrefois", "Musée en plein air : fermes, maisons et ateliers d'époque venus de toute la Suède, avec artisans et guides en costume (verrier, poterie, boulangerie, école de 1800…) selon les jours. Tram 7 depuis Djurgårdsbron. Ouvert 10h–16h pendant les vacances d'automne. Animations réduites hors saison : calendrier sur skansen.se. Paiement sans espèces.", "~45 € / 2", { lat: 59.3263, lng: 18.1059, q: "Skansen, Djurgårdsslätten 49-51, Stockholm" })); }
home("j5", HS, "Scandic Alvik", true);
home("j6", HS, "Scandic Alvik");
// Jour 7 : Flixbus retour + vol + retour à Baznīcas iela 1
const d7 = D("j7"), g7 = id => d7.steps.find(s => s.id === id);
Object.assign(g7("j7_s1"), { time: "10h00" });
Object.assign(g7("j7_s2"), { time: "13h00", title: "Souvenirs Fika & déjeuner léger chez Vete-Katten" });
Object.assign(g7("j7_s3"), { time: "17h30 → 22h20", title: "Arlanda & Vol Retour FR4642 (20h15)", desc: "Le FlixBus vous dépose au Terminal 5 (arrêt à ~4 min à pied) : vérifiez le terminal de votre vol sur la carte d'embarquement. Vol à 20h15, atterrissage à Riga à 22h20." });
d7.title = "Vendredi 30 oct. — Dernières balades, Flixbus & Vol Retour";
d7.tip = "🎁 Souvenirs avant 15h. Flixbus 16h50 Cityterminalen → Arlanda 17h30 (vol 20h15). Bagages : consigne du Scandic Alvik.";
d7.steps = [
  S("j7_h0", "09h00", "Départ : check-out du Scandic Alvik", "Laissez les bagages à la réception jusqu'à 15h30, puis métro vers le centre.", "", HS),
  g7("j7_s1"), g7("j7_s2"),
  S("j7_b", "15h30", "Récupérer les bagages au Scandic Alvik", "Métro T-Centralen → Alvik (~12 min), puis retour vers Cityterminalen.", "SL ≈ 4 €", HS),
  S("j7_c", "16h20 → 16h50", "Flixbus Cityterminalen → Arlanda (16h50 → 17h30)", "Départ de Cityterminalen (Klarabergsviadukten 72, collé à T-Centralen), quai souvent Gate 1 : à confirmer sur le billet ou l'écran. Soyez-y 15 min avant. Billets dans l'appli FlixBus.", "Voir FlixBus", CT),
  g7("j7_s3"),
  S("j7_d", "22h20", "Retour à Baznīcas iela 1", "Bus 22 (vérifier le dernier départ) ou Bolt ~13–17 € de nuit.", "1,50 € bus / ~15 € Bolt", HR)
];
// Où manger (rapide & pas cher) — à vérifier sur place (horaires / prix)
D("j1").food = [F("Lido Vecrīga", "Buffet letton self-service", "8–12 €/pers", "Lido Vecrīga, Rīga"), F("Pelmeņi XL", "Raviolis lettons à emporter", "4–7 €", "Pelmeņi XL, Rīga"), F("Mārtiņa Beķereja", "Boulangerie, pâtisseries", "2–5 €", "Mārtiņa Beķereja, Rīga"), F("Čili Pica", "Pizza locale", "6–10 €", "Čili Pica, Rīga")];
D("j2").food = [F("Rocket Bean Roastery", "Café, brunch, pâtisseries", "6–12 €", "Rocket Bean Roastery, Rīga"), F("Mārtiņa Beķereja", "Boulangerie, sandwichs", "2–5 €", "Mārtiņa Beķereja, Rīga"), F("Čili Pica", "Pizza locale", "6–10 €", "Čili Pica, Rīga"), F("Rimi (supermarché)", "Pique-nique, salades, plats préparés", "3–7 €", "Rimi, Rīga")];
D("j3").food = [F("Marché central : pavillons", "Soupes, pīrāgi, poisson fumé, pelmeņi", "3–8 €", "Rīgas Centrāltirgus"), F("Āgenskalna tirgus", "Halle gourmande, stands variés", "6–12 €", "Āgenskalna tirgus"), F("Pelmeņi XL", "Raviolis lettons à emporter", "4–7 €", "Pelmeņi XL, Rīga"), F("Lido Vecrīga", "Buffet letton self-service", "8–12 €/pers", "Lido Vecrīga, Rīga")];
D("j8").food = [F("Boulangeries de Jomas iela", "Pâtisseries, sandwichs", "2–6 €", "bakery Jomas iela Jūrmala"), F("Rimi / Maxima à Majori", "Pique-nique pour la plage", "4–8 €", "Rimi Majori Jūrmala"), F("Pancakes sur Jomas iela", "Crêpes sucrées ou salées", "5–9 €", "pancakes Jomas iela Jūrmala")];
D("j9").food = [F("Rocket Bean Roastery", "Brunch (déjà prévu)", "6–12 €", "Rocket Bean Roastery, Rīga"), F("Lido Vecrīga", "Buffet letton self-service", "8–12 €/pers", "Lido Vecrīga, Rīga"), F("Pelmeņi XL", "Raviolis lettons à emporter", "4–7 €", "Pelmeņi XL, Rīga")];
D("j4").food = [F("Hötorgshallen", "Marché couvert : falafel, sandwichs, fruits", "8–12 €", "Hötorgshallen, Stockholm"), F("Pressbyrån", "Hot-dogs et sandwichs de kiosque", "3–6 €", "Pressbyrån, Stockholm"), F("Max Burgers", "Fast-food suédois, menu complet", "9–11 €", "Max Burgers, Stockholm"), F("Dagens lunch", "Menu du jour en semaine, 11h–14h (plat + salade + café)", "10–14 €", "dagens lunch Stockholm centrum")];
D("j5").food = [F("Fabrique (Gamla Stan)", "Kanelbullar et pains frais", "3–5 €", "Fabrique Gamla Stan, Stockholm"), F("Pressbyrån", "Hot-dogs et sandwichs de kiosque", "3–6 €", "Pressbyrån, Stockholm"), F("Max Burgers", "Fast-food suédois, menu complet", "9–11 €", "Max Burgers, Stockholm"), F("ICA / Coop", "Salades et plats préparés", "5–9 €", "ICA Supermarket, Stockholm")];
D("j6").food = [F("Östermalms Saluhall", "Halle chic : partagez un plat ou une assiette", "15–25 €", "Östermalms Saluhall, Stockholm"), F("Hötorgshallen", "Moins cher que Östermalm", "8–12 €", "Hötorgshallen, Stockholm"), F("Dagens lunch", "Menu du jour en semaine, 11h–14h", "10–14 €", "dagens lunch Stockholm centrum"), F("ICA / Coop", "Salades et plats préparés", "5–9 €", "ICA Supermarket, Stockholm")];
D("j7").food = [F("Vete-Katten", "Fika, pâtisseries (déjà prévu)", "6–10 €", "Vete-Katten, Stockholm"), F("Pressbyrån", "Sandwichs avant le bus", "3–6 €", "Pressbyrån, Stockholm"), F("Max Burgers", "Repas rapide", "9–11 €", "Max Burgers, Stockholm")];

const st = document.createElement("style");
st.textContent = `.food-box{margin-top:12px;background:var(--bg-sage-light);border-radius:12px;padding:10px 12px;font-size:.8rem;color:var(--accent-forest)}.food-row{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:6px 0;border-top:1px dashed #CFE0D7;color:var(--text-main)}.food-row span{color:var(--text-muted);display:block;font-size:.74rem}.food-row em{font-style:normal;font-weight:700;margin-right:6px}`;
document.head.appendChild(st);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
window.dayHook = (card, day) => { if (!day.food) return;
  card.insertAdjacentHTML("beforeend", `<div class="food-box"><strong>🍴 Où manger (rapide & pas cher)</strong>${day.food.map(f => `<div class="food-row"><div><b>${esc(f.n)}</b><span>${esc(f.t)}</span></div><div><em>${esc(f.p)}</em><a class="btn-map" target="_blank" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.q)}">📍</a></div></div>`).join("")}</div>`); };
})();
(() => {
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS = { get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}, set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}} };
const START = new Date(2026, 9, 24);
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const tripIdx = () => { const n=new Date(); const i=Math.round((new Date(n.getFullYear(),n.getMonth(),n.getDate())-START)/864e5); return i>=0&&i<itineraryData.length?i:-1; };

/* ---------- données ---------- */
itineraryData.forEach((d,i)=>{ d.date=new Date(2026,9,24+i); d.city=['j4','j5','j6','j7'].includes(d.id)?'sto':'rig'; });


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
const kmBetween=(a,b)=>computeDistanceKm(a.lat,a.lng,b.lat,b.lng)*1.3;
const ptq=p=>p.q?encodeURIComponent(p.q):p.lat+','+p.lng;
const mapsUrl=(s,o,mode)=>`https://www.google.com/maps/dir/?api=1${o?'&origin='+ptq(o):''}&destination=${ptq(s)}&travelmode=${mode}`;
const legHtml=(a,b)=>{ const km=kmBetween(a,b), min=Math.max(1,Math.round(km/4.8*60)), sto=b.lat>58;
  if(km>25) return '🚌 Trajet longue distance : voir les horaires de l’étape';
  if(km<1.2) return `🚶 ~${min} min (${km.toFixed(1)} km)`;
  const lo=sto?Math.max(7,3.5+1.5*km):Math.max(3,1.5+0.7*km);
  return `${km<3?`🚶 ~${min} min · `:''}🚕 Bolt ≈ ${Math.round(lo)}–${Math.round(lo*1.35)} € · <a href="${mapsUrl(b,a,'transit')}" target="_blank">🚌 Bus/tram ${sto?'≈ 4 € (SL)':'1,50 €'} : itinéraire</a>`; };

/* ---------- wrappers (le code d'origine reste intact) ---------- */
const _fd=filterDay; window.filterDay=id=>{ _fd(id); refreshStrip(); };
const _rds=renderDaySelector; window.renderDaySelector=()=>{ _rds(); const t=tripIdx();
  document.querySelectorAll('#daySelector .day-pill').forEach(b=>{ const m=/filterDay\('(j\d)'\)/.exec(b.getAttribute('onclick')); if(m&&itineraryData.findIndex(d=>d.id===m[1])===t) b.insertAdjacentText('afterbegin','📍 '); }); };
const _rd=renderDays; window.renderDays=()=>{ _rd();
  const list=currentDayFilter==='all'?itineraryData:itineraryData.filter(d=>d.id===currentDayFilter);
  document.querySelectorAll('#daysContainer .day-card').forEach((card,i)=>{ const day=list[i]; if(!day) return;
    card.querySelector('.day-card-header').insertAdjacentHTML('afterend',`<div class="weather-strip wx">${weatherHtml(day)}</div>`);
    if(window.dayHook) window.dayHook(card,day); card.querySelectorAll('.step-item').forEach((row,j)=>{ const s=day.steps[j], prev=day.steps[j-1];
      const a=row.querySelector('a.btn-map'); if(a){ a.href=mapsUrl(s,null,(prev&&kmBetween(prev,s)<3)?'walking':'transit'); a.textContent='🧭 Y aller'; }
      if(prev) row.querySelector('.step-actions').insertAdjacentHTML('beforebegin',`<div class="leg">${legHtml(prev,s)}</div>`); }); });
  updateNextUpBanner(); };

const stepMin=s=>{ const m=/(\d{1,2})h(\d{2})?/.exec(s.time); if(m) return +m[1]*60+(+m[2]||0); const t=s.time.toLowerCase(); return t.includes('retour')?1260:t.includes('départ')||t.includes('dépôt')?480:t.includes('matin')?570:t.includes('après')?840:t.includes('fin de')?1020:t.includes('soir')?1140:720; };
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

/* ---------- carte : un tracé précis pour CHAQUE trajet (marche, route, bus/train, vol) ---------- */
const GREEN='#2D5A4C', TERRA='#C85A32';
const AIR=[{lat:56.9236,lng:23.9711,n:'RIX'},{lat:59.6498,lng:17.9238,n:'ARN'}];
const hav=(a,b)=>computeDistanceKm(a.lat,a.lng,b.lat,b.lng);
const nearAir=p=>AIR.reduce((m,x)=>hav(p,x)<hav(p,m)?x:m,AIR[0]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const fmtMin=s=>{ const m=Math.max(1,Math.round(s/60)); return m>=60?Math.floor(m/60)+' h '+String(m%60).padStart(2,'0'):m+' min'; };
const PROV={
  foot:['https://routing.openstreetmap.de/routed-foot/route/v1/foot/','https://routing.openstreetmap.de/routed-bike/route/v1/bike/','https://router.project-osrm.org/route/v1/driving/'],
  car:['https://routing.openstreetmap.de/routed-car/route/v1/driving/','https://router.project-osrm.org/route/v1/driving/']
};
const legKey=(m,a,b)=>`rs_leg4_${m}_${a.lat.toFixed(4)},${a.lng.toFixed(4)}_${b.lat.toFixed(4)},${b.lng.toFixed(4)}`;

/* découpe une journée en trajets : chaque paire d'étapes a son propre tracé */
function legsOf(day){
  const out=[], st=day.steps;
  for(let i=1;i<st.length;i++){
    const a=st[i-1], b=st[i], km=hav(a,b), push=(mode,p,q)=>out.push({i:i-1,mode,a:p,b:q,km:hav(p,q),ta:a.title,tb:b.title});
    if(km<0.08){ push('none',a,b); continue; }
    if(km>300){                      // vol : arc aérien + trajets au sol aux deux bouts
      const a2=nearAir(a), b2=nearAir(b);
      if(hav(a,a2)>0.4) push(hav(a,a2)>8?'car':'foot',a,a2);
      push('air',a2,b2);
      if(hav(b2,b)>0.4) push(hav(b2,b)>8?'car':'foot',b2,b);
    } else push(km>8?'car':'foot',a,b);
  }
  return out;
}

/* arc de vol (calculé dans l'espace Mercator pour qu'il paraisse courbe sur la carte) */
const mY=la=>Math.asinh(Math.tan(la*Math.PI/180))*180/Math.PI, mLat=y=>Math.atan(Math.sinh(y*Math.PI/180))*180/Math.PI;
function arc(a,b){
  const x1=a.lng,y1=mY(a.lat),x2=b.lng,y2=mY(b.lat), dx=x2-x1, dy=y2-y1, len=Math.hypot(dx,dy)||1;
  let nx=-dy/len, ny=dx/len; if(ny<0){ nx=-nx; ny=-ny; }
  const h=0.18*len, pts=[];
  for(let k=0;k<=56;k++){ const t=k/56, s=Math.sin(Math.PI*t)*h; pts.push([mLat(y1+dy*t+ny*s), x1+dx*t+nx*s]); }
  return pts;
}

/* récupération d'un tracé réel (plusieurs serveurs en secours, cache local, déduplication) */
const legMem=new Map(), inflight=new Map();
async function osrm(base,a,b,ms){
  const ac=new AbortController(), to=setTimeout(()=>ac.abort(),ms);
  try{
    const r=await fetch(`${base}${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`,{signal:ac.signal});
    if(!r.ok) throw new Error('http');
    const j=await r.json(), R=j.routes&&j.routes[0];
    if(j.code!=='Ok'||!R||!R.geometry||R.geometry.coordinates.length<2) throw new Error('vide');
    return R;
  } finally { clearTimeout(to); }
}
function cached(leg){
  const k=legKey(leg.mode,leg.a,leg.b);
  if(legMem.has(k)) return legMem.get(k);
  const v=LS.get(k,null); if(v&&v.p&&v.p.length>1){ legMem.set(k,v); return v; }
  return null;
}
function fetchLeg(leg){
  const k=legKey(leg.mode,leg.a,leg.b), hit=cached(leg); if(hit) return Promise.resolve(hit);
  if(inflight.has(k)) return inflight.get(k);
  const p=(async()=>{
    for(const base of PROV[leg.mode]){
      try{
        const R=await osrm(base,leg.a,leg.b,9000);
        if(R.distance/1000>leg.km*3.5+2) continue;                   // mauvais accrochage : on essaie le serveur suivant
        const walk=leg.mode==='foot';
        const o={ p:R.geometry.coordinates.map(c=>[+c[1].toFixed(5),+c[0].toFixed(5)]), d:Math.round(R.distance), t:walk?Math.round(R.distance/1.33):Math.round(R.duration) };
        legMem.set(k,o); LS.set(k,o); return o;
      }catch(e){}
    }
    return null;
  })().finally(()=>inflight.delete(k));
  inflight.set(k,p); return p;
}
const geomOf=leg=>leg.mode==='air'?(leg.pts||(leg.pts=arc(leg.a,leg.b))):(cached(leg)?cached(leg).p:[[leg.a.lat,leg.a.lng],[leg.b.lat,leg.b.lng]]);

/* libellé au clic sur un tracé */
function labelOf(leg){
  const d=cached(leg), km=d?d.d/1000:leg.km*1.25, kms=km>=10?Math.round(km)+' km':km.toFixed(1).replace('.',',')+' km';
  if(leg.mode==='air') return `✈️ Vol ${leg.a.n} → ${leg.b.n} · ${Math.round(leg.km)} km · ${leg.km>400?'≈ 1 h 15':'≈ 1 h'}`;
  const txt=(leg.ta+' '+leg.tb).toLowerCase();
  if(leg.mode==='car'&&km>15&&/flixbus/.test(txt)) return `🚌 FlixBus · ${kms}${d?' · ≈ '+fmtMin(d.t):''}`;
  if(leg.mode==='car'&&km>15&&/train/.test(txt)) return `🚆 Train · ${kms} · ≈ 30 min`;
  if(leg.mode==='car') return `🚌 Bus / 🚕 Bolt · ${kms}${d?' · ≈ '+fmtMin(d.t):''}`;
  return `🚶 À pied · ${kms}${d?' · ≈ '+fmtMin(d.t):''}`;
}

/* dessin : tous les traits sont pleins, jamais en pointillés */
let RG=null, RTOK=0, RDAY=null, RLEGS=[], RMSG=null;
function paintLeg(leg){
  if(!RG) return;
  if(leg.layer){ RG.removeLayer(leg.layer); leg.layer=null; }
  if(leg.mode==='none') return;
  const real=leg.mode==='air'||!!cached(leg), pts=geomOf(leg), air=leg.mode==='air', col=air?TERRA:GREEN;
  const casing=L.polyline(pts,{color:'#fff',weight:9,opacity:real?.7:.35,lineCap:'round',lineJoin:'round',interactive:false});
  const line=L.polyline(pts,{color:col,weight:real?5:4,opacity:real?.95:.5,lineCap:'round',lineJoin:'round'}).bindPopup(()=>labelOf(leg));
  const parts=[casing,line];
  if(air){
    const m=pts[Math.floor(pts.length/2)], p0=pts[Math.floor(pts.length/2)-2], p1=pts[Math.floor(pts.length/2)+2];
    const ang=Math.atan2(mY(p1[0])-mY(p0[0]),p1[1]-p0[1])*180/Math.PI;
    const ic=L.divIcon({className:'',html:`<div style="font-size:22px;line-height:28px;text-align:center;transform:rotate(${(45-ang).toFixed(0)}deg);filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))">✈️</div>`,iconSize:[28,28],iconAnchor:[14,14]});
    parts.push(L.marker(m,{icon:ic,interactive:true,keyboard:false}).bindPopup(()=>labelOf(leg)));
  }
  leg.layer=L.featureGroup(parts).addTo(RG);
}
function routeStatus(){
  if(!RMSG) return;
  const g=RLEGS.filter(l=>l.mode==='foot'||l.mode==='car'), ok=g.filter(l=>cached(l)).length, air=RLEGS.some(l=>l.mode==='air');
  RMSG.innerHTML=!g.length?(air?'✈️ Trajet en avion tracé sur la carte':''):ok===g.length?`✅ Trajets précis sur les routes${air?' · ✈️ vol en arc':''} <small>(touchez un tracé pour la durée)</small>`:
    navigator.onLine?`⏳ Tracé des routes… ${ok}/${g.length}`:`📴 Hors-ligne : ${ok}/${g.length} trajets précis en mémoire. <a href="#" onclick="retryRoutes();return false" style="color:var(--accent-terra-dark)">Réessayer</a>`;
}
async function loadLegs(tok,attempt){
  const todo=RLEGS.filter(l=>(l.mode==='foot'||l.mode==='car')&&!cached(l));
  for(const l of todo){
    if(tok!==RTOK) return;
    const r=await fetchLeg(l); if(tok!==RTOK) return;
    if(r){ paintLeg(l); routeStatus(); } await sleep(90);
  }
  if(tok!==RTOK) return;
  routeStatus();
  const left=RLEGS.filter(l=>(l.mode==='foot'||l.mode==='car')&&!cached(l)).length;
  if(left&&attempt<4&&navigator.onLine){ await sleep(2500*attempt); if(tok===RTOK) loadLegs(tok,attempt+1); }
}
window.retryRoutes=()=>{ if(RDAY){ const tok=++RTOK; routeStatus(); loadLegs(tok,1); } };
function paintRoute(day){
  const tok=++RTOK; RDAY=day.id; RLEGS=legsOf(day);
  if(routePolyline&&mapInstance) mapInstance.removeLayer(routePolyline);
  RG=L.featureGroup().addTo(mapInstance); routePolyline=RG;
  if(!RMSG){ const box=$('#voyageMap'); box.insertAdjacentHTML('afterend','<div id="routeStat" style="font-size:.74rem;color:var(--text-muted);margin-top:8px;min-height:1.1em"></div>'); RMSG=$('#routeStat'); }
  RLEGS.forEach(paintLeg); routeStatus(); loadLegs(tok,1);
}
/* préchargement silencieux de tous les jours : les tracés restent disponibles hors-ligne */
let prefetching=false;
async function prefetchAll(){
  if(prefetching||!navigator.onLine) return; prefetching=true;
  try{ for(const d of itineraryData){ for(const l of legsOf(d)){ if((l.mode==='foot'||l.mode==='car')&&!cached(l)){ await fetchLeg(l); await sleep(250); } } } }catch(e){}
  prefetching=false;
}
window.addEventListener('online',()=>{ net(); retryRoutes(); setTimeout(prefetchAll,1500); });

const _draw=drawDayOnMap; window.drawDayOnMap=()=>{ _draw(); const d=itineraryData.find(x=>x.id===mapCurrentDayId); if(d) paintRoute(d); };

/* suit le trajet : caméra cadrée sur le parcours + le couple se déplace le long de la vraie route */
let lastPos=null, animTok=0;
function followLeg(dayId,i,reverse){
  if(RDAY!==dayId||!mapInstance) return;
  let legs=RLEGS.filter(l=>l.i===i&&l.mode!=='none'); if(!legs.length) return;
  let pts=[]; (reverse?legs.slice().reverse():legs).forEach(l=>{ let g=geomOf(l); if(reverse) g=g.slice().reverse(); pts=pts.concat(g); });
  if(pts.length<2) return;
  mapInstance.flyToBounds(L.latLngBounds(pts),{padding:[46,46],maxZoom:15,duration:.9});
  if(!coupleMarker) return;
  const cum=[0]; for(let k=1;k<pts.length;k++) cum.push(cum[k-1]+hav({lat:pts[k-1][0],lng:pts[k-1][1]},{lat:pts[k][0],lng:pts[k][1]}));
  const tot=cum[cum.length-1], dur=Math.min(1900,700+tot*30), t0=performance.now(), tok=++animTok, end=pts[pts.length-1];
  coupleMarker.setLatLng(pts[0]);
  const step=now=>{
    if(tok!==animTok) return;
    let u=Math.min(1,(now-t0)/dur); const e=u<.5?2*u*u:1-Math.pow(-2*u+2,2)/2, target=e*tot;
    let k=1; while(k<cum.length-1&&cum[k]<target) k++;
    const seg=(cum[k]-cum[k-1])||1, f=Math.min(1,Math.max(0,(target-cum[k-1])/seg));
    coupleMarker.setLatLng(u>=1?end:[pts[k-1][0]+(pts[k][0]-pts[k-1][0])*f, pts[k-1][1]+(pts[k][1]-pts[k-1][1])*f]);
    if(u<1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
const _upd=updateCouplePositionOnProgram; window.updateCouplePositionOnProgram=f=>{
  animTok++; const prev=lastPos; _upd(f);
  const d=itineraryData.find(x=>x.id===mapCurrentDayId)||itineraryData[0], c=d.steps[mapCurrentStepIdx]||d.steps[0], n=d.steps[mapCurrentStepIdx+1];
  lastPos={day:d.id,idx:mapCurrentStepIdx};
  $('#trackerGmapsBtn').href=mapsUrl(c,null,'walking');
  if(n) $('#trackerNextInfo').insertAdjacentHTML('beforeend',`<br><small>${legHtml(c,n)}</small>`);
  if(!f&&prev&&prev.day===d.id&&Math.abs(mapCurrentStepIdx-prev.idx)===1&&gpsWatchId===null){
    followLeg(d.id,Math.min(prev.idx,mapCurrentStepIdx),mapCurrentStepIdx<prev.idx);
  }
};
window.fitDayOnMap=()=>{
  const d=itineraryData.find(x=>x.id===mapCurrentDayId); if(!d||!mapInstance) return;
  stopAutoPlay(); animTok++;
  let pts=[]; RLEGS.forEach(l=>{ if(l.mode!=='none') pts=pts.concat(geomOf(l)); });
  if(!pts.length) pts=d.steps.map(s=>[s.lat,s.lng]);
  mapInstance.flyToBounds(L.latLngBounds(pts),{padding:[36,36],maxZoom:15,duration:.9});
};
$('#btnOffline').insertAdjacentHTML('beforebegin','<button class="btn-map-ctrl" id="btnFitDay" style="grid-column:1/-1" onclick="fitDayOnMap()">🗺️ Voir tout le parcours du jour</button>');
window.saveMapOffline=async()=>{
  const b=$('#btnOffline'), d=itineraryData.find(x=>x.id===mapCurrentDayId), U=new Set();
  const tl=(z,la,lo)=>{const n=2**z,r=la*Math.PI/180;return[Math.floor((lo+180)/360*n),Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*n)]};
  d.steps.forEach(s=>[14,15].forEach(z=>{const[x,y]=tl(z,s.lat,s.lng);for(let a=-1;a<=1;a++)for(let c=-1;c<=1;c++)U.add(`https://tile.openstreetmap.org/${z}/${x+a}/${y+c}.png`)}));
  RLEGS.forEach(l=>{ if(l.mode==='air') return; const g=geomOf(l); for(let k=0;k<g.length;k+=Math.max(1,Math.floor(g.length/40))){ const[x,y]=tl(14,g[k][0],g[k][1]); U.add(`https://tile.openstreetmap.org/14/${x}/${y}.png`); } });
  const all=[...U].slice(0,420); let i=0;
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
loadWeather(); loadRate(); setTimeout(prefetchAll,4000);
if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
