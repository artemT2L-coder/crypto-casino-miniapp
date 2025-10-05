import React, { useEffect, useState } from "react";
type DistRow = { name: string; prob: number; mul: [number, number] };


/** ================== Utils ================== **/
function clamp(n:number,a:number,b:number){return Math.max(a,Math.min(b,n));}
function rand(){return Math.random();}
function chance(p:number){return rand()<p;}
function choiceWeighted<T extends {weight:number}>(items:T[]):T{const total=items.reduce((s,i)=>s+(i.weight??1),0);let r=rand()*total;for(const it of items){r-=it.weight??1;if(r<=0)return it;}return items[items.length-1];}
function range(min:number,max:number){return min+rand()*(max-min);}
function currency(n:number){return new Intl.NumberFormat("ru-RU",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);}
function between(min:number,max:number){return Math.floor(range(min,max+1));}

/** ================== Assets ================== **/
const ASSETS=["BTC","ETH","TON","SOL","MEME","NOTSCAM","MAMONT","LOUSHARIO","CATJAM","MOONWIF","BANANA","CASINO","LAUNCH"] as const;
type AssetKey=typeof ASSETS[number];
const ASSET_META:Record<AssetKey,{name:string;color:string;risk:"низкий"|"средний"|"высокий"|"казино"}>={
  BTC:{name:"BTC",color:"#F7931A",risk:"низкий"},ETH:{name:"ETH",color:"#627EEA",risk:"средний"},TON:{name:"TON",color:"#0098EA",risk:"средний"},SOL:{name:"SOL",color:"#14F195",risk:"средний"},
  MEME:{name:"MEME",color:"#00D26A",risk:"высокий"},NOTSCAM:{name:"NOTSCAM",color:"#FF6B6B",risk:"высокий"},MAMONT:{name:"MAMONT",color:"#C0A062",risk:"высокий"},LOUSHARIO:{name:"LOUSHARIO",color:"#8E44AD",risk:"высокий"},CATJAM:{name:"CATJAM",color:"#1ABC9C",risk:"высокий"},MOONWIF:{name:"MOONWIF",color:"#2ECC71",risk:"высокий"},BANANA:{name:"BANANA",color:"#F1C40F",risk:"высокий"},
  CASINO:{name:"КАЗИНО",color:"#9B59B6",risk:"казино"},LAUNCH:{name:"LAUNCH",color:"#E74C3C",risk:"высокий"},
};

/** ================== Distributions (harder) ================== **/
const BASE_MEME: DistRow[] = [
  { name: "rug",  prob: 0.42, mul: [0.0, 0.25] },
  { name: "meh",  prob: 0.33, mul: [0.7, 1.15] },
  { name: "moon", prob: 0.25, mul: [1.8, 6.0] },
];
const DISTRIBUTIONS: Record<AssetKey, DistRow[]> = {
  BTC:   [{ name:"dip",   prob:0.28, mul:[0.88,0.97] }, { name:"flat", prob:0.47, mul:[0.97,1.05] }, { name:"pump", prob:0.25, mul:[1.05,1.12] }],
  ETH:   [{ name:"dump",  prob:0.34, mul:[0.7,0.9]   }, { name:"normal",prob:0.41, mul:[0.9,1.18]  }, { name:"pump", prob:0.25, mul:[1.18,1.5]  }],
  TON:   [{ name:"dip",   prob:0.34, mul:[0.75,0.95] }, { name:"normal",prob:0.41, mul:[0.95,1.25] }, { name:"hype", prob:0.25, mul:[1.25,1.8] }],
  SOL:   [{ name:"outage",prob:0.3,  mul:[0.5,0.85]  }, { name:"normal",prob:0.44, mul:[0.9,1.28]  }, { name:"speed_hype", prob:0.26, mul:[1.28,1.7] }],
  MEME: BASE_MEME, NOTSCAM: BASE_MEME, MAMONT: BASE_MEME, LOUSHARIO: BASE_MEME, CATJAM: BASE_MEME, MOONWIF: BASE_MEME, BANANA: BASE_MEME,
  CASINO:[{ name:"lose",  prob:0.58, mul:[0.0,0.0]   }, { name:"win",  prob:0.42, mul:[1.5,2.0]   }],
  LAUNCH:[{ name:"rugpull",prob:0.82, mul:[0.0,0.2]  }, { name:"ok_start",prob:0.13, mul:[0.8,1.5] }, { name:"mega_pump", prob:0.05, mul:[4.0,80.0] }],
};

