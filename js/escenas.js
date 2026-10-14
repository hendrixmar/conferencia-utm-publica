/* Escenas Three.js: un solo renderer de fondo; cada diapositiva elige escena y estado (data-escena + fragmento). */
(function(){
const DPR=Math.min(window.devicePixelRatio||1,1.5);
let canvas=document.getElementById('escena');
const movimiento=matchMedia('(prefers-reduced-motion: reduce)'),etiquetas=[];
const pasos=[['Vapor','músculo','#7896ac'],['Electricidad','energía','#b4c6d4'],['Computación','automatización','#6da9ed'],['Digital','Schwab, 2016','#54dcc5'],['Agentes','cognición','#ffbd69']];
const ciclo=[['Percibir','observa el resultado','#54dcc5',-3.5,2.2],['Razonar','planea el siguiente paso','#6da9ed',-.2,0],['Actuar','edita, ejecuta, prueba','#f4f7fa',-3.5,-2.2],['Herramientas','terminal · navegador · API · MCP','#ffbd69',-6.8,0]];
const descripciones={titulo:'Nube de partículas que se transforma en una red neuronal tridimensional.',cierre:'Nube de partículas y red neuronal tridimensional.',fuego:'Partículas que se transforman de fuego en un globo conectado y después en órbitas de agentes.',agentes:'Ciclo tridimensional del agente: percibir, razonar, actuar y herramientas; un pulso recorre la órbita alrededor del objetivo.',revoluciones:'Escalera tridimensional de cinco revoluciones; la cámara recorre cada escalón. La rampa final representa una hipótesis.'};
let renderer,respaldo=false;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'}); }
catch(e){ respaldo=true; console.warn('WebGL no disponible; ilustración de respaldo.',e); }
if(renderer){renderer.setPixelRatio(DPR);renderer.setClearColor(0x04060c,0);renderer.outputEncoding=THREE.sRGBEncoding;}
function animar(obj,opciones){return gsap.to(obj,{...opciones,duration:movimiento.matches?0:opciones.duration,delay:movimiento.matches?0:opciones.delay||0,overwrite:true});}
const rnd=(a,b)=>a+Math.random()*(b-a);
function tamano(){
  if(respaldo)return;
  renderer.setSize(innerWidth,innerHeight,false);
  const w=Math.min(innerWidth,innerHeight*16/9)*.97,h=w*9/16;
  renderer.setViewport((innerWidth-w)/2,(innerHeight-h)/2,w,h);
  dibujar();
}
function textoSprite(txt,{size=64,color='#f4f7fa',sub=null,w=1024,h=256,escala=1}={}){
  const cv=document.createElement('canvas'); cv.width=w; cv.height=h; const g=cv.getContext('2d');
  const t=new THREE.CanvasTexture(cv);t.minFilter=THREE.LinearFilter;t.anisotropy=4;t.encoding=THREE.sRGBEncoding;
  function pintar(){
    g.clearRect(0,0,w,h);g.textAlign='center';g.textBaseline='middle';
    g.font=`700 ${size}px Archivo, Inter, sans-serif`;g.fillStyle=color;g.shadowColor='rgba(0,0,0,.8)';g.shadowBlur=10;
    g.fillText(txt,w/2,sub?h*.36:h/2,w-40);
    if(sub){g.font=`500 ${Math.round(size*.6)}px Inter, sans-serif`;g.fillStyle='#b4c6d4';g.fillText(sub,w/2,h*.75,w-40);}
    t.needsUpdate=true;
  }
  pintar();etiquetas.push(pintar);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false}));
  s.scale.set(4*escala,1*escala,1); return s;
}
// ---------- Material de partículas con morph GPU y modo fuego ----------
function matParticulas(){
  return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uT:{value:0},uMix:{value:0},uFuego:{value:0},uTam:{value:30*DPR},uAlpha:{value:.95}},
    vertexShader:`
      attribute vec3 pA; attribute vec3 pB; attribute vec3 cA; attribute vec3 cB; attribute vec2 sem;
      uniform float uT,uMix,uFuego,uTam; varying vec3 vC; varying float vA;
      void main(){
        vec3 p=mix(pA,pB,uMix); vec3 c=mix(cA,cB,uMix);
        // fuego: partículas que suben y se estrechan
        float h=fract(sem.x+uT*(0.28+0.22*sem.y));
        float ang=sem.x*6.2831+uT*1.5;
        float r=(0.95-h*0.85)*(0.55+0.45*sem.y)*(1.0+0.12*sin(uT*7.0+sem.x*40.0));
        vec3 f=vec3(cos(ang)*r*1.15+0.18*sin(uT*2.3+h*6.0), h*3.6-1.7, sin(ang)*r*0.6);
        vec3 fc=mix(vec3(1.0,0.88,0.71),vec3(1.0,0.74,0.41),smoothstep(0.0,0.45,h)); fc=mix(fc,vec3(0.72,0.42,0.17),smoothstep(0.45,1.0,h));
        p=mix(p,f,uFuego); c=mix(c,fc,uFuego);
        vA=mix(1.0,(1.0-h)*1.2,uFuego);
        vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;
        gl_PointSize=uTam*(0.45+0.55*sem.y)*mix(1.0,1.0+ (1.0-h)*0.9,uFuego)/(-mv.z);
        vC=c; }`,
    fragmentShader:`
      varying vec3 vC; varying float vA; uniform float uAlpha;
      void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d); if(r>0.5) discard;
        float a=smoothstep(0.5,0.0,r); gl_FragColor=vec4(vC*(0.65+0.6*a),a*a*vA*uAlpha); }`});
}
function nubeMorph(N){
  const g=new THREE.BufferGeometry();
  const pA=new Float32Array(N*3),pB=new Float32Array(N*3),cA=new Float32Array(N*3),cB=new Float32Array(N*3),sem=new Float32Array(N*2);
  for(let i=0;i<N;i++){sem[i*2]=Math.random(); sem[i*2+1]=Math.random();}
  g.setAttribute('position',new THREE.BufferAttribute(pB,3));
  g.setAttribute('pA',new THREE.BufferAttribute(pA,3)); g.setAttribute('pB',new THREE.BufferAttribute(pB,3));
  g.setAttribute('cA',new THREE.BufferAttribute(cA,3)); g.setAttribute('cB',new THREE.BufferAttribute(cB,3));
  g.setAttribute('sem',new THREE.BufferAttribute(sem,2));
  g.boundingSphere=new THREE.Sphere(new THREE.Vector3(),50);
  const m=matParticulas(); const pts=new THREE.Points(g,m);
  // cambia de objetivo: A = estado actual interpolado, B = nuevo
  pts.userData.ir=function(pos,col,dur=1.8){
    const u=m.uniforms.uMix.value;
    for(let i=0;i<N*3;i++){ pA[i]=pA[i]+(pB[i]-pA[i])*u; cA[i]=cA[i]+(cB[i]-cA[i])*u; pB[i]=pos[i]; cB[i]=col[i]; }
    ['pA','pB','cA','cB'].forEach(k=>g.attributes[k].needsUpdate=true);
    m.uniforms.uMix.value=0; animar(m.uniforms.uMix,{value:1,duration:dur,ease:'power3.inOut'});
  };
  pts.userData.fijar=function(pos,col){ pA.set(pos);pB.set(pos);cA.set(col);cB.set(col); ['pA','pB','cA','cB'].forEach(k=>g.attributes[k].needsUpdate=true); m.uniforms.uMix.value=1; };
  return pts;
}
const C1=new THREE.Color('#54dcc5'),C2=new THREE.Color('#6da9ed'),C3=new THREE.Color('#6da9ed'),CF=new THREE.Color('#ffbd69');
function colGrad(N,fn){ const c=new Float32Array(N*3),t=new THREE.Color(); for(let i=0;i<N;i++){ fn(i,t); c[i*3]=t.r;c[i*3+1]=t.g;c[i*3+2]=t.b;} return c; }
// formas
function formaNube(N,R=7){const p=new Float32Array(N*3);for(let i=0;i<N;i++){const u=Math.random(),v=Math.random(),th=u*2*Math.PI,ph=Math.acos(2*v-1),r=R*Math.cbrt(Math.random());p[i*3]=r*Math.sin(ph)*Math.cos(th)*1.6;p[i*3+1]=r*Math.sin(ph)*Math.sin(th)*0.8;p[i*3+2]=r*Math.cos(ph)-2;}return p;}
function formaEsfera(N,R=2.2){const p=new Float32Array(N*3);const ga=Math.PI*(3-Math.sqrt(5));for(let i=0;i<N;i++){const y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),th=ga*i;const j=1+(Math.random()-.5)*0.03;p[i*3]=Math.cos(th)*r*R*j;p[i*3+1]=y*R*j;p[i*3+2]=Math.sin(th)*r*R*j;}return p;}
function nodosRed(capas=[6,10,12,10,6],sep=2.0){const n=[];capas.forEach((k,ci)=>{for(let j=0;j<k;j++){n.push(new THREE.Vector3((ci-(capas.length-1)/2)*sep*1.25,(j-(k-1)/2)*0.62,Math.sin(j*1.7+ci)*0.6));}});return {n,capas};}
function formaRed(N,red){const p=new Float32Array(N*3);const nn=red.n.length;
  for(let i=0;i<N;i++){ if(i<nn*14){const a=red.n[i%nn];p[i*3]=a.x+rnd(-.07,.07);p[i*3+1]=a.y+rnd(-.07,.07);p[i*3+2]=a.z+rnd(-.07,.07);}
   else{ // partículas sobre aristas entre capas
     let ci=Math.floor(Math.random()*(red.capas.length-1)),off=0;for(let k=0;k<ci;k++)off+=red.capas[k];
     const a=red.n[off+Math.floor(Math.random()*red.capas[ci])],b=red.n[off+red.capas[ci]+Math.floor(Math.random()*red.capas[ci+1])];const t=Math.random();
     p[i*3]=a.x+(b.x-a.x)*t;p[i*3+1]=a.y+(b.y-a.y)*t;p[i*3+2]=a.z+(b.z-a.z)*t;}}
  return p;}
