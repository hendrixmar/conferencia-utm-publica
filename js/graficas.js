/* Gráficas animadas (Chart.js) a partir de window.DATOS (generado desde graficas/datos_graficas.csv). */
(function(){
const D=window.DATOS;
const movimiento=window.matchMedia('(prefers-reduced-motion: reduce)');
const MES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const COL={'Anthropic':'#ff8a5c','OpenAI':'#19c39c','Google':'#5b9cff','xAI (SpaceXAI)':'#e5e7eb','Meta':'#a78bfa','DeepSeek':'#6d8dff','Alibaba (Qwen)':'#ffb020','Moonshot (Kimi)':'#ff5c9a','Z.ai (GLM)':'#2dd4bf'};
const LABS=Object.keys(COL);
const ACC='#5ee6d0',VIO='#7fb2ff',FUE='#ffb45c',GRIS='rgba(180,198,212,.35)';
const ts=f=>Date.parse(f+'T12:00:00Z');
const X0=ts('2025-11-10'),X1=ts('2026-10-12');
const fmtN=(v,d=0)=>v.toLocaleString('es-MX',{minimumFractionDigits:d,maximumFractionDigits:d});
function corto(m){return m.replace('Claude ','').replace(' Preview','').replace(' 397B A17B','').replace(' Thinking','').replace('DeepSeek ','DS ').replace(' 0424','').replace(' (0902)','').trim();}
Chart.defaults.font.family="Inter, system-ui, sans-serif"; Chart.defaults.font.size=20; Chart.defaults.color='#b4c6d4';
Chart.defaults.borderColor='rgba(180,198,212,.12)'; Chart.defaults.devicePixelRatio=Math.min(2,window.devicePixelRatio||1);
Object.assign(Chart.defaults.plugins.tooltip,{backgroundColor:'rgba(10,15,28,.98)',borderColor:'rgba(180,198,212,.24)',borderWidth:1,padding:14,titleColor:'#f4f7fa',bodyColor:'#f4f7fa',titleFont:{weight:'600',size:18},bodyFont:{size:17},cornerRadius:8});
Chart.defaults.plugins.legend.display=false;
// --- plugins propios ---
const cortina={id:'cortina',
  beforeDatasetDraw(ch,a){const ds=ch.data.datasets[a.index]; if(!ds.cortina) return; const p=ch.$cortina??1, c=ch.chartArea; const g=ch.ctx; g.save(); g.beginPath(); g.rect(c.left-20,c.top-60,(c.width+40)*p,c.height+120); g.clip();},
  afterDatasetDraw(ch,a){const ds=ch.data.datasets[a.index]; if(ds.cortina) ch.ctx.restore();}};
const etiquetas={id:'etiquetas',
  beforeUpdate(ch){
    for(const ds of ch.data.datasets) if(ds.etiquetas) for(const e of ds.etiquetas){
      e.$font=`${e.peso||600} ${e.tam||17}px ${e.fam||'Inter'}`; e.$medidas=null;
    }
  },
  afterDatasetsDraw(ch){const al=ch.$etq??0; if(al<=0) return; const g=ch.ctx,p=ch.options.layout.padding,n=typeof p==='number'?p:0;
    // Chart.js dibuja en píxeles lógicos; canvas.width incluye el DPR.
    const minX=Math.max(8,p.left??n),maxX=ch.width-Math.max(8,p.right??n),minY=Math.max(8,p.top??n),maxY=ch.height-Math.max(8,p.bottom??n);
    for(let di=0;di<ch.data.datasets.length;di++){const ds=ch.data.datasets[di]; if(!ds.etiquetas||!ch.isDatasetVisible(di)) continue; const meta=ch.getDatasetMeta(di);
      for(const e of ds.etiquetas){const el=meta.data[e.i]; if(!el) continue; g.save(); g.globalAlpha=al*(e.alpha??1);
        const align=e.align||'center',fondo=e.fondo?8:0;
        g.font=e.$font; g.textAlign=align; g.textBaseline='middle';
        // Medir una vez por actualización, no en cada cuadro de la animación.
        const m=e.$medidas||(e.$medidas=g.measureText(e.txt)),w=m.width;
        const izq=Math.max(m.actualBoundingBoxLeft??0,align==='right'?w:align==='center'?w/2:0)+fondo;
        const der=Math.max(m.actualBoundingBoxRight??w,align==='left'?w:align==='center'?w/2:0)+fondo;
        const arriba=Math.max(m.actualBoundingBoxAscent??(e.tam||17)/2,e.fondo?16:0);
        const abajo=Math.max(m.actualBoundingBoxDescent??(e.tam||17)/2,e.fondo?16:0);
        const x=Math.max(minX+izq,Math.min(maxX-der,el.x+(e.dx||0))),y=Math.max(minY+arriba,Math.min(maxY-abajo,el.y+(e.dy||0)));
        if(e.linea){g.strokeStyle='rgba(180,198,212,.55)'; g.lineWidth=1.5; g.beginPath(); g.moveTo(el.x,el.y); g.lineTo(x,y+(e.dy<0?abajo:-arriba)); g.stroke();}
        if(e.fondo){g.fillStyle='rgba(4,6,12,.9)'; g.fillRect(x-izq,y-arriba,izq+der,arriba+abajo);}
        g.fillStyle=e.color||'#f4f7fa'; g.fillText(e.txt,x,y); g.restore();
      }
    }
  }};
const lineasV={id:'lineasV',afterDraw(ch){const L=ch.$lineas; if(!Array.isArray(L)) return; const al=ch.$etq??0; if(al<=0) return; const g=ch.ctx,c=ch.chartArea,xs=ch.scales.x;
  L.forEach(l=>{const x=xs.getPixelForValue(l.x); g.save(); g.globalAlpha=al; g.strokeStyle=l.color||FUE; g.setLineDash([6,6]); g.lineWidth=2; g.beginPath(); g.moveTo(x,c.top); g.lineTo(x,c.bottom); g.stroke(); g.restore();});}};
Chart.register(cortina,etiquetas,lineasV);
function ejeFecha(extra={}){return Object.assign({type:'linear',min:X0,max:X1,grid:{display:false},border:{color:'rgba(255,255,255,.15)'},
  afterBuildTicks(ax){const t=[];let d=new Date(Date.UTC(2025,10,1));while(d.getTime()<=X1){if(d.getTime()>=X0)t.push({value:d.getTime()});d=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1));}ax.ticks=t;},
  ticks:{callback(v){const d=new Date(v);const m=d.getUTCMonth();return (m===0||m===10)?[MES[m],String(d.getUTCFullYear())]:MES[m];},maxRotation:0,autoSkip:false}},extra);}