/** ================== Rumors & News ================== **/
interface Bias{pump_prob_delta?:number;dip_prob_delta?:number;rug_prob_delta?:number}
interface Rumor{ id:string;text:string;affects:(AssetKey|"ALL")[];weight:number;bias?:Partial<Record<AssetKey|"ALL",Bias>> }
interface News{ id:string;type:"positive"|"negative";text:string;affects:(AssetKey|"ALL")[];impact?:Partial<Record<AssetKey|"ALL",{mul:[number,number]}>>;weight:number }

const RUMORS:Rumor[]=[
  {id:"r_musk",text:"Слух: Маск готовит твит про DOGE…",affects:["MEME","NOTSCAM","MAMONT","LOUSHARIO","CATJAM","MOONWIF","BANANA"],weight:8,bias:{MEME:{pump_prob_delta:+0.05}}},
  {id:"r_ton",text:"Инсайды: TON подпишет партнёрство.",affects:["TON"],weight:6,bias:{TON:{pump_prob_delta:+0.1}}},
  {id:"r_fud",text:"Говорят, регуляция ужесточится.",affects:["ALL"],weight:7,bias:{ALL:{dip_prob_delta:+0.06}}},
  {id:"r_whales",text:"Киты двигают рынок.",affects:["BTC","ETH"],weight:5,bias:{BTC:{pump_prob_delta:+0.03},ETH:{pump_prob_delta:+0.04}}},
];

const NEWS:News[]=[
  {id:"n_hack",type:"negative",text:"Крупная биржа взломана — выводы заморожены.",affects:["ALL"],weight:10,impact:{ALL:{mul:[0.4,0.85]}}},
  {id:"n_reg",type:"negative",text:"Регулятор заблокировал торговлю в ЕС.",affects:["ALL"],weight:9,impact:{ALL:{mul:[0.5,0.9]}}},
  {id:"n_bug",type:"negative",text:"Баг в популярном протоколе.",affects:["ETH"],weight:7,impact:{ETH:{mul:[0.6,0.95]}}}, 
  {id:"n_whale",type:"positive",text:"Киты скупают BTC.",affects:["BTC"],weight:6,impact:{BTC:{mul:[1.02,1.15]}}},
  {id:"n_ton",type:"positive",text:"TON объявил о партнёрстве.",affects:["TON"],weight:7,impact:{TON:{mul:[1.4,2.2]}}},
  {id:"n_doge",type:"positive",text:"‘Doge to the moon!’ — в трендах.",affects:["MEME","BANANA","CATJAM"],weight:7,impact:{MEME:{mul:[1.6,3.5]}}}, 
  {id:"n_black_swan",type:"negative",text:"Чёрный лебедь: системный сбой по рынку.",affects:["ALL"],weight:2,impact:{ALL:{mul:[0.1,0.4]}}}, 
  {id:"n_golden",type:"positive",text:"Золотой момент: массовый хайп.",affects:["ALL"],weight:1,impact:{ALL:{mul:[1.8,3.0]}}},
];

/** ================== Upgrades (nerfed) ================== **/
type BuffId = "u_ins" | "u_cash" | "u_floor" | "u_reroll" | "u_meme_pr" | "u_launch_bias";
interface BuffDef{ id:BuffId; name:string; desc:string; cost:number; uses:number; proc:number; }
const BUFFS:BuffDef[]=[
  {id:"u_ins",name:"Страховка",desc:"20% возврат при убытке (заряды 3, шанс 65%)",cost:700,uses:3,proc:0.65},
  {id:"u_cash",name:"Кэшбэк",desc:"+5% от ставки (заряды 5, шанс 60%)",cost:600,uses:5,proc:0.60},
  {id:"u_floor",name:"Стоп-лосс",desc:"Минимум x0.55 (2 заряда, шанс 55%)",cost:650,uses:2,proc:0.55},
  {id:"u_reroll",name:"Масс-медиа",desc:"1 переролл новости, если < x1 (2 заряда, шанс 50%)",cost:900,uses:2,proc:0.50},
  {id:"u_meme_pr",name:"Мем-PR",desc:"МЕМЕ moon чаще (3 заряда, шанс 40%)",cost:650,uses:3,proc:0.40},
  {id:"u_launch_bias",name:"Лаунч-чат",desc:"LAUNCH чуть реже рогается (2 заряда, 40%)",cost:800,uses:2,proc:0.40},
];
type OwnedBuff = { id:BuffId; uses:number };

