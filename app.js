const VER=22,TILES="hdl-tiles-v1";const $=s=>document.querySelector(s),f=n=>Math.round(n).toLocaleString("en"),esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const near=k=>P.reduce((a,b)=>Math.abs(b[3]-k)<Math.abs(a[3]-k)?b:a);
const seg=(a,b)=>P.filter(p=>p[3]>=a&&p[3]<=b).map(p=>[p[0],p[1]]);
const map=L.map("map",{zoomControl:false});
map.setView([P[0][0],P[0][1]],12);
L.control.zoom({position:"bottomright"}).addTo(map);
// maxNativeZoom matches the offline download (zoom 11 to 15); past 15 Leaflet scales the saved tiles instead of showing a blank map.
L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",{maxZoom:17,maxNativeZoom:15,subdomains:"abc",attribution:"© OpenTopoMap, © OSM"}).addTo(map);
const rl=L.layerGroup().addTo(map),hll=L.layerGroup().addTo(map);
L.polyline(seg(0,99),{color:"#0b2a12",weight:8,opacity:.85}).addTo(rl);
const all=L.polyline(seg(0,99),{opacity:0,weight:0,interactive:false}).addTo(map);
const DC=["#7CFC00","#ff3df2","#00e5ff","#ff8a00","#b388ff"];D.forEach((d,i)=>{d.c=DC[i];L.polyline(seg(d.a,i<D.length-1?d.b+.2:d.b),{color:d.c,weight:4,opacity:1}).addTo(rl)});
const hl=L.layerGroup().addTo(map),water=L.layerGroup().addTo(map);
map.fitBounds(all.getBounds(),{padding:[20,20]});
// water (W comes from data.js, looked up once from OpenStreetMap)
let WP=[],lastLL=null;
W.forEach(w=>{L.marker([w.lat,w.lng],{icon:L.divIcon({className:"wat",html:"💧",iconSize:[20,20]})}).bindPopup(esc(w.n)+"<br><small>"+w.d+" m from the trail. Treat all water before drinking.</small>").addTo(water);WP.push({km:w.km,name:w.n,off:w.d})});
WP.sort((a,b)=>a.km-b.km);WP=WP.filter((w,i)=>!i||w.km-WP[i-1].km>.15);
let lOn=true;$("#lns").onclick=()=>{lOn=!lOn;[rl,hll].forEach(g=>lOn?g.addTo(map):g.remove());$("#lns").style.opacity=lOn?1:.45};
let wOn=true;$("#wtr").onclick=()=>{wOn=!wOn;wOn?water.addTo(map):water.remove();$("#wtr").style.opacity=wOn?1:.45};
function toast(t,ms){const e=$("#toast");e.textContent=t;e.style.display="block";setTimeout(()=>e.style.display="none",ms||4000)}
// compass (true north) and elevation
const DECL=15;// approx. magnetic declination, degrees east, Olympic Peninsula
const CARD=["N","NE","E","SE","S","SW","W","NW"];
function setHd(h){const t=(h+DECL+360)%360;$("#dial").style.transform=`rotate(${-t}deg)`;$("#hd").textContent=Math.round(t)+"° "+CARD[Math.round(t/45)%8]}
// iOS gives a compass heading directly. Elsewhere, absolute alpha is the rotation about vertical, so 360-alpha is the heading of the phone's top edge while it is held face up.
function onOri(e){let h;if(e.webkitCompassHeading!=null)h=e.webkitCompassHeading;else if(e.alpha!=null&&(e.absolute||e.type=="deviceorientationabsolute"))h=(360-e.alpha)%360;else return;setHd(h)}
let cmpOn=false;async function startCmp(){if(cmpOn)return;try{if(typeof DeviceOrientationEvent!="undefined"&&DeviceOrientationEvent.requestPermission&&await DeviceOrientationEvent.requestPermission()!="granted"){toast("Compass permission denied.");return}
 addEventListener("deviceorientationabsolute",onOri,true);addEventListener("deviceorientation",onOri,true);cmpOn=true;setTimeout(()=>{if($("#hd").textContent=="–°")toast("No compass sensor found. It works on a phone.")},3000)}catch(_){toast("Compass unavailable on this device.")}}