function frontera(pts){const s=[...pts].sort((a,b)=>ts(a.f)-ts(b.f)||b.v-a.v);const f=[];let m=-1;for(const p of s){if(p.v>m){m=p.v;f.push(p);}}return f;}
function animar(ch,{cortinaDur=1.2,etqDelay=.8}={}){ ch.$cortina=0; ch.$etq=0;
  gsap.to(ch,{$cortina:1,duration:cortinaDur,ease:'power2.out',delay:.1,onUpdate:()=>{if(ch.ctx)ch.draw();}});
  gsap.to(ch,{$etq:1,duration:.45,delay:etqDelay,onUpdate:()=>{if(ch.ctx)ch.draw();}}); return ch; }
const popDelay=ctx=>(ctx.type==='data'&&ctx.mode==='default'&&ctx.raw&&ctx.raw.x)?Math.max(0,(ctx.raw.x-X0)/(X1-X0))*600:0;
const popAnim={radius:{from:0,duration:400,easing:'easeOutCubic',delay:popDelay},x:{duration:0},y:{duration:0}};
const G={};
// ---------- 1. Línea de tiempo ----------
G.g1=cv=>{const aa=D.aa;const ds=LABS.map((lab,i)=>{const p=aa.filter(r=>r.lab===lab).sort((a,b)=>ts(a.f)-ts(b.f));
   return {label:lab,data:p.map(r=>({x:ts(r.f),y:LABS.length-1-i,m:r.m})),backgroundColor:COL[lab],borderColor:'rgba(4,6,12,.9)',borderWidth:2,pointRadius:11,pointHoverRadius:15,
     etiquetas:p.flatMap((r,k)=>k===0||k===p.length-1?[{i:k,txt:corto(r.m),dx:k===0?14:-14,dy:k===0?20:-20,align:k===0?'left':'right',tam:18,peso:500,color:'#b4c6d4'}]:[])};});
  ds.push({type:'line',label:'',data:[{x:ts('2025-11-24'),y:-0.6},{x:ts('2025-11-24'),y:LABS.length-0.4}],borderColor:'rgba(255,138,92,.6)',borderDash:[6,6],borderWidth:2,pointRadius:0,cortina:true});
  const ch=new Chart(cv,{type:'scatter',data:{datasets:ds},options:{responsive:true,maintainAspectRatio:false,animations:popAnim,layout:{padding:{right:30}},
    scales:{x:ejeFecha(),y:{min:-0.6,max:LABS.length-0.4,grid:{color:(c)=>'rgba(255,255,255,.05)'},border:{display:false},
      afterBuildTicks(ax){ax.ticks=LABS.map((_,i)=>({value:i}));},ticks:{autoSkip:false,font:{size:19,weight:'600'},color:c=>COL[LABS[LABS.length-1-c.tick.value]]||'#999',callback:v=>LABS[LABS.length-1-v]}}},
    plugins:{tooltip:{callbacks:{label:c=>`${c.raw.m} · ${new Date(c.raw.x).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})}`}}}}});
  return animar(ch,{cortinaDur:1.2,etqDelay:2.4});};