/** ================== NEW: Market Mood ================== **/
type MarketMood = "neutral" | "panic" | "altseason";
const HIGH_RISK_ASSETS:AssetKey[]=["MEME","NOTSCAM","MAMONT","LOUSHARIO","CATJAM","MOONWIF","BANANA","LAUNCH"]; // буст в альтсезон

function applyMarketMoodMul(asset:AssetKey, mul:number, mood:MarketMood){
  if(mood==="panic")     return mul*range(0.80,0.92);       // всем больнее
  if(mood==="altseason") return HIGH_RISK_ASSETS.includes(asset) ? mul*range(1.15,1.60) : mul*range(0.98,1.03);
  return mul;
}

/** ================== NEW: Asset Shop (cars/realty) ================== **/
type ShopItem = { id:string; name:string; price:number; cat:"car"|"realty" };
const SHOP_ITEMS:ShopItem[]=[
  // Автомобили
  {id:"car_focus",   name:"Ford Focus 3",        price:  9000,  cat:"car"},
  {id:"car_camry",   name:"Toyota Camry",        price: 25000,  cat:"car"},
  {id:"car_bmw5",    name:"BMW 5",               price: 42000,  cat:"car"},
  {id:"car_huracan", name:"Lamborghini Huracan", price:250000,  cat:"car"},
  {id:"car_f812",    name:"Ferrari 812",         price:480000,  cat:"car"},
  {id:"car_veyron",  name:"Bugatti Veyron",      price:1300000, cat:"car"},
  {id:"car_chiron",  name:"Bugatti Chiron",      price:3000000, cat:"car"},
  // Недвижимость
  {id:"re_stalinka", name:"Квартира в сталинке",       price:150000, cat:"realty"},
  {id:"re_new",      name:"Квартира в новом ЖК",       price:180000, cat:"realty"},
  {id:"re_center",   name:"Квартира в центре города",  price:350000, cat:"realty"},
  {id:"re_city",     name:"Квартира в Москва-Сити",    price:500000, cat:"realty"},
  {id:"re_cottage",  name:"Коттедж",                    price:650000, cat:"realty"},
  {id:"re_spain",    name:"Дом в Испании",              price:800000, cat:"realty"},
];
type OwnedItem = { id:string; name:string; value:number; cat:"car"|"realty" };

/** ================== Leaderboard ================== **/
interface ScoreRow{ name:string; net:number; bestX:number; rounds:number; date:string }
const LB_KEY="ccasino_lb_hardcore_v1";
function loadLB():ScoreRow[]{try{return JSON.parse(localStorage.getItem(LB_KEY)||"[]");}catch{return[];}}
function saveLB(rows:ScoreRow[]){localStorage.setItem(LB_KEY,JSON.stringify(rows.slice(0,20)));}

