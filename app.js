const $=s=>document.querySelector(s);
const KEY='zauch-progress-v1',SKEY='zauch-settings-v1';
let WORDS=[],LESSONS=[],prog=JSON.parse(localStorage.getItem(KEY)||'{}');
let set=Object.assign({lessons:[],dir:'jr',nNew:15,type:false,auto:false},JSON.parse(localStorage.getItem(SKEY)||'{}'));
let queue=[],cur=null,curDir='jr',flipped=false,practice=false,doneCount=0,total=0;
const id=w=>w.lesson+'|'+w.jp;
const save=()=>{localStorage.setItem(KEY,JSON.stringify(prog));localStorage.setItem(SKEY,JSON.stringify(set));};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function show(sec){if(sec!=='study'&&sec!=='done')$('#brushFill').style.width='0';['home','study','done','stats'].forEach(s=>$('#'+s).hidden=s!==sec);if(sec==='home')renderHome();if(sec==='stats')renderStats();}
function selIds(){return WORDS.filter(w=>set.lessons.includes(w.lesson)).map(id);}
function renderHome(){
  $('#lessons').innerHTML=LESSONS.map(l=>`<button data-l="${l}" class="${set.lessons.includes(l)?'on':''}">${l}</button>`).join('');
  document.querySelectorAll('#dir button').forEach(b=>b.classList.toggle('on',b.dataset.v===set.dir));
  $('#nNew').value=set.nNew;$('#nNewVal').textContent=set.nNew;$('#typeMode').checked=set.type;$('#autoSpeak').checked=set.auto;
  const ids=selIds(),now=Date.now(),due=ids.filter(i=>SRS.isDue(prog[i],now)).length,nw=ids.filter(i=>!prog[i]).length;
  $('#summary').textContent=ids.length?`Слов: ${ids.length} · к повторению: ${due} · новых: ${nw} (сегодня возьмём до ${Math.min(nw,set.nNew)})`:'Выбери хотя бы один урок';}
$('#lessons').onclick=e=>{const l=e.target.dataset.l;if(!l)return;set.lessons=set.lessons.includes(l)?set.lessons.filter(x=>x!==l):[...set.lessons,l];save();renderHome();};
$('#dir').onclick=e=>{if(e.target.dataset.v){set.dir=e.target.dataset.v;save();renderHome();}};
$('#nNew').oninput=e=>{set.nNew=+e.target.value;save();renderHome();};
$('#typeMode').onchange=e=>{set.type=e.target.checked;save();};
$('#autoSpeak').onchange=e=>{set.auto=e.target.checked;save();};
const byId={};
function start(pr){practice=pr;const ids=selIds();
  queue=pr?shuffle(ids):SRS.buildSession(ids,prog,set.nNew,Date.now(),shuffle);
  if(!pr)queue=shuffle(queue);
  if(!queue.length){alert(ids.length?'На сегодня всё повторено! Можно увеличить число новых слов или «Повторить всё».':'Выбери урок');return;}
  total=queue.length;doneCount=0;show('study');next();}
$('#startBtn').onclick=()=>start(false);$('#practiceBtn').onclick=()=>start(true);
function next(){
  if(!queue.length){show('done');$('#doneText').textContent=`Пройдено карточек: ${doneCount}. 頑張って！`;$('#brushFill').style.width='100%';return;}
  cur=byId[queue[0]];curDir=set.dir==='mix'?(Math.random()<.5?'jr':'rj'):set.dir;flipped=false;
  const kana=/[ぁ-んァ-ヶ]/.test(cur.reading||'');
  const jpHtml=`<div class="stack">${kana?`<div class="rd">${cur.reading}</div>`:''}<div class="jp">${cur.jp}</div>${!kana&&cur.reading?`<div class="rom">${cur.reading}</div>`:''}</div>`;
  const ruHtml=`<div class="ru">${cur.ru}</div>`;const vi=cur.verbInfo?`<div class="vi">${cur.verbInfo}</div>`:'';
  const c=$('#card');c.style.transition='none';c.classList.remove('flipped');void c.offsetWidth;c.style.transition='';
  $('#front').innerHTML=curDir==='jr'?jpHtml:ruHtml;$('#back').innerHTML=`<div class="stack">${curDir==='jr'?ruHtml:jpHtml}${vi}</div>`;
  $('#brushFill').style.width=(doneCount/total*100)+'%';$('#grade').hidden=true;$('#verdict').textContent='';
  const typing=set.type&&curDir==='rj';$('#typeBox').hidden=!typing;$('#answer').value='';
  $('#hint').textContent=typing?'Введи ответ или нажми на карточку':'Нажми на карточку, чтобы перевернуть';
  $('#speakBtn').hidden=curDir==='rj';
  $('#progress').textContent=`${doneCount+1} из ${total}${practice?' · тренировка':''}`;
  if(typing)setTimeout(()=>$('#answer').focus(),50);else if(set.auto&&curDir==='jr')speak();}