function formaAnillos(N,K=6,R=2.6){const p=new Float32Array(N*3);const ejes=[];for(let k=0;k<K;k++){const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd(0,Math.PI),rnd(0,Math.PI),0));ejes.push(q);}
  const v=new THREE.Vector3();for(let i=0;i<N;i++){const k=i%K,t=Math.random()*Math.PI*2,r=R*(0.55+0.45*((k%3)/2));
   if(i%9===0){v.set(rnd(-.35,.35),rnd(-.35,.35),rnd(-.35,.35));} else {v.set(Math.cos(t)*r,Math.sin(t)*r,rnd(-.03,.03)).applyQuaternion(ejes[k]);}
   p[i*3]=v.x;p[i*3+1]=v.y;p[i*3+2]=v.z;}return p;}
const E={};
// =============== TITULO / CIERRE: nube -> red neuronal ===============
function crearTitulo(variante){
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,100);cam.position.set(0,0,11);
  const N=6000,pts=nubeMorph(N),red=nodosRed();scene.add(pts);
  const nube=formaNube(N),rd=formaRed(N,red);
  const cN=colGrad(N,(i,t)=>t.copy(C1).lerp(C2,Math.random()).multiplyScalar(0.55));
  const cR=colGrad(N,(i,t)=>t.copy(C1).lerp(C2,(rd[i*3]+6)/12));
  if(variante==='cierre'){ for(let i=0;i<N;i++){ if(Math.random()<.22){cR[i*3]=CF.r;cR[i*3+1]=CF.g;cR[i*3+2]=CF.b;} } }
  pts.userData.fijar(nube,cN);
  // líneas de la red
  const lp=[];let off=0;red.capas.forEach((k,ci)=>{if(ci<red.capas.length-1){for(let a=0;a<k;a++)for(let b=0;b<red.capas[ci+1];b++){if(Math.random()<.45){const A=red.n[off+a],B=red.n[off+k+b];lp.push(A.x,A.y,A.z,B.x,B.y,B.z);}}}off+=k;});
  const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));
  const lm=new THREE.LineBasicMaterial({color:0x6da9ed,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const lineas=new THREE.LineSegments(lg,lm);scene.add(lineas);
  let estado=-1,fase=-1;const raton={x:0,y:0};
  addEventListener('pointermove',e=>{raton.x=e.clientX/innerWidth-.5;raton.y=e.clientY/innerHeight-.5;});
  function aRed(){pts.userData.ir(rd,cR,2.6);animar(lm,{opacity:.12,duration:2.4,delay:1.2});}
  function aNube(){pts.userData.ir(nube,cN,2.6);animar(lm,{opacity:0,duration:1});}
  return {scene,cam,
    set(e){if(e!==estado){estado=e;fase=-1;if(variante==='titulo')e>0?aRed():aNube();}},
    salir(){estado=-1;},
    tick(t){
      if(variante==='cierre'){
        const siguiente=movimiento.matches?0:Math.floor(t/10)%2;
        if(siguiente!==fase){fase=siguiente;fase===0?aRed():aNube();}
      }
      pts.material.uniforms.uT.value=t;
      pts.rotation.y=Math.sin(t*.12)*.3+(movimiento.matches?0:raton.x*.18);
      pts.rotation.x=movimiento.matches?0:raton.y*.08;lineas.rotation.copy(pts.rotation);
      cam.position.z=11+Math.sin(t*.2)*.35;
    }};
}
// =============== FUEGO -> INTERNET -> AGENTES ===============
function crearFuego(){
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,100);cam.position.set(0,0.2,8.5);
  const N=5000,pts=nubeMorph(N);const grupo=new THREE.Group();grupo.position.x=2.9;scene.add(grupo);grupo.add(pts);
  const esf=formaEsfera(N,2.3),cEsf=colGrad(N,(i,t)=>t.copy(C1).lerp(C3,Math.random()*.7));
  const ani=formaAnillos(N,7,2.7),cAni=colGrad(N,(i,t)=>t.copy(C2).lerp(C1,Math.random()*.6).lerp(CF,(i%9===0)?0.7:0));
  pts.userData.fijar(esf,cEsf);
  // arcos de internet
  const ap=[];const nodos=[];for(let i=0;i<70;i++){const j=Math.floor(Math.random()*N);nodos.push(new THREE.Vector3(esf[j*3],esf[j*3+1],esf[j*3+2]));}
  for(let i=0;i<110;i++){const a=nodos[Math.floor(Math.random()*nodos.length)],b=nodos[Math.floor(Math.random()*nodos.length)];if(a.distanceTo(b)<.5)continue;
    const mid=a.clone().add(b).multiplyScalar(.5).normalize().multiplyScalar(2.3+a.distanceTo(b)*.35);const cur=new THREE.QuadraticBezierCurve3(a,mid,b);const ps=cur.getPoints(24);
    for(let k=0;k<ps.length-1;k++)ap.push(ps[k].x,ps[k].y,ps[k].z,ps[k+1].x,ps[k+1].y,ps[k+1].z);}
  const ag=new THREE.BufferGeometry();ag.setAttribute('position',new THREE.Float32BufferAttribute(ap,3));
  const am=new THREE.LineBasicMaterial({color:0x54dcc5,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  const arcos=new THREE.LineSegments(ag,am);grupo.add(arcos);
  // núcleo de agentes
  scene.add(new THREE.HemisphereLight(0xf4f7fa,0x0a0f1c,.9));
  const luz=new THREE.DirectionalLight(0xf4f7fa,1.3);luz.position.set(4,5,6);scene.add(luz);
  const nucleo=new THREE.Mesh(new THREE.IcosahedronGeometry(.55,1),new THREE.MeshStandardMaterial({color:0x6da9ed,metalness:.25,roughness:.4,emissive:0x244c66,emissiveIntensity:.2,transparent:true,opacity:0}));grupo.add(nucleo);
  const bordes=new THREE.LineSegments(new THREE.EdgesGeometry(nucleo.geometry),new THREE.LineBasicMaterial({color:0xb4c6d4,transparent:true,opacity:0}));nucleo.add(bordes);
  let estado=-1;
  return {scene,cam,
    set(e){ if(e===estado)return; const u=pts.material.uniforms;if(estado<0&&e<=0)u.uFuego.value=0;estado=e;
      if(e<=0){animar(u.uFuego,{value:1,duration:1.6,ease:'power2.inOut'});animar(am,{opacity:0,duration:.6});animar(nucleo.material,{opacity:0,duration:.6});animar(cam.position,{z:8.5,duration:2});}
      else if(e===1){pts.userData.ir(esf,cEsf,2.2);animar(u.uFuego,{value:0,duration:2.2,ease:'power3.inOut'});animar(am,{opacity:.28,duration:1.5,delay:1.4});animar(nucleo.material,{opacity:0,duration:.6});animar(cam.position,{z:8,duration:2});}
      else{animar(u.uFuego,{value:0,duration:1});pts.userData.ir(ani,cAni,2.4);animar(am,{opacity:0,duration:1});animar(nucleo.material,{opacity:.95,duration:1.5,delay:1});animar(cam.position,{z:9,duration:2.4});}
      animar(bordes.material,{opacity:e>=2?.5:0,duration:1.5,delay:e>=2?1:0});},
    salir(){ estado=-1; },
    tick(t){ const u=pts.material.uniforms; u.uT.value=t; grupo.rotation.y=t*(.12+.25*(estado>=2)); grupo.rotation.x=Math.sin(t*.3)*.08*(estado>=1);
      const f=u.uFuego.value; if(f>0.5) grupo.rotation.y*= (1-f); nucleo.rotation.x=t*.6; nucleo.rotation.y=t*.4; }};
}
// =============== REVOLUCIONES: escalera 3D ===============
function crearRevoluciones(){
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(45,innerWidth/innerHeight,.1,200);
  scene.fog=new THREE.FogExp2(0x04060c,.018);
  scene.add(new THREE.AmbientLight(0xb4c6d4,.6));const dl=new THREE.DirectionalLight(0xf4f7fa,1.1);dl.position.set(5,10,7);scene.add(dl);
  const grid=new THREE.GridHelper(80,80,0x244c66,0x0a0f1c);grid.position.y=-.01;scene.add(grid);
  const datos=[['Vapor','músculo','#7896ac'],['Electricidad','energía','#b4c6d4'],['Computación','automatización','#6da9ed'],['Digital','Schwab, 2016','#54dcc5'],['Agentes','cognición','#ffbd69']];
  const pasos=[];
  datos.forEach(([n,s,c],i)=>{
    const h=0.8+i*1.0,g=new THREE.BoxGeometry(2.4,h,2.4);
    const m=new THREE.MeshStandardMaterial({color:new THREE.Color(c).multiplyScalar(.5),metalness:.2,roughness:.48,emissive:new THREE.Color(c),emissiveIntensity:i===4?.25:.07});
    const b=new THREE.Mesh(g,m);b.position.set(i*3.1-6.2,h/2,-i*1.2);scene.add(b);
    const ed=new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineBasicMaterial({color:c,transparent:true,opacity:.9}));ed.position.copy(b.position);scene.add(ed);
    const sp=textoSprite(`${i+1} · ${n}`,{size:84,color:i===4?'#ffbd69':'#f4f7fa',sub:s,escala:1.25});sp.position.set(b.position.x,h+.9,b.position.z);scene.add(sp);
    pasos.push({b,ed,sp,h});
  });
  // Rampa de partículas: hipótesis que aparece después de los cinco escalones.
  const N=1400,rp=new Float32Array(N*3);for(let i=0;i<N;i++){const t=Math.random();rp[i*3]=6.2+1.6+t*7;rp[i*3+1]=4.8+t*t*9+rnd(-.2,.2);rp[i*3+2]=-4.8-t*3+rnd(-.6,.6);}
  const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rp,3));
  const rm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uT:{value:0},uAlpha:{value:0},uTam:{value:24*DPR}},
    vertexShader:`uniform float uT,uTam;void main(){float a=(position.x-7.8)/7.0,t=fract(a+uT*.08);vec3 p=vec3(7.8+t*7.0,4.8+t*t*9.0+position.y-4.8-a*a*9.0,-4.8-t*3.0+position.z+4.8+a*3.0);vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=uTam/(-mv.z);}`,
    fragmentShader:`uniform float uAlpha;void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;gl_FragColor=vec4(1.0,.74,.41,(1.0-r*2.0)*uAlpha);}`});
  scene.add(new THREE.Points(rg,rm));
  const objetivo=new THREE.Vector3();const OX=-5;const vistas=[[[ -1+OX,7,17],[OX,2.5,-2.5]]];
  pasos.forEach(p=>vistas.push([[p.b.position.x-2.2+OX*.55,p.h+7,p.b.position.z+12.5],[p.b.position.x+OX*.55,p.h*.65,p.b.position.z]]));
  vistas.push([[OX-2,9.5,27],[OX-1,4.2,-3]]);
  cam.position.set(...vistas[0][0]);objetivo.set(...vistas[0][1]);let estado=-1;
  return {scene,cam,
    set(e){ if(e===estado)return; estado=e; const v=vistas[Math.min(e,vistas.length-1)];
      animar(cam.position,{x:v[0][0],y:v[0][1],z:v[0][2],duration:1.8,ease:'power3.inOut'});animar(objetivo,{x:v[1][0],y:v[1][1],z:v[1][2],duration:1.8,ease:'power3.inOut'});
      pasos.forEach((p,i)=>{
        animar(p.b.material,{emissiveIntensity:e===i+1?.45:i===4?.25:.07,duration:.8});
        animar(p.sp.material,{opacity:e===0||e>=6||e===i+1?1:0,duration:.5});
      });
      animar(rm.uniforms.uAlpha,{value:e>=6?.85:0,duration:1.2});},
    salir(){estado=-1;},
    tick(t){cam.lookAt(objetivo);pasos[4].ed.material.opacity=.7+.15*Math.sin(t*1.2);rm.uniforms.uT.value=t;}};
}
// =============== CICLO DEL AGENTE ===============
function crearAgentes(){
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.1,100);cam.position.set(0,6.2,10.5);cam.lookAt(0,-0.6,0);
  scene.add(new THREE.HemisphereLight(0xf4f7fa,0x0a0f1c,1.2));
  const luz=new THREE.DirectionalLight(0xf4f7fa,1.5);luz.position.set(-2,5,7);scene.add(luz);
  const g=new THREE.Group();g.position.set(-2.3,-0.4,0);scene.add(g);
  const R=2.5;
  const anillo=new THREE.Mesh(new THREE.TorusGeometry(R,.025,12,220),new THREE.MeshBasicMaterial({color:0x6da9ed,transparent:true,opacity:.75}));anillo.rotation.x=Math.PI/2;g.add(anillo);
  const anillo2=new THREE.Mesh(new THREE.TorusGeometry(R,.12,12,220),new THREE.MeshBasicMaterial({color:0x6da9ed,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false}));anillo2.rotation.x=Math.PI/2;g.add(anillo2);
  const nombres=[['Percibir','observa el resultado'],['Razonar','planea el siguiente paso'],['Actuar','edita, ejecuta, prueba'],['Herramientas','terminal · navegador · API · MCP']];
  const cols=['#54dcc5','#6da9ed','#f4f7fa','#ffbd69'];const nodos=[];
  nombres.forEach(([n,s],i)=>{const a=-i/4*Math.PI*2+Math.PI/2;const x=Math.cos(a)*R,z=Math.sin(a)*R;
    const m=new THREE.Mesh(new THREE.SphereGeometry(.28,24,24),new THREE.MeshStandardMaterial({color:cols[i],metalness:.25,roughness:.35,emissive:cols[i],emissiveIntensity:.12}));m.position.set(x,0,z);g.add(m);
    const halo=new THREE.Mesh(new THREE.SphereGeometry(.5,32,32),new THREE.MeshBasicMaterial({color:cols[i],transparent:true,opacity:.15,blending:THREE.AdditiveBlending,depthWrite:false}));m.add(halo);
    const sp=textoSprite(n,{size:90,color:'#f4f7fa',sub:s,escala:.95});sp.position.set(x*1.18,1.15,z*1.18);g.add(sp);nodos.push({m,halo,a});});
  const centro=textoSprite('Objetivo',{size:80,color:'#ffbd69',escala:.6});centro.position.set(0,.35,0);g.add(centro);
  const pulso=new THREE.Mesh(new THREE.SphereGeometry(.13,24,24),new THREE.MeshBasicMaterial({color:0xf4f7fa}));g.add(pulso);
  const N=1000,sem=new Float32Array(N);for(let i=0;i<N;i++)sem[i]=Math.random();
  const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3));pg.setAttribute('sem',new THREE.BufferAttribute(sem,1));
  pg.boundingSphere=new THREE.Sphere(new THREE.Vector3(),R+.4);
  const pm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uT:{value:0},uTam:{value:16*DPR}},
    vertexShader:`attribute float sem;uniform float uT,uTam;void main(){float a=-uT*.9+1.5708+sem*6.2832,r=2.5+sin(sem*50.0+uT)*.18;vec3 p=vec3(cos(a)*r,sin(sem*90.0+uT*1.3)*.12,sin(a)*r);vec4 mv=modelViewMatrix*vec4(p,1.0);gl_Position=projectionMatrix*mv;gl_PointSize=uTam/(-mv.z);}`,
    fragmentShader:`void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;gl_FragColor=vec4(.43,.66,.93,(1.0-r*2.0)*.65);}`});
  g.add(new THREE.Points(pg,pm));
  return {scene,cam,set(){},salir(){},
    tick(t){const ang=-t*.9+Math.PI/2;pulso.position.set(Math.cos(ang)*R,0,Math.sin(ang)*R);pm.uniforms.uT.value=t;
      nodos.forEach(n=>{let d=Math.abs(((ang-n.a)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI);const k=Math.max(0,1-d/0.7);n.halo.scale.setScalar(1+k*.3);n.halo.material.opacity=.055+k*.12;});
      g.rotation.y=Math.sin(t*.25)*.25; g.rotation.z=Math.sin(t*.2)*.05; }};
}
function activarRespaldo(){
  respaldo=true;detener();
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.id='escena';svg.setAttribute('viewBox','0 0 1920 1080');svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  canvas.replaceWith(svg);canvas=svg;if(window.Escenas)window.Escenas.ok=false;
}
function textoSVG(x,y,txt,tam=30,color='#f4f7fa'){
  return `<text x="${x}" y="${y}" fill="${color}" font-family="Inter, sans-serif" font-size="${tam}" font-weight="600" text-anchor="middle">${txt}</text>`;
}
function dibujarRespaldo(n,e){
  let dibujo='';
  if(n==='agentes'){
    dibujo='<defs><marker id="flecha-agente" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#6da9ed"/></marker></defs>';
    dibujo+='<g fill="none" stroke="#6da9ed" stroke-width="2" marker-end="url(#flecha-agente)"><path d="M 765 320 Q 940 320 940 470"/><path d="M 940 610 Q 940 760 765 760"/><path d="M 455 760 Q 280 760 280 610"/><path d="M 280 470 Q 280 320 455 320"/></g>';
    for(const [t,sub,color,x,y] of ciclo){const px=960+x*100,py=540-y*100;
      dibujo+=`<rect x="${px-152}" y="${py-56}" width="304" height="112" rx="6" fill="#0a0f1c" stroke="${color}" stroke-opacity=".6"/>`+textoSVG(px,py-7,t,32)+textoSVG(px,py+28,sub,20,'#b4c6d4');
    }
    dibujo+='<circle cx="610" cy="540" r="68" fill="none" stroke="#ffbd69" stroke-opacity=".65"/>'+textoSVG(610,549,'Objetivo',30,'#ffbd69');
  }else if(n==='revoluciones'){
    for(let i=0;i<5;i++){
      const x=940+i*160,h=70+i*55,y=705-h,color=pasos[i][2],op=e===i+1||e>=6?1:.65;
      dibujo+=`<path d="M ${x} ${y} l 20 -14 h 125 l -20 14 z" fill="${color}" opacity="${op*.65}"/><rect x="${x}" y="${y}" width="125" height="${h}" fill="#0a0f1c" stroke="${color}" stroke-opacity="${op}"/><path d="M ${x+125} ${y} l 20 -14 v ${h} l -20 14 z" fill="${color}" opacity=".3"/>`;
      dibujo+=textoSVG(x+62,y-57,`${i+1} · ${pasos[i][0]}`,23,i===4?'#ffbd69':'#f4f7fa')+textoSVG(x+62,y-30,pasos[i][1],18,'#b4c6d4');
    }
    if(e>=6)dibujo+='<path d="M 1705 415 Q 1750 400 1810 340" fill="none" stroke="#ffbd69" stroke-width="5"/>';
  }else if(n==='fuego'){
    if(e===0)dibujo='<path d="M 1440 715 C 1270 705 1300 525 1380 465 C 1360 550 1435 535 1445 345 C 1520 430 1480 500 1535 540 C 1615 650 1520 715 1440 715" fill="#ffbd69"/><path d="M 1440 700 C 1370 660 1390 575 1450 530 C 1440 600 1510 630 1480 680 Z" fill="#ffe0b6"/>';
    else if(e===1)dibujo='<g stroke="#54dcc5" fill="none"><circle cx="1440" cy="530" r="185" fill="#0a0f1c"/><ellipse cx="1440" cy="530" rx="85" ry="185"/><ellipse cx="1440" cy="530" rx="145" ry="185"/><ellipse cx="1440" cy="530" rx="185" ry="65"/><path d="M 1270 470 Q 1450 335 1595 580" stroke="#6da9ed" stroke-width="2"/></g>';
    else dibujo='<g fill="none" stroke-width="2"><ellipse cx="1440" cy="530" rx="195" ry="90" stroke="#54dcc5"/><ellipse cx="1440" cy="530" rx="195" ry="90" transform="rotate(60 1440 530)" stroke="#6da9ed"/><ellipse cx="1440" cy="530" rx="195" ry="90" transform="rotate(-60 1440 530)" stroke="#6da9ed"/><path d="M 1440 460 L 1505 510 L 1480 590 L 1400 590 L 1375 510 Z" fill="#244c66" stroke="#b4c6d4"/></g>';
    dibujo+=textoSVG(1440,820,['Fuego','Internet','Agentes'][Math.min(2,e)],38);
  }else{
    dibujo='<g fill="#6da9ed" stroke="#6da9ed" opacity=".25">';
    for(let i=0;i<6;i++)for(let j=0;j<3;j++){const x=1080+i*110,y=865+j*50;dibujo+=`<circle cx="${x}" cy="${y}" r="4"/>`;if((n==='cierre'||e>0)&&i<5)dibujo+=`<path d="M ${x} ${y} L ${x+110} ${865+(j+1)%3*50}" fill="none"/>`;}
    dibujo+='</g>';
  }
  canvas.innerHTML=`<title>${descripciones[n]} Ilustración simplificada: WebGL no disponible.</title>${dibujo}`;
}
const fabricas={titulo:()=>crearTitulo('titulo'),cierre:()=>crearTitulo('cierre'),fuego:crearFuego,revoluciones:crearRevoluciones,agentes:crearAgentes};
let actual=null,nombreActual=null,estadoActual=0,raf=0,tiempo=0,ultimo=0;
function detener(){cancelAnimationFrame(raf);raf=0;ultimo=0;}
function dibujar(){if(actual&&!respaldo&&!document.hidden){actual.tick(movimiento.matches?0:tiempo);renderer.render(actual.scene,actual.cam);}}
function bucle(ahora){
  raf=0;if(!nombreActual||document.hidden||movimiento.matches||respaldo)return;
  if(ultimo)tiempo+=Math.min((ahora-ultimo)/1000,.1);ultimo=ahora;dibujar();raf=requestAnimationFrame(bucle);
}
function reanudar(){
  detener();if(!nombreActual||document.hidden||respaldo)return;
  dibujar();if(!movimiento.matches)raf=requestAnimationFrame(bucle);
}
function obtener(n){if(!E[n]){E[n]=fabricas[n]();E[n].cam.aspect=16/9;E[n].cam.updateProjectionMatrix();}return E[n];}
window.Escenas={ok:!respaldo,
  set(nombre,estado=0){
    detener();
    if(!Object.prototype.hasOwnProperty.call(fabricas,nombre)){
      if(actual)actual.salir();nombreActual=null;canvas.classList.remove('on');return;
    }
    nombreActual=nombre;estadoActual=Math.max(0,Math.min(6,Number.isFinite(estado)?Math.floor(estado):0));
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',descripciones[nombre]);
    if(nombre==='titulo'||nombre==='cierre')canvas.setAttribute('aria-hidden','true');else canvas.removeAttribute('aria-hidden');
    if(respaldo)dibujarRespaldo(nombre,estadoActual);
    else{
      const s=obtener(nombre);
      if(actual!==s){if(actual)actual.salir();tiempo=0;}
      actual=s;s.set(estadoActual);reanudar();
    }
    canvas.classList.add('on');
  },
  precargar(){if(!respaldo)for(const n in fabricas)obtener(n);}
};
addEventListener('resize',tamano);
document.addEventListener('visibilitychange',reanudar);
movimiento.addEventListener('change',()=>{if(actual)actual.salir();if(nombreActual)window.Escenas.set(nombreActual,estadoActual);});
if(respaldo)activarRespaldo();
else{
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();activarRespaldo();if(nombreActual)window.Escenas.set(nombreActual,estadoActual);});
  tamano();
}
document.fonts.ready.then(()=>{for(const pintar of etiquetas)pintar();dibujar();});
})();