$("#cmp").onclick=startCmp;if(!(typeof DeviceOrientationEvent!="undefined"&&DeviceOrientationEvent.requestPermission))startCmp();
function routeElev(ll){let best=null;const c=Math.cos(ll.lat*Math.PI/180);for(let i=0;i<P.length-1;i++){const A=P[i],B=P[i+1],ax=(A[1]-ll.lng)*c,ay=A[0]-ll.lat,dx=(B[1]-A[1])*c,dy=B[0]-A[0],l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,-(ax*dx+ay*dy)/l)):0,d=Math.hypot(ax+t*dx,ay+t*dy)*111320;if(!best||d<best.d)best={d,e:A[2]+t*(B[2]-A[2]),km:A[3]+t*(B[3]-A[3])}}return best}
function updElev(e){const r=routeElev(e.latlng);let t;if(r.d<50)t=f(r.e)+" m <small>on trail</small>";else if(e.altitude!=null)t="≈"+f(e.altitude)+" m <small>GPS, approx.</small>";else t="<small>Elevation unavailable</small>";$("#elv").innerHTML="⛰ "+t}
// location
let me,acc,first=true;
function onFix(e){const ll=e.latlng;updElev(e);updProg(e.latlng);me?(me.setLatLng(ll),acc.setLatLng(ll).setRadius(e.accuracy)):(acc=L.circle(ll,{radius:e.accuracy,weight:1,color:"#2b7fff",fillOpacity:.12}).addTo(map),me=L.circleMarker(ll,{radius:8,color:"#fff",weight:3,fillColor:"#2b7fff",fillOpacity:1}).addTo(map));
 if(first){first=false;if(map.distance(ll,all.getBounds().getCenter())<60000)map.setView(ll,15);else toast("You're far from the route, so the map stays on the trail.")}}
map.on("locationfound",onFix);map.on("locationerror",()=>{if(first){first=false;toast("Location unavailable. Showing the route.")}});
map.locate({watch:true,enableHighAccuracy:true});
$("#loc").onclick=()=>me?map.setView(me.getLatLng(),Math.max(map.getZoom(),15)):map.locate({watch:true,enableHighAccuracy:true});
// sheet
const tabs=["All",...D.map((_,i)=>"Day "+(i+1))];
$("#tabs").innerHTML=tabs.map((n,i)=>`<button role="tab" onclick="show(${i})">${n}</button>`).join("");
function prof(d){const q=P.filter(p=>p[3]>=d.a&&p[3]<=d.b),lo=Math.min(...q.map(p=>p[2]))-30,hi=Math.max(...q.map(p=>p[2]))+30,W=320,H=110;
 const x=k=>8+(k-d.a)/(d.b-d.a)*(W-16),y=e=>H-16-(e-lo)/(hi-lo)*(H-30);
 return `<svg class="pr" viewBox="0 0 ${W} ${H}"><path d="M${x(d.a)},${H-16} ${q.map(p=>`L${x(p[3]).toFixed(1)},${y(p[2]).toFixed(1)}`).join(" ")} L${x(d.b)},${H-16}Z" fill="${d.c}" fill-opacity=".25" stroke="${d.c}" stroke-width="2"/><text x="8" y="${H-3}" font-size="9" fill="var(--mut)">${f(lo+30)} to ${f(hi-30)} m, ${d.a.toFixed(1)} to ${d.b.toFixed(1)} km</text></svg>`}
