(function(){
'use strict';
const data=window.ATLAS_DATA,theories=window.THEORIES,categories=window.CATEGORIES;
const $=id=>document.getElementById(id),byId=Object.fromEntries(data.map(x=>[x.id,x]));
let current=data[0],filtered=data.slice(),raf=0,last=0,theoryCurrent=theories[0];
const state={reveal:false,running:false,time:0,value:.5,variant:0,seed:17};
const canvases=[$('demoCanvas'),$('zoomCanvas')];
function text(id,value){$(id).textContent=value||'';}
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e;}
function linkList(node,sources){node.replaceChildren();const seen=new Set();sources.forEach(source=>{if(seen.has(source.url))return;seen.add(source.url);const li=el('li'),a=el('a','',source.title);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';li.append(a);node.append(li);});}
function stop(){state.running=false;last=0;if(raf){cancelAnimationFrame(raf);raf=0;}updateControls();draw();}
function updateControls(){
 $('revealBtn').setAttribute('aria-pressed',String(state.reveal));text('revealBtn',state.reveal?'答えを閉じて図に戻る':'答え・確かめ方を見る');
 $('answerPanel').hidden=!state.reveal;$('playBtn').hidden=!current.animate;$('zoomPlay').hidden=!current.animate;
 const playText=state.running?'動きを停止':(state.time>0?'動きを再開':'動きを開始');text('playBtn',playText);text('zoomPlay',playText);
 text('motionStatus',current.animate?(state.running?'再生中 · いつでも停止できます':state.time>0?'停止中 · 「最初から」でやり直せます':'停止中 · ボタンで動きを開始します'):(current.experience==='模式図'?'仕組みを説明する模式図です':'画像自体は動いていません'));
 text('elapsed',current.animate?`${state.time.toFixed(1)} 秒`:'');
}
function paint(canvas,entry,s){
 const ctx=canvas.getContext('2d');ctx.save();ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,640,400);ctx.fillStyle='#f7f8fa';ctx.fillRect(0,0,640,400);
 const renderer=window.ILLUSION_RENDERERS[entry.id];
 if(!renderer)throw new Error('描画が見つかりません: '+entry.id);
 ctx.save();renderer(ctx,s);ctx.restore();ctx.restore();
 canvas.setAttribute('aria-label',`${entry.id} ${entry.name}。${entry.question}${s.reveal?' 答え: '+entry.fact:''}`);
}
function draw(){paint(canvases[0],current,state);if($('zoomDialog').open)paint(canvases[1],current,state);text('elapsed',current.animate?`${state.time.toFixed(1)} 秒`:'');}
function tick(now){if(!state.running)return;if(last)state.time+=Math.max(0,(now-last)/1000);last=now;const limit=Number(current.maxSeconds)||20;if(state.time>=limit){state.time=limit;stop();draw();return;}draw();raf=requestAnimationFrame(tick);}
function togglePlay(){if(!current.animate)return;if(state.running){stop();return;}const limit=Number(current.maxSeconds)||20;if(state.time>=limit)state.time=0;state.running=true;last=performance.now();updateControls();raf=requestAnimationFrame(tick);}
function reveal(){state.reveal=!state.reveal;updateControls();draw();}
function reset(){stop();state.time=0;state.reveal=false;state.value=.5;state.variant=0;$('parameter').value='50';text('sliderValue','50');updateControls();draw();}
function choose(id,updateHash=true){
 if(!byId[id])return;stop();current=byId[id];state.time=0;state.reveal=false;state.value=.5;state.variant=0;
 text('itemId',current.id);text('categoryBadge',categories.find(c=>c.id===current.category)?.name||current.category);text('experienceBadge',current.experience);$('experienceBadge').dataset.schematic=String(current.experience==='模式図');
 text('itemName',current.name);text('englishName',current.english);text('question',current.question);text('fact',current.fact);text('check',current.check);text('observation',current.observation);text('mechanism',current.mechanism);text('gameIdea',current.game);text('caution',current.caution);text('aliases',current.aliases?.length?'別名・関連する呼び方：'+current.aliases.join('、'):'別名の記載はありません。');linkList($('sources'),current.sources);
 text('measurementHelp',/RGB/i.test(current.fact)?'色の数値は、赤・緑・青の強さを0〜255で表した指定値です（RGB）。':/ピクセル|座標|ベクトル/.test(current.fact)?'数値は図を作るための共通の目盛りです。画面の大きさに合わせて図全体を拡大縮小します。':'');$('measurementHelp').hidden=!$('measurementHelp').textContent;
 $('sliderWrap').hidden=!current.sliderLabel;text('sliderLabel',current.sliderLabel);$('parameter').value='50';text('sliderValue','50');
 const variantLabels={G04:'周囲の円を入れ替える',C18:'隠れた形を切り替える',M23:'変わる場所を替える'};$('variantBtn').hidden=!variantLabels[current.id];text('variantBtn',variantLabels[current.id]||'別の条件');
 $('entrySelect').value=current.id;text('zoomTitle',current.id+' '+current.name);
 const ix=filtered.findIndex(x=>x.id===id);text('position',`${ix>=0?ix+1:data.indexOf(current)+1} / ${ix>=0?filtered.length:data.length}`);$('prevBtn').disabled=ix===0;$('nextBtn').disabled=ix===filtered.length-1;
 document.querySelectorAll('.item-button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.id===id)));
 if(updateHash){try{history.replaceState(null,'','#'+id);}catch(_){}}
 updateControls();draw();
}
function applyFilters(autoChoose=false){
 const q=$('search').value.trim().toLocaleLowerCase('ja'),cat=$('category').value;
 filtered=data.filter(e=>(cat==='all'||e.category===cat)&&(!q||[e.id,e.name,e.english,...(e.aliases||[]),e.observation,e.mechanism,...(e.theory||[])].join(' ').toLocaleLowerCase('ja').includes(q)));
 $('entrySelect').replaceChildren();$('itemList').replaceChildren();text('resultCount',`（${filtered.length}件）`);$('emptySearch').hidden=filtered.length>0;$('entrySelect').disabled=filtered.length===0;
 filtered.forEach(e=>{const option=el('option','',e.id+' '+e.name);option.value=e.id;$('entrySelect').append(option);const b=el('button','item-button');b.type='button';b.dataset.id=e.id;b.setAttribute('aria-current',String(e.id===current.id));b.append(el('span','code',e.id),document.createTextNode(e.name));b.onclick=()=>choose(e.id);$('itemList').append(b);});
 if(filtered.length){if(autoChoose&&!filtered.some(x=>x.id===current.id))choose(filtered[0].id);else if(filtered.some(x=>x.id===current.id)){$('entrySelect').value=current.id;const i=filtered.findIndex(x=>x.id===current.id);text('position',`${i+1} / ${filtered.length}`);$('prevBtn').disabled=i===0;$('nextBtn').disabled=i===filtered.length-1;}}
 else{$('prevBtn').disabled=true;$('nextBtn').disabled=true;text('position','検索結果なし');stop();}
}
function panel(name){stop();document.querySelectorAll('.panel').forEach(p=>{const active=p.id==='panel-'+name;p.hidden=!active;p.classList.toggle('active',active);});document.querySelectorAll('.tab').forEach(b=>{const active=b.dataset.panel===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});if(name==='theory')showTheory(theoryCurrent.id);}
function openEntry(id){$('search').value='';$('category').value='all';applyFilters(false);panel('atlas');choose(id);$('demoArticle').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
function showTheory(id){
 theoryCurrent=theories.find(t=>t.id===id)||theories[0];const t=theoryCurrent,e=byId[t.representative];
 text('theoryId',t.id);text('theoryName',t.name);text('theorySummary',t.summary);text('theoryDetail',t.detail+' この整理で扱う用語：'+t.term+'。');text('theoryLimit',t.limit);text('theoryExampleName',e.id+' '+e.name);text('theoryExampleCaption',e.observation+' 下の例のボタンを開くと、動き・答え・調整を試せます。');$('theorySelect').value=t.id;
 paint($('theoryCanvas'),e,{reveal:false,running:false,time:0,value:.5,variant:0,seed:17});
 $('theoryLinks').replaceChildren();t.examples.forEach(id=>{const b=el('button','',id+' '+byId[id].name);b.type='button';b.onclick=()=>openEntry(id);$('theoryLinks').append(b);});linkList($('theorySources'),t.examples.flatMap(id=>byId[id].sources));
}
categories.forEach(c=>{const o=el('option','',c.name);o.value=c.id;$('category').append(o);});
theories.forEach(t=>{const o=el('option','',t.id+' '+t.name);o.value=t.id;$('theorySelect').append(o);});
categories.forEach(c=>{const sec=el('section','index-section');sec.append(el('h3','',c.name));const grid=el('div','index-grid');data.filter(e=>e.category===c.id).forEach(e=>{const b=el('button','index-entry');b.type='button';b.append(el('span','code',e.id),el('span','',e.name),el('span','kind',e.experience));b.onclick=()=>openEntry(e.id);grid.append(b);});sec.append(grid);$('fullIndex').append(sec);});
$('search').addEventListener('input',()=>applyFilters(true));$('category').addEventListener('change',()=>applyFilters(true));$('entrySelect').addEventListener('change',e=>choose(e.target.value));
$('revealBtn').onclick=reveal;$('zoomReveal').onclick=reveal;$('playBtn').onclick=togglePlay;$('zoomPlay').onclick=togglePlay;$('resetBtn').onclick=reset;
$('parameter').addEventListener('input',e=>{if(['C20','C24'].includes(current.id)){stop();state.time=0;}state.value=Number(e.target.value)/100;text('sliderValue',e.target.value);draw();});
$('variantBtn').onclick=()=>{stop();state.variant++;state.time=0;state.reveal=false;state.value=.5;$('parameter').value='50';text('sliderValue','50');updateControls();draw();};
$('prevBtn').onclick=()=>{const i=filtered.findIndex(x=>x.id===current.id);if(i>0)choose(filtered[i-1].id);};$('nextBtn').onclick=()=>{const i=filtered.findIndex(x=>x.id===current.id);if(i<filtered.length-1)choose(filtered[i+1].id);};
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>panel(b.dataset.panel));document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openEntry(b.dataset.open));$('theorySelect').onchange=e=>showTheory(e.target.value);
$('zoomBtn').onclick=()=>{$('zoomDialog').showModal();paint($('zoomCanvas'),current,state);};$('closeZoom').onclick=()=>$('zoomDialog').close();
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});window.addEventListener('pagehide',stop);window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(byId[id])openEntry(id);});
applyFilters(false);choose(byId[location.hash.slice(1)]?location.hash.slice(1):data[0].id,false);
window.ATLAS_TEST={getState:()=>({...state,current:current.id,filtered:filtered.map(x=>x.id)}),choose,openEntry,draw,paint,stop,theories,data};
})();