// ---------- 2. Índice AA ----------
G.g2=(cv,opc={})=>{const aa=D.aa;const sol=opc.soloFrontera;
  const ds=LABS.map(lab=>{const p=aa.filter(r=>r.lab===lab);return {label:lab,data:p.map(r=>({x:ts(r.f),y:r.v,m:r.m,est:r.est,ab:r.ab})),
    pointStyle:p.map(r=>r.ab?'rectRot':'circle'),pointRadius:p.map(r=>r.ab?12:10),backgroundColor:p.map(r=>r.est?'rgba(0,0,0,0)':COL[lab]),borderColor:COL[lab],borderWidth:2.5,
    hidden:false,_al:sol?0.18:1};});
  if(sol) ds.forEach(d=>{d.backgroundColor=d.backgroundColor.map(c=>c==='rgba(0,0,0,0)'?c:'rgba(180,198,212,.18)');d.borderColor='rgba(180,198,212,.25)';});
  const fr=frontera(aa);const fd=[];fr.forEach((p,i)=>fd.push({x:ts(p.f),y:p.v,m:p.m}));fd.push({x:ts('2026-10-02'),y:fr[fr.length-1].v,m:''});
  const iO=fd.findIndex(p=>p.m==='Claude Opus 4.5'), iT=fd.length-2;
  ds.push({type:'line',label:'Frontera',data:fd,stepped:'before',borderColor:sol?FUE:'rgba(255,255,255,.85)',borderWidth:sol?5:3,pointRadius:0,cortina:true,
    etiquetas:[{i:iO,txt:`Opus 4.5 · ${fmtN(fd[iO].y,1)}`,dx:16,dy:34,align:'left',tam:24,peso:700,fam:'Archivo'},{i:iT,txt:`${fd[iT].m} · ${fmtN(fd[iT].y,1)}`,dx:-20,dy:-30,align:'right',tam:26,peso:700,fam:'Archivo',color:sol?FUE:'#f4f7fa'}]});
  const ch=new Chart(cv,{type:'scatter',data:{datasets:ds},options:{responsive:true,maintainAspectRatio:false,animations:popAnim,
    scales:{x:ejeFecha(),y:{min:15,max:63,title:{display:true,text:'Puntaje (0–100)'},grid:{color:'rgba(255,255,255,.06)'},border:{display:false}}},
    plugins:{tooltip:{callbacks:{label:c=>c.raw.m?`${c.raw.m}: ${fmtN(c.raw.y,1)}${c.raw.est?' (estimado)':''}`:''}}}}});
  return animar(ch,{cortinaDur:sol?2.2:2.6,etqDelay:sol?1.8:2.6});};