const SY={s:"▶",e:"⚑",c:"⛺",p:"★"},kd=(d,j)=>j==0?"s":j==d.st.length-1?"e":d.st[j][3]?"c":"p";
const today=()=>{const t=new Date();return t.getFullYear()+"-"+String(t.getMonth()+1).padStart(2,"0")+"-"+String(t.getDate()).padStart(2,"0")},sdv=()=>localStorage.sd||today();
const MUL={r:1.4,n:1,f:.8};let cur=0;
const gain=(a,b)=>{let up=0,ref=null;P.forEach(p=>{if(p[3]<a||p[3]>b)return;if(ref==null)ref=p[2];const df=p[2]-ref;if(df>=4){up+=df;ref=p[2]}else if(df<=-4)ref=p[2]});return up};
const hrs=(a,b)=>((b-a)/5+gain(a,b)/600)*MUL[localStorage.pace||"r"];
const hm=h=>{const m=Math.round(h*60/5)*5;return Math.floor(m/60)+" h "+String(m%60).padStart(2,"0")+" m"};
D.forEach(d=>{d.up=gain(d.a,d.b);d.dn=Math.max(0,d.up-(near(d.b)[2]-near(d.a)[2]))});
function sun(ms,lat,lon){const r=Math.PI/180,jd=ms/864e5+2440587.5,n=Math.ceil(jd-2451545+8e-4),Js=n-lon/360,M=(357.5291+.98560028*Js)%360,C=1.9148*Math.sin(M*r)+.02*Math.sin(2*M*r)+3e-4*Math.sin(3*M*r),lam=(M+C+180+102.9372)%360,Jt=2451545+Js+.0053*Math.sin(M*r)-.0069*Math.sin(2*lam*r),dl=Math.asin(Math.sin(lam*r)*Math.sin(23.4397*r)),w=Math.acos((Math.sin(-.833*r)-Math.sin(lat*r)*Math.sin(dl))/(Math.cos(lat*r)*Math.cos(dl)))/r/360;return[(Jt-w-2440587.5)*864e5,(Jt+w-2440587.5)*864e5]}
function sunLine(i){const sd=sdv();const[a,b]=sun(Date.parse(sd)+(i-1)*864e5,P[0][0],P[0][1]),t=x=>new Date(x).toLocaleTimeString("en-US",{timeZone:"America/Los_Angeles",hour:"numeric",minute:"2-digit"});return`<p style="margin:6px 0"><small>☀ Sunrise ${t(a)} · Sunset ${t(b)} · ${hm((b-a)/36e5)} of daylight</small></p>`}
function updProg(ll){lastLL=ll;const r=routeElev(ll),el=$("#prg");el.style.display="block";
 if(r.d>100){el.innerHTML="<small>Off the trail ("+f(r.d)+" m away). Progress shows when you're on it.</small>";return}
 const d=D.find(x=>r.km>=x.a&&r.km<=x.b)||D[D.length-1],w=WP.find(x=>x.km>r.km+.05);
 el.innerHTML=`<b>Day ${D.indexOf(d)+1}</b> · ${(r.km-d.a).toFixed(1)} km done, ${(d.b-r.km).toFixed(1)} km left<br><small>↑ ${f(gain(r.km,d.b))} m to climb · about ${hm(hrs(r.km,d.b))} left today</small>`+(WP.length?`<br><small>💧 ${w?`${esc(w.name)} in ${(w.km-r.km).toFixed(1)} km`+(w.off>30?`, ${f(w.off)} m off trail`:""):"No mapped water ahead"}</small>`:"")}
