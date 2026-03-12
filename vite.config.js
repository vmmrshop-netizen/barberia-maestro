import { useState, useEffect, useCallback, useRef } from "react";

const GOOGLE_CLIENT_ID = "1000503917260-6smvu4b7arrqqppb4p14ou7hk5b4tqjq.apps.googleusercontent.com";
const BARBER_PIN = "1234";

const SERVICES = [
  { id: "corte",             name: "Corte de cabello",           price: 12, duration: 30, emoji: "✂️",      desc: "Corte asesorado y personalizado" },
  { id: "corte_barba",       name: "Corte + Barba",              price: 15, duration: 30, emoji: "✂️🪒",    desc: "Corte y arreglo de barba" },
  { id: "corte_lavado",      name: "Corte + Lavado",             price: 15, duration: 40, emoji: "✂️🚿",    desc: "Corte con lavado de cabello" },
  { id: "corte_cejas",       name: "Corte + Cejas",              price: 19, duration: 45, emoji: "✂️👁️",   desc: "Corte + cejas con hilo" },
  { id: "corte_cejas_barba", name: "Corte + Cejas + Barba",      price: 24, duration: 55, emoji: "✂️👁️🪒", desc: "Servicio completo" },
  { id: "cejas",             name: "Cejas con hilo",             price: 7,  duration: 15, emoji: "👁️",      desc: "Depilación con hilo" },
  { id: "barba",             name: "Recorte de barba",           price: 5,  duration: 10, emoji: "🪒",      desc: "Recorte y perfilado" },
  { id: "jubilado",          name: "Corte jubilado",             price: 10, duration: 20, emoji: "👴",      desc: "Precio especial jubilados" },
  { id: "nino",              name: "Corte de niño",              price: 10, duration: 20, emoji: "👦",      desc: "Hasta 9 años" },
  { id: "cabello_largo",     name: "Cabello largo / media melena", price: 24, duration: 50, emoji: "💇",  desc: "Asesoramiento y estructura" },
  { id: "visagismo_basico",  name: "Visagismo básico",           price: 10, duration: 15, emoji: "🎨",      desc: "Asesoramiento express" },
  { id: "visagismo_completo",name: "Visagismo completo",         price: 10, duration: 30, emoji: "🎨✨",    desc: "Basado en visagismo" },
  { id: "mechas_blancas",    name: "Mechas blancas",             price: 35, duration: 30, emoji: "🖌️",     desc: "" },
  { id: "mechas_platinadas", name: "Mechas platinadas / rubias", price: 30, duration: 30, emoji: "🖌️",     desc: "" },
  { id: "reflejos",          name: "Reflejos",                   price: 25, duration: 30, emoji: "✨",      desc: "" },
  { id: "tinte_blanco",      name: "Tinte blanco",               price: 70, duration: 75, emoji: "🎨",      desc: "Contactar: 697610737" },
  { id: "tinte_2",           name: "Tinte (variante)",           price: 70, duration: 75, emoji: "🎨",      desc: "" },
  { id: "color_fantasia",    name: "Color fantasía",             price: 85, duration: 90, emoji: "🎨🖌️",   desc: "" },
];

const DEFAULT_SLOTS = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"];
const DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const ld  = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v !== null ? v : fb; } catch { return fb; } };
const sv  = (k, v)  => localStorage.setItem(k, JSON.stringify(v));
const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmtDay = d => `${DAYS[d.getDay()]} ${d.getDate()} ${MONS[d.getMonth()]}`;
const next30 = () => { const a=[], t=new Date(); t.setHours(0,0,0,0); for(let i=0;i<30;i++){const d=new Date(t);d.setDate(t.getDate()+i);a.push(d);} return a; };
const jwtPay = t => { try{return JSON.parse(atob(t.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));}catch{return {};} };

