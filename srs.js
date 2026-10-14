// Leitner-подобная система: коробки 0..7, интервалы в днях
(function(root){
const INT=[0,1,2,4,7,14,30,60];
const DAY=86400000;
function today(now){const d=new Date(now);d.setHours(0,0,0,0);return d.getTime();}
function grade(st,g,now){ // g: 0 не помню,1 с трудом,2 помню
  st=st?{...st}:{box:0,seen:0};
  if(g===0)st.box=0;else if(g===1)st.box=Math.max(1,st.box);else st.box=Math.min(INT.length-1,st.box+1);
  st.seen=(st.seen||0)+1;st.last=now;
  st.due=g===0?now:today(now)+INT[st.box]*DAY; // забытое — снова сегодня
  return st;}
function isDue(st,now){return !!st&&st.due<=now;}
function buildSession(ids,prog,nNew,now,shuffle){
  const due=ids.filter(id=>isDue(prog[id],now));
  const fresh=ids.filter(id=>!prog[id]).slice(0,nNew);
  return (shuffle||(a=>a))(due).concat(fresh);}
function kanaToRomaji(s){
  const D={'きゃ':'kya','きゅ':'kyu','きょ':'kyo','しゃ':'sha','しゅ':'shu','しょ':'sho','ちゃ':'cha','ちゅ':'chu','ちょ':'cho','にゃ':'nya','にゅ':'nyu','にょ':'nyo','ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','みゃ':'mya','みゅ':'myu','みょ':'myo','りゃ':'rya','りゅ':'ryu','りょ':'ryo','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo','じゃ':'ja','じゅ':'ju','じょ':'jo','びゃ':'bya','びゅ':'byu','びょ':'byo','ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo','てぃ':'ti','でぃ':'di','ふぃ':'fi','しぇ':'she','じぇ':'je','ちぇ':'che'};
  const M='あa いi うu えe おo かka きki くku けke こko さsa しshi すsu せse そso たta ちchi つtsu てte とto なna にni ぬnu ねne のno はha ひhi ふfu へhe ほho まma みmi むmu めme もmo やya ゆyu よyo らra りri るru れre ろro わwa をo んn がga ぎgi ぐgu げge ごgo ざza じji ずzu ぜze ぞzo だda ぢji づzu でde どdo ばba びbi ぶbu べbe ぼbo ぱpa ぴpi ぷpu ぺpe ぽpo ぁa ぃi ぅu ぇe ぉo ゔvu'.split(' ');
  const S={};M.forEach(x=>S[x[0]]=x.slice(1));
  s=s.replace(/[\u30a1-\u30f6]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
  let r='';for(let i=0;i<s.length;i++){const c=s[i],two=s.slice(i,i+2);
    if(D[two]){r+=D[two];i++;continue}
    if(c==='っ'){const nx=D[s.slice(i+1,i+3)]||S[s[i+1]]||'';r+=nx.startsWith('ch')?'t':(nx[0]||'');continue}
    if(c==='ー'){r+=r.slice(-1);continue}
    r+=S[c]!==undefined?S[c]:c;}
  return r;}
function norm(s){return (s||'').toLowerCase().normalize('NFKC').replace(/[\s'’\-.。、,!?？！~～〜]/g,'')
  .replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));}
function romaNorm(r){return norm(r).replace(/ou/g,'oo').replace(/ei/g,'ee').replace(/ā/g,'aa').replace(/ō/g,'oo').replace(/ū/g,'uu').replace(/nn/g,'n').replace(/m(?=[bpm])/g,'n');}
function variants(w){ // все приемлемые ответы
  const base=[];const split=x=>x.split(/[／\/]/);
  const strip=x=>x.replace(/[（(][^）)]*[）)]/g,'').replace(/[～〜]/g,'');
  const alt=x=>(x.match(/[（(]([^）)]*)[）)]/)||[])[1];
  [w.jp,w.reading].forEach(f=>{if(!f)return;split(f).forEach(p=>{base.push(strip(p));const a=alt(p);if(a)base.push(a);});});
  const out=new Set();base.forEach(b=>{if(!b)return;out.add(norm(b));out.add(romaNorm(b));out.add(romaNorm(kanaToRomaji(norm(b))));});
  out.delete('');return out;}
function checkAnswer(w,input){const v=variants(w);return v.has(norm(input))||v.has(romaNorm(input))||v.has(romaNorm(kanaToRomaji(norm(input))));}
const api={INT,grade,isDue,buildSession,kanaToRomaji,checkAnswer,variants,today};
if(typeof module!=='undefined')module.exports=api;else root.SRS=api;
})(this);