/** ================== Mechanics helpers ================== **/
function applyBias(base:{name:string;prob:number;mul:[number,number]}[], bias?:Bias){
  const arr=base.map(x=>({...x})); if(!bias) return arr;
  for(const it of arr){
    if(bias.pump_prob_delta && /pump|hype|moon|win|mega/.test(it.name)) it.prob=clamp(it.prob+bias.pump_prob_delta,0,1);
    if(bias.dip_prob_delta  && /dip|dump|outage|lose|rug/.test(it.name)) it.prob=clamp(it.prob+bias.dip_prob_delta,0,1);
    if(bias.rug_prob_delta  && /rug|rugpull/.test(it.name))              it.prob=clamp(it.prob+bias.rug_prob_delta,0,1);
  }
  const s=arr.reduce((a,b)=>a+b.prob,0)||1; arr.forEach(x=>x.prob=x.prob/s); return arr;
}
function collectRumorBias(asset:AssetKey, rumor:Rumor|null):Bias|undefined{ if(!rumor) return; return (rumor.bias?.ALL)||((rumor.bias as any)?.[asset]); }
function pickOutcome(asset:AssetKey, rumor:Rumor|null, owned:OwnedBuff[]):{ name:string; multiplier:number }{
  let base=DISTRIBUTIONS[asset];
  let extra:Bias|undefined;
  const hasMeme=["MEME","NOTSCAM","MAMONT","LOUSHARIO","CATJAM","MOONWIF","BANANA"].includes(asset);
  if(owned.some(b=>b.id==="u_meme_pr") && hasMeme && chance(0.4)) extra={...(extra||{}),pump_prob_delta:0.06};
  if(owned.some(b=>b.id==="u_launch_bias") && asset==="LAUNCH" && chance(0.4)) extra={...(extra||{}),rug_prob_delta:-0.06};
  const rBias=collectRumorBias(asset,rumor); if(rBias) extra={...(extra||{}),...rBias};
  const dist=applyBias(base,extra);
  let r=rand(); let picked=dist[0]; for(const d of dist){r-=d.prob; if(r<=0){picked=d;break;}}
  const mul=range(picked.mul[0],picked.mul[1]);
  return {name:picked.name,multiplier:mul};
}
function pickRumor(selected:AssetKey|null){const list=RUMORS.map(r=>({...r})); if(selected) list.forEach(r=>{if(r.affects.includes(selected)||r.affects.includes("ALL")) r.weight+=2;}); return choiceWeighted(list);}
function pickNews(afterBet:AssetKey){const list=NEWS.map(n=>({...n})); list.forEach(n=>{if(n.affects.includes(afterBet)||n.affects.includes("ALL")) n.weight+=3;}); return choiceWeighted(list);}
function applyNewsMul(asset:AssetKey, news:News|null, mul:number){ if(!news) return mul; const rule=(news.impact?.[asset])||(news.impact?.ALL); if(!rule) return mul; const [a,b]=rule.mul; return mul*range(a,b);}

/** ================== UI atoms ================== **/
function RiskBadge({a}:{a:AssetKey}){const r=ASSET_META[a].risk; const color=r==="низкий"?"bg-emerald-600":r==="средний"?"bg-amber-600":r==="высокий"?"bg-rose-600":"bg-purple-700"; return <span className={`text-white text-[10px] px-2 py-0.5 rounded-full ${color}`}>{r.toUpperCase()}</span>;}
function Tile({a,onClick}:{a:AssetKey;onClick:()=>void}){const m=ASSET_META[a]; const sub=a==="CASINO"?"x2 или 0":a==="LAUNCH"?"памп или rugpull":["MEME","NOTSCAM","MAMONT","LOUSHARIO","CATJAM","MOONWIF","BANANA"].includes(a)?"moon/ругань":"волатильность"; return (
  <button onClick={onClick} className="group relative rounded-2xl p-4 border border-white/10 bg-white/5 hover:bg-white/10 transition">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl" style={{background:m.color, boxShadow:`0 0 18px ${m.color}66`}}/>
      <div>
        <div className="font-semibold text-white/90">{m.name}</div>
        <div className="text-xs text-white/60">{sub}</div>
      </div>
    </div>
    <div className="absolute top-3 right-3"><RiskBadge a={a}/></div>
  </button>
);}