function flip(){if(flipped)return;flipped=true;$('#card').classList.add('flipped');$('#grade').hidden=false;$('#speakBtn').hidden=false;$('#hint').textContent='Насколько хорошо вспомнил?';if(set.auto&&curDir==='rj')speak();}
$('#card').onclick=flip;$('#card').onkeydown=e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();flip();}};
function check(){if(flipped)return;const ok=SRS.checkAnswer(cur,$('#answer').value);
  $('#verdict').innerHTML=ok?'<span class="ok">✓ Верно!</span>':'<span class="no">✗ Неверно</span>';flip();}
$('#checkBtn').onclick=check;$('#answer').onkeydown=e=>{if(e.key==='Enter')check();};
$('#grade').onclick=e=>{const g=e.target.dataset.g;if(g===undefined)return;const k=queue.shift();doneCount++;
  if(!practice){prog[k]=SRS.grade(prog[k],+g,Date.now());save();}
  if(+g===0){queue.splice(Math.min(queue.length,3),0,k);total++;} // забытое — через пару карточек
  next();};
function speak(){if(!('speechSynthesis'in window))return;speechSynthesis.cancel();
  const t=cur.jp.replace(/[～〜]/g,'').replace(/[／\/].*/,'').replace(/[（(].*?[）)]/g,'').replace(/＋.*/,'');
  const u=new SpeechSynthesisUtterance(t);u.lang='ja-JP';u.rate=.85;
  const v=speechSynthesis.getVoices().find(v=>v.lang&&v.lang.replace('_','-').startsWith('ja'));if(v)u.voice=v;speechSynthesis.speak(u);}
$('#speakBtn').onclick=e=>{e.stopPropagation();speak();};
function renderStats(){const now=Date.now();let h='';
  LESSONS.forEach(l=>{const ws=WORDS.filter(w=>w.lesson===l).map(id);const s=ws.map(i=>prog[i]).filter(Boolean);
    const n=ws.length,L=s.filter(p=>p.box>=4).length,S=s.length-L,D=s.filter(p=>SRS.isDue(p,now)).length,pc=x=>(x/n*100).toFixed(1)+'%';
    h+=`<div class="srow"><div class="shead"><b>${l}</b><span>${D?`<em>${D}</em> к повторению · `:''}${n} слов</span></div>
    <div class="bar"><i class="l" style="width:${pc(L)}"></i><i class="s" style="width:${pc(S)}"></i></div>
    <div class="nums"><span><b>${L}</b>выучено</span><span><b>${S}</b>изучаю</span><span><b>${n-L-S}</b>новые</span></div></div>`;});
  $('#statTable').innerHTML=h;}
$('#resetBtn').onclick=()=>{if(confirm('Точно сбросить весь прогресс?')){prog={};save();renderStats();}};
$('#homeBtn').onclick=()=>show('home');$('#statsBtn').onclick=()=>show('stats');$('#againBtn').onclick=()=>show('home');
fetch('words.json').then(r=>r.json()).then(d=>{WORDS=d.words;LESSONS=d.lessons||[...new Set(WORDS.map(w=>w.lesson))];
  WORDS.forEach(w=>byId[id(w)]=w);if(!set.lessons.length)set.lessons=[LESSONS[0]];
  set.lessons=set.lessons.filter(l=>LESSONS.includes(l));show('home');});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');