// ---------- 3. SWE-bench ----------
G.g3=cv=>{const mk=(arr,est)=>LABS.filter(l=>arr.some(r=>r.lab===l)).map(lab=>{const p=arr.filter(r=>r.lab===lab);return {label:lab+est,data:p.map(r=>({x:ts(r.f),y:r.v,m:r.m})),pointStyle:est===' Pro'?'rect':'circle',
    pointRadius:est===' Pro'?10:11,backgroundColor:COL[lab],borderColor:'rgba(4,6,12,.9)',borderWidth:2};});
  const linea=(arr,dash,col,etq)=>{const fr=frontera(arr);const d=fr.map(p=>({x:ts(p.f),y:p.v,m:p.m}));d.push({x:ts('2026-10-02'),y:fr[fr.length-1].v,m:''});
    return {type:'line',data:d,stepped:'before',borderColor:col,borderDash:dash,borderWidth:3.5,pointRadius:0,cortina:true,etiquetas:etq(d)};};
  const ds=[...mk(D.swev,''),...mk(D.swep,' Pro'),
    linea(D.swev,[],ACC,d=>[{i:0,txt:'Verified · Opus 4.5 80.9%',dx:12,dy:-26,align:'left',tam:20,peso:700,color:ACC,fondo:1},{i:d.length-2,txt:'Opus 5 · 96%',dx:-14,dy:-26,align:'right',tam:24,peso:700,color:ACC,fondo:1}]),
    linea(D.swep,[10,8],VIO,d=>[{i:0,txt:'Pro · Opus 4.5 52%',dx:12,dy:30,align:'left',tam:20,peso:700,color:VIO,fondo:1},{i:d.length-2,txt:'Opus 5.5 · 89.9%',dx:-14,dy:30,align:'right',tam:24,peso:700,color:VIO,fondo:1}])];
  const ch=new Chart(cv,{type:'scatter',data:{datasets:ds},options:{responsive:true,maintainAspectRatio:false,animations:popAnim,
    scales:{x:ejeFecha(),y:{min:45,max:100,title:{display:true,text:'% de tareas resueltas'},grid:{color:'rgba(255,255,255,.06)'},border:{display:false}}},
    plugins:{tooltip:{callbacks:{label:c=>c.raw.m?`${c.raw.m}: ${fmtN(c.raw.y,1)}%`:''}}}}});
  ch.$lineas=[{x:ts('2026-02-23'),color:FUE},{x:ts('2026-07-08'),color:VIO}];
  return animar(ch,{cortinaDur:2.6,etqDelay:2.4});};