/** ================== App ================== **/
export default function App(){
  const [bank,setBank]=useState(1000);
  const [bet,setBet]=useState(100);
  const [asset,setAsset]=useState<AssetKey|null>(null);
  const [step,setStep]=useState<"rumor"|"bet"|"result">("rumor");
  const [rumor,setRumor]=useState<Rumor|null>(null);
  const [news,setNews]=useState<News|null>(null);
  const [delta,setDelta]=useState(0);
  const [round,setRound]=useState(1);
  const [bestX,setBestX]=useState(1);
  const [name,setName]=useState("Аноним");
  const [lb,setLb]=useState<ScoreRow[]>(loadLB());
  const [owned,setOwned]=useState<OwnedBuff[]>([]);
  const [effects,setEffects]=useState<string[]>([]);
  const bankrupt=bank<=0;

  // NEW: market mood + duration
  const [mood,setMood]=useState<MarketMood>("neutral");
  const [moodLeft,setMoodLeft]=useState(0);

  // NEW: portfolio (shop purchases)
  const [portfolio,setPortfolio]=useState<OwnedItem[]>([]);
  const portfolioValue=portfolio.reduce((s,i)=>s+i.value,0);

  // при входе в фазу "слух" — обновляем слух, слегка двигаем портфель и рулём «настроение рынка»
  useEffect(()=>{
    if(step!=="rumor") return;

    setRumor(pickRumor(asset));
    setNews(null); setDelta(0); setAsset(null); setBet(b=>Math.min(b,bank));

    // Портфель дрейфует ±1% за ход (косметика, не ломает механику ставок)
    setPortfolio(prev => prev.map(it => ({...it, value: Math.max(0, Math.round(it.value*range(0.99,1.01)))})));

    // Обновляем «настроение рынка»
    setMoodLeft(x=>{
      const left = Math.max(0, x-1);
      if(left>0) return left; // ещё действует
      // событие может стартовать раз в несколько раундов
      if(round>1 && rand()<0.23){
        setMood(rand()<0.5 ? "panic" : "altseason");
        return between(1,2); // длительность 1–2 хода
      } else {
        setMood("neutral");
        return 0;
      }
    });
  },[step,bank,round,asset]);

  function startBet(a:AssetKey){ setAsset(a); setStep("bet"); }

  function roll(){
    if(!asset) return;
    let eff:string[]=[];
    // outcome + rumor bias
    const out=pickOutcome(asset,rumor,owned);
    let mul=out.multiplier;

    // news
    const n=pickNews(asset); mul=applyNewsMul(asset,n,mul); setNews(n);

    // NEW: market mood
    mul = applyMarketMoodMul(asset,mul,mood);

    // REROLL (if <1)
    const hasReroll=owned.find(b=>b.id==="u_reroll" && b.uses>0);
    if(hasReroll && mul<1 && chance(BUFFS.find(b=>b.id==="u_reroll")!.proc)){
      const n2=pickNews(asset); const mul2=applyNewsMul(asset,n2,out.multiplier);
      if(mul2>mul){ mul=mul2; eff.push("Переролл новости"); hasReroll.uses--; setNews(n2);} else { eff.push("Переролл не помог"); }
    }

    // FLOOR
    const floorDef=BUFFS.find(b=>b.id==="u_floor")!; const floor=owned.find(b=>b.id==="u_floor" && b.uses>0);
    if(floor && mul<0.55 && chance(floorDef.proc)){ mul=0.55; floor.uses--; eff.push("Стоп-лосс x0.55"); }
    else if(floor && mul<0.55){ eff.push("Стоп-лосс не сработал"); }

    // Difficulty trim
    mul = mul>=1 ? 1 + (mul-1)*0.9 : 1 - (1-mul)*1.06;

    let gain=Math.floor(bet*(mul-1));

    // INSURANCE
    const insDef=BUFFS.find(b=>b.id==="u_ins")!; const ins=owned.find(b=>b.id==="u_ins" && b.uses>0);
    if(ins && gain<0 && chance(insDef.proc)){ const refund=Math.floor(Math.abs(gain)*0.2); gain+=refund; ins.uses--; eff.push(`Страховка +${currency(refund)}`); }
    else if(ins && gain<0){ eff.push("Страховка не сработала"); }

    // CASHBACK
    const cbDef=BUFFS.find(b=>b.id==="u_cash")!; const cb=owned.find(b=>b.id==="u_cash" && b.uses>0);
    if(cb && chance(cbDef.proc)){ const back=Math.floor(bet*0.05); gain+=back; cb.uses--; eff.push(`Кэшбэк +${currency(back)}`); }

    setBank(b=>Math.max(0,b+gain));
    setDelta(gain); setBestX(x=>Math.max(x,mul)); setEffects(eff); setStep("result");
  }

  function nextRound(){ if(bank<=0) return; setRound(r=>r+1); setStep("rumor"); }

  function buyBuff(id:BuffId){
    const def=BUFFS.find(b=>b.id===id)!;
    if(bank<def.cost) return;
    if(owned.some(o=>o.id===id)) return;
    setBank(b=>b-def.cost); setOwned(o=>[...o,{id,uses:def.uses}]);
  }

  // NEW: покупка предметов из магазина
  function buyItem(item:ShopItem){
    if(bank<item.price) return;
    setBank(b=>b-item.price);
    setPortfolio(p=>[...p,{id:item.id,name:item.name,value:item.price,cat:item.cat}]);
  }

function saveToLB(){
  const row:ScoreRow={
    name: name?.trim() || "Аноним",
    net: bank + portfolioValue,
    bestX: Math.round(bestX*100)/100,
    rounds: round-1,
    date: new Date().toISOString()
  };
  const rows=[...lb,row].sort((a,b)=>b.net-a.net).slice(0,20);
  setLb(rows); saveLB(rows);
}

function resetRun(){
  setBank(1000); setBet(100); setAsset(null); setStep("rumor");
  setRumor(null); setNews(null); setDelta(0);
  setRound(1); setBestX(1); setOwned([]); setEffects([]);
  setPortfolio([]); setMood("neutral"); setMoodLeft(0);
}


  async function share(){
    const txt=`Я сделал нетворт ${currency(bank+portfolioValue)} и x${(Math.round(bestX*100)/100).toFixed(2)} в Simulator Crypto Investor!`;
    try{ await navigator.clipboard.writeText(txt); alert("Текст скопирован. Вставь в Telegram!"); }catch{ alert(txt); }
  }

  const moodInfo = mood==="panic"
    ? {label:"Рынок в панике",    hint:"всем активам больнее",           cls:"from-rose-500/15 to-rose-500/5"}
    : mood==="altseason"
      ? {label:"Альтсезон",       hint:"высокорисковые активы бустятся", cls:"from-emerald-500/15 to-emerald-500/5"}
      : {label:"Нейтрально",      hint:"обычная волатильность",          cls:"from-slate-500/10 to-slate-500/5"};

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#0B1220] to-[#0E0F17] text-white px-4 pb-24">
      <header className="max-w-3xl mx-auto pt-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Simulator Crypto Investor <span className="text-white/60">MiniApp</span></h1>
          <p className="text-sm text-white/60">Твоя карьера инвестора: крипта, активы и настроение рынка.</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="ник" className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-white/30"/>
<button onClick={resetRun} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm">Новая игра</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto mt-6 grid gap-4">
        {/* Balance */}
        <section className="rounded-2xl bg-white/5 border border-white/10 p-4 grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-white/70 text-sm">Баланс (кэш)</div>
            <div className="text-3xl font-bold">{currency(bank)}</div>
            <div className="text-xs text-white/50">Раунд {round} • Лучший множитель: x{(Math.round(bestX*100)/100).toFixed(2)}</div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-3">
            <div className="text-white/70 text-sm">Портфель</div>
            <div className="text-xl font-semibold">{currency(portfolioValue)}</div>
            <div className="text-xs text-white/50">Нетворт: <span className="font-medium text-white/80">{currency(bank+portfolioValue)}</span></div>
          </div>
          <div className="sm:col-span-2 flex gap-2">
  <button
    onClick={share}
    className="px-3 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600"
  >
    Поделиться
  </button>

  <button
    onClick={saveToLB}
    className="px-3 py-2 rounded-xl bg-fuchsia-600/90 hover:bg-fuchsia-600"
  >
    Сохранить в таблицу
  </button>
</div>

        </section>

        {/* Rumor */}
        <section className="rounded-2xl p-4 border border-white/10 bg-gradient-to-r from-indigo-500/10 to-fuchsia-500/10">
          <div className="text-xs text-white/60">Слух рынка</div>
          <div className="text-lg">{rumor?.text || "Собираем слухи…"}</div>
        </section>

        {/* NEW: Market mood banner */}
        <section className={`rounded-2xl p-4 border border-white/10 bg-gradient-to-r ${moodInfo.cls}`}>
          <div className="text-xs text-white/60">Настроение рынка {moodLeft>0 && `(ещё ${moodLeft} х.)`}</div>
          <div className="text-lg font-medium">{moodInfo.label}</div>
          <div className="text-xs text-white/50">{moodInfo.hint}</div>
        </section>

        {/* Shop (buffs) */}
        <section className="rounded-2xl p-4 border border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Магазин бафов</h3>
            <div className="text-xs text-white/50">Бафы с шансом и зарядами</div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {BUFFS.map(u=>{const ow=owned.find(o=>o.id===u.id);return (
              <div key={u.id} className="rounded-xl border border-white/10 p-3 bg-white/5">
                <div className="font-medium">{u.name}</div>
                <div className="text-xs text-white/60 mb-2">{u.desc}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/70">{currency(u.cost)}</div>
                  <button onClick={()=>buyBuff(u.id)} disabled={!!ow || bank<u.cost} className={`px-3 py-1.5 rounded-lg text-sm ${!!ow||bank<u.cost?"bg-white/10 text-white/40":"bg-white/20 hover:bg-white/30"}`}>
                    {ow?`Куплено (${ow.uses})`:"Купить"}
                  </button>
                </div>
              </div>
            );})}
          </div>
        </section>


        {/* Asset grid */}
        <section className="rounded-2xl p-4 border border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Выбери крипто-актив</h3>
            <div className="text-xs text-white/60">Нажми на карточку, чтобы поставить</div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {ASSETS.map(a=> (<Tile key={a} a={a} onClick={()=>startBet(a)}/>))}
          </div>
        </section>

        {/* Bet panel */}
        {asset && (
          <section className="rounded-2xl p-4 border border-white/10 bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg" style={{background:ASSET_META[asset].color}}/>
                <div>
                  <div className="font-semibold">Ставка на {ASSET_META[asset].name}</div>
                  <div className="text-xs text-white/60">Риск: <RiskBadge a={asset}/></div>
                </div>
              </div>
              <button className="text-white/60 text-sm hover:text-white" onClick={()=>{setAsset(null);setStep("rumor");}}>Сменить актив</button>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between text-sm text-white/70"><span>Сумма ставки</span><span>{currency(bet)}</span></div>
              <input type="range" min={10} max={bank} step={10} value={bet} onChange={(e)=>setBet(clamp(parseInt(e.target.value||"0"),10,bank))} className="w-full"/>
              <div className="flex gap-2">
                {[0.1,0.25,0.5,1].map(p=> (<button key={p} onClick={()=>setBet(Math.max(10,Math.floor(bank*p)))} className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm">{Math.round(p*100)}%</button>))}
                <input type="number" value={bet} min={10} max={bank} step={10} onChange={(e)=>setBet(clamp(parseInt(e.target.value||"0"),10,bank))} className="ml-auto w-32 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-sm"/>
              </div>
              <button onClick={roll} disabled={bank<=0||bet<=0} className="mt-2 px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 disabled:opacity-50">Крутить судьбу</button>
            </div>

            {step==="result" && (
              <div className="mt-4 grid gap-3">
                <div className="rounded-xl p-4 bg-gradient-to-r from-emerald-500/10 to-fuchsia-500/10 border border-white/10">
                  <div className="text-sm text-white/60">Новость</div>
                  <div className="text-lg">{news?.text}</div>
                </div>
                <div className="rounded-xl p-4 bg-white/5 border border-white/10">
                  <div className="text-sm text-white/60">Итог</div>
                  <div className="flex items-baseline gap-2">
                    <div className={`text-2xl font-bold ${delta>=0?"text-emerald-400":"text-rose-400"}`}>{delta>=0?"+":""}{currency(delta)}</div>
                    <div className="text-white/60">(множитель ~ x{(Math.round(bestX*100)/100).toFixed(2)})</div>
                  </div>
                  <div className="mt-2 space-x-2">
                    {effects.length? effects.map((t,i)=>(<span key={i} className="inline-block text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">{t}</span>)) : <span className="inline-block text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10">Бафы не сработали</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={nextRound} disabled={bankrupt} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50">Дальше</button>
                  <button onClick={()=>setStep("rumor")} disabled={bankrupt} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50">Ещё поставить</button>
                </div>
                {bankrupt && (<div className="text-rose-400 text-sm">Депозит сгорел. Сохрани результат и начни заново.</div>)}
              </div>
            )}
          </section>
        )}

        {/* NEW: Asset Shop (cars/realty) */}
        <section className="rounded-2xl p-4 border border-white/10 bg-white/5">
          <h3 className="font-semibold mb-2">Магазин активов</h3>

          <div className="text-xs text-white/60 mb-1">Автомобили</div>
          <div className="grid sm:grid-cols-3 gap-3 mb-3">
            {SHOP_ITEMS.filter(i=>i.cat==="car").map(i=>(
              <div key={i.id} className="rounded-xl border border-white/10 p-3 bg-white/5">
                <div className="font-medium">{i.name}</div>
                <div className="text-sm text-white/70 mb-2">{currency(i.price)}</div>
                <button onClick={()=>buyItem(i)} disabled={bank<i.price} className={`px-3 py-1.5 rounded-lg text-sm ${bank<i.price?"bg-white/10 text-white/40":"bg-white/20 hover:bg-white/30"}`}>Купить</button>
              </div>
            ))}
          </div>

          <div className="text-xs text-white/60 mb-1">Недвижимость</div>
          <div className="grid sm:grid-cols-3 gap-3">
            {SHOP_ITEMS.filter(i=>i.cat==="realty").map(i=>(
              <div key={i.id} className="rounded-xl border border-white/10 p-3 bg-white/5">
                <div className="font-medium">{i.name}</div>
                <div className="text-sm text-white/70 mb-2">{currency(i.price)}</div>
                <button onClick={()=>buyItem(i)} disabled={bank<i.price} className={`px-3 py-1.5 rounded-lg text-sm ${bank<i.price?"bg-white/10 text-white/40":"bg-white/20 hover:bg-white/30"}`}>Купить</button>
              </div>
            ))}
          </div>
        </section>

        {/* Portfolio list */}
        <section className="rounded-2xl p-4 border border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Портфель</h3>
            <div className="text-sm text-white/70">{currency(portfolioValue)}</div>
          </div>
          {portfolio.length===0 ? (
            <div className="text-white/60 text-sm">Пока пусто. Купи авто или недвижимость в магазине.</div>
          ) : (
            <div className="grid gap-2">
              {portfolio.map((it,idx)=>(
                <div key={it.id+idx} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="text-sm">{it.name}</div>
                  <div className="text-sm text-white/70">{currency(it.value)}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Leaderboard */}
        <section className="rounded-2xl p-4 border border-white/10 bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Таблица лидеров (локально)</h3>
            <button onClick={()=>{localStorage.removeItem(LB_KEY); setLb([]);}} className="text-xs text-white/60 hover:text-white">Очистить</button>
          </div>
          {lb.length===0 ? (
            <div className="text-white/60 text-sm">Пока пусто. Сыграй и нажми «Сохранить в таблицу».</div>
          ): (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-white/60"><tr><th className="text-left font-medium py-2">#</th><th className="text-left font-medium py-2">Игрок</th><th className="text-left font-medium py-2">Нетворт</th><th className="text-left font-medium py-2">Лучший x</th><th className="text-left font-medium py-2">Раундов</th><th className="text-left font-medium py-2">Дата</th></tr></thead>
                <tbody>
                  {lb.map((r,i)=>(
                    <tr key={i} className="border-t border-white/10">
                      <td className="py-2 text-white/70">{i+1}</td>
                      <td className="py-2">{r.name}</td>
                      <td className="py-2">{currency(r.net)}</td>
                      <td className="py-2">x{r.bestX}</td>
                      <td className="py-2">{r.rounds}</td>
                      <td className="py-2 text-white/60">{new Date(r.date).toLocaleString("ru-RU")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="text-center text-xs text-white/40 pt-4">Сделано для предпросмотра. Симулятор инвестора: не финсовет 🙃</footer>
      </main>
    </div>
  );
}
