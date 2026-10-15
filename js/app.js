/* Inicialización de reveal.js, entradas GSAP, contadores, escenas 3D y gráficas. */
(function(){
const movimiento=window.matchMedia('(prefers-reduced-motion: reduce)');
const deck=new Reveal({width:1920,height:1080,margin:0.03,minScale:0.2,maxScale:2,center:false,hash:true,scrollActivationWidth:null,
  controls:true,controlsTutorial:false,controlsLayout:'bottom-right',progress:true,slideNumber:'c/t',
  transition:movimiento.matches?'none':'fade',transitionSpeed:'fast',backgroundTransition:movimiento.matches?'none':'fade',autoAnimate:!movimiento.matches,autoAnimateDuration:.6,autoAnimateEasing:'cubic-bezier(.22,1,.36,1)',
  pdfSeparateFragments:false,plugins:[],
  keyboard:{53:()=>saltar('grafica5'),101:()=>saltar('grafica5'),52:()=>saltar('dominio0'),100:()=>saltar('dominio0'),48:()=>saltar('preguntas'),96:()=>saltar('preguntas')}});
// Teclas: 5 = gráfica 5 (y 5 otra vez regresa), 0 = preguntas en vivo (y 0 otra vez regresa).
let regreso=null;
const botonSonido=document.getElementById('sonido');
const botonAnimaciones=document.getElementById('animaciones');
let conNext=false;
function pendiente(sec){return conNext&&sec.querySelector('.inicio-animacion:not(.visible)');}
function prepararAnimaciones(){
  deck.getHorizontalSlides().forEach(sec=>{
    sec.querySelector('.inicio-animacion')?.remove();
    sec.querySelectorAll('.fragment[data-fragment-index]').forEach(el=>{
      if(el.dataset.indiceOriginal!==undefined){
        if(el.dataset.indiceOriginal==='')el.removeAttribute('data-fragment-index');
        else el.dataset.fragmentIndex=el.dataset.indiceOriginal;
      }
    });
    if(!conNext||sec.dataset.escena==='titulo'||!sec.querySelector('.anim,[data-graf],.ruido'))return;
    sec.querySelectorAll('.fragment').forEach(el=>{
      el.dataset.indiceOriginal=el.getAttribute('data-fragment-index')||'';
      if(el.hasAttribute('data-fragment-index'))el.dataset.fragmentIndex=+el.dataset.fragmentIndex+1;
    });
    const inicio=document.createElement('span');
    inicio.className='fragment inicio-animacion';inicio.dataset.fragmentIndex='0';
    inicio.setAttribute('aria-hidden','true');sec.prepend(inicio);
  });
  deck.sync();
}
botonAnimaciones.addEventListener('click',()=>{
  conNext=!conNext;
  botonAnimaciones.setAttribute('aria-pressed',String(conNext));
  botonAnimaciones.textContent=conNext?'Animaciones: con Next':'Animaciones: al entrar';
  botonAnimaciones.title=conNext?'Cambiar para animar al entrar':'Cambiar para iniciar las animaciones con Next';
  detenerCascada();prepararAnimaciones();deck.slide(deck.getIndices().h,0,-1);presentar(deck.getCurrentSlide());
});
let audio=null,sonido=false;
function actualizarSonido(){botonSonido.setAttribute('aria-pressed',String(sonido));botonSonido.textContent=sonido?'Sonido: encendido':'Sonido: apagado';botonSonido.title=sonido?'Silenciar efectos de sonido':'Activar efectos de sonido suaves';}
function silenciar(){sonido=false;actualizarSonido();if(audio)audio.suspend().catch(()=>{});}
botonSonido.addEventListener('click',async()=>{
  if(sonido){silenciar();return;}
  try{
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio){botonSonido.disabled=true;botonSonido.textContent='Sonido no disponible';return;}
    if(!audio)audio=new Audio();
    botonSonido.disabled=true;
    await audio.resume();sonido=audio.state==='running';actualizarSonido();tono('activar');
  }catch{silenciar();botonSonido.title='No se pudo activar el audio; vuelve a intentarlo';}
  finally{if(audio)botonSonido.disabled=false;}
});
function tono(tipo){
  if(!sonido||!audio||audio.state!=='running'||document.hidden||deck.isPaused()||deck.isOverview())return;
  const t=audio.currentTime,d=tipo==='fragmento'?.08:.18;
  const oscilador=audio.createOscillator(),volumen=audio.createGain();
  oscilador.type='sine';oscilador.frequency.setValueAtTime(tipo==='fragmento'?660:440,t);
  oscilador.frequency.exponentialRampToValueAtTime(tipo==='fragmento'?540:580,t+d);
  volumen.gain.setValueAtTime(0,t);volumen.gain.linearRampToValueAtTime(tipo==='fragmento'?.018:.035,t+.012);volumen.gain.linearRampToValueAtTime(0,t+d);
  oscilador.connect(volumen);volumen.connect(audio.destination);oscilador.start(t);oscilador.stop(t+d+.01);
  oscilador.onended=()=>{oscilador.disconnect();volumen.disconnect();};
}
function ambiente(){
  const activo=!document.hidden&&!deck.isOverview()&&!deck.isPaused();
  if(cascadaActiva)cascadaActiva.paused(!activo);
  document.body.classList.toggle('ambiente-activo',activo);
  document.getElementById('ambiente').hidden=deck.isPaused()||deck.isOverview();
  document.getElementById('alba').hidden=deck.isPaused()||deck.isOverview();
  botonSonido.hidden=deck.isPaused()||deck.isOverview();
  botonAnimaciones.hidden=deck.isPaused()||deck.isOverview();
  if(audio){if(!activo)audio.suspend().catch(()=>{});else if(sonido)audio.resume().catch(silenciar);}
}
function saltar(destino){ const secs=deck.getHorizontalSlides(); const i=secs.findIndex(s=>destino==='preguntas'?s.dataset.preguntas==='tablero':s.id===destino); if(i<0) return;
  const act=deck.getIndices(); if(act.h===i&&regreso){ const r=regreso; regreso=null; deck.slide(r.h,r.v,r.f); } else { regreso=act; deck.slide(i); } }
const fmt=(v,d)=>v.toLocaleString('es-MX',{minimumFractionDigits:d,maximumFractionDigits:d});
function contar(raiz){ raiz.querySelectorAll('.contar').forEach(el=>{
  const a=parseFloat(el.dataset.a),d=parseInt(el.dataset.d||'0');
  el.textContent=(el.dataset.pre||'')+fmt(a,d)+(el.dataset.suf||'');
}); }
// Diapositiva 7: preguntas en cascada, cada vez más rápido; al terminar entra sola la pregunta principal (fragmento .senal).
let cascadaActiva=null;
function detenerCascada(){
  if(cascadaActiva){cascadaActiva.kill();cascadaActiva=null;}
}
function cascada(sec){
  detenerCascada();
  const spans=sec.querySelectorAll('.ruido span'),senal=sec.querySelector('.fragment.senal');
  if(!senal)return;
  gsap.set(spans,{opacity:(i,s)=>+s.dataset.o,scale:1,y:0});
  if(movimiento.matches||senal.classList.contains('visible'))return;
  cascadaActiva=gsap.timeline({paused:document.hidden||deck.isOverview()||deck.isPaused()});
  spans.forEach((s,i)=>cascadaActiva.fromTo(s,
    {opacity:0,scale:.82,y:14},
    {opacity:+s.dataset.o,scale:1,y:0,duration:.55,ease:'expo.out'},6.5*Math.sqrt(i/spans.length)));
  cascadaActiva.call(()=>{
    if(deck.getCurrentSlide()===sec&&!senal.classList.contains('visible'))deck.nextFragment();
  },null,7.4);
}
function adelantar(e){
  if(!e.fragment.classList.contains('senal'))return;
  detenerCascada();
  gsap.set(e.fragment.closest('section').querySelectorAll('.ruido span'),{opacity:(i,s)=>+s.dataset.o,scale:1,y:0});
}
function entrar(sec){
  gsap.killTweensOf(sec.querySelectorAll('.anim,.st,.ruido span,.barraH > div,.embudo .nivel'));
  if(pendiente(sec)){
    const animados=sec.querySelectorAll('.anim'),ruido=sec.querySelectorAll('.ruido span');
    if(animados.length)gsap.set(animados,{autoAlpha:1,y:0,clearProps:'transform'});
    if(ruido.length)gsap.set(ruido,{opacity:(i,s)=>+s.dataset.o,scale:1,y:0});
    sec.querySelectorAll('.barraH > div').forEach(b=>gsap.set(b,{width:b.dataset.w+'%'}));
    contar(sec);return;
  }
  const els=sec.querySelectorAll('.anim');
  if(els.length) gsap.fromTo(els,{autoAlpha:.55,y:movimiento.matches?0:18},{autoAlpha:1,y:0,duration:movimiento.matches?0:.6,ease:'power3.out',stagger:movimiento.matches?0:.045,clearProps:'transform'});
  cascada(sec);
  sec.querySelectorAll('.barraH > div').forEach(b=>{
    if(movimiento.matches) gsap.set(b,{width:b.dataset.w+'%'});
    else gsap.fromTo(b,{width:'0%'},{width:b.dataset.w+'%',duration:.7,ease:'power3.out'});
  });
  contar(sec);
}
function aplanar(sec){ if(!sec) return; sec.querySelectorAll('.graf[data-graf],.graf[data-graf] > .cont').forEach(el=>{
  gsap.killTweensOf(el); gsap.set(el,{clearProps:'transform,transformOrigin,--luz,willChange'});
}); }
// Orientación de superficies, no ejes nuevos: cada familia tiene una entrada propia.
const entradasGraficas={
  g1:{rotationY:16,z:-100,transformOrigin:'0% 50%'},
  g2:{rotationX:14,z:-120,transformOrigin:'50% 100%'},
  retorno:{rotationX:-8,rotationY:-6,z:-200,transformOrigin:'50% 0%'},
  g3:{rotationY:-18,rotationX:5,z:-80,transformOrigin:'100% 50%'},
  g5:{rotationX:-12,z:-180,transformOrigin:'50% 0%'},
  g6a:{rotationY:12,rotationZ:-1.5,z:-140,transformOrigin:'0% 100%'},
  g6b:{rotationX:16,rotationY:-7,z:-90,transformOrigin:'50% 100%'},
  g6c:{rotationX:-10,rotationY:15,z:-110,transformOrigin:'100% 0%'},
  g7a:{rotationY:-14,rotationZ:1.5,z:-70,transformOrigin:'100% 100%'},
  g7b:{rotationX:10,rotationY:9,z:-160,transformOrigin:'0% 0%'}
};
const entradasDominios=[
  {rotationX:12,rotationY:-10,z:-120,transformOrigin:'0% 100%'},
  {rotationY:18,z:-100,transformOrigin:'0% 50%'},
  {rotationX:-14,z:-140,transformOrigin:'50% 0%'},
  {rotationY:-16,rotationZ:1,z:-80,transformOrigin:'100% 50%'},
  {rotationX:16,rotationY:6,z:-110,transformOrigin:'50% 100%'},
  {rotationX:-8,rotationY:14,z:-150,transformOrigin:'0% 0%'},
  {rotationX:8,rotationY:-14,z:-130,transformOrigin:'100% 100%'},
  {rotationX:-10,rotationY:-8,rotationZ:-1,z:-100,transformOrigin:'100% 0%'},
  {rotationX:6,rotationY:12,rotationZ:1,z:-170,transformOrigin:'0% 100%'}
];
function perspectiva(sec){
  aplanar(sec);
  if(movimiento.matches||document.hidden||deck.isOverview()||deck.isPaused()) return;
  // Inclinar el lienzo real y volver a 2D: no se inventa una tercera dimensión de datos.
  sec.querySelectorAll('.graf[data-graf]:not(.falla)').forEach(graf=>{
    const el=graf.querySelector('.cont')||graf;
    gsap.fromTo(el,
      {transformPerspective:1800,rotationX:0,rotationY:0,rotationZ:0,z:0,scale:.96,...(graf.dataset.graf==='g4'?entradasDominios[+sec.dataset.dominio]:entradasGraficas[graf.dataset.entrada||graf.dataset.graf]),'--luz':1,willChange:'transform'},
      {rotationX:0,rotationY:0,rotationZ:0,z:0,scale:1,'--luz':0,duration:1.8,ease:'power2.inOut',clearProps:'transform,transformOrigin,--luz,willChange'});
  });
}
function escena(){ const s=deck.getCurrentSlide(); const n=deck.isOverview()||deck.isPaused()||(pendiente(s)&&s.dataset.escena!=='titulo')?null:s.dataset.escena||null;
  // estado = número de fragmentos visibles con data-estado (o índice+1)
  const vis=[...s.querySelectorAll('.fragment.visible[data-estado]')].map(e=>+e.dataset.estado); const est=vis.length?Math.max(...vis):(+(s.dataset.estado||0));
  if(window.Escenas) Escenas.set(n,est,!conNext); }
// Amanecer: el horizonte (#alba) se enciende con el avance de la charla.
function alba(){ document.documentElement.style.setProperty('--alba',deck.getProgress().toFixed(3)); }
function presentar(sec){entrar(sec);Graficas.montar(sec,!pendiente(sec));if(!pendiente(sec))perspectiva(sec);else aplanar(sec);escena();}
deck.on('ready',()=>{ alba(); if(window.PreguntasDeck) PreguntasDeck.iniciar(deck); document.fonts.ready.then(()=>presentar(deck.getCurrentSlide())); });
deck.on('slidechanged',e=>{alba();detenerCascada();if(e.previousSlide){aplanar(e.previousSlide);Graficas.desmontar(e.previousSlide);gsap.killTweensOf(e.previousSlide.querySelectorAll('.anim,.st,.ruido span,.barraH > div'));}presentar(e.currentSlide);});
deck.on('fragmentshown',e=>{if(e.fragment.classList.contains('inicio-animacion'))presentar(deck.getCurrentSlide());});
deck.on('fragmenthidden',e=>{if(e.fragment.classList.contains('inicio-animacion')){detenerCascada();presentar(deck.getCurrentSlide());}});
deck.on('fragmentshown',adelantar);
deck.on('fragmentshown',escena);
deck.on('fragmenthidden',escena);
deck.on('fragmenthidden',e=>{if(e.fragment.classList.contains('senal'))cascada(deck.getCurrentSlide());});
['overviewshown','overviewhidden','paused','resumed'].forEach(evento=>deck.on(evento,()=>{aplanar(deck.getCurrentSlide());escena();}));
document.addEventListener('visibilitychange',()=>{if(document.hidden) aplanar(deck.getCurrentSlide());});
movimiento.addEventListener('change',()=>{
  deck.configure({autoAnimate:!movimiento.matches,transition:movimiento.matches?'none':'fade',backgroundTransition:movimiento.matches?'none':'fade'});
  if(movimiento.matches){aplanar(deck.getCurrentSlide());cascada(deck.getCurrentSlide());}
});
deck.on('ready',ambiente);
deck.on('slidechanged',()=>tono('diapositiva'));
deck.on('fragmentshown',()=>tono('fragmento'));
['overviewshown','overviewhidden','paused','resumed'].forEach(evento=>deck.on(evento,ambiente));
document.addEventListener('visibilitychange',ambiente);
window.deck=deck; deck.initialize();
})();