// ---------- 4. Un dominio por diapositiva ----------
function iniBest(pts){const ini=pts.find(p=>p.m==='Claude Opus 4.5')||pts[0];const best=[...pts].sort((a,b)=>b.v-a.v||ts(a.f)-ts(b.f))[0];return {ini,best};}
G.g4=(cont,{dominio})=>{const dm=D.dominios[dominio];cont.innerHTML='';const cel=document.createElement('div');cel.className='mini vidrio';
  const {ini,best}=iniBest(dm.pts);const dag=ini.m==='Claude Opus 4.5'?'':'†';
  cel.innerHTML=`<div class="mv"><span class="a">${fmtN(ini.v,0)}%${dag} · ${corto(ini.m)}</span><span class="fl">→</span><span class="b">${fmtN(best.v,0)}% · ${corto(best.m)}</span></div><div class="mc"><canvas></canvas></div>`;
  cont.appendChild(cel);const cv=cel.querySelector('canvas');const fr=frontera(dm.pts);const fd=fr.map(p=>({x:ts(p.f),y:p.v}));fd.push({x:X1,y:fr[fr.length-1].v});
  const ch=new Chart(cv,{type:'scatter',data:{datasets:[
    {data:dm.pts.map(p=>({x:ts(p.f),y:p.v,m:p.m})),backgroundColor:dm.pts.map(p=>COL[p.lab]||'#b4c6d4'),pointRadius:9,pointHoverRadius:13,borderColor:'#0a0f1c',borderWidth:2,_a:1},
    {type:'line',data:fd,stepped:'before',borderColor:FUE,borderWidth:4.5,pointRadius:0,cortina:true},
    {data:[{x:ts(ini.f),y:ini.v,m:ini.m}],pointRadius:13,backgroundColor:'#0a0f1c',borderColor:FUE,borderWidth:3},
    {data:[{x:ts(best.f),y:best.v,m:best.m}],pointRadius:15,backgroundColor:COL[best.lab]||'#b4c6d4',borderColor:FUE,borderWidth:3.5}]},
    options:{responsive:true,maintainAspectRatio:false,animations:popAnim,layout:{padding:{top:4,right:8}},
      scales:{x:Object.assign(ejeFecha(),{border:{color:'rgba(84,220,197,.3)'},afterBuildTicks(ax){ax.ticks=[ts('2025-12-01'),ts('2026-03-01'),ts('2026-06-01'),ts('2026-09-01')].map(v=>({value:v}));},ticks:{font:{size:22,weight:'600'},color:'#b4c6d4',callback:v=>MES[new Date(v).getUTCMonth()]}}),
        y:{min:0,max:105,afterBuildTicks(ax){ax.ticks=ax.ticks.filter(t=>t.value<=100);},ticks:{font:{size:22},color:'#b4c6d4',callback:v=>`${v}%`},grid:{color:'rgba(180,198,212,.12)'},border:{display:false}}},
      plugins:{tooltip:{callbacks:{label:c=>c.raw.m?`${c.raw.m}: ${fmtN(c.raw.y,1)}%`:''}}}}});
  return animar(ch,{cortinaDur:1.6,etqDelay:0});};
// ---------- 5. Antes / ahora ----------
G.g5=cv=>{const R=D.dominios.map(dm=>({dom:dm.dom,...iniBest(dm.pts)}));
  const ch=new Chart(cv,{type:'bar',data:{labels:R.map(r=>r.dom),datasets:[
    {data:R.map(r=>[r.ini.v,r.best.v]),backgroundColor:FUE,
     borderRadius:20,borderSkipped:false,barThickness:22,
}]},
    options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,layout:{padding:{right:260}},
      animation:{delay:c=>c.type==='data'&&c.mode==='default'?c.dataIndex*120:0,duration:1100,easing:'easeOutCubic'},
      scales:{x:{min:0,max:100,ticks:{callback:v=>v+'%'},grid:{color:'rgba(255,255,255,.06)'}},y:{grid:{display:false},ticks:{font:{size:21,weight:'600'},color:'#f4f7fa'}}},
      plugins:{tooltip:{callbacks:{label:c=>{const r=R[c.dataIndex];return `${fmtN(r.ini.v,1)}% (${corto(r.ini.m)}) → ${fmtN(r.best.v,1)}% (${corto(r.best.m)})`;}}}}},
    plugins:[{id:'extremos',afterDatasetsDraw(ch){const al=ch.$etq??0;if(al<=0)return;const g=ch.ctx,m=ch.getDatasetMeta(0);g.save();g.globalAlpha=al;
      m.data.forEach((b,i)=>{const r=R[i];const x0=ch.scales.x.getPixelForValue(r.ini.v),x1=ch.scales.x.getPixelForValue(r.best.v);
        g.fillStyle='#04060c';g.strokeStyle='#b4c6d4';g.lineWidth=3;g.beginPath();g.arc(x0,b.y,10,0,7);g.fill();g.stroke();
        g.fillStyle=FUE;g.beginPath();g.arc(x1,b.y,12,0,7);g.fill();
        g.font='500 17px Inter';g.fillStyle='#b4c6d4';g.textAlign='right';g.fillText(fmtN(r.ini.v,0)+(r.ini.m==='Claude Opus 4.5'?'':'†'),x0-18,b.y+6);
        g.font='700 20px Archivo';g.fillStyle=FUE;g.textAlign='left';g.fillText(`${fmtN(r.best.v,0)}%  ${corto(r.best.m)}`,x1+20,b.y+7);});g.restore();}}]});
  ch.$etq=0; gsap.to(ch,{$etq:1,duration:.8,delay:1.6,onUpdate:()=>{if(ch.ctx)ch.draw();}}); return ch;};
