import { useState } from "react";
import { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES,
  TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK,
  MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT,
  uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia,
  getTempLead, getAlertas, LS, mkDemo } from "./shared.js";
import { MarflowLogo, ConfirmModal, Av, Btn, Inp, Sel, FL,
  MFModal, MHead, HoraSelect, ContactoModal, GD, Tag, WolfMark } from "./ui.jsx";
import { LeadCard, LeadModal } from "./LeadCard.jsx";
import Dashboard   from "./Dashboard.jsx";
import Pipeline    from "./Pipeline.jsx";
import ListaLeads  from "./ListaLeads.jsx";
import Agenda      from "./Agenda.jsx";
import Metricas    from "./Metricas.jsx";
import Mensajes    from "./Mensajes.jsx";
import Cobranza    from "./Cobranza.jsx";
import Usuarios    from "./Usuarios.jsx";

function Auth({onLogin}) {
  const [usuario,setUsuario]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [cuentas]=useState(()=>LS.get("mf_cuentas",CUENTAS_INIT));

  function login(){
    if(loading) return;
    setErr(""); setLoading(true);
    setTimeout(()=>{
      const c=cuentas.find(c=>c.usuario.toLowerCase()===usuario.toLowerCase()&&c.pass===pass);
      if(!c){setErr("Credenciales incorrectas");setLoading(false);return;}
      onLogin(c,cuentas);
    },400);
  }

  const AUTH_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Cormorant+Garamond:wght@400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Poppins',sans-serif;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes shimmerLine{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
    .mf-input{
      width:100%;padding:14px 16px;
      background:rgba(255,255,255,0.04);
      border:1px solid rgba(198,169,107,0.2);
      border-radius:10px;
      color:#f0ece4;
      font-family:'Poppins',sans-serif;
      font-size:14px;font-weight:400;
      outline:none;
      transition:border-color .2s, background .2s, box-shadow .2s;
      -webkit-appearance:none;
    }
    .mf-input::placeholder{color:rgba(255,255,255,0.25);}
    .mf-input:focus{
      border-color:rgba(198,169,107,0.7);
      background:rgba(255,255,255,0.07);
      box-shadow:0 0 0 3px rgba(198,169,107,0.1);
    }
    .mf-input-light{
      width:100%;padding:14px 16px;
      background:#ffffff;
      border:1.5px solid #e5e7eb;
      border-radius:10px;
      color:#0A1F44;
      font-family:'Poppins',sans-serif;
      font-size:14px;font-weight:400;
      outline:none;
      transition:border-color .2s, box-shadow .2s;
      -webkit-appearance:none;
    }
    .mf-input-light::placeholder{color:#9ca3af;}
    .mf-input-light:focus{
      border-color:#C6A96B;
      box-shadow:0 0 0 3px rgba(198,169,107,0.12);
    }
    .mf-btn{
      width:100%;padding:15px;
      background:linear-gradient(135deg,#0A1F44 0%,#1a3a6e 100%);
      border:none;border-radius:10px;
      color:#ffffff;
      font-family:'Poppins',sans-serif;
      font-size:14px;font-weight:600;letter-spacing:0.3px;
      cursor:pointer;
      transition:all .2s;
      position:relative;overflow:hidden;
    }
    .mf-btn:hover{background:linear-gradient(135deg,#122550 0%,#1e4a8e 100%);transform:translateY(-1px);box-shadow:0 8px 24px rgba(10,31,68,.4);}
    .mf-btn:active{transform:translateY(0);}
    .mf-btn-gold{
      width:100%;padding:15px;
      background:linear-gradient(135deg,#C6A96B 0%,#d4bc89 50%,#b8960e 100%);
      border:none;border-radius:10px;
      color:#0A1F44;
      font-family:'Poppins',sans-serif;
      font-size:14px;font-weight:700;letter-spacing:0.3px;
      cursor:pointer;
      transition:all .2s;
    }
    .mf-btn-gold:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(198,169,107,.45);}
    @media(min-width:900px){
      .mf-desktop-layout{flex-direction:row!important;}
      .mf-brand-panel{display:flex!important;}
      .mf-form-panel{border-radius:0!important;}
    }
  `;

  /* -- VERSIÓN A: DARK PREMIUM (panel izquierdo oscuro) -- */
  return (
    <div style={{minHeight:"100vh",background:"#060e1c",display:"flex",flexDirection:"column",fontFamily:"'Poppins',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{AUTH_CSS}</style>

      {/* -- Fondo: textura de puntos + gradientes -- */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        {/* Gradiente radial superior izq */}
        <div style={{position:"absolute",top:-200,left:-200,width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(198,169,107,0.07) 0%,transparent 70%)"}}/>
        {/* Gradiente radial inferior der */}
        <div style={{position:"absolute",bottom:-150,right:-100,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(10,31,68,0.8) 0%,transparent 70%)"}}/>
        {/* Grid sutil */}
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.03}} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C6A96B" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
        {/* Línea dorada horizontal sutil */}
        <div style={{position:"absolute",top:"50%",left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(198,169,107,0.08),transparent)"}}/>
      </div>

      {/* -- Layout responsive -- */}
      <div className="mf-desktop-layout" style={{flex:1,display:"flex",flexDirection:"column",position:"relative",zIndex:1,minHeight:"100vh"}}>

        {/* === PANEL IZQUIERDO -- MARCA (oculto en mobile, visible desktop) === */}
        <div className="mf-brand-panel" style={{
          display:"none", // se muestra por media query
          flex:"0 0 52%",flexDirection:"column",
          justifyContent:"space-between",
          padding:"52px 56px",
          background:"linear-gradient(145deg,#0A1F44 0%,#071428 60%,#020a18 100%)",
          borderRight:"1px solid rgba(198,169,107,0.1)",
          position:"relative",overflow:"hidden",
        }}>
          {/* Lobo watermark de fondo */}
          <div style={{position:"absolute",right:-20,bottom:60,opacity:.04,transform:"scale(2.2) rotate(-5deg)",transformOrigin:"right bottom"}}>
            <WolfMark size={260}/>
          </div>
          {/* Olas decorativas */}
          <svg style={{position:"absolute",bottom:0,left:0,right:0,opacity:.12}} viewBox="0 0 600 100" preserveAspectRatio="none" height="100">
            <path d="M0 60 Q75 20 150 50 Q225 80 300 40 Q375 0 450 35 Q525 70 600 30 L600 100 L0 100Z" fill={B.gold}/>
          </svg>

          {/* Logo top */}
          <div style={{animation:"fadeIn .8s ease"}}>
            <div style={{marginBottom:48}}>
              <MarflowLogo height={52} dark={true}/>
            </div>

            {/* Headline */}
            <div style={{marginBottom:40}}>
              <div style={{fontSize:14,color:"rgba(240,236,228,0.5)",lineHeight:1.75,fontWeight:300,maxWidth:340}}>
                La plataforma inteligente que convierte seguimiento en resultados. Diseñada para asesores de alto rendimiento.
              </div>
            </div>
          </div>

          {/* Features */}
          <div style={{animation:"fadeUp .9s ease",animationDelay:".2s",animationFillMode:"both"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
              {[
                {icon:"*",t:"Pipeline inteligente",d:"Kanban visual con temperatura automática"},
                {icon:"📅",t:"Agenda privada",d:"Eventos personales invisibles para asistentes"},
                {icon:"📊",t:"Métricas en vivo",d:"Conversión, pipeline y alertas automáticas"},
                {icon:"💰",t:"Cobranza proactiva",d:"Renovaciones y atrasos desde tu Excel"},
              ].map(f=>(
                <div key={f.t} style={{padding:"16px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(198,169,107,0.1)"}}>
                  <div style={{fontSize:20,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontSize:12,fontWeight:600,color:"#f0ece4",marginBottom:3}}>{f.t}</div>
                  <div style={{fontSize:11,color:"rgba(240,236,228,0.4)",lineHeight:1.5,fontWeight:300}}>{f.d}</div>
                </div>
              ))}
            </div>

            {/* Footer brand */}
            <div style={{marginTop:36,paddingTop:24,borderTop:"1px solid rgba(198,169,107,0.1)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:10,color:"rgba(198,169,107,0.5)",letterSpacing:2,textTransform:"uppercase"}}>© 2025 MarFlow · Todos los derechos reservados</div>
              <div style={{display:"flex",gap:8}}>
                {["●","●","●"].map((d,i)=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:i===0?B.gold:"rgba(198,169,107,0.25)"}}/>)}
              </div>
            </div>
          </div>
        </div>

        {/* === PANEL DERECHO -- FORMULARIO === */}
        <div style={{
          flex:1,
          display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",
          padding:"32px 24px",
          background:"#060e1c",
          minHeight:"100vh",
          position:"relative",
        }}>
          {/* Formulario centrado */}
          <div style={{width:"100%",maxWidth:380,animation:"fadeUp .5s ease",animationDelay:".1s",animationFillMode:"both",marginTop:40}}>

            {/* Título bienvenida */}
            <div style={{textAlign:"center",marginBottom:28}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600,color:"#f0ece4",lineHeight:1.2,marginBottom:8}}>
                Bienvenido
              </div>
              <div style={{fontSize:13,color:"rgba(240,236,228,0.4)",fontWeight:300,letterSpacing:0.2}}>
                Acceso exclusivo · Plataforma privada
              </div>
            </div>

            {/* Inputs */}
            <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:6}}>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:10,fontWeight:600,color:"rgba(198,169,107,0.8)",textTransform:"uppercase",letterSpacing:"1px"}}>Usuario</label>
                <input
                  className="mf-input"
                  value={usuario} onChange={e=>setUsuario(e.target.value)}
                  placeholder="Tu usuario"
                  onKeyDown={e=>e.key==="Enter"&&login()}
                  autoCapitalize="none" autoCorrect="off" spellCheck={false}
                />
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:10,fontWeight:600,color:"rgba(198,169,107,0.8)",textTransform:"uppercase",letterSpacing:"1px"}}>Contraseña</label>
                <input
                  className="mf-input"
                  type="password" value={pass} onChange={e=>setPass(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e=>e.key==="Enter"&&login()}
                />
              </div>

              {err&&(
                <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:8,background:"rgba(220,38,38,0.12)",border:"1px solid rgba(220,38,38,0.25)"}}>
                  <span style={{fontSize:14}}>⚠</span>
                  <span style={{fontSize:12,color:"#fca5a5",fontWeight:500}}>{err}</span>
                </div>
              )}

              {/* Botón principal */}
              <button
                className="mf-btn-gold"
                onClick={login}
                disabled={loading}
                style={{marginTop:8,opacity:loading?.7:1}}
              >
                {loading ? (
                  <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                    <span style={{display:"inline-block",width:14,height:14,border:"2px solid rgba(10,31,68,0.4)",borderTopColor:B.navy,borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
                    Verificando...
                  </span>
                ) : "Ingresar →"}
              </button>
            </div>

            {/* Divider */}
            <div style={{display:"flex",alignItems:"center",gap:12,margin:"24px 0"}}>
              <div style={{flex:1,height:1,background:"rgba(198,169,107,0.12)"}}/>
              <div style={{fontSize:10,color:"rgba(198,169,107,0.35)",letterSpacing:2,textTransform:"uppercase"}}>acceso seguro</div>
              <div style={{flex:1,height:1,background:"rgba(198,169,107,0.12)"}}/>
            </div>

            {/* Demo hint */}
            <div style={{background:"rgba(198,169,107,0.05)",border:"1px solid rgba(198,169,107,0.12)",borderRadius:10,padding:"12px 16px",textAlign:"center"}}>
              <div style={{fontSize:10,color:"rgba(198,169,107,0.5)",textTransform:"uppercase",letterSpacing:1.5,marginBottom:5}}>Demo</div>
              <div style={{fontSize:12,color:"rgba(240,236,228,0.5)",fontFamily:"monospace",letterSpacing:0.5}}>
                mariana <span style={{color:"rgba(198,169,107,0.4)"}}>·</span> Mariana2024
              </div>
            </div>

            {/* Footer */}
            <div style={{marginTop:32,textAlign:"center"}}>
              <div style={{fontSize:10,color:"rgba(198,169,107,0.25)",letterSpacing:2,textTransform:"uppercase"}}>
                © 2025 MarFlow
              </div>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @media(min-width:900px){
          .mf-brand-panel{display:flex!important;}
          .mf-desktop-layout{flex-direction:row!important;}
        }
      `}</style>
    </div>
  );
}

/* ===========================================
   VENTA DEL DÍA
=========================================== */
export default function App() {
  const [usuario,setUsuario]=useState(null);
  const [cuentas,setCuentas]=useState(()=>LS.get("mf_cuentas",CUENTAS_INIT));
  const [seccion,setSeccion]=useState("dashboard");
  const [filtroNav,setFiltroNav]=useState("todos");
  const [allLeads,setAllLeads]=useState(()=>LS.get("mf_leads",{}));
  const [allEventos,setAllEventos]=useState(()=>LS.get("mf_eventos",{}));
  const [notifOpen,setNotifOpen]=useState(false);
  const [sessionStart]=useState(()=>Date.now());

  const cid=usuario?.rol==="asistente"?usuario.adminId:usuario?.id;
  const leads=cid?(allLeads[cid]||[]):[];
  const eventos=cid?(allEventos[cid]||[]):[];

  function setLeads(fn){setAllLeads(p=>{const u={...p,[cid]:typeof fn==="function"?fn(p[cid]||[]):fn};LS.set("mf_leads",u);return u;});}
  function setEventos(fn){setAllEventos(p=>{const u={...p,[cid]:typeof fn==="function"?fn(p[cid]||[]):fn};LS.set("mf_eventos",u);return u;});}

  function onLogin(u,cs){
    setUsuario(u);setCuentas(cs||[]);
    setSeccion(u.rol==="asistente"?"agenda":"dashboard");
    const cid2=u.rol==="asistente"?u.adminId:u.id;
    if(!(LS.get("mf_leads",{})[cid2])){
      setAllLeads(p=>{const u2={...p,[cid2]:mkDemo()};LS.set("mf_leads",u2);return u2;});
    }
  }

  if(!usuario) return <Auth onLogin={onLogin}/>;

  const esAdmin=["admin","superadmin"].includes(usuario.rol);
  const esAsistente=usuario.rol==="asistente";
  const alertaCount=leads.filter(l=>!l.sinSeguimiento&&getAlertas(l).some(a=>["riesgo","sin_contacto"].includes(a.tipo))&&!["otro","cierre"].includes(l.etapa)).length;

  const NAV=[
    ...(esAdmin?[{id:"dashboard",icon:"*",l:"Dashboard"}]:[]),
    ...(esAdmin?[{id:"pipeline",icon:"#",l:"Pipeline"}]:[]),
    {id:"lista",icon:"☰",l:"Leads"},           // admin + asistente
    {id:"agenda",icon:"📅",l:"Agenda"},          // admin + asistente
    ...(esAdmin?[{id:"metricas",icon:"📊",l:"Métricas"}]:[]),
    ...(esAdmin?[{id:"mensajes",icon:"✉",l:"Mensajes"}]:[]),
    ...(esAdmin?[{id:"cobranza",icon:"💰",l:"Cobranza"}]:[]),
    ...(esAdmin?[{id:"usuarios",icon:"👤",l:"Usuarios"}]:[]),
  ];

  const APP_CSS = `
    /* ==========================================
       MARFLOW -- MOBILE FIRST PRODUCTION CSS
       iPhone priority · touch-safe · fluid
    ========================================== */

    /* -- BASE -- */
    html, body, * { box-sizing: border-box !important; }
    html {
      width: 100%; max-width: 100vw;
      overflow-x: hidden;
      -webkit-text-size-adjust: 100%;
      text-size-adjust: 100%;
    }
    body {
      width: 100%; max-width: 100vw;
      overflow-x: hidden;
      overscroll-behavior-y: contain;
    }
    input, select, textarea, button {
      font-family: 'Poppins', sans-serif;
      -webkit-appearance: none;
      appearance: none;
      border-radius: 8px;
      font-size: 16px; /* prevents iOS zoom on focus */
    }
    select { font-size: 14px; }

    /* -- APP WRAPPER -- */
    .mf-app {
      width: 100%; max-width: 100vw;
      min-height: 100vh; min-height: -webkit-fill-available;
      overflow-x: hidden;
      position: relative;
    }

    /* == HEADER == */
    .mf-header {
      position: sticky; top: 0; z-index: 400;
      width: 100%; max-width: 100vw;
      background: #0A1F44;
      border-bottom: 1px solid rgba(198,169,107,0.15);
      box-shadow: 0 2px 16px rgba(10,31,68,.3);
    }
    /* Row 1: Logo + acciones */
    .mf-header-row1 {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      height: 60px;
      gap: 8px;
      width: 100%;
    }
    /* Row 2: Nav scroll */
    .mf-header-row2 {
      display: flex;
      align-items: center;
      padding: 0 10px 9px;
      gap: 2px;
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      background: #0A1F44;
    }
    .mf-header-row2::-webkit-scrollbar { display: none; }

    /* == NAV BUTTONS == */
    .mf-nav-btn {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      min-height: 36px;
      padding: 6px 12px;
      border-radius: 18px;
      border: none;
      font-family: 'Poppins', sans-serif;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
      white-space: nowrap;
      -webkit-tap-highlight-color: transparent;
      position: relative;
      user-select: none;
      -webkit-user-select: none;
    }
    .mf-nav-btn.active {
      background: #C6A96B; color: #0A1F44;
      box-shadow: 0 2px 8px rgba(198,169,107,.35);
    }
    .mf-nav-btn.inactive { background: transparent; color: rgba(255,255,255,0.55); }
    .mf-nav-btn.inactive:active { background: rgba(255,255,255,0.1); color: #fff; }

    /* == MAIN == */
    .mf-main {
      width: 100%; max-width: 100vw;
      padding: 12px;
      overflow-x: hidden;
    }
    @media (min-width: 480px)  { .mf-main { padding: 16px; } }
    @media (min-width: 768px)  { .mf-main { padding: 20px; } }
    @media (min-width: 1024px) { .mf-main { padding: 28px; max-width: 1440px; margin: 0 auto; } }

    /* == PIPELINE FILTERS == */
    .mf-pipeline-filters {
      width: 100%; max-width: 100vw;
      display: flex; gap: 5px;
      padding: 7px 12px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
      background: rgba(255,255,255,0.97);
      border-bottom: 1px solid rgba(229,231,235,0.7);
    }
    .mf-pipeline-filters::-webkit-scrollbar { display: none; }
    .mf-pipeline-filters > button { flex-shrink: 0; min-height: 34px; }

    /* == KANBAN == */
    .mf-kanban {
      display: flex; gap: 10px;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 20px;
      align-items: flex-start;
      scrollbar-width: thin;
    }
    .mf-kanban-col { min-width: 240px; max-width: 260px; flex-shrink: 0; }

    /* == TABLE == */
    .mf-table-wrap {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }
    .mf-table { width: 100%; border-collapse: collapse; min-width: 560px; }
    .mf-th {
      text-align: left; padding: 10px 12px;
      font-size: 10px; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: .8px;
      border-bottom: 2px solid #E5E7EB;
      white-space: nowrap; background: #F8F6F2;
      position: sticky; top: 0; z-index: 1;
    }
    .mf-td {
      padding: 10px 12px; font-size: 13px;
      border-bottom: 1px solid rgba(229,231,235,.5);
      vertical-align: middle;
    }
    .mf-tr { transition: background .1s; cursor: pointer; }
    .mf-tr:active .mf-td { background: rgba(10,31,68,.03); }
    .mf-tr.rojo .mf-td { background: #fef2f2; }
    .mf-tr.seg-ant .mf-td { background: #fffbeb; }
    .mf-tel-btn {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 6px 12px; min-height: 36px;
      border-radius: 20px; border: 1px solid #E5E7EB;
      background: #fff; color: #0A1F44;
      font-family: 'Poppins', sans-serif;
      font-size: 12px; font-weight: 600;
      cursor: pointer; white-space: nowrap;
      -webkit-tap-highlight-color: transparent;
    }
    .mf-tel-btn:active { background: #0A1F44; color: #fff; }
    @media (max-width: 640px) { .mf-col-hide { display: none !important; } }

    /* == CALENDAR == */
    .mf-cal-wrap { width: 100%; box-sizing: border-box; overflow-x: hidden; }
    .mf-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); width: 100%; }
    .mf-cal-hdr  { display: grid; grid-template-columns: repeat(7, 1fr); background: #0A1F44; border-radius: 10px 10px 0 0; }
    .mf-cell {
      box-sizing: border-box; overflow: hidden;
      border-right: 1px solid rgba(10,31,68,0.06);
      border-bottom: 1px solid rgba(10,31,68,0.06);
      cursor: pointer; transition: background .1s;
      -webkit-tap-highlight-color: transparent;
      display: flex; flex-direction: column;
      position: relative;
      user-select: none; -webkit-user-select: none;
    }
    .mf-cell.ghost   { opacity: .32; cursor: default; background: #f7f6f4 !important; }
    .mf-cell.today   { background: rgba(10,31,68,.04); }
    .mf-cell.selected{ background: rgba(198,169,107,.12) !important; }
    .mf-cell.weekend { background: #faf8f4; }
    .mf-cell:not(.ghost):active { background: rgba(10,31,68,.07) !important; }
    .mf-daynum {
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-weight: 500; transition: all .15s;
    }
    .mf-daynum.today-num  { background: #0A1F44; color: #fff; font-weight: 800; }
    .mf-daynum.sel-num    { border: 2px solid #C6A96B; color: #C6A96B; font-weight: 700; }
    .mf-daynum.weekend-num{ color: #C6A96B; font-weight: 600; }
    .mf-pill {
      display: block; width: 100%;
      overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
      border-radius: 3px; font-weight: 600;
      cursor: pointer; box-sizing: border-box;
    }
    .mf-pill:active { opacity: .7; }

    /* Calendar responsive sizing */
    @media (max-width: 360px) {
      .mf-cell        { min-height: 44px; padding: 3px 1px 2px; }
      .mf-daynum      { width: 18px; height: 18px; font-size: 9px; }
      .mf-pill        { font-size: 6px; padding: 1px 2px; margin-bottom: 1px; line-height: 1.4; }
      .mf-cal-hdr div { font-size: 8px; padding: 7px 0; letter-spacing: 0; }
      .mf-legend      { display: none !important; }
    }
    @media (min-width: 361px) and (max-width: 480px) {
      .mf-cell        { min-height: 52px; padding: 3px 2px 2px; }
      .mf-daynum      { width: 20px; height: 20px; font-size: 10px; }
      .mf-pill        { font-size: 7px; padding: 1px 3px; margin-bottom: 1px; line-height: 1.4; }
      .mf-cal-hdr div { font-size: 9px; padding: 8px 0; }
      .mf-legend      { display: none !important; }
    }
    @media (min-width: 481px) and (max-width: 640px) {
      .mf-cell        { min-height: 64px; padding: 4px 3px 3px; }
      .mf-daynum      { width: 22px; height: 22px; font-size: 11px; }
      .mf-pill        { font-size: 8px; padding: 1px 4px; margin-bottom: 1px; line-height: 1.5; }
      .mf-cal-hdr div { font-size: 10px; }
    }
    @media (min-width: 641px) and (max-width: 900px) {
      .mf-cell        { min-height: 80px; padding: 5px 4px 4px; }
      .mf-daynum      { width: 25px; height: 25px; font-size: 12px; }
      .mf-pill        { font-size: 9px; padding: 2px 5px; margin-bottom: 2px; line-height: 1.5; }
    }
    @media (min-width: 901px) {
      .mf-cell        { min-height: 96px; padding: 6px 6px 4px; }
      .mf-daynum      { width: 28px; height: 28px; font-size: 13px; }
      .mf-pill        { font-size: 10px; padding: 2px 6px; margin-bottom: 2px; line-height: 1.6; }
    }

    /* == USER NAME HIDE ON SMALL == */
    .mf-user-name { display: none; }
    @media (min-width: 500px) { .mf-user-name { display: block; } }

    /* == TOUCH TARGETS == */
    .mf-touch-target {
      min-height: 44px; min-width: 44px;
      display: flex; align-items: center; justify-content: center;
    }

    /* == CARDS == */
    .mf-card {
      background: #fff;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(10,31,68,.07);
    }

    /* == MODAL OVERRIDE FOR MOBILE == */
    @media (max-width: 480px) {
      /* Modals full width on small phones */
      .mf-modal-inner {
        padding: 20px 16px !important;
        border-radius: 16px 16px 0 0 !important;
      }
    }

    /* == SAFE AREA (iPhone notch) == */
    .mf-app {
      padding-bottom: env(safe-area-inset-bottom);
    }
    .mf-header {
      padding-top: env(safe-area-inset-top);
    }
  `;

  return (
    <div className="mf-app" style={{fontFamily:"'Poppins',sans-serif",background:B.cream,color:B.black}} onClick={()=>notifOpen&&setNotifOpen(false)}>
      <style>{CSS}</style>
      <style>{APP_CSS}</style>

      {/* == HEADER == */}
      <header className="mf-header">
        {/* Fila 1: Logo + Bell + Avatar + Salir */}
        <div className="mf-header-row1" style={{background:B.navy}}>
          {/* Logo MarFlow SVG */}
          <MarflowLogo height={36} dark={true}/>

          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            {/* 🔔 Botón notificaciones */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setNotifOpen(o=>!o)}
                style={{width:36,height:36,borderRadius:"50%",border:`1px solid ${notifOpen?B.gold:"rgba(255,255,255,0.3)"}`,background:notifOpen?B.gold+"22":"rgba(255,255,255,0.1)",color:notifOpen?B.gold:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .18s",flexShrink:0,position:"relative"}}>
                🔔
                {alertaCount>0&&<span style={{position:"absolute",top:0,right:0,width:14,height:14,background:B.redBright,borderRadius:"50%",fontSize:8,color:"#fff",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{alertaCount}</span>}
              </button>

              {/* Panel notificaciones */}
              {notifOpen && (
                <div onClick={e=>e.stopPropagation()} style={{
                  position:"absolute",top:44,right:0,width:320,
                  background:B.white,borderRadius:14,
                  border:`1px solid ${B.gray}`,
                  boxShadow:B.shadowLg,zIndex:800,
                  animation:"fadeUp .18s ease",overflow:"hidden"
                }}>
                  {/* Header panel */}
                  <div style={{background:B.navy,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <div style={{fontSize:13,fontWeight:700,color:B.white}}>Centro de actividad</div>
                    <button onClick={()=>setNotifOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:16}}>✕</button>
                  </div>

                  {/* Tiempo de sesión */}
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${B.gray}`,background:B.goldDim}}>
                    <div style={{fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".7px",marginBottom:4}}>Sesión actual</div>
                    <div style={{fontSize:22,fontWeight:800,color:B.navy,lineHeight:1}}>
                      {Math.floor((Date.now()-sessionStart)/60000)} min
                    </div>
                    <div style={{fontSize:11,color:"#64748b",marginTop:2}}>desde que ingresaste hoy</div>
                  </div>

                  {/* Alertas de leads */}
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${B.gray}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".7px",marginBottom:8}}>Alertas de leads</div>
                    {alertaCount===0 && <div style={{fontSize:12,color:B.green,fontWeight:500}}>✓ Todo en orden</div>}
                    {leads.filter(l=>getAlertas(l).some(a=>a.tipo==="riesgo")).slice(0,3).map(l=>(
                      <div key={l.id} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                        <span style={{fontSize:10,animation:"pulse 1.4s infinite",color:B.redBright}}>●</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.nombre}</div>
                          <div style={{fontSize:10,color:B.redBright}}>⚠ Riesgo de pérdida</div>
                        </div>
                      </div>
                    ))}
                    {leads.filter(l=>getAlertas(l).some(a=>a.tipo==="sin_contacto")).slice(0,3).map(l=>(
                      <div key={l.id} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}>
                        <span style={{fontSize:10,color:B.amber}}>●</span>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,fontWeight:600,color:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.nombre}</div>
                          <div style={{fontSize:10,color:B.amber}}>{diasDesde(l.ultimoContacto)}d sin contacto</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Métricas de uso */}
                  <div style={{padding:"12px 16px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".7px",marginBottom:8}}>Tus patrones de uso</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
                      {[
                        {l:"Mejor día",v:"Martes",ic:"📅"},
                        {l:"Mejor horario",v:"10-12am",ic:"⏰"},
                        {l:"Hora + respuestas",v:"11am",ic:"💬"},
                        {l:"Leads activos",v:leads.filter(l=>!l.sinSeguimiento&&!["otro","cierre"].includes(l.etapa)).length,ic:"*"},
                      ].map((m,i)=>(
                        <div key={i} style={{background:B.cream,borderRadius:9,padding:"9px 11px"}}>
                          <div style={{fontSize:14,marginBottom:3}}>{m.ic}</div>
                          <div style={{fontSize:16,fontWeight:800,color:B.navy,lineHeight:1}}>{m.v}</div>
                          <div style={{fontSize:9,color:"#94a3b8",marginTop:2,textTransform:"uppercase",letterSpacing:".5px"}}>{m.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:10,fontSize:10,color:"#94a3b8",fontStyle:"italic",textAlign:"center"}}>
                      Las métricas detalladas se irán construyendo con el uso de la app
                    </div>
                  </div>

                  {/* Centro de actividad del equipo -- Admin ve sus asistentes, SA ve todos */}
                  {(esAdmin) && (()=>{
                    const miEquipo = usuario.rol==="superadmin"
                      ? cuentas.filter(c=>c.rol==="asistente")
                      : cuentas.filter(c=>c.rol==="asistente"&&c.adminId===usuario.id);
                    if(miEquipo.length===0) return null;
                    // Actividad: contar seguimientos registrados hoy por cada asistente
                    const actHoy = (uid)=>{
                      const all=allLeads[cuentas.find(c=>c.id===uid)?.adminId||uid]||leads;
                      return all.flatMap(l=>l.seguimientos||[]).filter(s=>s.autor&&s.fecha===hoy()).length;
                    };
                    return (
                      <div style={{padding:"12px 16px",borderTop:`1px solid ${B.gray}`}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".7px",marginBottom:8}}>
                          {usuario.rol==="superadmin"?"Actividad de todos los asistentes":"Actividad de tu equipo"}
                        </div>
                        {miEquipo.map(c=>{
                          const act = actHoy(c.id);
                          const adminNombre = cuentas.find(a=>a.id===c.adminId)?.nombre||"";
                          return (
                            <div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${B.gray}22`}}>
                              <Av name={c.nombre} size={28} color={B.purple}/>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{fontSize:12,fontWeight:700,color:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nombre}</div>
                                {usuario.rol==="superadmin"&&adminNombre&&<div style={{fontSize:9,color:"#94a3b8"}}>Admin: {adminNombre}</div>}
                              </div>
                              <div style={{textAlign:"right",flexShrink:0}}>
                                <div style={{fontSize:14,fontWeight:800,color:act>0?B.green:"#94a3b8"}}>{act}</div>
                                <div style={{fontSize:9,color:"#94a3b8"}}>hoy</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {alertaCount>0&&(
              <div style={{minWidth:20,height:20,padding:"0 5px",background:B.redBright,borderRadius:10,fontSize:9,color:"#fff",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{alertaCount}</div>
            )}
            <Av name={usuario.nombre} size={32} color={usuario.color||B.gold}/>
            <div className="mf-user-name">
              <div style={{fontSize:12,fontWeight:700,color:"#fff",lineHeight:1.2}}>{usuario.nombre}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",textTransform:"capitalize",letterSpacing:".3px"}}>{usuario.rol}</div>
            </div>
            <button onClick={()=>setUsuario(null)}
              style={{padding:"6px 12px",minHeight:34,borderRadius:8,border:"1px solid rgba(255,255,255,0.25)",background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.8)",fontFamily:"'Poppins',sans-serif",fontSize:11,cursor:"pointer",flexShrink:0,fontWeight:500,transition:"all .15s",WebkitTapHighlightColor:"transparent"}}>
              Salir
            </button>
          </div>
        </div>

        {/* Fila 2: Nav con scroll horizontal */}
        <div className="mf-header-row2">
          {NAV.map(n=>(
            <button key={n.id}
              className={`mf-nav-btn ${seccion===n.id?"active":"inactive"}`}
              onClick={()=>setSeccion(n.id)}>
              <span>{n.icon}</span>
              <span>{n.l}</span>
              {n.id==="dashboard"&&alertaCount>0&&(
                <span style={{position:"absolute",top:3,right:3,width:13,height:13,background:B.redBright,borderRadius:"50%",fontSize:7,color:"#fff",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{alertaCount}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Filtros pipeline */}
      {seccion==="pipeline"&&esAdmin&&(
        <div className="mf-pipeline-filters">
          {[{v:"todos",l:"Todos"},{v:"activos",l:"Activos"},...ETAPAS.map(et=>({v:et.id,l:`${et.icon} ${et.label}`,c:et.color}))].map(o=>(
            <button key={o.v} onClick={()=>setFiltroNav(o.v)}
              style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${filtroNav===o.v?(o.c||B.navy):B.gray}`,background:filtroNav===o.v?(o.c||B.navy)+"12":B.cream,color:filtroNav===o.v?(o.c||B.navy):"#6b7280",fontFamily:"Poppins",fontWeight:600,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
              {o.l}
            </button>
          ))}
        </div>
      )}

      {/* MAIN */}
      <main className="mf-main">
        {seccion==="dashboard"&&esAdmin&&<Dashboard leads={leads} setFiltroNav={setFiltroNav} setSeccion={setSeccion}/>}
        {seccion==="pipeline"&&esAdmin&&<Pipeline leads={leads} setLeads={setLeads} filtroNav={filtroNav} esAdmin={esAdmin} cuentas={cuentas} usuario={usuario}/>}
        {seccion==="lista"&&<ListaLeads leads={leads} setLeads={setLeads} cuentas={cuentas} usuario={usuario} esAsistente={esAsistente}/>}
        {seccion==="agenda"&&<Agenda eventos={eventos} setEventos={setEventos} leads={leads} esAsistente={esAsistente} usuario={usuario}/>}
        {seccion==="metricas"&&esAdmin&&<Metricas leads={leads}/>}
        {seccion==="mensajes"&&esAdmin&&<Mensajes/>}
        {seccion==="cobranza"&&esAdmin&&<Cobranza/>}
        {seccion==="usuarios"&&esAdmin&&<Usuarios usuario={usuario} cuentas={cuentas} setCuentas={cs=>{setCuentas(cs);LS.set("mf_cuentas",cs);}}/>}
      </main>

      <div style={{height:2,background:`linear-gradient(90deg,transparent,${B.gold}55,transparent)`,position:"fixed",bottom:0,left:0,right:0,pointerEvents:"none"}}/>
    </div>
  );
}