/* ─── TOAST ─────────────────────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3800); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position:"fixed", top:20, left:"50%", transform:"translateX(-50%)",
      background: type==="success" ? "#1a1a14" : "#1a0a0a",
      border:`1px solid ${type==="success" ? "#d4af5a" : "#c0392b"}`,
      color: type==="success" ? "#f0e6d0" : "#ff8a80",
      padding:"13px 26px", borderRadius:10,
      fontFamily:"'Cormorant Garamond',serif", fontSize:15,
      boxShadow:"0 8px 32px rgba(0,0,0,0.6)", zIndex:9999,
      letterSpacing:"0.03em", maxWidth:340, textAlign:"center",
      animation:"toastIn 0.3s ease"
    }}>
      {type==="success" ? "✓ " : "⚠ "}{msg}
    </div>
  );
}

/* ─── GOOGLE BUTTON ──────────────────────────────────────────────────────── */
function GoogleSignInButton({ onSuccess, onError }) {
  const ref   = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const init = () => {
      if (!window.google?.accounts?.id || !ref.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res) => {
          if (res.credential) {
            const p = jwtPay(res.credential);
            onSuccess({ name: p.name, email: p.email, picture: p.picture });
          } else {
            onError("Error al iniciar sesión con Google");
          }
        },
        ux_mode: "popup",
      });
      window.google.accounts.id.renderButton(ref.current, {
        type: "standard", theme: "filled_black", size: "large",
        text: "signin_with", shape: "rectangular", width: 280,
      });
      setReady(true);
    };

    if (window.google?.accounts?.id) { init(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = init;
    s.onerror = () => onError("No se pudo cargar Google Sign-In");
    document.head.appendChild(s);
  }, []);

  return (
    <div style={{display:"flex", flexDirection:"column", alignItems:"center", gap:12}}>
      <div ref={ref} style={{minHeight:44, display:"flex", justifyContent:"center"}}/>
      {!ready && (
        <div style={{display:"flex",alignItems:"center",gap:8,width:280,height:44,borderRadius:4,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",justifyContent:"center"}}>
          {[0,1,2].map(i=>(
            <div key={i} style={{width:7,height:7,borderRadius:"50%",background:"rgba(212,175,90,0.5)",animation:`dot 1.2s ease-in-out ${i*0.2}s infinite`}}/>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────────────────────────── */
export default function App() {
  const G = "#d4af5a";

  const [gUser,    setGUser]    = useState(null);
  const [view,     setView]     = useState("login");
  const [toast,    setToast]    = useState(null);
  const showT = useCallback((msg, type="success") => setToast({msg,type}), []);

  const [step,     setStep]     = useState(1);
  const [svcId,    setSvcId]    = useState(null);
  const [selDate,  setSelDate]  = useState(null);
  const [selSlot,  setSelSlot]  = useState(null);
  const [confData, setConfData] = useState(null);

  const [bPin,    setBPin]    = useState("");
  const [bAuth,   setBAuth]   = useState(false);
  const [bPinErr, setBPinErr] = useState(false);
  const [bTab,    setBTab]    = useState("reservas");
  const [newSlot, setNewSlot] = useState("");
  const [fDate,   setFDate]   = useState("");

  const [bookings, setBookings] = useState(() => ld("bk5", []));
  const [slots,    setSlots]    = useState(() => ld("sl5", DEFAULT_SLOTS));
  const [blocked,  setBlocked]  = useState(() => ld("bl5", []));

  useEffect(() => sv("bk5", bookings), [bookings]);
  useEffect(() => sv("sl5", slots),    [slots]);
  useEffect(() => sv("bl5", blocked),  [blocked]);

  const days     = next30();
  const todayStr = iso(new Date());
  const svc      = svcId ? SERVICES.find(s => s.id === svcId) : null;

  const getBooked = ds => bookings.filter(b => b.date===ds && b.status!=="cancelled").map(b => b.slot);
  const getFree   = ds => blocked.includes(ds) ? [] : slots.filter(s => !getBooked(ds).includes(s));

  const signIn  = user => { setGUser(user); setView("home"); showT(`¡Bienvenido, ${user.name.split(" ")[0]}!`); };
  const signOut = ()   => { window.google?.accounts?.id?.disableAutoSelect(); setGUser(null); setView("login"); resetBook(); };
  const resetBook = () => { setStep(1); setSvcId(null); setSelDate(null); setSelSlot(null); };

  const doBook = () => {
    if (!selSlot) { showT("Selecciona una hora","error"); return; }
    const nb = { id:Date.now(), service:svcId, date:iso(selDate), slot:selSlot, name:gUser.name, email:gUser.email, picture:gUser.picture, status:"confirmed", createdAt:new Date().toISOString() };
    setBookings(p => [...p, nb]);
    setConfData(nb); setView("confirm"); showT("¡Reserva confirmada!"); setSelSlot(null);
  };

  const barberLogin = () => {
    if (bPin === BARBER_PIN) { setBAuth(true); setBPinErr(false); setBPin(""); setView("barber"); }
    else { setBPinErr(true); setBPin(""); }
  };

  const addSlot = () => {
    if (!newSlot) return;
    if (slots.includes(newSlot)) { showT("Esa hora ya existe","error"); return; }
    setSlots(p => [...p, newSlot].sort()); setNewSlot(""); showT("Hora añadida");
  };

  const toggleDay = ds => {
    if (blocked.includes(ds)) { setBlocked(p=>p.filter(d=>d!==ds)); showT("Día desbloqueado"); }
    else { setBlocked(p=>[...p,ds]); showT("Día bloqueado"); }
  };

  /* styles */
  const app  = { minHeight:"100vh", background:"linear-gradient(160deg,#0c0c0a 0%,#171410 55%,#0c0c0a 100%)", fontFamily:"'Montserrat',sans-serif", color:"#e8dcc8", position:"relative", overflowX:"hidden" };
  const card = (x={}) => ({ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(212,175,90,0.13)", borderRadius:10, ...x });
  const gBtn = (x={}) => ({ background:`linear-gradient(135deg,${G},#b8942e)`, color:"#0d0d0d", border:"none", borderRadius:8, cursor:"pointer", fontFamily:"'Montserrat',sans-serif", fontWeight:600, fontSize:13, letterSpacing:"0.14em", textTransform:"uppercase", ...x });
  const ghost= (x={}) => ({ background:"none", border:`1px solid rgba(212,175,90,0.14)`, color:"#5a4a38", borderRadius:8, cursor:"pointer", fontFamily:"'Montserrat',sans-serif", fontSize:11, letterSpacing:"0.13em", textTransform:"uppercase", transition:"all 0.2s", ...x });

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
    body { background:#0d0d0d; }
    @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(-14px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    @keyframes fadeUp  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes dot     { 0%,80%,100%{transform:scale(0.6);opacity:0.3} 40%{transform:scale(1);opacity:1} }
    input:focus { outline:none; }
    ::-webkit-scrollbar { width:3px; }
    ::-webkit-scrollbar-track { background:#111; }
    ::-webkit-scrollbar-thumb { background:#d4af5a; border-radius:2px; }
    .fade { animation: fadeUp 0.35s ease both; }
  `;

  /* ── LOGIN ── */
  if (view === "login") return (
    <div style={{...app, display:"flex", alignItems:"center", justifyContent:"center", padding:24, minHeight:"100vh"}}>
      <style>{css}</style>
      {toast && <Toast {...toast} onClose={()=>setToast(null)}/>}
      <div className="fade" style={{textAlign:"center", maxWidth:380, width:"100%"}}>
        <div style={{width:90,height:90,borderRadius:"50%",margin:"0 auto 22px",background:"radial-gradient(circle at 40% 35%,rgba(212,175,90,0.18),transparent 70%)",border:`1.5px solid rgba(212,175,90,0.45)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,boxShadow:"0 0 40px rgba(212,175,90,0.1)"}}>✂️</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:8}}>
          <div style={{height:1,width:38,background:`linear-gradient(to right,transparent,${G})`}}/>
          <span style={{color:G,fontSize:10,letterSpacing:"0.28em",fontWeight:500,textTransform:"uppercase"}}>Barbería &amp; Estilismo</span>
          <div style={{height:1,width:38,background:`linear-gradient(to left,transparent,${G})`}}/>
        </div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(40px,10vw,60px)",fontWeight:600,color:"#f5ead8",lineHeight:1.0,marginBottom:8}}>
          Maestro<br/><span style={{color:G,fontStyle:"italic",fontWeight:300}}>& Estilista</span>
        </h1>
        <p style={{color:"#3a3025",fontSize:11,letterSpacing:"0.22em",marginBottom:34}}>ALMENDRALEJO · EXTREMADURA</p>
        <div style={{...card(),padding:"30px 26px",marginBottom:14,borderRadius:14,boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
          <p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#d8c8b0",marginBottom:6}}>Accede a tu cuenta</p>
          <p style={{color:"#4a3a28",fontSize:12,lineHeight:1.65,marginBottom:28}}>
            Inicia sesión con Google para reservar cita.<br/>
            <span style={{color:"rgba(212,175,90,0.4)"}}>Tus datos solo se usan para la reserva.</span>
          </p>
          <GoogleSignInButton onSuccess={signIn} onError={e=>showT(e,"error")}/>
        </div>
        <button onClick={()=>setView("barber_pin")} style={{...ghost({padding:"13px",width:"100%"})}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(212,175,90,0.3)";e.currentTarget.style.color="#8a7a65";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(212,175,90,0.14)";e.currentTarget.style.color="#5a4a38";}}>
          ✂ Acceso Peluquero
        </button>
      </div>
    </div>
  );

  /* ── BARBER PIN ── */
  if (view === "barber_pin") return (
    <div style={{...app,display:"flex",alignItems:"center",justifyContent:"center",padding:24,minHeight:"100vh"}}>
      <style>{css}</style>
      {toast && <Toast {...toast} onClose={()=>setToast(null)}/>}
      <div className="fade" style={{textAlign:"center",maxWidth:285,width:"100%"}}>
        <div style={{fontSize:40,marginBottom:14}}>✂️</div>
        <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:"#f0e6d0",marginBottom:6,fontWeight:500}}>Panel Peluquero</h2>
        <p style={{color:"#3a3020",fontSize:11,letterSpacing:"0.12em",marginBottom:26}}>Introduce tu PIN de 4 dígitos</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:9,marginBottom:10}}>
          {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((k,i)=>(
            <button key={i}
              onClick={()=>{if(k==="")return;if(k==="⌫"){setBPin(p=>p.slice(0,-1));setBPinErr(false);}else if(bPin.length<4){setBPin(p=>p+k);setBPinErr(false);}}}
              style={{padding:"17px",borderRadius:8,cursor:k===""?"default":"pointer",background:k===""?"transparent":"rgba(255,255,255,0.04)",border:`1px solid ${k===""?"transparent":"rgba(212,175,90,0.13)"}`,color:"#e8dcc8",fontSize:19,fontFamily:"'Cormorant Garamond',serif",transition:"all 0.12s"}}
              onMouseEnter={e=>{if(k!=="")e.currentTarget.style.background="rgba(212,175,90,0.09)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=k===""?"transparent":"rgba(255,255,255,0.04)";}}>
              {k}
            </button>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:18}}>
          {[0,1,2,3].map(i=><div key={i} style={{width:11,height:11,borderRadius:"50%",background:i<bPin.length?G:"rgba(212,175,90,0.15)",transition:"background 0.15s",boxShadow:i<bPin.length?`0 0 8px rgba(212,175,90,0.5)`:""}}/>)}
        </div>
        {bPinErr&&<p style={{color:"#c0392b",fontSize:12,marginBottom:12}}>PIN incorrecto. Inténtalo de nuevo.</p>}
        <button onClick={barberLogin} disabled={bPin.length!==4} style={{...gBtn({width:"100%",padding:"15px",marginBottom:13}),background:bPin.length===4?`linear-gradient(135deg,${G},#b8942e)`:"rgba(255,255,255,0.05)",color:bPin.length===4?"#0d0d0d":"#252015",cursor:bPin.length===4?"pointer":"default"}}>Entrar</button>
        <button onClick={()=>{setView("login");setBPin("");setBPinErr(false);}} style={{background:"none",border:"none",color:"#3a2e1a",cursor:"pointer",fontSize:12,textDecoration:"underline"}}>← Volver</button>
      </div>
    </div>
  );

  /* ── HOME ── */
  if (view === "home") return (
    <div style={app}>
      <style>{css}</style>
      {toast && <Toast {...toast} onClose={()=>setToast(null)}/>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 18px",borderBottom:"1px solid rgba(212,175,90,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {gUser?.picture?<img src={gUser.picture} alt="" style={{width:33,height:33,borderRadius:"50%",border:`1.5px solid rgba(212,175,90,0.4)`}}/>:<div style={{width:33,height:33,borderRadius:"50%",background:"rgba(212,175,90,0.1)",border:`1px solid rgba(212,175,90,0.25)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>👤</div>}
          <div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#e8dcc8",fontWeight:500}}>{gUser?.name}</div>
            <div style={{fontSize:10,color:"#3a3020"}}>{gUser?.email}</div>
          </div>
        </div>
        <button onClick={signOut} style={{...ghost({padding:"6px 12px",fontSize:10})}}>Salir</button>
      </div>
      <div style={{textAlign:"center",padding:"36px 20px 26px",position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse 70% 55% at 50% 0%,rgba(212,175,90,0.09) 0%,transparent 70%)",pointerEvents:"none"}}/>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,7vw,50px)",fontWeight:600,color:"#f5ead8",lineHeight:1.05,marginBottom:8}}>
          Hola, <span style={{color:G,fontStyle:"italic",fontWeight:300}}>{gUser?.name?.split(" ")[0]}</span>
        </h1>
        <p style={{color:"#3a3020",fontSize:11,letterSpacing:"0.12em",marginBottom:26}}>¿Qué servicio necesitas hoy?</p>
        <button onClick={()=>{setView("book");setStep(1);}} style={{...gBtn({padding:"15px 38px"}),boxShadow:"0 8px 28px rgba(212,175,90,0.2)"}}>Reservar Cita</button>
      </div>
      <div style={{padding:"0 16px 40px",maxWidth:520,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{height:1,flex:1,background:"linear-gradient(to right,transparent,rgba(212,175,90,0.18))"}}/>
          <span style={{color:G,fontSize:9,letterSpacing:"0.2em",textTransform:"uppercase"}}>Servicios</span>
          <div style={{height:1,flex:1,background:"linear-gradient(to left,transparent,rgba(212,175,90,0.18))"}}/>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
          {SERVICES.map((s,i)=>(
            <div key={s.id} className="fade" style={{...card({padding:"14px 12px",cursor:"pointer",transition:"all 0.2s",animationDelay:`${i*0.03}s`})}} onClick={()=>{setSvcId(s.id);setView("book");setStep(2);}} onMouseEnter={e=>{e.currentTarget.style.background="rgba(212,175,90,0.07)";e.currentTarget.style.borderColor="rgba(212,175,90,0.32)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";e.currentTarget.style.borderColor="rgba(212,175,90,0.13)";}}>
              <div style={{fontSize:18,marginBottom:7}}>{s.emoji}</div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:14,color:"#e8dcc8",fontWeight:500,lineHeight:1.25,marginBottom:5}}>{s.name}</div>
              <div style={{color:G,fontSize:13,fontWeight:600}}>{s.price}€</div>
              <div style={{color:"#2e2518",fontSize:10,marginTop:2}}>{s.duration}min</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── BOOKING ── */
  if (view === "book") return (
    <div style={app}>
      <style>{css}</style>
      {toast && <Toast {...toast} onClose={()=>setToast(null)}/>}
      <div style={{display:"flex",alignItems:"center",padding:"17px 17px 0",gap:13}}>
        <button onClick={()=>{if(step===1)setView("home");else setStep(step-1);}} style={{background:"none",border:`1px solid rgba(212,175,90,0.22)`,color:G,borderRadius:"50%",width:36,height:36,cursor:"pointer",fontSize:16,flexShrink:0}}>←</button>
        <div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,color:"#f0e6d0",fontWeight:500}}>{step===1?"Elige un servicio":step===2?"Selecciona el día":"Confirma tu cita"}</h2>
          <div style={{display:"flex",gap:5,marginTop:5}}>{[1,2,3].map(i=><div key={i} style={{height:2,width:24,borderRadius:1,background:i<=step?G:"rgba(212,175,90,0.14)",transition:"background 0.3s"}}/>)}</div>
        </div>
      </div>
      <div style={{padding:"16px 17px",maxWidth:500,margin:"0 auto"}}>
        {step===1&&<div className="fade">{SERVICES.map(s=>(
          <div key={s.id} onClick={()=>{setSvcId(s.id);setStep(2);}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 15px",marginBottom:7,...card({background:svcId===s.id?"rgba(212,175,90,0.1)":"rgba(255,255,255,0.03)",border:`1px solid ${svcId===s.id?G:"rgba(212,175,90,0.12)"}`}),cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(212,175,90,0.07)"} onMouseLeave={e=>e.currentTarget.style.background=svcId===s.id?"rgba(212,175,90,0.1)":"rgba(255,255,255,0.03)"}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <span style={{fontSize:20}}>{s.emoji}</span>
              <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:"#e8dcc8",fontWeight:500}}>{s.name}</div>{s.desc&&<div style={{fontSize:11,color:"#3a2a18",marginTop:2}}>{s.desc}</div>}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}><div style={{color:G,fontWeight:600,fontSize:15}}>{s.price}€</div><div style={{fontSize:10,color:"#2e2010"}}>{s.duration}min</div></div>
          </div>
        ))}</div>}

        {step===2&&<div className="fade">
          {svc&&<div style={{padding:"13px 15px",marginBottom:16,background:"rgba(212,175,90,0.07)",border:`1px solid ${G}`,borderRadius:9,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#f0e6d0"}}>{svc.name}</div><div style={{fontSize:11,color:"#6a5a48",marginTop:2}}>{svc.duration} min</div></div><div style={{color:G,fontWeight:700,fontSize:19}}>{svc.price}€</div></div>}
          <p style={{color:"#3a2a18",fontSize:10,letterSpacing:"0.13em",marginBottom:12,textTransform:"uppercase"}}>Próximos 30 días</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7}}>
            {days.map(d=>{
              const ds=iso(d),bl=blocked.includes(ds),fr=getFree(ds),sel=selDate&&iso(selDate)===ds;
              const t=new Date();t.setHours(0,0,0,0);const past=d<t;
              return<div key={ds} onClick={()=>{if(!bl&&!past&&fr.length>0){setSelDate(d);setStep(3);setSelSlot(null);}}} style={{padding:"10px 6px",borderRadius:8,textAlign:"center",cursor:(bl||past||fr.length===0)?"not-allowed":"pointer",background:sel?"rgba(212,175,90,0.12)":(past||bl)?"rgba(255,255,255,0.01)":"rgba(255,255,255,0.03)",border:`1px solid ${sel?G:(past||bl)?"rgba(255,255,255,0.04)":"rgba(212,175,90,0.12)"}`,opacity:(past||bl)?0.35:fr.length===0?0.45:1,transition:"all 0.2s"}}>
                <div style={{fontSize:9,color:"#3a2a18",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>{DAYS[d.getDay()]}</div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,color:sel?G:"#e8dcc8",fontWeight:600}}>{d.getDate()}</div>
                <div style={{fontSize:9,marginTop:2,color:bl?"#c0392b":fr.length===0?"#4a3020":G}}>{bl?"Cerrado":past?"—":fr.length===0?"Completo":`${fr.length} libre${fr.length!==1?"s":""}`}</div>
              </div>;
            })}
          </div>
        </div>}

        {step===3&&<div className="fade">
          <div style={{...card({padding:"13px 15px",marginBottom:14})}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17,color:"#f0e6d0",marginBottom:3}}>{svc?.name}</div><div style={{fontSize:12,color:"#5a4a38"}}>{selDate&&fmtDay(selDate)} · {svc?.price}€ · {svc?.duration}min</div></div>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"11px 13px",marginBottom:18,...card()}}>
            {gUser?.picture?<img src={gUser.picture} alt="" style={{width:32,height:32,borderRadius:"50%",border:`1.5px solid rgba(212,175,90,0.3)`}}/>:<div style={{width:32,height:32,borderRadius:"50%",background:"rgba(212,175,90,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>👤</div>}
            <div style={{flex:1}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#e8dcc8"}}>{gUser?.name}</div><div style={{fontSize:10,color:"#3a3020"}}>{gUser?.email}</div></div>
            <div style={{fontSize:9,color:G,border:`1px solid rgba(212,175,90,0.25)`,padding:"3px 8px",borderRadius:4,letterSpacing:"0.12em"}}>GOOGLE</div>
          </div>
          <p style={{color:"#3a2a18",fontSize:10,letterSpacing:"0.13em",marginBottom:11,textTransform:"uppercase"}}>Horas disponibles</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:26}}>
            {selDate&&getFree(iso(selDate)).map(s=><button key={s} onClick={()=>setSelSlot(s)} style={{padding:"9px 16px",borderRadius:6,cursor:"pointer",background:selSlot===s?G:"rgba(255,255,255,0.04)",color:selSlot===s?"#0d0d0d":"#e8dcc8",border:`1px solid ${selSlot===s?G:"rgba(212,175,90,0.2)"}`,fontFamily:"'Montserrat',sans-serif",fontWeight:selSlot===s?600:400,fontSize:13,transition:"all 0.14s"}}>{s}</button>)}
            {selDate&&getFree(iso(selDate)).length===0&&<p style={{color:"#5a4a38",fontSize:13}}>No hay horas disponibles</p>}
          </div>
          <button onClick={doBook} style={{...gBtn({width:"100%",padding:"16px"}),opacity:selSlot?1:0.4,transition:"opacity 0.2s"}}>Confirmar Reserva</button>
        </div>}
      </div>
    </div>
  );

  /* ── CONFIRM ── */
  if (view==="confirm"&&confData) {
    const cs=SERVICES.find(s=>s.id===confData.service);
    return(
      <div style={{...app,display:"flex",alignItems:"center",justifyContent:"center",padding:24,minHeight:"100vh"}}>
        <style>{css}</style>
        {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
        <div className="fade" style={{textAlign:"center",maxWidth:340}}>
          <div style={{width:76,height:76,borderRadius:"50%",margin:"0 auto 20px",background:"radial-gradient(circle,rgba(212,175,90,0.2),transparent)",border:`2px solid ${G}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>✓</div>
          <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,color:"#f0e6d0",marginBottom:5,fontWeight:500}}>¡Cita Reservada!</h2>
          <p style={{color:"#3a3020",fontSize:11,letterSpacing:"0.12em",marginBottom:26}}>Te esperamos en el salón</p>
          <div style={{...card({borderRadius:12,padding:22,marginBottom:18,textAlign:"left"})}}>
            {[{l:"Servicio",v:`${cs?.emoji} ${cs?.name}`},{l:"Fecha",v:confData.date},{l:"Hora",v:confData.slot},{l:"Cliente",v:confData.name},{l:"Precio",v:`${cs?.price}€`},{l:"Duración",v:`${cs?.duration} min`}].map(r=>(
              <div key={r.l} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid rgba(212,175,90,0.07)"}}>
                <span style={{color:"#3a3020",fontSize:10,letterSpacing:"0.1em",textTransform:"uppercase"}}>{r.l}</span>
                <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#e8dcc8"}}>{r.v}</span>
              </div>
            ))}
          </div>
          <div style={{background:"rgba(212,175,90,0.06)",border:"1px solid rgba(212,175,90,0.16)",borderRadius:8,padding:"11px 14px",marginBottom:20,fontSize:12,color:"#6a5a48",lineHeight:1.7}}>
            📞 Para cambiar o cancelar: <span style={{color:G}}>697 610 737</span>
          </div>
          <button onClick={()=>{setView("home");resetBook();setConfData(null);}} style={{...gBtn({width:"100%",padding:"15px"})}}>Volver al inicio</button>
        </div>
      </div>
    );
  }

  /* ── BARBER DASHBOARD ── */
  if (view==="barber"&&bAuth) {
    const todayBks=bookings.filter(b=>b.date===todayStr&&b.status==="confirmed");
    const upcoming=bookings.filter(b=>b.date>=todayStr&&b.status==="confirmed");
    const filtered=fDate?bookings.filter(b=>b.date===fDate).sort((a,b)=>a.slot.localeCompare(b.slot)):upcoming.sort((a,b)=>a.date.localeCompare(b.date)||a.slot.localeCompare(b.slot));
    return(
      <div style={app}>
        <style>{css}</style>
        {toast&&<Toast {...toast} onClose={()=>setToast(null)}/>}
        <div style={{padding:"16px 17px 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,color:"#f0e6d0",fontWeight:500}}>Panel del Peluquero</h2><p style={{color:"#2e2010",fontSize:10,letterSpacing:"0.12em",marginTop:2}}>HOY: {todayBks.length} CITA{todayBks.length!==1?"S":""}</p></div>
          <button onClick={()=>{setBAuth(false);setView("login");}} style={{...ghost({padding:"7px 13px",fontSize:10})}}>Salir</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,padding:"13px 17px"}}>
          {[{l:"Hoy",v:todayBks.length},{l:"Próximas",v:upcoming.length},{l:"Horarios",v:slots.length}].map(st=>(
            <div key={st.l} style={{...card({borderRadius:8,padding:"12px 8px",textAlign:"center"})}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:G,fontWeight:600}}>{st.v}</div><div style={{fontSize:9,color:"#2e2010",letterSpacing:"0.12em",textTransform:"uppercase",marginTop:2}}>{st.l}</div></div>
          ))}
        </div>
        <div style={{display:"flex",padding:"0 17px",gap:4,borderBottom:"1px solid rgba(212,175,90,0.08)",marginBottom:13}}>
          {[["reservas","Reservas"],["horarios","Horarios"],["dias","Días"]].map(([id,lb])=>(
            <button key={id} onClick={()=>setBTab(id)} style={{padding:"9px 14px",background:"none",border:"none",color:bTab===id?G:"#2e2010",borderBottom:bTab===id?`2px solid ${G}`:"2px solid transparent",cursor:"pointer",fontSize:11,letterSpacing:"0.1em",fontFamily:"'Montserrat',sans-serif",fontWeight:bTab===id?600:400,transition:"all 0.2s",marginBottom:-1}}>{lb}</button>
          ))}
        </div>
        <div style={{padding:"0 17px 40px",maxWidth:500,margin:"0 auto"}}>
          {bTab==="reservas"&&<div className="fade">
            <div style={{display:"flex",gap:8,marginBottom:13}}>
              <input type="date" value={fDate} onChange={e=>setFDate(e.target.value)} style={{flex:1,padding:"9px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(212,175,90,0.18)",borderRadius:6,color:"#e8dcc8",fontSize:12,colorScheme:"dark",fontFamily:"'Montserrat',sans-serif"}}/>
              {fDate&&<button onClick={()=>setFDate("")} style={{...ghost({padding:"9px 12px",fontSize:11})}}>✕</button>}
            </div>
            {filtered.length===0&&<div style={{textAlign:"center",padding:"44px 0",color:"#1e1808"}}><div style={{fontSize:28,marginBottom:10}}>📅</div><p style={{fontFamily:"'Cormorant Garamond',serif",fontSize:17}}>Sin reservas</p></div>}
            {filtered.map(b=>{
              const sv2=SERVICES.find(s=>s.id===b.service);
              return<div key={b.id} style={{padding:"13px",marginBottom:8,...card({border:`1px solid ${b.status==="cancelled"?"rgba(255,255,255,0.05)":"rgba(212,175,90,0.14)"}`}),opacity:b.status==="cancelled"?0.45:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                      {b.picture?<img src={b.picture} alt="" style={{width:26,height:26,borderRadius:"50%",border:`1px solid rgba(212,175,90,0.2)`}}/>:<div style={{width:26,height:26,borderRadius:"50%",background:"rgba(212,175,90,0.08)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>👤</div>}
                      <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:"#f0e6d0",fontWeight:500}}>{b.name}</div><div style={{fontSize:10,color:"#3a3020"}}>{b.email}</div></div>
                    </div>
                    <div style={{fontSize:11,color:G}}>📅 {b.date} · 🕐 {b.slot}</div>
                    <div style={{fontSize:11,color:"#5a4a38",marginTop:3}}>{sv2?.emoji} {sv2?.name} — <span style={{color:G,fontWeight:600}}>{sv2?.price}€</span></div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0,marginLeft:10}}>
                    <div style={{fontSize:9,textTransform:"uppercase",padding:"3px 7px",borderRadius:4,border:"1px solid",marginBottom:6,color:b.status==="cancelled"?"#c0392b":G,borderColor:b.status==="cancelled"?"rgba(192,57,43,0.25)":"rgba(212,175,90,0.25)",background:b.status==="cancelled"?"rgba(192,57,43,0.06)":"rgba(212,175,90,0.06)"}}>{b.status==="cancelled"?"Cancelada":"Confirmada"}</div>
                    {b.status!=="cancelled"&&<button onClick={()=>{setBookings(p=>p.map(x=>x.id===b.id?{...x,status:"cancelled"}:x));showT("Reserva cancelada");}} style={{background:"none",border:"1px solid rgba(192,57,43,0.25)",color:"#c0392b",borderRadius:4,padding:"3px 9px",cursor:"pointer",fontSize:10}}>Cancelar</button>}
                  </div>
                </div>
              </div>;
            })}
          </div>}
          {bTab==="horarios"&&<div className="fade">
            <p style={{color:"#3a2a18",fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:13}}>Horas disponibles para clientes</p>
            <div style={{display:"flex",gap:8,marginBottom:17}}>
              <input type="time" value={newSlot} onChange={e=>setNewSlot(e.target.value)} style={{flex:1,padding:"10px 13px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(212,175,90,0.18)",borderRadius:6,color:"#e8dcc8",fontSize:13,colorScheme:"dark",fontFamily:"'Montserrat',sans-serif"}}/>
              <button onClick={addSlot} style={{...gBtn({padding:"10px 18px",borderRadius:6,fontSize:12})}}>+ Añadir</button>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {slots.map(s=><div key={s} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 12px",...card({border:"1px solid rgba(212,175,90,0.17)",borderRadius:6})}}><span style={{color:"#e8dcc8",fontSize:13,fontFamily:"'Cormorant Garamond',serif"}}>{s}</span><button onClick={()=>{setSlots(p=>p.filter(x=>x!==s));showT("Hora eliminada");}} style={{background:"none",border:"none",color:"rgba(192,57,43,0.55)",cursor:"pointer",fontSize:15,lineHeight:1,padding:0}}>×</button></div>)}
            </div>
            <button onClick={()=>{setSlots(DEFAULT_SLOTS);showT("Horario restablecido");}} style={{...ghost({marginTop:17,padding:"9px 14px",fontSize:11})}}>↺ Restablecer por defecto</button>
          </div>}
          {bTab==="dias"&&<div className="fade">
            <p style={{color:"#3a2a18",fontSize:10,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:13}}>Toca para bloquear / desbloquear</p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
              {days.map(d=>{
                const ds=iso(d),bl=blocked.includes(ds),t2=new Date();t2.setHours(0,0,0,0);const past=d<t2,nb=getBooked(ds).length;
                return<div key={ds} onClick={()=>!past&&toggleDay(ds)} style={{padding:"12px",...card({border:`1px solid ${bl?"rgba(192,57,43,0.28)":"rgba(212,175,90,0.12)"}`,background:bl?"rgba(192,57,43,0.08)":"rgba(255,255,255,0.03)",borderRadius:8}),cursor:past?"default":"pointer",opacity:past?0.28:1,transition:"all 0.2s"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div><div style={{fontSize:9,color:"#3a2a18",textTransform:"uppercase"}}>{DAYS[d.getDay()]}</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,color:bl?"#c0392b":"#e8dcc8",fontWeight:500}}>{d.getDate()} {MONS[d.getMonth()]}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontSize:9,padding:"3px 7px",borderRadius:4,background:bl?"rgba(192,57,43,0.12)":"rgba(212,175,90,0.07)",color:bl?"#c0392b":G,border:`1px solid ${bl?"rgba(192,57,43,0.22)":"rgba(212,175,90,0.18)"}`,textTransform:"uppercase",marginBottom:3}}>{bl?"Cerrado":"Abierto"}</div>{nb>0&&<div style={{fontSize:9,color:"#5a4a38"}}>{nb} cita{nb!==1?"s":""}</div>}</div>
                  </div>
                </div>;
              })}
            </div>
          </div>}
        </div>
      </div>
    );
  }

  if(view==="barber"&&!bAuth){setTimeout(()=>setView("barber_pin"),0);return null;}
  return null;
}