// ---------- 6a. Commits públicos por día ----------
G.g6a=cv=>{const c=D.gh.commitsDia;const v=c.map(r=>r.v/1e6);const is26=c.map(r=>r.f>='2026');
  const ch=new Chart(cv,{type:'bar',data:{labels:c.map(r=>{const m=+r.f.slice(5,7)-1;return m===0?[MES[m],r.f.slice(0,4)]:MES[m];}),datasets:[{data:v,borderRadius:8,
    backgroundColor:x=>is26[x.dataIndex]?ACC:GRIS,
    etiquetas:[{i:c.findIndex(r=>r.f==='2026-01-01'),txt:'4.8 M/día',dy:-26,tam:20,peso:700},{i:c.length-1,txt:`${fmtN(v[v.length-1],0)} M/día`,dy:-28,tam:28,peso:700,fam:'Archivo',color:ACC}]}]},
    options:{responsive:true,maintainAspectRatio:false,animation:{delay:x=>x.type==='data'&&x.mode==='default'?x.dataIndex*70:0,duration:900,easing:'easeOutCubic'},
      scales:{y:{title:{display:true,text:'millones de commits públicos por día'},grid:{color:'rgba(255,255,255,.06)'},border:{display:false}},x:{grid:{display:false},ticks:{maxRotation:0,autoSkip:false,font:{size:15}}}},
      plugins:{tooltip:{callbacks:{label:x=>`${fmtN(x.raw,1)} millones/día`}}}}});
  ch.$etq=0;gsap.to(ch,{$etq:1,duration:.8,delay:2,onUpdate:()=>{if(ch.ctx)ch.draw();}});return ch;};
// ---------- 6b. Pushes por trimestre + commits de agentes ----------
G.g6b=cv=>{const q=D.gh.pushes;const v=q.map(r=>r.v/1e6);
  const ch=new Chart(cv,{type:'bar',data:{labels:q.map(r=>r.var.replace('-T',' T')),datasets:[{data:v,borderRadius:8,backgroundColor:q.map(r=>r.f>='2026'?FUE:'rgba(109,169,237,.55)'),
    etiquetas:[{i:v.length-1,txt:`${fmtN(v[v.length-1],0)} M`,dy:-24,tam:24,peso:700,fam:'Archivo',color:FUE}]}]},
    options:{responsive:true,maintainAspectRatio:false,animation:{delay:x=>x.type==='data'&&x.mode==='default'?x.dataIndex*80:0,duration:900},
      scales:{y:{grid:{color:'rgba(255,255,255,.06)'},border:{display:false},ticks:{callback:x=>x+' M'}},x:{grid:{display:false},ticks:{maxRotation:0,font:{size:14},callback:function(val,i){const l=this.getLabelForValue(val);return l.endsWith('T1')?l:'';}}}},
      plugins:{tooltip:{callbacks:{label:x=>`${fmtN(x.raw,1)} millones de pushes`}}}}});
  ch.$etq=0;gsap.to(ch,{$etq:1,duration:.8,delay:1.4,onUpdate:()=>{if(ch.ctx)ch.draw();}});return ch;};