// Test location: only when the page is opened with ?test, so a long press on the map cannot replace the real GPS fix on the trail.
if(/[?&]test/.test(location.search))map.on("contextmenu",e=>{onFix({latlng:e.latlng,accuracy:15,altitude:null});toast("Test location set. Right-click or long-press the map to move it.")});
const sum=k=>D.reduce((a,d)=>a+d[k],0);
function show(i){cur=i;document.querySelectorAll("#tabs button").forEach((b,j)=>b.setAttribute("aria-selected",j==i));hl.clearLayers();hll.clearLayers();let h;
 if(!i){map.fitBounds(all.getBounds(),{padding:[20,20]});
  h=`<h2>High Divide and Appleton Pass Loop</h2><small>${D.length} days in the Olympic Mountains</small><div class="stats"><div><b>${P[P.length-1][3].toFixed(1)} km</b><span>distance</span></div><div><b>+${f(sum("up"))} m</b><span>gain</span></div><div><b>−${f(sum("dn"))} m</b><span>loss</span></div><div><b>${hm(D.reduce((a,d)=>a+hrs(d.a,d.b),0))}</b><span>est. time</span></div></div>`+D.map((d,j)=>`<div class="stop" onclick="show(${j+1})"><i style="background:${d.c};color:#111;width:auto;padding:0 10px;border-radius:12px;white-space:nowrap">Day ${j+1}</i><div><b>${d.t}</b><p><small>${d.km} km, +${f(d.up)} m, −${f(d.dn)} m, about ${hm(hrs(d.a,d.b))}</small></p></div></div>`).join("")}
 else{const d=D[i-1];const line=L.polyline(seg(d.a,d.b),{color:"#ffffff",weight:10,opacity:.9}).addTo(hll);all.bringToFront();
  L.polyline(seg(d.a,d.b),{color:"#0b2a12",weight:8}).addTo(hll);L.polyline(seg(d.a,d.b),{color:d.c,weight:4}).addTo(hll);map.fitBounds(line.getBounds(),{padding:[30,30]});
  d.st.forEach((q,j)=>{const p=near(q[0]);L.marker([p[0],p[1]],{icon:L.divIcon({className:"",html:`<div class="mk ${kd(d,j)}">${SY[kd(d,j)]}</div>`,iconSize:[28,28]})}).bindPopup(`<b>${q[1]}</b><br>${q[2]}`).addTo(hl)});
  h=`<h2 style="border-left:6px solid ${d.c};padding-left:8px">Day ${i}: ${d.t}</h2><p>${d.d}</p><div class="stats"><div><b>${d.km} km</b><span>distance</span></div><div><b>+${f(d.up)} m</b><span>gain</span></div><div><b>−${f(d.dn)} m</b><span>loss</span></div><div><b>${hm(hrs(d.a,d.b))}</b><span>est. time</span></div></div>`+sunLine(i)+prof(d)+`<div class="leg"><span><b style="color:#d32f2f">▶</b> Start</span><span><b style="color:#d32f2f">⚑</b> End Of Day</span><span><b style="color:#1e6fe0">⛺</b> Campsite</span><span><b style="color:#f5a623">★</b> Point Of Interest</span></div>`+d.st.map((q,j)=>{const p=near(q[0]);return `<div class="stop ${kd(d,j)}" onclick="map.setView([${p[0]},${p[1]}],15)"><i>${SY[kd(d,j)]}</i><div><b>${q[1]}</b> <small>${q[0].toFixed(1)} km${q[0]>d.a+.05?" · "+hm(hrs(d.a,q[0]))+" in":""}</small><p>${q[2]}</p></div></div>`}).join("")}
 h+=`<details id="wx"><summary>Trip date, weather and offline map</summary><p><label>Trip start date <input type="date" id="sd"></label></p><p><label>Pace <select id="pc"><option value="r">Relaxed</option><option value="n">Normal</option><option value="f">Fast</option></select></label> <small>Times use Naismith's rule (5 km/h plus 1 h per 600 m climbed), scaled by pace.</small></p><div id="wo"><small>Forecasts only exist about 16 days ahead, so set the date closer to the trip.</small></div><p><button class="btn" id="dl" style="width:100%">Save map for offline use</button><small id="dls"></small></p><p><small>On iPhone, add the app to the Home Screen first, then save the map from there. The Home Screen app keeps its own saved data.</small></p><p><small>Elevation: AWS Terrain Tiles (USGS and NASA SRTM data). Water: OpenStreetMap. App version ${VER}</small></p></details>`;
 $("#body").innerHTML=h;$("#body").scrollTop=0;wx(i);$("#dl").onclick=dl;const pc=$("#pc");pc.value=localStorage.pace||"r";pc.onchange=()=>{localStorage.pace=pc.value;show(cur);$("#wx").open=true;if(lastLL)updProg(lastLL)}}
