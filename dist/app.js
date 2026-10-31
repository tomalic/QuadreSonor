const $=id=>document.getElementById(id);
const player=new Audio();player.preload='auto';player.loop=false;
let db,tracks=[],urls=[],imageURL,active=false,playing=false,last=-1,wake=null,busy=false;
const message=text=>$('message').textContent=text;
function transaction(mode,action){return new Promise((resolve,reject)=>{const tx=db.transaction('assets',mode);const request=action(tx.objectStore('assets'));tx.oncomplete=()=>resolve(request?.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('Operació cancel·lada'));});}
async function refresh(){const records=await transaction('readonly',s=>s.getAll());urls.forEach(URL.revokeObjectURL);urls=[];tracks=records.filter(x=>x.kind==='audio').map(x=>({...x,url:URL.createObjectURL(x.blob)}));urls=tracks.map(x=>x.url);last=-1;const image=records.find(x=>x.kind==='image');if(image){if(imageURL)URL.revokeObjectURL(imageURL);imageURL=URL.createObjectURL(image.blob);$('art').src=$('thumb').src=imageURL;$('imageName').textContent=image.name;}$('count').textContent=`${tracks.length} ${tracks.length===1?'cançó':'cançons'}`;$('tracks').replaceChildren();tracks.forEach(track=>{const li=document.createElement('li'),label=document.createElement('span'),button=document.createElement('button');label.textContent=track.name;button.textContent='×';button.setAttribute('aria-label',`Eliminar ${track.name}`);button.onclick=async()=>{try{stop();await transaction('readwrite',s=>s.delete(track.id));await refresh();}catch(e){message('No s’ha pogut eliminar el fitxer.');}};li.append(label,button);$('tracks').append(li);});$('start').disabled=!tracks.length||busy;$('state').textContent=tracks.length?'Obra preparada · esperant un toc':'Afegeix música per començar';}
function stop(){player.pause();player.removeAttribute('src');player.load();playing=false;}
async function playRandom(){if(!active||playing||!tracks.length)return;let candidates=tracks.map((_,i)=>i).filter(i=>tracks.length===1||i!==last);const index=candidates[Math.floor(Math.random()*candidates.length)];playing=true;last=index;player.src=tracks[index].url;try{await player.play();}catch(e){playing=false;openSettings();message('No s’ha pogut reproduir aquesta cançó. Comprova el format i el volum del dispositiu.');}}
player.onended=()=>{playing=false;};player.onerror=()=>{if(!player.getAttribute('src'))return;playing=false;openSettings();message('El dispositiu no pot reproduir aquest fitxer. Prova una versió MP3.');};
async function keepAwake(){if(!active||document.visibilityState!=='visible'||wake)return;if(!navigator.wakeLock){$('wakeStatus').textContent='Pantalla activa: aquest navegador no ofereix el permís. Configura el bloqueig automàtic al dispositiu.';return;}try{wake=await navigator.wakeLock.request('screen');$('wakeStatus').textContent='Pantalla activa: permís concedit.';wake.addEventListener('release',()=>{wake=null;$('wakeStatus').textContent='Pantalla activa: permís alliberat pel sistema.';});}catch(e){$('wakeStatus').textContent='Pantalla activa: el sistema no ha concedit el permís.';}}
// Four distinct two-finger taps; both fingers must lift before the next tap.
const menuTapTimes=[];
let touchGroup=null;
function resetGesture(){touchGroup=null;menuTapTimes.length=0;}
function openSettings(){resetGesture();if(!$('settings').open){$('settings').showModal();$('settings').scrollTop=0;}}
function tap(){if(active){keepAwake();playRandom();}}
function touchStart(e){
  e.preventDefault();
  const now=performance.now();
  if(!touchGroup)touchGroup={start:now,points:new Map(),max:0,valid:true};
  for(const t of e.changedTouches)touchGroup.points.set(t.identifier,{x:t.clientX,y:t.clientY});
  touchGroup.max=Math.max(touchGroup.max,e.touches.length);
  if(e.touches.length>2||(e.touches.length===2&&now-touchGroup.start>180))touchGroup.valid=false;
}
function checkMovement(touches){
  if(!touchGroup)return;
  for(const t of touches){const p=touchGroup.points.get(t.identifier);if(p&&Math.hypot(t.clientX-p.x,t.clientY-p.y)>30)touchGroup.valid=false;}
}
function touchMove(e){e.preventDefault();checkMovement(e.changedTouches);}
function touchEnd(e){
  e.preventDefault();
  if(!touchGroup)return;
  checkMovement(e.changedTouches);
  if(e.touches.length)return;
  const group=touchGroup,now=performance.now();touchGroup=null;
  if(!group.valid||now-group.start>450){menuTapTimes.length=0;return;}
  if(group.max!==2||group.points.size!==2){menuTapTimes.length=0;if(group.max===1)tap();return;}
  if(menuTapTimes.length&&now-menuTapTimes[menuTapTimes.length-1]>800)menuTapTimes.length=0;
  while(menuTapTimes.length&&now-menuTapTimes[0]>2800)menuTapTimes.shift();
  menuTapTimes.push(now);
  if(menuTapTimes.length===4)openSettings();
}
const touchOptions={passive:false};
$('canvas').addEventListener('touchstart',touchStart,touchOptions);
$('canvas').addEventListener('touchmove',touchMove,touchOptions);
$('canvas').addEventListener('touchend',touchEnd,touchOptions);
$('canvas').addEventListener('touchcancel',e=>{e.preventDefault();resetGesture();},touchOptions);
$('canvas').addEventListener('pointerdown',e=>{if(e.pointerType!=='touch'&&e.isPrimary&&e.button===0){e.preventDefault();menuTapTimes.length=0;tap();}});
$('canvas').addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();menuTapTimes.length=0;tap();}});
document.addEventListener('contextmenu',e=>e.preventDefault());
$('settings').addEventListener('cancel',e=>e.preventDefault());
$('start').onclick=()=>{if(!tracks.length)return;active=true;message('');$('settings').close();$('canvas').focus();if(!document.fullscreenElement&&document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});keepAwake();navigator.storage?.persist?.().catch(()=>{});};
$('stop').onclick=()=>{stop();message('Música aturada.');};$('exit').onclick=async()=>{active=false;stop();if(wake)await wake.release();if(document.fullscreenElement)await document.exitFullscreen();message('Obra aturada. Pots tancar l’app amb els controls del dispositiu.');};
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')keepAwake();else{resetGesture();stop();}});
$('volume').value=localStorage.getItem('volume')||'0.8';player.volume=Number($('volume').value);$('volume').oninput=()=>{player.volume=Number($('volume').value);localStorage.setItem('volume',$('volume').value);};$('fit').value=localStorage.getItem('fit')||'cover';$('art').style.objectFit=$('fit').value;$('fit').onchange=()=>{$('art').style.objectFit=$('fit').value;localStorage.setItem('fit',$('fit').value);};
$('imageFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{await transaction('readwrite',s=>s.put({id:'image',kind:'image',name:file.name,blob:file}));await refresh();message('Imatge desada en aquest dispositiu.');}catch(e){message('No s’ha pogut desar la imatge. Comprova l’espai disponible.');}e.target.value='';};
$('musicFiles').onchange=async e=>{busy=true;stop();$('start').disabled=true;let added=0;try{for(const file of e.target.files){if(!file.type.startsWith('audio/')&&!/\.(mp3|m4a|wav|ogg|aac|flac)$/i.test(file.name))continue;message(`Desant ${file.name}…`);await transaction('readwrite',s=>s.put({id:crypto.randomUUID(),kind:'audio',name:file.name,blob:file}));added++;}message(`${added} ${added===1?'cançó desada':'cançons desades'} en aquest dispositiu.`);}catch(e){message('No s’han pogut desar tots els fitxers. Comprova l’espai disponible.');}finally{busy=false;await refresh();e.target.value='';}};
async function init(){openSettings();try{db=await new Promise((resolve,reject)=>{const r=indexedDB.open('quadre-sonor',1);r.onupgradeneeded=()=>r.result.createObjectStore('assets',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});await refresh();}catch(e){$('state').textContent='Emmagatzematge no disponible';$('start').disabled=true;message('Obre l’app fora del mode privat per poder desar música i imatges.');}if('serviceWorker'in navigator){try{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;const cache=await caches.open('quadre-sonor-v2');const ready=await cache.match('./index.html');$('offlineStatus').textContent=ready?'App desada per a ús sense connexió. Comprova-la en mode avió.':'App instal·lada; recarrega i comprova el mode avió.';}catch(e){$('offlineStatus').textContent='No s’ha pogut preparar el mode sense connexió. Torna-ho a provar amb internet.';}}else $('offlineStatus').textContent='Mode sense connexió no compatible amb aquest navegador.';}
init();