G.g6c=cv=>{const t=D.gh.agentes,c=D.gh.claude;const tv=t.map(r=>r.v/1e6),cv2=c.map(r=>r.v/1e6);
  const ch=new Chart(cv,{type:'bar',data:{labels:t.map(r=>{const m=+r.f.slice(5,7)-1;return m===0?[MES[m],r.f.slice(0,4)]:MES[m];}),datasets:[
    {label:'Claude Code',data:cv2,backgroundColor:'#ff8a5c',borderRadius:4,stack:'s'},
    {label:'otros agentes',data:tv.map((x,i)=>x-cv2[i]),backgroundColor:'rgba(180,198,212,.55)',borderRadius:4,stack:'s',
}]},
    options:{responsive:true,maintainAspectRatio:false,animation:{delay:x=>x.type==='data'&&x.mode==='default'?x.dataIndex*70+x.datasetIndex*300:0,duration:800},
      scales:{x:{stacked:true,grid:{display:false},ticks:{maxRotation:0,autoSkip:false,font:{size:14}}},y:{stacked:true,grid:{color:'rgba(255,255,255,.06)'},border:{display:false},ticks:{callback:x=>x+' M'}}},
      plugins:{legend:{display:true,position:'top',align:'start',labels:{boxWidth:14,boxHeight:14,useBorderRadius:true,borderRadius:7,color:'#b4c6d4',font:{size:17}}},tooltip:{callbacks:{label:x=>`${x.dataset.label}: ${fmtN(x.raw,2)} M`}}}},
    plugins:[{id:'topeEtq',afterDatasetsDraw(c){const al=c.$etq??0;if(al<=0)return;const m=c.getDatasetMeta(1),el=m.data[m.data.length-1];const g=c.ctx;g.save();g.globalAlpha=al;g.font='700 24px Archivo';g.fillStyle=FUE;g.textAlign='right';g.fillText(`${fmtN(tv[tv.length-1],1)} M`,el.x+12,el.y-16);g.restore();}}]});
  ch.$etq=0;gsap.to(ch,{$etq:1,duration:.8,delay:2,onUpdate:()=>{if(ch.ctx)ch.draw();}});return ch;};
// ---------- 7a. Mis commits por año ----------
G.g7a=cv=>{const P=D.hk.anioPub,Q=D.hk.anioPriv;const yy=P.map(r=>r.f.slice(0,4));const tot=P.map((r,i)=>r.v+Q[i].v);
  const ch=new Chart(cv,{type:'bar',data:{labels:yy.map(y=>y==='2026'?['2026','(al 2 oct)']:y),datasets:[
    {label:'repos privados',data:Q.map(r=>r.v),stack:'s',borderRadius:6,backgroundColor:x=>yy[x.dataIndex]==='2026'?FUE:'rgba(109,169,237,.75)'},
    {label:'repos públicos',data:P.map(r=>r.v),stack:'s',borderRadius:6,backgroundColor:x=>yy[x.dataIndex]==='2026'?'#ffe0b6':'rgba(84,220,197,.7)',
      etiquetas:tot.map((v,i)=>({i,txt:fmtN(v),dy:-18,tam:yy[i]==='2026'?30:17,peso:yy[i]==='2026'?700:600,fam:yy[i]==='2026'?'Archivo':'Inter',color:yy[i]==='2026'?FUE:'#b4c6d4',fondo:1}))}]},
    options:{responsive:true,maintainAspectRatio:false,layout:{padding:{top:10,right:14}},animation:{delay:x=>x.type==='data'&&x.mode==='default'?x.dataIndex*110:0,duration:1000,easing:'easeOutCubic'},
      scales:{x:{stacked:true,grid:{display:false},ticks:{maxRotation:0,autoSkip:false,font:{size:16}}},y:{stacked:true,grace:'18%',grid:{color:'rgba(255,255,255,.06)'},border:{display:false},ticks:{callback:v=>fmtN(v)}}},
      plugins:{legend:{display:true,position:'top',align:'start',labels:{boxWidth:14,boxHeight:14,color:'#b4c6d4',font:{size:17}}},tooltip:{callbacks:{label:x=>`${x.dataset.label}: ${fmtN(x.raw)}`}}}}});
  ch.$etq=0;gsap.to(ch,{$etq:1,duration:.8,delay:1.4,onUpdate:()=>{if(ch.ctx)ch.draw();}});return ch;};