// weather (tucked away). The last good forecast is kept so it still shows at the trailhead without signal.
function wx(i){const sd=$("#sd");sd.value=sdv();sd.onchange=()=>{localStorage.sd=sd.value;show(i);$("#wx").open=true};
 if(!sd.value)return;const s=new Date(sd.value),end=new Date(s.getTime()+(D.length-1)*864e5).toISOString().slice(0,10);if((s-new Date())/864e5+D.length-1>15){$("#wo").innerHTML="<small>Too far ahead for a forecast. Check back within 16 days of the trip.</small>";return}
 let old=null;try{old=JSON.parse(localStorage.wx||"null")}catch(_){}if(old&&old.start!=sd.value)old=null;
 const render=(d,note)=>$("#wo").innerHTML=d.time.map((t,k)=>`<p><b>Day ${k+1}</b> <small>${t}</small><br>High ${Math.round(d.temperature_2m_max[k])}°C, low ${Math.round(d.temperature_2m_min[k])}°C, rain ${d.precipitation_probability_max[k]}%, wind ${Math.round(d.wind_speed_10m_max[k])} km/h</p>`).join("")+(note?`<p><small>${note}</small></p>`:"");
 if(old)render(old.daily,"Forecast from "+new Date(old.at).toLocaleString("en-US",{timeZone:"America/Los_Angeles",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})+". Updates when online.");
 fetch(`https://api.open-meteo.com/v1/forecast?latitude=47.955&longitude=-123.835&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&timezone=auto&start_date=${sd.value}&end_date=${end}`)
 .then(r=>r.json()).then(j=>{if(j.error||!j.daily)throw new Error(j.reason||"bad data");try{localStorage.wx=JSON.stringify({start:sd.value,at:Date.now(),daily:j.daily})}catch(_){}render(j.daily)})
 .catch(()=>{if(!old)$("#wo").innerHTML="<small>Weather needs an internet connection.</small>"})}
// offline tiles. Tiles are fetched with CORS so each one has a real status; only good tiles are stored, and the count is honest.
const tx=(o,z)=>Math.floor((o+180)/360*2**z),ty=(a,z)=>{const r=a*Math.PI/180;return Math.floor((1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*2**z)};
async function dl(){if(!self.caches){$("#dls").textContent=" Saving needs a secure (https) page.";return}
 const b=all.getBounds().pad(.15),u=[];for(let z=11;z<=15;z++)for(let x=tx(b.getWest(),z);x<=tx(b.getEast(),z);x++)for(let y=ty(b.getNorth(),z);y<=ty(b.getSouth(),z);y++)u.push(`https://a.tile.opentopomap.org/${z}/${x}/${y}.png`);
 $("#dl").disabled=true;try{if(navigator.storage&&navigator.storage.persist)await navigator.storage.persist()}catch(_){}
 const c=await caches.open(TILES);let ok=0,bad=0;
 for(let k=0;k<u.length;k+=4){await Promise.all(u.slice(k,k+4).map(async x=>{try{if(await c.match(x)){ok++;return}const r=await fetch(x,{mode:"cors"});if(!r.ok)throw 0;await c.put(x,r);ok++}catch(_){bad++}}));$("#dls").textContent=` ${ok+bad} of ${u.length} tiles`}
 $("#dls").textContent=bad?` Saved ${ok} of ${u.length} tiles. ${bad} failed. Tap again to retry the rest.`:` Saved all ${u.length} tiles (zoom 11 to 15).`;$("#dl").disabled=false}
function startTab(){const s=localStorage.sd;if(!s)return 0;const k=Math.round((new Date(today())-new Date(s))/864e5);return k>=0&&k<D.length?k+1:0}
show(startTab());