// ---------- 7b. Mes por mes 2025–2026 ----------
G.g7b=cv=>{const f=s=>s.filter(r=>r.f<'2026-10');const P=f(D.hk.mesPub),Q=f(D.hk.mesPriv),I=f(D.hk.mesIA);const is26=P.map(r=>r.f>='2026');const T=P.map((r,i)=>r.v+Q[i].v);
  const ch=new Chart(cv,{type:'bar',data:{labels:P.map(r=>{const m=+r.f.slice(5,7)-1;return m===0?[MES[m],r.f.slice(0,4)]:MES[m];}),datasets:[
    {type:'line',label:'con coautor IA',data:I.map(r=>r.v),borderColor:'#f4f7fa',backgroundColor:'#f4f7fa',borderDash:[6,5],borderWidth:2.5,pointRadius:I.map(r=>r.v>0?5:0),tension:.25,cortina:true,order:0},
    {label:'privados',data:Q.map(r=>r.v),stack:'s',borderRadius:5,backgroundColor:P.map((r,i)=>is26[i]?FUE:'rgba(109,169,237,.75)'),order:1},
    {label:'públicos',data:P.map(r=>r.v),stack:'s',borderRadius:5,backgroundColor:P.map((r,i)=>is26[i]?'#ffe0b6':'rgba(84,220,197,.7)'),order:1}]},
    options:{responsive:true,maintainAspectRatio:false,animation:{delay:x=>x.type==='data'&&x.mode==='default'&&x.dataset.type!=='line'?x.dataIndex*55:0,duration:800},
      scales:{x:{stacked:true,grid:{display:false},ticks:{maxRotation:0,autoSkip:false,font:{size:13}}},y:{stacked:true,grid:{color:'rgba(255,255,255,.06)'},border:{display:false}}},
      plugins:{legend:{display:true,position:'top',align:'start',labels:{boxWidth:14,boxHeight:14,color:'#b4c6d4',font:{size:17}}},tooltip:{mode:'index',intersect:false,callbacks:{label:x=>`${x.dataset.label}: ${fmtN(x.raw)}`}}}},
    plugins:[{id:'tot',afterDatasetsDraw(c){const al=c.$etq??0;if(al<=0)return;const m=c.getDatasetMeta(2),g=c.ctx;g.save();g.globalAlpha=al;
      m.data.forEach((el,i)=>{if(!is26[i])return;const big=T[i]===Math.max(...T);g.font=big?'700 26px Archivo':'600 15px Inter';g.fillStyle=big?FUE:'#b4c6d4';g.textAlign='center';g.fillText(fmtN(T[i]),el.x,el.y-10);});g.restore();}}]});
  return animar(ch,{cortinaDur:2.2,etqDelay:1.6});};
// ---------- registro ----------
const vivos=new Map();
window.Graficas={
  montar(seccion){ seccion.querySelectorAll('[data-graf]').forEach(el=>{ const id=el.dataset.graf; const prev=vivos.get(el); if(prev){[].concat(prev).forEach(c=>{gsap.killTweensOf(c);c.destroy();});}
      try{ const tgt=el.querySelector('canvas')&&id!=='g4'?el.querySelector('canvas'):el.querySelector('.cont')||el; const opc=el.dataset.opc?JSON.parse(el.dataset.opc):{};
        const creadas=G[id](tgt,opc);
        if(movimiento.matches) [].concat(creadas).forEach(ch=>{
          ch.stop(); ch.options.animation=false; ch.options.animations={};
          gsap.getTweensOf(ch).forEach(t=>t.progress(1));
          ch.$cortina=1; ch.$etq=1; ch.update('none');
        });
        vivos.set(el,creadas); el.classList.remove('falla'); }catch(e){ console.error('Gráfica',id,e); el.classList.add('falla'); } }); },
  desmontar(seccion){ seccion.querySelectorAll('[data-graf]').forEach(el=>{const p=vivos.get(el); if(p){[].concat(p).forEach(c=>{gsap.killTweensOf(c);c.destroy();}); vivos.delete(el);} }); }
};
})();
