import { useState, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";

const B = {
  navy:"#0A1F44", navyMid:"#122550",
  gold:"#C6A96B", goldDim:"#C6A96B16", goldBorder:"#C6A96B35",
  cream:"#F8F6F2", creamDark:"#F0EDE7",
  gray:"#E5E7EB", grayMid:"#D1D5DB",
  black:"#1A1A1A", white:"#FFFFFF",
  green:"#166534", greenLight:"#dcfce7", greenDim:"#16653412",
  red:"#991b1b", redLight:"#fef2f2", redDim:"#991b1b10", redBright:"#dc2626",
  amber:"#92400e", amberLight:"#fffbeb", amberDim:"#92400e12",
  blue:"#1e3a8a", blueDim:"#1e3a8a10",
  teal:"#134e4a", tealDim:"#134e4a10",
  purple:"#4c1d95", purpleDim:"#4c1d9510",
  shadow:"0 1px 4px rgba(10,31,68,.08),0 1px 2px rgba(10,31,68,.04)",
  shadowMd:"0 4px 20px rgba(10,31,68,.12)",
  shadowLg:"0 8px 40px rgba(10,31,68,.16)",
};

const SUPERADMIN_ID = "mariana_root";
const CUENTAS_INIT = [{id:SUPERADMIN_ID,nombre:"Mariana",usuario:"mariana",pass:"Mariana2024",rol:"superadmin",color:B.gold,adminId:null}];

const ETAPAS = [
  {id:"nuevo",        label:"Nuevo Lead",           color:"#475569", icon:"+",  sinSeg:false},
  {id:"cita",         label:"Cita agendada",         color:"#7c3aed", icon:"📅", sinSeg:false},
  {id:"asesorado",    label:"Asesorado",             color:"#b45309", icon:"📋", sinSeg:false},
  {id:"seguimiento",  label:"En seguimiento",        color:"#1e40af", icon:"⟳",  sinSeg:false},
  {id:"no_localiz",   label:"No localizable",        color:"#dc2626", icon:"📵", sinSeg:false},
  {id:"cierre",       label:"¡Cierre! ⭐",           color:"#166534", icon:"⭐", sinSeg:false},
  {id:"otro",         label:"Sin interés",           color:"#dc2626", icon:"🚫", sinSeg:true},
];

const PRODUCTOS_LEAD = ["Vida","GMM","Auto","Hogar","Patrimonial","Ahorro","Educación","Otro"];
const PRODUCTOS_COB  = ["GMMI","PLU3","EDU","Auto","Vida","Hogar","Otro"];
const ESTADOS_MX = ["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas","Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_L = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

const TIPO_EVENTO = [
  {id:"trabajo",    label:"Trabajo",       color:"#1e40af", privado:false, soloAdmin:false, subtipos:["curso_allianz","junta_camara","junta"]},
  {id:"cita",       label:"Cita cliente",  color:"#065f46", privado:false, soloAdmin:false, subtipos:["info1","seguimiento","cierre","presencial"]},
  {id:"viaje",      label:"Viaje ✈️",      color:"#7c3aed", privado:false, soloAdmin:true,  subtipos:[]},
  {id:"personal",   label:"Personal 🔒",   color:"#9ca3af", privado:true,  soloAdmin:true,  subtipos:[]},
];
const SUBTIPO_LABEL = {
  curso_allianz: "Curso Allianz", junta_camara: "Junta cámara prendida", junta: "Junta",
  info1: "1ra información", seguimiento: "Seguimiento", cierre: "Cierre", presencial: "Presencial 🤝",
};
const REPETICION = [{v:"none",l:"No se repite"},{v:"weekly",l:"Semanalmente"},{v:"monthly",l:"Mensualmente"},{v:"yearly",l:"Anualmente"}];

const CHECKLIST_DEF = [
  {key:"wa1",      label:"WhatsApp 1ra vez",  icon:"💬"},
  {key:"wa2",      label:"WhatsApp 2da vez",  icon:"💬"},
  {key:"call1",    label:"Llamada 1ra vez",   icon:"📞"},
  {key:"call2",    label:"Llamada 2da vez",   icon:"📞"},
  {key:"email",    label:"Correo enviado",    icon:"📧"},
  {key:"sigues",   label:"Desea seguimiento", icon:"✅"},
  {key:"noInteres",label:"Sin seguimiento",   icon:"🚫"},
];
const EMPTY_CHECK = {wa1:false,wa2:false,call1:false,call2:false,email:false,sigues:false,noInteres:false};

const MENSAJES_TPL = {
  primer_contacto:[
    {titulo:"Presentación cálida",body:"Hola buen día *[Nombre]*!, soy [Tu nombre] *asesora directa* en *Allianz México*.\n\n  Me comunico contigo, ya que solicitaste información acerca de [Producto] mediante nuestra página oficial🙏"},
    {titulo:"Por referencia",body:"Hola [Nombre], me contacto de parte de [Referido].\n\n¿Cuándo sería un buen momento para platicar sin compromiso?"},
  ],
  seguimiento:[
    {titulo:"Recordatorio amable",body:"Hola [Nombre] 😊, quería retomar nuestra conversación sobre [Producto].\n\nTe preparé una propuesta puntual. ¿La revisamos esta semana?"},
    {titulo:"Post-cotización",body:"Hola [Nombre], ¿tuviste oportunidad de revisar la cotización?\n\nCualquier ajuste, con gusto lo atendemos. ¿Cómo te quedó?"},
  ],
  cierre:[
    {titulo:"Urgencia natural",body:"Hola [Nombre], la propuesta tiene vigencia hasta [fecha]. Si avanzamos hoy, gestiono todo de inmediato 🙌"},
    {titulo:"Cierre suave",body:"Hola [Nombre], ¿qué necesitas de mi parte para que podamos avanzar juntos?"},
  ],
  reactivacion:[
    {titulo:"Reactivación estratégica",body:"Hola [Nombre], hace un tiempo platicamos sobre [Producto].\n\nLas condiciones han mejorado y quería compartirte algo que creo te va a interesar. ¿Hablamos?"},
  ],
};

// Genera UUIDs v4 válidos (formato xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
// Requerido por las tablas de Supabase donde `id` es de tipo uuid.
const uid = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
const hoy = () => new Date().toISOString().split("T")[0];
const diasDesde = f => f ? Math.floor((Date.now()-new Date(f).getTime())/86400000) : 999;
const fmtF = f => { if(!f) return "--"; const [y,m,d]=f.split("-"); return `${d}/${m}/${y}`; };
const initials = n => (n||"").trim().split(/\s+/).slice(0,2).map(w=>w[0]||"").join("").toUpperCase();
const getDias = (y,m) => new Date(y,m+1,0).getDate();
const getPrimerDia = (y,m) => { const d=new Date(y,m,1).getDay(); return d===0?6:d-1; };

function getTempLead(lead) {
  if(lead.sinSeguimiento) return null;
  const dias = diasDesde(lead.ultimoContacto);
  const chk = lead.checklist||{};
  const interact = [chk.wa1,chk.wa2,chk.call1,chk.call2,chk.email].filter(Boolean).length;
  const etapasCalientes = ["cita","seguimiento","cierre"];
  if(dias<=2 && (interact>=2 || etapasCalientes.includes(lead.etapa))) return {nivel:"caliente",icon:"🔥",color:"#dc2626",label:"Caliente"};
  if(dias<=7 && interact>=1) return {nivel:"tibio",icon:"🟡",color:"#d97706",label:"Tibio"};
  return {nivel:"frio",icon:"❄️",color:"#3b82f6",label:"Frío"};
}

function getAlertas(lead) {
  if(lead.sinSeguimiento) return [];
  const dias = diasDesde(lead.ultimoContacto);
  const a = [];
  if(!["otro","cierre"].includes(lead.etapa)) {
    if(dias>=15) a.push({tipo:"reactivar", msg:`♻️ ${dias}d -- Reactivar`, color:B.purple});
    else if(dias>=2) a.push({tipo:"sin_contacto", msg:`${dias}d sin contacto`, color:B.amber});
  }
  if(lead.etapa==="seguimiento" && dias>=5) a.push({tipo:"riesgo", msg:"⚠ Riesgo de pérdida", color:B.redBright});
  if(lead.etapa==="cita" && dias>=1) a.push({tipo:"cot", msg:"💡 Confirmar cita", color:B.blue});
  return a;
}

const LS = {
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};

const mkDemo = () => [
  {id:uid(),nombre:"Fernanda Reyes",telefono:"3312345678",correo:"fernanda@email.com",edad:"38",producto:"Vida",estado:"Jalisco",etapa:"cita",ultimoContacto:new Date(Date.now()-3*86400000).toISOString().split("T")[0],notas:"Familia con 2 hijos. Muy interesada.",objeciones:"El precio le parece alto",intereses:"Proteger a sus hijos",motivador:"Seguridad familiar",checklist:{...EMPTY_CHECK,wa1:true,call1:true,email:true},seguimientos:[{id:uid(),fecha:hoy(),texto:"Llamada muy positiva, pide cotización",tipo:"llamada",autor:"Mariana",rol:"superadmin"}],sinSeguimiento:false,asignadoA:null,mesCreacion:hoy().slice(0,7)},
  {id:uid(),nombre:"Roberto Mendoza",telefono:"5598765432",correo:"roberto@email.com",edad:"45",producto:"GMM",estado:"Ciudad de México",etapa:"seguimiento",ultimoContacto:new Date(Date.now()-6*86400000).toISOString().split("T")[0],notas:"Comparando con otra aseguradora",objeciones:"Ya tiene otro seguro",intereses:"Mejor cobertura",motivador:"Salud familiar",checklist:{...EMPTY_CHECK,wa1:true,wa2:true,call1:true,sigues:true},seguimientos:[{id:uid(),fecha:hoy(),texto:"Etapa: Nuevo Lead → En seguimiento",tipo:"nota",autor:"Mariana",rol:"superadmin",_auto:true}],sinSeguimiento:false,asignadoA:null,mesCreacion:hoy().slice(0,7)},
  {id:uid(),nombre:"Sofía Villanueva",telefono:"8112223344",correo:"sofia@email.com",edad:"31",producto:"Patrimonial",estado:"Nuevo León",etapa:"asesorado",ultimoContacto:new Date(Date.now()-1*86400000).toISOString().split("T")[0],notas:"Referida por Carlos R.",objeciones:"",intereses:"Inversión a largo plazo",motivador:"Patrimonio para sus hijos",checklist:{...EMPTY_CHECK,wa1:true,sigues:true},seguimientos:[{id:uid(),fecha:hoy(),texto:"Etapa: Nuevo Lead → Asesorado",tipo:"nota",autor:"Mariana",rol:"superadmin",_auto:true}],sinSeguimiento:false,asignadoA:null,mesCreacion:hoy().slice(0,7)},
  {id:uid(),nombre:"Daniela Castro",telefono:"4421234567",correo:"daniela@email.com",edad:"29",producto:"Auto",estado:"Querétaro",etapa:"cierre",ultimoContacto:hoy(),notas:"Lista para firmar ✅",objeciones:"",intereses:"Seguro completo",motivador:"Auto nuevo",checklist:{...EMPTY_CHECK,wa1:true,wa2:true,call1:true,call2:true,email:true,sigues:true},seguimientos:[{id:uid(),fecha:hoy(),texto:"Etapa: En seguimiento → ¡Cierre! ⭐",tipo:"nota",autor:"Mariana",rol:"superadmin",_auto:true}],sinSeguimiento:false,asignadoA:null,mesCreacion:hoy().slice(0,7)},
  {id:uid(),nombre:"Pedro Sánchez",telefono:"6641234567",correo:"pedro@email.com",edad:"40",producto:"Hogar",estado:"Baja California",etapa:"otro",ultimoContacto:new Date(Date.now()-18*86400000).toISOString().split("T")[0],notas:"Sin presupuesto",objeciones:"Sin presupuesto",intereses:"",motivador:"",checklist:{...EMPTY_CHECK,wa1:true,wa2:true,noInteres:true},seguimientos:[],sinSeguimiento:true,asignadoA:null,mesCreacion:hoy().slice(0,7)},
];

/* ===========================================
   CSS BASE — con animaciones de estrella
=========================================== */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{width:100%;max-width:100vw;overflow-x:hidden;overflow-y:auto;-webkit-text-size-adjust:100%;text-size-adjust:100%;scroll-behavior:smooth;height:-webkit-fill-available;}
body{font-family:'Poppins',sans-serif;background:#F8F6F2;color:#1A1A1A;width:100%;max-width:100vw;min-height:100vh;min-height:-webkit-fill-available;overflow-x:hidden;overflow-y:auto;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;overscroll-behavior-y:contain;}
::-webkit-scrollbar{width:3px;height:3px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:2px;}
input,select,textarea{font-family:'Poppins',sans-serif;font-size:16px;max-width:100%;-webkit-appearance:none;appearance:none;}
select{font-size:14px;}
input[type=date]{font-size:14px;}
input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.35);}
input[type=number]{font-size:14px;}
textarea{resize:vertical;font-size:14px;}
img,video,svg{max-width:100%;height:auto;}
*:focus-visible{outline:2px solid #C6A96B;outline-offset:2px;border-radius:4px;}
button,a,[role=button]{-webkit-tap-highlight-color:transparent;touch-action:manipulation;user-select:none;-webkit-user-select:none;}
button{min-height:36px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes spin{to{transform:rotate(360deg)}}
.scroll-x{overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;}
.scroll-x::-webkit-scrollbar{display:none;}

/* =============================================
   ANIMACIONES ESTRELLA CIERRES
============================================= */
@keyframes starPulse{
  0%,100%{filter:drop-shadow(0 0 6px #C6A96B88);transform:scale(1);}
  50%{filter:drop-shadow(0 0 18px #C6A96Bcc) drop-shadow(0 0 32px #ffe08a66);transform:scale(1.07);}
}
@keyframes starBurst{
  0%{transform:scale(1) rotate(0deg);filter:drop-shadow(0 0 6px #C6A96B88);}
  25%{transform:scale(1.3) rotate(10deg);filter:drop-shadow(0 0 28px #ffe08aee) drop-shadow(0 0 48px #C6A96Bcc);}
  55%{transform:scale(1.18) rotate(-6deg);filter:drop-shadow(0 0 20px #C6A96Bcc);}
  80%{transform:scale(1.05) rotate(3deg);}
  100%{transform:scale(1) rotate(0deg);filter:drop-shadow(0 0 6px #C6A96B88);}
}
.mf-star-idle{animation:starPulse 2.8s ease-in-out infinite;}
.mf-star-burst{animation:starBurst .6s cubic-bezier(.36,.07,.19,.97) forwards;}

html, body, #root {
  height: auto !important;
  min-height: 100% !important;
  overflow: visible !important;
}
.mf-app {
  height: auto !important;
  min-height: 100vh !important;
  overflow: visible !important;
}
.mf-main {
  height: auto !important;
  min-height: auto !important;
  overflow-y: visible !important;
  padding-bottom: 140px !important;
}
`;

function MarflowLogo({ height = 40, dark = true }) {
  const gold  = "#C6A96B";
  const white = "#FFFFFF";
  const navy  = "#0A1F44";
  const textMain = dark ? white : navy;
  return (
    <svg width={Math.round(height * 4.2)} height={height} viewBox="0 0 210 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 36 C18 24 30 40 44 32 C58 24 70 38 84 30" stroke={gold} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.55"/>
      <path d="M8 28 C18 16 30 32 44 24 C58 16 70 28 84 20" stroke={gold} strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M76 20 C80 14 86 16 90 13" stroke={gold} strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85"/>
      <circle cx="91" cy="10" r="4.5" fill={gold} />
      <text x="102" y="35" fontFamily="'Poppins', Arial, sans-serif" fontWeight="700" fontSize="26" letterSpacing="-0.5" fill={textMain}>MAR</text>
      <text x="152" y="35" fontFamily="'Poppins', Arial, sans-serif" fontWeight="700" fontSize="26" letterSpacing="-0.5" fill={gold}>FLOW</text>
    </svg>
  );
}

const GD = () => <div style={{height:1,background:`linear-gradient(90deg,transparent,${B.gold}55,transparent)`,margin:"14px 0"}}/>;

const Tag = ({color,children,small}) =>
  <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:small?"1px 9px":"3px 11px",borderRadius:20,fontSize:small?10:11,fontWeight:600,background:color+"14",color,border:`1px solid ${color}25`,whiteSpace:"nowrap"}}>{children}</span>;

function ConfirmModal({titulo,mensaje,icono="⚠️",onConfirm,onCancel,textoConfirm="Sí, eliminar",colorConfirm=B.redBright}) {
  return (
    <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(10,31,68,.55)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:B.white,borderRadius:16,padding:32,maxWidth:360,width:"100%",boxShadow:B.shadowLg,animation:"fadeUp .2s ease",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:12}}>{icono}</div>
        <div style={{fontSize:18,fontWeight:800,color:B.navy,marginBottom:8}}>{titulo}</div>
        {mensaje&&<div style={{fontSize:14,color:"#64748b",lineHeight:1.6,marginBottom:24}}>{mensaje}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={onCancel} style={{flex:1,padding:"11px 20px",borderRadius:10,border:`1.5px solid ${B.gray}`,background:B.white,color:"#64748b",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:13,cursor:"pointer"}}>Cancelar</button>
          <button onClick={()=>{onConfirm();}} style={{flex:1,padding:"11px 20px",borderRadius:10,border:"none",background:colorConfirm,color:"#fff",fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:`0 4px 14px ${colorConfirm}44`}}>{textoConfirm}</button>
        </div>
      </div>
    </div>
  );
}

function Av({name,size=34,color=B.gold}) {
  return <div style={{width:size,height:size,borderRadius:"50%",background:color+"18",border:`1.5px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.34,fontWeight:700,color,flexShrink:0}}>{initials(name)}</div>;
}

function Btn({onClick,children,color,bg,full,small,outline,disabled,style:sx={}}) {
  const c=color||B.gold;
  const bk=disabled?"#e5e7eb":outline?c+"0d":(bg||c);
  return <button onClick={onClick} disabled={disabled}
    style={{padding:small?"7px 14px":"10px 20px",minHeight:small?36:44,borderRadius:8,border:outline?`1px solid ${c}40`:"none",background:bk,color:disabled?"#9ca3af":outline?c:"#fff",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:small?12:14,cursor:disabled?"not-allowed":"pointer",transition:"all .15s",width:full?"100%":"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,WebkitTapHighlightColor:"transparent",touchAction:"manipulation",...sx}}>
    {children}
  </button>;
}

function Inp({value,onChange,type="text",placeholder,maxLength,onKeyDown,rows}) {
  const s={padding:"11px 13px",borderRadius:8,border:`1.5px solid ${B.gray}`,background:B.white,color:B.black,fontFamily:"'Poppins',sans-serif",fontSize:16,outline:"none",width:"100%",transition:"border-color .15s",minHeight:44,WebkitAppearance:"none"};
  const ev={onFocus:e=>e.target.style.borderColor=B.gold,onBlur:e=>e.target.style.borderColor=B.gray};
  return rows
    ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...s,resize:"vertical",minHeight:"auto"}} {...ev}/>
    : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} onKeyDown={onKeyDown} style={s} {...ev}/>;
}

function Sel({value,onChange,options}) {
  return <select value={value} onChange={e=>onChange(e.target.value)}
    style={{padding:"11px 13px",borderRadius:8,border:`1.5px solid ${B.gray}`,background:B.white,color:B.black,fontFamily:"'Poppins',sans-serif",fontSize:16,outline:"none",width:"100%",minHeight:44,WebkitAppearance:"none",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",paddingRight:36}}>
    {options.map(o=><option key={o.v||o} value={o.v||o}>{o.l||o}</option>)}
  </select>;
}

function FL({label,children,span2}) {
  return <div style={{display:"flex",flexDirection:"column",gap:5,gridColumn:span2?"1/-1":"auto"}}>
    {label&&<label style={{fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:".7px"}}>{label}</label>}
    {children}
  </div>;
}

function MFModal({onClose,children,width=520}) {
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"rgba(10,31,68,.5)",zIndex:900,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <style>{`@media(min-width:520px){.mf-modal-sheet{align-self:center!important;border-radius:16px!important;margin:16px;max-height:90vh!important;}}`}</style>
      <div className="mf-modal-sheet" style={{background:B.white,borderRadius:"20px 20px 0 0",padding:"24px 16px 32px",paddingBottom:"max(32px, calc(32px + env(safe-area-inset-bottom)))",width:"100%",maxWidth:width,maxHeight:"92vh",overflowY:"auto",WebkitOverflowScrolling:"touch",boxShadow:B.shadowLg,animation:"fadeUp .22s ease",border:`1px solid ${B.gray}`,borderBottom:"none",alignSelf:"flex-end"}}>
        <div style={{width:36,height:4,borderRadius:2,background:"#d1d5db",margin:"0 auto 20px"}}/>
        {children}
      </div>
    </div>
  );
}

function MHead({title,sub,onClose}) {
  return <div style={{marginBottom:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div>
        <div style={{fontSize:18,fontWeight:700,color:B.navy}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:"#6b7280",marginTop:3}}>{sub}</div>}
      </div>
      <button onClick={onClose} style={{background:"none",border:"none",color:"#9ca3af",cursor:"pointer",fontSize:20,lineHeight:1,padding:2,marginLeft:12}}>✕</button>
    </div>
    <GD/>
  </div>;
}

function HoraSelect({value,onChange}) {
  const opts=[];
  for(let h=6;h<=22;h++) for(let m=0;m<60;m+=15) opts.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
  return <Sel value={value} onChange={onChange} options={[{v:"",l:"Sin hora"},...opts.map(o=>({v:o,l:o}))]}/>;
}

function ContactoModal({lead,onClose}) {
  const tel=(lead.telefono||"").replace(/\D/g,"");
  const row=(href,icon,title,sub,bg,border,tc)=>(
    <a href={href} target={href.startsWith("tel")?"_self":"_blank"} rel="noreferrer" onClick={onClose}
      style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderRadius:12,background:bg,border:`1px solid ${border}`,textDecoration:"none"}}>
      <div style={{width:40,height:40,borderRadius:"50%",background:tc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{icon}</div>
      <div><div style={{fontSize:13,fontWeight:700,color:B.navy}}>{title}</div><div style={{fontSize:11,color:"#6b7280"}}>{sub}</div></div>
    </a>
  );
  return <MFModal onClose={onClose} width={340}>
    <MHead title="Contactar" sub={lead.nombre} onClose={onClose}/>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {row(`tel:${tel}`,"📞","Llamar",lead.telefono,B.blueDim,B.blue+"20",B.blue)}
      {row(`https://wa.me/52${tel}`,"💬","WhatsApp","Abrir conversación","#f0fdf4","#bbf7d0","#25d366")}
      {row(`https://api.whatsapp.com/send?phone=52${tel}`,"💼","WhatsApp Business","Abrir en WA Business","#f0fdf4","#86efac","#128C7E")}
    </div>
  </MFModal>;
}

function WolfMark({size=120, opacity=1}) {
  return (
    <svg width={size} height={size} viewBox="0 0 0 0" fill="none" style={{opacity}}>
      <path d="M76 72 Q100 60 96 40 Q92 30 86 36" stroke={B.gold} strokeWidth="3" fill="none" opacity="0.45" strokeLinecap="round"/>
    </svg>
  );
}

function Auth({onLogin, mensajeInicial}) {
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [nombre,setNombre]=useState("");
  const [err,setErr]=useState("");
  const [info,setInfo]=useState(mensajeInicial||"");
  const [loading,setLoading]=useState(false);
  const [modo,setModo]=useState("login"); // 'login' | 'signup' | 'forgot'
  const [verPass,setVerPass]=useState(false);

  async function login(){
    if(loading) return;
    setErr(""); setInfo(""); setLoading(true);
    try {
      // Modo: olvidé contraseña
      if (modo === "forgot") {
        if (!email.trim()) { setErr("Escribe tu email"); setLoading(false); return; }
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin
        });
        if (error) { setErr(error.message); setLoading(false); return; }
        setInfo("Te enviamos un correo con instrucciones para crear una nueva contraseña. Revisa tu bandeja (y también spam por si acaso).");
        setLoading(false);
        return;
      }
      // Modo: signup
      if (modo === "signup") {
        if (!nombre.trim()) { setErr("Escribe tu nombre"); setLoading(false); return; }
        if (pass.length < 8) { setErr("La contraseña debe tener al menos 8 caracteres"); setLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: { data: { nombre: nombre.trim(), rol: "admin" } }
        });
        if (error) { setErr(error.message); setLoading(false); return; }
        if (!data.session) {
          setInfo("Te enviamos un correo para confirmar tu cuenta. Revisa tu bandeja de entrada.");
          setLoading(false); return;
        }
        await cargarPerfilYContinuar(data.session.user.id);
        return;
      }
      // Modo: login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass
      });
      if (error) { setErr("Email o contraseña incorrectos"); setLoading(false); return; }
      await cargarPerfilYContinuar(data.user.id);
    } catch (e) {
      setErr("Error inesperado: " + (e.message || e));
      setLoading(false);
    }
  }

  function cambiarModo(nuevo){
    setModo(nuevo); setErr(""); setInfo(""); setPass(""); setNombre("");
  }

  async function cargarPerfilYContinuar(userId) {
    let { data: perfil, error } = await supabase
      .from("cuentas").select("*").eq("id", userId).maybeSingle();
    if (error) {
      setErr("Error al cargar perfil: " + error.message);
      setLoading(false); return;
    }
    // Auto-create si el trigger no se ejecutó
    if (!perfil) {
      const { data: userData } = await supabase.auth.getUser();
      const meta = userData?.user?.user_metadata || {};
      const emailUser = userData?.user?.email || "";
      const prefijo = emailUser.split("@")[0] || "usuario";
      const { data: nuevoPerfil, error: insertError } = await supabase
        .from("cuentas")
        .insert({
          id: userId,
          nombre: meta.nombre || nombre.trim() || prefijo,
          usuario: prefijo + "_" + userId.substring(0, 4),
          rol: meta.rol || "admin",
        })
        .select().single();
      if (insertError) {
        setErr("No pudimos crear tu perfil: " + insertError.message);
        setLoading(false); return;
      }
      perfil = nuevoPerfil;
    }
    const cuentaAdaptada = {
      id: perfil.id, nombre: perfil.nombre, usuario: perfil.usuario,
      rol: perfil.rol, color: perfil.color, adminId: perfil.admin_id,
    };
    onLogin(cuentaAdaptada);
  }

  const AUTH_CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Cormorant+Garamond:wght@400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    .mf-input{width:100%;padding:14px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(198,169,107,0.2);border-radius:10px;color:#f0ece4;font-family:'Poppins',sans-serif;font-size:14px;outline:none;transition:border-color .2s,background .2s,box-shadow .2s;-webkit-appearance:none;}
    .mf-input::placeholder{color:rgba(255,255,255,0.25);}
    .mf-input:focus{border-color:rgba(198,169,107,0.7);background:rgba(255,255,255,0.07);box-shadow:0 0 0 3px rgba(198,169,107,0.1);}
    .mf-btn-gold{width:100%;padding:15px;background:linear-gradient(135deg,#C6A96B 0%,#d4bc89 50%,#b8960e 100%);border:none;border-radius:10px;color:#0A1F44;font-family:'Poppins',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;}
    .mf-btn-gold:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(198,169,107,.45);}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @media(min-width:900px){.mf-brand-panel{display:flex-direction:column!important;}.mf-desktop-layout{flex-direction:row!important;}}
  `;

  return (
    <div style={{minHeight:"100vh",background:"#060e1c",display:"flex",flexDirection:"row-reverse",fontFamily:"'Poppins',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{AUTH_CSS}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:-200,left:-200,width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(198,169,107,0.07) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:-150,right:-100,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(10,31,68,0.8) 0%,transparent 70%)"}}/>
        <svg style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.03}} xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#C6A96B" strokeWidth="0.5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>
      <div className="mf-desktop-layout" style={{flex:1,display:"flex",flexDirection:"row",position:"relative",zIndex:1,minHeight:"100vh"}}>
        <div className="mf-brand-panel" style={{display:"flex",flex:"0 0 52%",flexDirection:"row-reverse",justifyContent:"space-between",padding:"52px 56px",background:"linear-gradient(145deg,#0A1F44 0%,#071428 60%,#020a18 100%)",borderRight:"1px solid rgba(198,169,107,0.1)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",right:-20,bottom:60,opacity:.04,transform:"scale(2.2) rotate(-5deg)",transformOrigin:"right bottom"}}><WolfMark size={260}/></div>
          <svg style={{position:"absolute",bottom:0,left:0,right:0,opacity:.12}} viewBox="0 0 600 100" preserveAspectRatio="none" height="100">
            <path d="M0 60 Q75 20 150 50 Q225 80 300 40 Q375 0 450 35 Q525 70 600 30 L600 100 L0 100Z" fill="#C6A96B"/>
          </svg>
          <div style={{animation:"fadeIn .8s ease"}}>
            <div style={{marginBottom:20}}>
              <div style={{fontSize:14,color:"rgba(240,236,228,0.5)",lineHeight:1.75,fontWeight:300,maxWidth:340}}>La plataforma inteligente que convierte seguimiento en resultados. Diseñada para asesores de alto rendimiento que operan con precisión y cierran con consistencia.</div>
            </div>
          </div>
          <div style={{animation:"fadeUp .9s ease",animationDelay:".2s",animationFillMode:"both"}}>
            <div style={{display:"grid",gap:20}}>
              {[{icon:"*",t:"Mensajes y llamadas en un clic",d:"Segmenta y acciona con facilidad."},{icon:"📅",t:"Optimiza tus dias",d:"Trabajo, vida personal y viajes en una sola agenda inteligente"},{icon:"📊",t:"Decisiones en tiempo real",d:"Métricas claras para actuar sin adivinar"},{icon:"💰",t:"Ingresos protegidos",d:"Cobranza y renovaciones bajo control, sin fugas"}].map((f,i)=>(
                <div key={f.t} style={{padding:"16px",borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(198,169,107,0.1)"}}>
                  <div style={{fontSize:20,marginBottom:8}}>{f.icon}</div>
                  <div style={{fontSize:12,fontWeight:600,color:"#f0ece4",marginBottom:3}}>{f.t}</div>
                  <div style={{fontSize:11,color:"rgba(240,236,228,0.4)",lineHeight:1.5,fontWeight:300}}>{f.d}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:50,paddingTop:30,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontSize:10,color:"rgba(198,169,107,0.5)",letterSpacing:2,textTransform:"uppercase"}}>© 2025 MarFlow · Todos los derechos reservados</div>
            </div>
          </div>
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"32px 24px",background:"#060e1c",minHeight:"100vh",position:"relative"}}>
          <div style={{width:"100%",maxWidth:380,animation:"fadeUp .5s ease",animationDelay:".1s",animationFillMode:"both",marginTop:40}}>
            <div style={{textAlign:"center",marginBottom:14}}>
              <img src="/LOGOT.png" alt="MARFLOW" style={{height:180,objectFit:"contain",marginBottom:24,filter:"drop-shadow(0 8px 24px rgba(198,169,107,0.45))"}}/>
              <div style={{fontFamily:"Cormorant Garamond, serif",fontSize:30,fontWeight:600}}>
                {modo==="forgot"?"Recuperar contraseña":modo==="signup"?"Crear cuenta":"Bienvenido"}
              </div>
              <div style={{fontSize:13,color:"rgba(240,236,228,0.4)",fontWeight:300,letterSpacing:0.2}}>
                {modo==="forgot"?"Te enviaremos un link a tu correo":"Acceso exclusivo · Plataforma privada"}
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:6}}>
              {modo==="signup"&&(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <label style={{fontSize:10,fontWeight:600,color:"rgba(198,169,107,0.8)",textTransform:"uppercase",letterSpacing:"1px"}}>Nombre completo</label>
                  <input className="mf-input" value={nombre} onChange={e=>setNombre(e.target.value)} placeholder="Tu nombre" onKeyDown={e=>e.key==="Enter"&&login()} autoCapitalize="words"/>
                </div>
              )}
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                <label style={{fontSize:10,fontWeight:600,color:"rgba(198,169,107,0.8)",textTransform:"uppercase",letterSpacing:"1px"}}>Email</label>
                <input className="mf-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@email.com" onKeyDown={e=>e.key==="Enter"&&login()} autoCapitalize="none" autoCorrect="off" spellCheck={false}/>
              </div>
              {modo!=="forgot"&&(
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <label style={{fontSize:10,fontWeight:600,color:"rgba(198,169,107,0.8)",textTransform:"uppercase",letterSpacing:"1px"}}>Contraseña {modo==="signup"&&<span style={{color:"rgba(240,236,228,0.35)",fontWeight:400,textTransform:"none",letterSpacing:0}}>(mín. 8 caracteres)</span>}</label>
                    {modo==="login"&&(
                      <button type="button" onClick={()=>cambiarModo("forgot")} style={{background:"none",border:"none",color:"rgba(198,169,107,0.7)",fontFamily:"'Poppins',sans-serif",fontSize:10,fontWeight:600,cursor:"pointer",textTransform:"uppercase",letterSpacing:".5px",padding:0,textDecoration:"underline"}}>
                        ¿Olvidaste tu contraseña?
                      </button>
                    )}
                  </div>
                  <div style={{position:"relative"}}>
                    <input className="mf-input" type={verPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&login()} style={{paddingRight:46}}/>
                    <button type="button" onClick={()=>setVerPass(v=>!v)} aria-label={verPass?"Ocultar contraseña":"Mostrar contraseña"} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",cursor:"pointer",padding:"6px 8px",borderRadius:6,color:"rgba(240,236,228,0.5)",fontSize:18,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {verPass?"🙈":"👁️"}
                    </button>
                  </div>
                </div>
              )}
              {err&&(<div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:8,background:"rgba(220,38,38,0.12)",border:"1px solid rgba(220,38,38,0.25)"}}><span style={{fontSize:14}}>⚠</span><span style={{fontSize:12,color:"#fca5a5",fontWeight:500}}>{err}</span></div>)}
              {info&&(<div style={{display:"flex",alignItems:"flex-start",gap:8,padding:"10px 14px",borderRadius:8,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.25)"}}><span style={{fontSize:14}}>✓</span><span style={{fontSize:12,color:"#86efac",fontWeight:500,lineHeight:1.5}}>{info}</span></div>)}
              <button className="mf-btn-gold" onClick={login} disabled={loading} style={{marginTop:8,opacity:loading?.7:1}}>
                {loading
                  ? (<span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><span style={{display:"inline-block",width:14,height:14,border:"2px solid rgba(10,31,68,0.4)",borderTopColor:"#0A1F44",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>{modo==="signup"?"Creando cuenta...":modo==="forgot"?"Enviando...":"Verificando..."}</span>)
                  : (modo==="signup"?"Crear cuenta →":modo==="forgot"?"Enviar instrucciones →":"Ingresar →")}
              </button>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:12,margin:"24px 0"}}>
              <div style={{flex:1,height:1,background:"rgba(198,169,107,0.12)"}}/>
              <div style={{fontSize:10,color:"rgba(198,169,107,0.35)",letterSpacing:2,textTransform:"uppercase"}}>
                {modo==="signup"?"o si ya tienes cuenta":modo==="forgot"?"o regresa al inicio":"o crea una cuenta"}
              </div>
              <div style={{flex:1,height:1,background:"rgba(198,169,107,0.12)"}}/>
            </div>
            <button onClick={()=>cambiarModo(modo==="login"?"signup":"login")} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid rgba(198,169,107,0.3)",borderRadius:10,color:"rgba(240,236,228,0.7)",fontFamily:"'Poppins',sans-serif",fontSize:13,fontWeight:500,cursor:"pointer",transition:"all .15s"}}>
              {modo==="signup"?"Ya tengo cuenta · Iniciar sesión":modo==="forgot"?"Volver al inicio de sesión":"Soy nuevo · Crear cuenta"}
            </button>
            <div style={{marginTop:32,textAlign:"center"}}><div style={{fontSize:10,color:"rgba(198,169,107,0.25)",letterSpacing:2,textTransform:"uppercase"}}>© 2025 MarFlow</div></div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}


/* ═══════════════════════════════════════════
   RECOVERY PASSWORD — pantalla para crear nueva contraseña
   tras hacer clic en el link del correo de recuperación
═══════════════════════════════════════════ */
function RecoveryPassword({onSuccess, onCancel}) {
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [verPass, setVerPass] = useState(false);
  const [verPass2, setVerPass2] = useState(false);

  async function guardar() {
    if (loading) return;
    setErr("");
    if (pass.length < 8) { setErr("La contraseña debe tener al menos 8 caracteres"); return; }
    if (pass !== pass2) { setErr("Las contraseñas no coinciden"); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pass });
      if (error) { setErr(error.message || "No se pudo actualizar la contraseña"); setLoading(false); return; }
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      await supabase.auth.signOut();
      onSuccess();
    } catch (e) {
      setErr("Error inesperado: " + (e.message || e));
      setLoading(false);
    }
  }

  const CSS = `
    .mfr-input{width:100%;padding:14px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(198,169,107,0.2);border-radius:10px;color:#f0ece4;font-family:'Poppins',sans-serif;font-size:14px;outline:none;transition:border-color .2s,background .2s,box-shadow .2s;-webkit-appearance:none;}
    .mfr-input::placeholder{color:rgba(255,255,255,0.25);}
    .mfr-input:focus{border-color:rgba(198,169,107,0.7);background:rgba(255,255,255,0.07);box-shadow:0 0 0 3px rgba(198,169,107,0.1);}
    .mfr-btn{width:100%;padding:15px;background:linear-gradient(135deg,#C6A96B 0%,#d4bc89 50%,#b8960e 100%);border:none;border-radius:10px;color:#0A1F44;font-family:'Poppins',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;}
    .mfr-btn:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(198,169,107,.45);}
    .mfr-btn-secondary{width:100%;padding:12px;background:transparent;border:1px solid rgba(198,169,107,0.3);border-radius:10px;color:rgba(240,236,228,0.7);font-family:'Poppins',sans-serif;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;}
    @keyframes spin{to{transform:rotate(360deg)}}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  `;

  return (
    <div style={{minHeight:"100vh",background:"#060e1c",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"'Poppins',sans-serif",position:"relative",overflow:"hidden"}}>
      <style>{CSS}</style>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:-200,left:-200,width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(198,169,107,0.07) 0%,transparent 70%)"}}/>
        <div style={{position:"absolute",bottom:-150,right:-100,width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(10,31,68,0.8) 0%,transparent 70%)"}}/>
      </div>
      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1,animation:"fadeUp .5s ease"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:44,marginBottom:12}}>🔐</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:600,color:"#f0ece4",marginBottom:8}}>Nueva contraseña</div>
          <div style={{fontSize:13,color:"rgba(240,236,228,0.5)",fontWeight:300}}>Escribe tu nueva contraseña y confírmala</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:18}}>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:10,fontWeight:600,color:"rgba(198,169,107,0.8)",textTransform:"uppercase",letterSpacing:"1px"}}>Nueva contraseña <span style={{color:"rgba(240,236,228,0.35)",fontWeight:400,textTransform:"none",letterSpacing:0}}>(mín. 8 caracteres)</span></label>
            <div style={{position:"relative"}}>
              <input className="mfr-input" type={verPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&guardar()} autoFocus style={{paddingRight:46}}/>
              <button type="button" onClick={()=>setVerPass(v=>!v)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",cursor:"pointer",padding:"6px 8px",borderRadius:6,color:"rgba(240,236,228,0.5)",fontSize:18,lineHeight:1}}>
                {verPass?"🙈":"👁️"}
              </button>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            <label style={{fontSize:10,fontWeight:600,color:"rgba(198,169,107,0.8)",textTransform:"uppercase",letterSpacing:"1px"}}>Confirmar contraseña</label>
            <div style={{position:"relative"}}>
              <input className="mfr-input" type={verPass2?"text":"password"} value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&guardar()} style={{paddingRight:46}}/>
              <button type="button" onClick={()=>setVerPass2(v=>!v)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",cursor:"pointer",padding:"6px 8px",borderRadius:6,color:"rgba(240,236,228,0.5)",fontSize:18,lineHeight:1}}>
                {verPass2?"🙈":"👁️"}
              </button>
            </div>
          </div>
          {err && (
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:8,background:"rgba(220,38,38,0.12)",border:"1px solid rgba(220,38,38,0.25)"}}>
              <span style={{fontSize:14}}>⚠</span>
              <span style={{fontSize:12,color:"#fca5a5",fontWeight:500}}>{err}</span>
            </div>
          )}
          <button className="mfr-btn" onClick={guardar} disabled={loading} style={{marginTop:6,opacity:loading?.7:1}}>
            {loading ? (
              <span style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                <span style={{display:"inline-block",width:14,height:14,border:"2px solid rgba(10,31,68,0.4)",borderTopColor:"#0A1F44",borderRadius:"50%",animation:"spin .7s linear infinite"}}/>
                Guardando...
              </span>
            ) : "Actualizar contraseña →"}
          </button>
          <button className="mfr-btn-secondary" onClick={onCancel}>Cancelar y volver al inicio</button>
        </div>
        <div style={{textAlign:"center",marginTop:24}}>
          <div style={{fontSize:10,color:"rgba(198,169,107,0.25)",letterSpacing:2,textTransform:"uppercase"}}>© 2025 MarFlow</div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================
   CAMBIO 1 — VENTA DEL DÍA (REDISEÑADA)
   Solo 2 bloques: Nuevos Leads + Desean Seguimiento
=========================================== */
function VentaDelDia({leads}) {
  const nuevos = leads.filter(l =>
    !l.sinSeguimiento && l.etapa === "nuevo"
  ).slice(0,6);

  // Desean seguimiento: checklist.sigues=true O etapa asesorado, sin sinSeguimiento, sin otro/cierre/nuevo
  const deseanSeguimiento = leads.filter(l =>
    !l.sinSeguimiento &&
    !["otro","cierre"].includes(l.etapa) &&
    (l.checklist?.sigues === true || l.etapa === "asesorado")
  ).filter((l,i,arr) => arr.findIndex(x=>x.id===l.id)===i).slice(0,6);

  const Block = ({title, color, items, emptyMsg, icon}) => (
    <div style={{background:"rgba(255,255,255,.07)",borderRadius:10,padding:"12px 14px"}}>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
        <span style={{fontSize:13}}>{icon}</span>
        <span style={{fontSize:11,fontWeight:700,color,textTransform:"uppercase",letterSpacing:.6}}>{title}</span>
        {items.length>0&&<span style={{marginLeft:"auto",background:color+"22",color,borderRadius:20,padding:"1px 8px",fontSize:10,fontWeight:700}}>{items.length}</span>}
      </div>
      {items.length===0
        ?<div style={{fontSize:11,color:"rgba(255,255,255,.3)",fontStyle:"italic"}}>{emptyMsg}</div>
        :items.map(l=>{
          const etapa = ETAPAS.find(e=>e.id===l.etapa)||ETAPAS[0];
          return (
            <div key={l.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,color:"#fff",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.nombre}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,.45)",display:"flex",gap:5,alignItems:"center"}}>
                  <span>{l.producto}</span>
                  <span style={{color:etapa.color+"cc",fontSize:9}}>{etapa.icon} {etapa.label}</span>
                </div>
              </div>
            </div>
          );
        })
      }
    </div>
  );

  return (
    <div style={{background:"#0A1F44",borderRadius:14,padding:"20px 24px",marginBottom:20,position:"relative",overflow:"hidden"}}>
      <svg style={{position:"absolute",bottom:0,right:0,opacity:.1}} width="220" height="90" viewBox="0 0 220 90">
        <path d="M0 60 Q55 20 110 45 Q165 70 220 25 L220 90 L0 90Z" fill="#C6A96B"/>
      </svg>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <span style={{fontSize:22}}>🎯</span>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>Venta del día</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.45)"}}>Tus prioridades de hoy · {new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})}</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:8}}>
        <Block icon="✨" title="Nuevos Leads" color="#93c5fd" items={nuevos} emptyMsg="Sin nuevos leads hoy"/>
        <Block icon="✅" title="Desean Seguimiento" color="#6ee7b7" items={deseanSeguimiento} emptyMsg="Sin pendientes ✓"/>
      </div>
    </div>
  );
}

/* ===========================================
   CAMBIO 2 — ESTRELLA CIERRES (NUEVO)
   Reemplaza la tarjeta simple de "Cierres del mes"
=========================================== */
function EstrellaCierres({count, onClick}) {
  const [burst, setBurst] = useState(false);

  function handleClick() {
    if(burst) return;
    setBurst(true);
    setTimeout(()=>setBurst(false), 650);
    if(onClick) onClick();
  }

  return (
    <div
      onClick={handleClick}
      style={{
        background:"linear-gradient(135deg, #dcfce7 0%, #f0fdf4 60%, #dcfce7 100%)",
        border:"1px solid #E5E7EB",
        borderRadius:12,
        padding:"16px 18px",
        cursor:"pointer",
        transition:"all .15s",
        boxShadow:"0 1px 4px rgba(10,31,68,.08)",
        position:"relative",
        overflow:"hidden",
        display:"flex",
        flexDirection:"column",
        alignItems:"center",
        justifyContent:"center",
        minHeight:100,
        userSelect:"none",
      }}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 20px rgba(10,31,68,.12)";e.currentTarget.style.transform="translateY(-2px)";}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 4px rgba(10,31,68,.08)";e.currentTarget.style.transform="none";}}
    >
      {/* Halo dorado de fondo */}
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:90,height:90,borderRadius:"50%",background:"radial-gradient(circle,rgba(198,169,107,0.14) 0%,transparent 70%)",pointerEvents:"none"}}/>

      <div style={{fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:".6px",marginBottom:8,alignSelf:"flex-start"}}>Cierres del mes</div>

      {/* Estrella animada */}
      <div className={burst ? "mf-star-burst" : "mf-star-idle"} style={{display:"flex",alignItems:"center",justifyContent:"center",marginBottom:4}}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="starGrad" cx="50%" cy="38%" r="58%">
              <stop offset="0%" stopColor="#fffbe8"/>
              <stop offset="32%" stopColor="#ffe08a"/>
              <stop offset="68%" stopColor="#C6A96B"/>
              <stop offset="100%" stopColor="#8a6830"/>
            </radialGradient>
            <radialGradient id="starHalo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C6A96B" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="#C6A96B" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="26" cy="26" r="26" fill="url(#starHalo)"/>
          <polygon
            points="26,4 30.9,18.8 46.5,18.8 34.3,27.6 39.2,42.4 26,33.6 12.8,42.4 17.7,27.6 5.5,18.8 21.1,18.8"
            fill="url(#starGrad)"
            stroke="#b8960e"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />
          <ellipse cx="22" cy="16" rx="5" ry="3" fill="white" opacity="0.28" transform="rotate(-20 22 16)"/>
        </svg>
      </div>

      <div style={{fontSize:36,fontWeight:800,color:"#166534",lineHeight:1}}>{count}</div>
      <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>Conversiones logradas</div>
    </div>
  );
}

/* ===========================================
   CAMBIO 3 — ACTIVIDAD RECIENTE (NUEVO)
   Historial de seguimientos de todos los leads,
   últimos 15 movimientos con autor y hora
=========================================== */
function ActividadReciente({leads}) {
  const movimientos = leads.flatMap(lead =>
    (lead.seguimientos || []).map(s => ({
      ...s,
      leadNombre: lead.nombre,
      leadProducto: lead.producto,
      leadEtapa: lead.etapa,
    }))
  );

  movimientos.sort((a,b) => {
    const fa = a.fecha || "";
    const fb = b.fecha || "";
    if(fb !== fa) return fb.localeCompare(fa);
    return (b.id||"").localeCompare(a.id||"");
  });

  const ultimos15 = movimientos.slice(0,15);

  const tipoIcon = {llamada:"📞", whatsapp:"💬", visita:"🤝", correo:"📧", nota:"📝"};
  const tipoColor = {llamada:"#1e3a8a", whatsapp:"#25d366", visita:"#4c1d95", correo:"#92400e", nota:"#9ca3af"};

  if(ultimos15.length === 0) {
    return (
      <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"18px 20px",boxShadow:"0 1px 4px rgba(10,31,68,.08)"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#0A1F44",marginBottom:14}}>📋 Actividad reciente</div>
        <div style={{fontSize:13,color:"#9ca3af",textAlign:"center",padding:"20px 0",fontStyle:"italic"}}>Sin movimientos registrados aún</div>
      </div>
    );
  }

  return (
    <div style={{background:"#fff",border:"1px solid #E5E7EB",borderRadius:12,padding:"18px 20px",boxShadow:"0 1px 4px rgba(10,31,68,.08)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:14,fontWeight:700,color:"#0A1F44"}}>📋 Actividad reciente</div>
        <span style={{fontSize:10,color:"#94a3b8",fontWeight:500}}>Últimos {ultimos15.length} movimientos</span>
      </div>
      <div style={{display:"flex",flexDirection:"column"}}>
        {ultimos15.map((s,i)=>{
          const tc = tipoColor[s.tipo]||"#9ca3af";
          const isAuto = s._auto;
          return (
            <div key={s.id||i} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:i<ultimos15.length-1?"1px solid rgba(229,231,235,.35)":"none",alignItems:"flex-start"}}>
              {/* Ícono tipo */}
              <div style={{width:28,height:28,borderRadius:"50%",background:tc+"15",border:`1.5px solid ${tc}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,flexShrink:0,marginTop:1}}>
                {tipoIcon[s.tipo]||"📝"}
              </div>
              {/* Contenido */}
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:2}}>
                  <span style={{fontSize:12,fontWeight:700,color:"#0A1F44",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130}}>{s.leadNombre}</span>
                  <span style={{display:"inline-flex",alignItems:"center",padding:"1px 7px",borderRadius:20,fontSize:9,fontWeight:600,background:"#0A1F4414",color:"#0A1F44",whiteSpace:"nowrap"}}>{s.leadProducto}</span>
                </div>
                <div style={{fontSize:11,color:isAuto?"#94a3b8":"#475569",fontStyle:isAuto?"italic":"normal",lineHeight:1.4,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
                  {s.texto}
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:9,color:"#94a3b8"}}>{fmtF(s.fecha)}</span>
                  {s.autor&&(
                    <span style={{display:"inline-flex",alignItems:"center",gap:2,padding:"1px 6px",borderRadius:20,background:s.rol==="asistente"?"#7c3aed14":"#1e40af14",color:s.rol==="asistente"?"#7c3aed":"#1e3a8a",fontSize:9,fontWeight:700}}>
                      {s.rol==="asistente"?"🤝":"👤"} {s.autor}
                    </span>
                  )}
                  {isAuto&&<span style={{fontSize:9,color:"#c4b5fd",fontStyle:"italic"}}>automático</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===========================================
   MÉTRICAS
=========================================== */
function Metricas({leads}) {
  const total=leads.length||1;
  const activos=leads.filter(l=>!l.sinSeguimiento&&!["otro","cierre"].includes(l.etapa)).length;
  const cierres=leads.filter(l=>l.etapa==="cierre").length;
  const perdidos=leads.filter(l=>l.etapa==="otro"||l.sinSeguimiento).length;
  const contactados=leads.filter(l=>(l.checklist?.wa1||l.checklist?.call1)&&!l.sinSeguimiento).length;
  const conv=Math.round((cierres/total)*100);
  const contRatio=Math.round((contactados/total)*100);
  const calientes=leads.filter(l=>getTempLead(l)?.nivel==="caliente").length;
  const tibios=leads.filter(l=>getTempLead(l)?.nivel==="tibio").length;
  const frios=leads.filter(l=>getTempLead(l)?.nivel==="frio").length;
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:16}}>
      {[{l:"Conversión",v:`${conv}%`,c:B.gold,icon:"📈"},{l:"Contactados",v:`${contRatio}%`,c:B.blue,icon:"📞"},{l:"Activos",v:activos,c:B.navy,icon:"*"},{l:"Cierres",v:cierres,c:B.green,icon:"✓"},{l:"Sin seguimiento",v:perdidos,c:B.redBright,icon:"🚫"}].map((s,i)=>(
        <div key={i} style={{background:B.white,border:`1px solid ${B.gray}`,borderLeft:`4px solid ${s.c}`,borderRadius:12,padding:"14px 16px",boxShadow:B.shadow}}>
          <div style={{fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:".6px",marginBottom:6}}>{s.l}</div>
          <div style={{fontSize:30,fontWeight:800,color:s.c,lineHeight:1,marginBottom:2}}>{s.v}</div>
          <div style={{fontSize:18}}>{s.icon}</div>
        </div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
      <div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}>
        <div style={{fontSize:14,fontWeight:700,color:B.navy,marginBottom:14}}>Temperatura de leads</div>
        {[{l:"🔥 Calientes",v:calientes,c:"#dc2626"},{l:"🟡 Tibios",v:tibios,c:"#d97706"},{l:"❄️ Fríos",v:frios,c:"#3b82f6"}].map(t=>(
          <div key={t.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <span style={{fontSize:13,color:B.black}}>{t.l}</span>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:90,height:6,background:B.gray,borderRadius:3}}><div style={{height:"100%",width:`${Math.round(t.v/total*100)}%`,background:t.c,borderRadius:3,transition:"width .5s"}}/></div>
              <span style={{fontSize:13,fontWeight:700,color:t.c,minWidth:20,textAlign:"right"}}>{t.v}</span>
            </div>
          </div>
        ))}
        <div style={{marginTop:8,paddingTop:12,borderTop:`1px solid ${B.gray}`,fontSize:11,color:"#9ca3af"}}>Total leads: {leads.length}</div>
      </div>
      <div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}>
        <div style={{fontSize:14,fontWeight:700,color:B.navy,marginBottom:14}}>Pipeline por etapa</div>
        {ETAPAS.map(et=>{const cnt=leads.filter(l=>l.etapa===et.id).length;return(
          <div key={et.id} style={{marginBottom:9}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{fontSize:11,color:B.black}}>{et.icon} {et.label}</span><span style={{fontSize:11,fontWeight:700,color:et.color}}>{cnt}</span></div>
            <div style={{height:3,background:B.gray,borderRadius:2}}><div style={{height:"100%",width:`${Math.round(cnt/total*100)}%`,background:et.color,borderRadius:2,transition:"width .5s"}}/></div>
          </div>
        );})}
      </div>
    </div>
  </div>;
}

/* ===========================================
   DASHBOARD — usa los 3 componentes nuevos
=========================================== */
function Dashboard({leads,setFiltroNav,setSeccion}) {
  const activos=leads.filter(l=>!l.sinSeguimiento&&!["otro","cierre"].includes(l.etapa));
  const cierres=leads.filter(l=>l.etapa==="cierre");
  const riesgo=leads.filter(l=>getAlertas(l).some(a=>a.tipo==="riesgo"));
  const sinC=leads.filter(l=>getAlertas(l).some(a=>a.tipo==="sin_contacto"));
  function irA(f){setFiltroNav(f);setSeccion("pipeline");}

  return <div style={{animation:"fadeUp .3s ease"}}>
    {/* CAMBIO 1: VentaDelDia rediseñada — solo 2 bloques */}
    <VentaDelDia leads={leads}/>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:18}}>
      {/* Leads activos */}
      <div onClick={()=>irA("activos")} style={{background:B.white,border:`1px solid ${B.gray}`,borderLeft:`4px solid ${B.navy}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all .15s",boxShadow:B.shadow}}
        onMouseEnter={e=>{e.currentTarget.style.boxShadow=B.shadowMd;e.currentTarget.style.transform="translateY(-2px)";}}
        onMouseLeave={e=>{e.currentTarget.style.boxShadow=B.shadow;e.currentTarget.style.transform="none";}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:".6px"}}>Leads activos</div>
          <span style={{color:B.navy,fontSize:15}}>*</span>
        </div>
        <div style={{fontSize:32,fontWeight:800,color:B.navy,lineHeight:1,marginBottom:4}}>{activos.length}</div>
        <div style={{fontSize:11,color:"#9ca3af"}}>En seguimiento activo</div>
      </div>

      {/* CAMBIO 2: Estrella de Cierres */}
      <EstrellaCierres count={cierres.length} onClick={()=>irA("cierre")}/>

      {/* En riesgo */}
      <div onClick={()=>irA("seguimiento")} style={{background:B.white,border:`1px solid ${B.gray}`,borderLeft:`4px solid ${B.redBright}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all .15s",boxShadow:B.shadow}}
        onMouseEnter={e=>{e.currentTarget.style.boxShadow=B.shadowMd;e.currentTarget.style.transform="translateY(-2px)";}}
        onMouseLeave={e=>{e.currentTarget.style.boxShadow=B.shadow;e.currentTarget.style.transform="none";}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:".6px"}}>En riesgo pérdida</div>
          <span style={{color:B.redBright,fontSize:15}}>⚠</span>
        </div>
        <div style={{fontSize:32,fontWeight:800,color:B.redBright,lineHeight:1,marginBottom:4}}>{riesgo.length}</div>
        <div style={{fontSize:11,color:"#9ca3af"}}>Actuar hoy</div>
      </div>

      {/* Sin contacto */}
      <div onClick={()=>irA("activos")} style={{background:B.white,border:`1px solid ${B.gray}`,borderLeft:`4px solid ${B.amber}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all .15s",boxShadow:B.shadow}}
        onMouseEnter={e=>{e.currentTarget.style.boxShadow=B.shadowMd;e.currentTarget.style.transform="translateY(-2px)";}}
        onMouseLeave={e=>{e.currentTarget.style.boxShadow=B.shadow;e.currentTarget.style.transform="none";}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <div style={{fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:".6px"}}>Sin contacto</div>
          <span style={{color:B.amber,fontSize:15}}>⏰</span>
        </div>
        <div style={{fontSize:32,fontWeight:800,color:B.amber,lineHeight:1,marginBottom:4}}>{sinC.length}</div>
        <div style={{fontSize:11,color:"#9ca3af"}}>Requieren atención</div>
      </div>
    </div>

    {/* Fila inferior: Atención inmediata + CAMBIO 3 Actividad Reciente */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:16}}>
      <div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}>
        <div style={{fontSize:14,fontWeight:700,color:B.navy,marginBottom:14}}>⚡ Atención inmediata</div>
        {[...riesgo,...sinC.filter(l=>!riesgo.includes(l))].length===0
          ?<div style={{fontSize:13,color:B.green,textAlign:"center",padding:"20px 0",fontWeight:500}}>✓ Todo en orden</div>
          :[...riesgo,...sinC.filter(l=>!riesgo.includes(l))].slice(0,5).map(l=>{
            const als=getAlertas(l);const temp=getTempLead(l);
            return <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${B.gray}`}}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {temp&&<span style={{fontSize:14}}>{temp.icon}</span>}
                  <div style={{fontSize:12,fontWeight:600,color:B.navy}}>{l.nombre}</div>
                </div>
                {als.map((a,i)=><div key={i} style={{fontSize:10,color:a.color,fontWeight:600}}>{a.msg}</div>)}
              </div>
              <a href={`https://wa.me/52${l.telefono}`} target="_blank" rel="noreferrer" style={{width:30,height:30,borderRadius:"50%",background:"#dcfce7",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>💬</a>
            </div>;
          })}
      </div>

      {/* CAMBIO 3: Actividad Reciente con seguimientos reales */}
      <ActividadReciente leads={leads}/>
    </div>
  </div>;
}

function LeadCard({lead,onClick,onContacto}) {
  const etapa=ETAPAS.find(e=>e.id===lead.etapa)||ETAPAS[0];
  const alerts=getAlertas(lead);
  const sinSeg=lead.sinSeguimiento||lead.checklist?.noInteres;
  const temp=getTempLead(lead);
  return <div onClick={()=>onClick(lead)}
    style={{background:sinSeg?B.redLight:B.white,border:`1.5px solid ${sinSeg?B.redBright+"44":B.gray}`,borderLeft:`3px solid ${sinSeg?B.redBright:etapa.color}`,borderRadius:10,padding:"12px 13px 11px",cursor:"pointer",marginBottom:8,transition:"all .15s",boxShadow:B.shadow}}
    onMouseEnter={e=>{e.currentTarget.style.boxShadow=B.shadowMd;e.currentTarget.style.transform="translateY(-1px)";}}
    onMouseLeave={e=>{e.currentTarget.style.boxShadow=B.shadow;e.currentTarget.style.transform="none";}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
      <div style={{flex:1,minWidth:0,paddingRight:8}}>
        <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:1}}>
          {temp&&!sinSeg&&<span style={{fontSize:13}}>{temp.icon}</span>}
          {sinSeg&&<span style={{fontSize:11}}>🚫</span>}
          <div style={{fontWeight:700,fontSize:13,color:sinSeg?B.redBright:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.nombre}</div>
        </div>
        <div style={{fontSize:11,color:"#6b7280"}}>{lead.estado} · {lead.edad} años</div>
      </div>
      <Tag color={sinSeg?B.redBright:etapa.color} small>{sinSeg?"Sin seguimiento":lead.producto}</Tag>
    </div>
    {!sinSeg&&alerts.length>0&&<div style={{marginBottom:6}}>
      {alerts.map((a,i)=><span key={i} style={{fontSize:10,color:a.color,fontWeight:600,marginRight:8,display:"inline-flex",alignItems:"center",gap:3}}>
        <span style={{fontSize:7,animation:a.tipo==="riesgo"?"pulse 1.4s infinite":"none"}}>●</span>{a.msg}
      </span>)}
    </div>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{fontSize:10,color:"#9ca3af"}}>Ult: {fmtF(lead.ultimoContacto)}</div>
      {!sinSeg&&<button onClick={e=>{e.stopPropagation();onContacto(lead);}}
        style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:20,border:`1px solid ${B.gray}`,background:B.cream,cursor:"pointer",fontSize:11,color:B.navy,fontWeight:600,fontFamily:"Poppins"}}>
        📞 Contactar
      </button>}
    </div>
  </div>;
}

// ============ LEADMODAL ===================
/* ═══════════════════════════════════════════
   ENVIAR WHATSAPP — selector de plantilla + preview con sustitución
═══════════════════════════════════════════ */
function EnviarWhatsAppModal({ lead, usuario, onClose, onEnviado }) {
  const CATEGORIAS = [
    { v: "primer_contacto", l: "👋 Primer contacto" },
    { v: "seguimiento",     l: "🔄 Seguimiento" },
    { v: "cierre",          l: "⭐ Cierre" },
    { v: "reactivacion",    l: "♻️ Reactivación" },
  ];
  const [cat, setCat] = useState("primer_contacto");
  const [idx, setIdx] = useState(0);
  const [mensajeEditado, setMensajeEditado] = useState(null);

  const opcionesPlantilla = (MENSAJES_TPL[cat] || []).map((m, i) => ({ v: String(i), l: m.titulo }));
  const tpl = MENSAJES_TPL[cat]?.[idx] || MENSAJES_TPL.primer_contacto[0];
  const mensajeBase = sustituirVariables(tpl.body, lead, usuario);
  const mensajeFinal = mensajeEditado !== null ? mensajeEditado : mensajeBase;

  const tel = (lead?.telefono || "").replace(/\D/g, "");
  const numeroConLada = tel.length === 10 ? `52${tel}` : tel; // si son 10 dígitos, asumir México

  function abrirWhatsApp() {
    if (!tel) return;
    const url = `https://wa.me/${numeroConLada}?text=${encodeURIComponent(mensajeFinal)}`;
    window.open(url, "_blank");
    if (onEnviado) onEnviado({ titulo: tpl.titulo, mensaje: mensajeFinal, categoria: cat });
    onClose();
  }

  function cambiarCategoria(v) {
    setCat(v); setIdx(0); setMensajeEditado(null);
  }
  function cambiarPlantilla(v) {
    setIdx(Number(v)); setMensajeEditado(null);
  }

  return (
    <MFModal onClose={onClose} width={640}>
      <MHead title="Enviar WhatsApp" sub={lead?.nombre || ""} onClose={onClose}/>

      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14}}>
        <FL label="Categoría">
          <Sel value={cat} onChange={cambiarCategoria} options={CATEGORIAS}/>
        </FL>
        <FL label="Plantilla">
          <Sel value={String(idx)} onChange={cambiarPlantilla} options={opcionesPlantilla}/>
        </FL>
      </div>

      <FL label="Vista previa (puedes editarlo antes de enviar)">
        <textarea
          value={mensajeFinal}
          onChange={e => setMensajeEditado(e.target.value)}
          rows={8}
          style={{
            width:"100%", padding:"12px 14px", borderRadius:10,
            border:`1.5px solid ${B.gray}`, background:B.white, color:B.black,
            fontFamily:"'Poppins',sans-serif", fontSize:14, lineHeight:1.6,
            outline:"none", resize:"vertical", minHeight:140,
            WebkitAppearance:"none",
          }}
          onFocus={e=>e.target.style.borderColor=B.gold}
          onBlur={e=>e.target.style.borderColor=B.gray}
        />
      </FL>

      {mensajeEditado !== null && (
        <button onClick={() => setMensajeEditado(null)}
          style={{background:"none", border:"none", color:B.navy, fontSize:11, fontWeight:600, cursor:"pointer", padding:"6px 0", marginBottom:6, textDecoration:"underline"}}>
          ↺ Restaurar plantilla original
        </button>
      )}

      <div style={{display:"flex", gap:10, marginTop:18}}>
        <Btn onClick={onClose} color={B.navy} outline full>Cancelar</Btn>
        <Btn onClick={abrirWhatsApp} bg="#25d366" full disabled={!tel}>
          📲 Abrir WhatsApp
        </Btn>
      </div>

      {!tel && (
        <div style={{marginTop:12, padding:"10px 12px", background:B.amberLight||"#fffbeb", border:`1px solid ${B.amber}33`, borderRadius:8, fontSize:11, color:B.amber, fontWeight:600}}>
          ⚠️ Este lead no tiene teléfono guardado. Agrégalo primero en los datos del lead.
        </div>
      )}
    </MFModal>
  );
}

function LeadModal({lead,onClose,onSave,onDelete,cuentas,usuario}) {
  const [f,setF]=useState({...lead});
  const [tab,setTab]=useState("info");
  const [nota,setNota]=useState("");
  const [tipoN,setTipoN]=useState("llamada");
  const [confirmDel,setConfirmDel]=useState(false);
  const [wam,setWam]=useState(false); // WhatsApp modal

  function registrarSeguimientoWhatsApp(info) {
    const nuevoSeg = {
      id: uid(),
      fecha: hoy(),
      texto: `📲 WhatsApp enviado · "${info.titulo}"`,
      tipo: "whatsapp",
      autor: usuario?.nombre || "",
      rol: usuario?.rol || "",
    };
    // Marcar checklist: si wa1 no está, marcarlo; si ya está, marcar wa2
    const newChk = { ...(f.checklist || {}) };
    if (!newChk.wa1) newChk.wa1 = true;
    else if (!newChk.wa2) newChk.wa2 = true;

    const leadActualizado = {
      ...f,
      ultimoContacto: hoy(),
      checklist: newChk,
      seguimientos: [nuevoSeg, ...(f.seguimientos || [])],
    };
    setF(leadActualizado);
    // Persistir inmediato en Supabase para que no se pierda si cierra el modal
    if (onSave) onSave(leadActualizado);
  }
  const esAsistente = usuario?.rol==="asistente";
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const setChk=(k,v)=>setF(p=>({...p,checklist:{...p.checklist,[k]:v}}));
  const alerts=getAlertas(f);
  const temp=getTempLead(f);

  function toggleSinSeg(){
    const n=!f.sinSeguimiento;
    setF(p=>({...p,sinSeguimiento:n,checklist:{...p.checklist,noInteres:n},etapa:n?"otro":p.etapa}));
  }
  function addNota(){
    if(!nota.trim())return;
    setF(p=>({...p,seguimientos:[
      {id:uid(),fecha:hoy(),texto:nota,tipo:tipoN,autor:usuario?.nombre||"",rol:usuario?.rol||""},
      ...(p.seguimientos||[])
    ]}));
    setNota("");
  }
  function cambiarEtapa(nueva){
    const anterior=f.etapa;if(nueva===anterior)return;
    const etL=ETAPAS.find(e=>e.id===nueva)?.label||nueva;
    const etA=ETAPAS.find(e=>e.id===anterior)?.label||anterior;
    const autoSinSeg=nueva==="otro";
    setF(p=>({...p,etapa:nueva,sinSeguimiento:autoSinSeg?true:p.sinSeguimiento,
      checklist:autoSinSeg?{...p.checklist,noInteres:true}:p.checklist,
      seguimientos:[{id:uid(),fecha:hoy(),texto:`Etapa: ${etA} → ${etL}${autoSinSeg?" (sin seguimiento automático)":""}`,tipo:"nota",autor:usuario?.nombre||"",rol:usuario?.rol||"",_auto:true},...(p.seguimientos||[])]}));
  }
  function guardar(){
    onSave({...f,ultimoContacto:hoy(),ultimaActualizacion:{por:usuario?.nombre||"",rol:usuario?.rol||"",fecha:hoy()}});
    onClose();
  }
  const TABS_ADMIN=[{v:"info",l:"Info"},{v:"etapa",l:"Etapa"},{v:"checklist",l:"Seguimiento"},{v:"historial",l:`Historial (${(f.seguimientos||[]).length})`},{v:"estrategia",l:"Estrategia"}];
  const TABS_ASIST=[{v:"checklist",l:"Seguimiento"},{v:"historial",l:`Historial (${(f.seguimientos||[]).length})`},{v:"info",l:"Info"}];
  const TABS=esAsistente?TABS_ASIST:TABS_ADMIN;
  const asistentes=(cuentas||[]).filter(c=>c.rol==="asistente"&&c.adminId===(usuario.rol==="superadmin"?c.adminId:usuario.id));
  const tipoColor={llamada:B.blue,whatsapp:"#25d366",visita:B.purple,correo:B.amber,nota:"#9ca3af"};

  return <MFModal onClose={onClose} width={640}>
    <MHead title={lead.nombre||"Nuevo lead"} sub={`${f.producto} · ${f.estado}${temp?` · ${temp.icon} ${temp.label}`:""}`} onClose={onClose}/>

    {/* Barra de acciones rápidas: solo si hay teléfono y es un lead existente (no uno nuevo) */}
    {f.telefono && lead.id === f.id && lead.nombre && (
      <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
        <button onClick={()=>setWam(true)}
          style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:"none",background:"#25d366",color:"#fff",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",boxShadow:"0 2px 8px rgba(37,211,102,.25)"}}>
          📲 Enviar WhatsApp
        </button>
        <a href={`tel:${f.telefono}`} style={{textDecoration:"none"}}>
          <button style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",borderRadius:8,border:`1px solid ${B.blue}40`,background:B.blueDim,color:B.blue,fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer"}}>
            📞 Llamar
          </button>
        </a>
      </div>
    )}

    {f.sinSeguimiento&&<div style={{background:B.redLight,border:`1.5px solid ${B.redBright}33`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>🚫</span>
        <div><div style={{fontSize:13,fontWeight:700,color:B.redBright}}>Sin seguimiento</div><div style={{fontSize:11,color:"#6b7280"}}>No interesado / perdido definitivo</div></div>
      </div>
      <Btn onClick={toggleSinSeg} color={B.green} outline small>Reactivar</Btn>
    </div>}
    <div style={{display:"flex",gap:3,marginBottom:18,background:B.cream,borderRadius:10,padding:4}}>
      {TABS.map(t=>(<button key={t.v} onClick={()=>setTab(t.v)} style={{flex:1,padding:"7px 2px",borderRadius:7,border:"none",background:tab===t.v?B.white:"transparent",color:tab===t.v?B.navy:"#6b7280",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:10,cursor:"pointer",transition:"all .15s",boxShadow:tab===t.v?B.shadow:"none"}}>{t.l}</button>))}
    </div>
    {!f.sinSeguimiento&&alerts.map((a,i)=><div key={i} style={{background:a.color+"10",border:`1px solid ${a.color}25`,borderRadius:8,padding:"8px 13px",marginBottom:8,fontSize:12,color:a.color,fontWeight:600}}>{a.msg}</div>)}
    {tab==="info"&&<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
      <FL label="Nombre completo" span2><Inp value={f.nombre} onChange={v=>set("nombre",v)}/></FL>
      <FL label="Teléfono / WhatsApp"><Inp value={f.telefono} onChange={v=>set("telefono",v)}/></FL>
      <FL label="Edad"><Inp value={f.edad} onChange={v=>set("edad",v)} type="number"/></FL>
      <FL label="Correo" span2><Inp value={f.correo} onChange={v=>set("correo",v)} type="email"/></FL>
      <FL label="Estado de la República"><Sel value={f.estado} onChange={v=>set("estado",v)} options={[{v:"",l:"Seleccionar..."},...ESTADOS_MX.map(e=>({v:e,l:e}))]}/></FL>
      <FL label="Producto"><Sel value={f.producto} onChange={v=>set("producto",v)} options={PRODUCTOS_LEAD}/></FL>
      <FL label="Último contacto"><Inp value={f.ultimoContacto} onChange={v=>set("ultimoContacto",v)} type="date"/></FL>
      <FL label="Asignar a"><Sel value={f.asignadoA||""} onChange={v=>set("asignadoA",v)} options={[{v:"",l:"-- Sin asignar --"},...asistentes.map(a=>({v:a.id,l:a.nombre}))]}/></FL>
      <FL label="Notas" span2><Inp value={f.notas} onChange={v=>set("notas",v)} rows={3} placeholder="Observaciones..."/></FL>
    </div>}
    {tab==="estrategia"&&<div style={{display:"grid",gap:12}}>
      <FL label="Objeciones del cliente"><Inp value={f.objeciones||""} onChange={v=>set("objeciones",v)} rows={2} placeholder="¿Qué lo detiene de comprar?"/></FL>
      <FL label="Intereses y necesidades"><Inp value={f.intereses||""} onChange={v=>set("intereses",v)} rows={2} placeholder="¿Qué busca proteger o lograr?"/></FL>
      <FL label="Motivador de compra"><Inp value={f.motivador||""} onChange={v=>set("motivador",v)} rows={2} placeholder="¿Qué lo haría decidir hoy?"/></FL>
    </div>}
    {tab==="etapa"&&<div>
      <div style={{fontSize:12,color:"#6b7280",marginBottom:14}}>Selecciona la etapa actual</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:18}}>
        {ETAPAS.map(et=>(<button key={et.id} onClick={()=>cambiarEtapa(et.id)} style={{padding:"8px 16px",borderRadius:20,border:`1.5px solid ${f.etapa===et.id?et.color:B.gray}`,background:f.etapa===et.id?et.color+"14":B.cream,color:f.etapa===et.id?et.color:"#6b7280",fontFamily:"Poppins",fontWeight:600,fontSize:12,cursor:"pointer"}}>{et.icon} {et.label}</button>))}
      </div>
      <div style={{background:f.sinSeguimiento?B.redLight:B.cream,border:`1.5px solid ${f.sinSeguimiento?B.redBright+"44":B.gray}`,borderRadius:12,padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:13,fontWeight:700,color:f.sinSeguimiento?B.redBright:B.navy}}>🚫 Sin seguimiento</div><div style={{fontSize:11,color:"#6b7280",marginTop:2}}>No interesado / perdido definitivo.</div></div>
          <Btn onClick={toggleSinSeg} color={f.sinSeguimiento?B.green:B.redBright} outline small>{f.sinSeguimiento?"Reactivar":"Marcar"}</Btn>
        </div>
      </div>
    </div>}
    {tab==="checklist"&&<div>
      <div style={{fontSize:12,color:"#6b7280",marginBottom:14}}>Registra cada acción de contacto</div>
      {CHECKLIST_DEF.map(item=>{
        const done=f.checklist?.[item.key]||false;
        const esNI=item.key==="noInteres";
        const col=esNI?B.redBright:done?B.green:"#d1d5db";
        return <div key={item.key} onClick={()=>{setChk(item.key,!done);if(item.key==="noInteres")setF(p=>({...p,sinSeguimiento:!done,etapa:!done?"perdido":p.etapa}));}}
          style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:9,background:done?(esNI?B.redLight:B.greenLight):"transparent",border:`1px solid ${done?(esNI?B.redBright+"28":B.green+"28"):B.gray}`,marginBottom:6,cursor:"pointer",transition:"all .15s"}}>
          <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${col}`,background:done?(esNI?B.redBright:B.green):"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {done&&<span style={{color:"#fff",fontSize:10,fontWeight:800}}>✓</span>}
          </div>
          <span style={{fontSize:14}}>{item.icon}</span>
          <span style={{fontSize:13,fontWeight:done?600:400,color:done?(esNI?B.redBright:B.green):B.black}}>{item.label}</span>
        </div>;
      })}
    </div>}
    {tab==="historial"&&<div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <Sel value={tipoN} onChange={setTipoN} options={[{v:"llamada",l:"📞 Llamada"},{v:"whatsapp",l:"💬 WhatsApp"},{v:"visita",l:"🤝 Visita"},{v:"correo",l:"📧 Correo"},{v:"nota",l:"📝 Nota"}]}/>
        <Inp value={nota} onChange={setNota} placeholder="Escribe el registro..." onKeyDown={e=>e.key==="Enter"&&addNota()}/>
        <Btn onClick={addNota} bg={B.navy} small>+</Btn>
      </div>
      {(f.seguimientos||[]).length===0
        ?<div style={{fontSize:12,color:"#9ca3af",textAlign:"center",padding:"24px 0"}}>Sin registros aún</div>
        :<div style={{position:"relative",paddingLeft:22}}>
          <div style={{position:"absolute",left:8,top:0,bottom:0,width:1,background:B.gray}}/>
          {(f.seguimientos||[]).map((s,i)=>(
            <div key={s.id||i} style={{position:"relative",marginBottom:12}}>
              <div style={{position:"absolute",left:-18,top:10,width:9,height:9,borderRadius:"50%",background:tipoColor[s.tipo]||"#9ca3af",border:`2px solid ${B.white}`}}/>
              <div style={{background:B.cream,borderRadius:8,padding:"9px 12px"}}>
                <div style={{fontSize:10,color:"#9ca3af",marginBottom:3,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                  <span>{fmtF(s.fecha)} · {s.tipo}</span>
                  {s.autor&&(<span style={{display:"inline-flex",alignItems:"center",gap:3,padding:"1px 7px",borderRadius:20,background:s.rol==="asistente"?"#7c3aed14":"#1e40af14",color:s.rol==="asistente"?"#7c3aed":B.navy,fontSize:9,fontWeight:700}}>{s.rol==="asistente"?"🤝":"👤"} {s.autor}</span>)}
                  {s._auto&&<span style={{fontSize:9,color:"#94a3b8",fontStyle:"italic"}}>automático</span>}
                </div>
                <div style={{fontSize:13,color:B.black}}>{s.texto}</div>
              </div>
            </div>
          ))}
        </div>
      }
    </div>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:22}}>
      {!esAsistente?<Btn onClick={()=>setConfirmDel(true)} color={B.redBright} outline small>Eliminar lead</Btn>:<div style={{fontSize:10,color:"#94a3b8",fontStyle:"italic"}}>Asistente · solo puede registrar seguimientos</div>}
      <div style={{display:"flex",gap:8}}>
        <Btn onClick={onClose} color="#6b7280" outline small>Cancelar</Btn>
        <Btn onClick={guardar} bg={B.navy} small>Guardar</Btn>
      </div>
    </div>
    {confirmDel&&<ConfirmModal titulo="¿Eliminar lead?" mensaje={`Vas a eliminar a "${lead.nombre}" permanentemente.`} icono="🗑️" textoConfirm="Sí, eliminar" colorConfirm={B.redBright} onConfirm={()=>{onDelete(lead.id);onClose();}} onCancel={()=>setConfirmDel(false)}/>}
    {wam&&<EnviarWhatsAppModal lead={f} usuario={usuario} onClose={()=>setWam(false)} onEnviado={registrarSeguimientoWhatsApp}/>}
  </MFModal>;
}

/* ═══════════════════════════════════════════
   PLANTILLAS DE WHATSAPP — sustitución de variables
   Reemplaza [Nombre], [Producto], etc. con los datos del lead/usuario
═══════════════════════════════════════════ */
function sustituirVariables(texto, lead, usuario) {
  if (!texto) return "";
  const ahora = new Date();
  const fechaStr = ahora.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const reemplazos = {
    "[Nombre]":    lead?.nombre || "",
    "[nombre]":    lead?.nombre || "",
    "[Producto]":  lead?.producto || "tu producto de interés",
    "[producto]":  lead?.producto || "tu producto de interés",
    "[Edad]":      lead?.edad || "",
    "[Estado]":    lead?.estado || "",
    "[Telefono]":  lead?.telefono || "",
    "[Teléfono]":  lead?.telefono || "",
    "[Email]":     lead?.correo || "",
    "[Correo]":    lead?.correo || "",
    "[Ejecutivo]": lead?.ejecutivo || (usuario?.nombre || ""),
    "[Tu nombre]": usuario?.nombre || "",
    "[tu nombre]": usuario?.nombre || "",
    "[fecha]":     fechaStr,
    "[Referido]":  usuario?.nombre || "tu asesor",
  };
  let resultado = texto;
  for (const [clave, valor] of Object.entries(reemplazos)) {
    resultado = resultado.split(clave).join(valor);
  }
  return resultado;
}

/* ═══════════════════════════════════════════
   MAPEO DB ↔ FRONTEND
   - DB usa snake_case (ultimo_contacto, admin_id, etc.)
   - Frontend usa camelCase (ultimoContacto, adminId, etc.)
   - Seguimientos: en frontend son array dentro del lead; en DB tabla aparte
═══════════════════════════════════════════ */
function leadFromDB(row, seguimientos = []) {
  return {
    id: row.id,
    nombre: row.nombre || "",
    telefono: row.telefono || "",
    correo: row.correo || "",
    edad: row.edad || "",
    producto: row.producto || "",
    estado: row.estado || "",
    ejecutivo: row.ejecutivo || "",
    etapa: row.etapa || "nuevo",
    ultimoContacto: row.ultimo_contacto || hoy(),
    sinSeguimiento: !!row.sin_seguimiento,
    notas: row.notas || "",
    objeciones: row.objeciones || "",
    intereses: row.intereses || "",
    motivador: row.motivador || "",
    checklist: { ...EMPTY_CHECK, ...(row.checklist || {}) },
    asignadoA: row.asignado_a || null,
    mesCreacion: row.mes_creacion || (row.created_at ? row.created_at.slice(0,7) : hoy().slice(0,7)),
    seguimientos: seguimientos
      .filter(s => s.lead_id === row.id)
      .map(s => ({ id: s.id, fecha: s.fecha, texto: s.texto, tipo: s.tipo, autorId: s.autor_id }))
      .sort((a,b) => (b.fecha || "").localeCompare(a.fecha || "")),
  };
}

function leadToDB(lead, adminId) {
  return {
    id: lead.id,
    admin_id: adminId,
    asignado_a: lead.asignadoA || null,
    nombre: lead.nombre || "",
    telefono: lead.telefono || null,
    correo: lead.correo || null,
    edad: lead.edad || null,
    producto: lead.producto || null,
    estado: lead.estado || null,
    ejecutivo: lead.ejecutivo || null,
    etapa: lead.etapa || "nuevo",
    ultimo_contacto: lead.ultimoContacto || null,
    sin_seguimiento: !!lead.sinSeguimiento,
    notas: lead.notas || null,
    objeciones: lead.objeciones || null,
    intereses: lead.intereses || null,
    motivador: lead.motivador || null,
    checklist: lead.checklist || { ...EMPTY_CHECK },
    mes_creacion: lead.mesCreacion || hoy().slice(0,7),
  };
}

function eventoFromDB(row) {
  return {
    id: row.id,
    titulo: row.titulo || "",
    tipo: row.tipo || "trabajo",
    subtipo: row.subtipo || "",
    fecha: row.fecha || hoy(),
    hora: row.hora || "",
    repeticion: row.repeticion || "none",
    notas: row.notas || "",
    privado: !!row.privado,
    leadId: row.lead_id || null,
    creadorId: row.creador_id || null,
  };
}

function eventoToDB(evento, adminId, creadorId) {
  return {
    id: evento.id,
    admin_id: adminId,
    creador_id: evento.creadorId || creadorId || null,
    lead_id: evento.leadId || null,
    titulo: evento.titulo || "",
    tipo: evento.tipo || "trabajo",
    subtipo: evento.subtipo || null,
    fecha: evento.fecha,
    hora: evento.hora || null,
    repeticion: evento.repeticion || "none",
    notas: evento.notas || null,
    privado: !!evento.privado,
  };
}

/* ═══════════════════════════════════════════
   HELPERS DE DETECCIÓN DE DUPLICADOS
   - normalizarTel: quita todo lo que no sea dígito
   - normalizarEmail: lowercase + trim
   - esDuplicado: compara contra una lista por tel O email
═══════════════════════════════════════════ */
function normalizarTel(t) {
  return String(t || "").replace(/\D/g, "");
}
function normalizarEmail(e) {
  return String(e || "").trim().toLowerCase();
}
function esDuplicado(lead, leadsExistentes) {
  const tel = normalizarTel(lead.telefono);
  const email = normalizarEmail(lead.correo);
  if (!tel && !email) return false; // sin tel ni email: no podemos comparar → se considera único
  return leadsExistentes.some(l => {
    const lTel = normalizarTel(l.telefono);
    const lEmail = normalizarEmail(l.correo);
    return (tel && lTel && tel === lTel) || (email && lEmail && email === lEmail);
  });
}
function clasificarDuplicados(leadsParsed, leadsExistentes) {
  const nuevos = [];
  const duplicados = [];
  for (const lead of leadsParsed) {
    if (esDuplicado(lead, leadsExistentes)) duplicados.push(lead);
    else nuevos.push(lead);
  }
  return { nuevos, duplicados };
}

/* ═══════════════════════════════════════════
   PARSEO DE LEADS DESDE EXCEL/CSV
   - Detecta encabezados con aliases
   - Fallback por orden posicional si no reconoce headers
   - Nunca aborta por campos faltantes (solo omite filas sin nombre)
═══════════════════════════════════════════ */
function parsearLeads(rows) {
  if (!rows || !rows.length) return { leads: [], warnings: { omitidasSinNombre: 0, sinTelefono: 0, sinMail: 0, sinEdad: 0 } };

  const aliasMap = {
    nombre:    /^(nombre)$/i,
    edad:      /^(edad)$/i,
    telefono:  /^(tel(é|e)fono|tel|celular)$/i,
    mail:      /^(mail|e-?mail|correo(\s*electr(ó|o)nico)?)$/i,
    estado:    /^(estado)$/i,
    producto:  /^(producto(\s+solicitado)?|producto\s+de\s+inter(é|e)s)$/i,
    ejecutivo: /^(ejecutivo|asesor|vendedor)$/i,
    etapa:     /^(etapa|status\s*lead|status)$/i,
  };

  // Detectar headers por nombre
  const keys = Object.keys(rows[0] || {});
  const headers = {};
  for (const key of keys) {
    for (const [field, regex] of Object.entries(aliasMap)) {
      if (!headers[field] && regex.test(String(key).trim())) { headers[field] = key; break; }
    }
  }
  const conHeaders = Object.keys(headers).length > 0;

  // Si no detectó NINGÚN header, usar orden posicional: Nombre, Edad, Tel, Mail, Estado, Producto, Ejecutivo
  const camposPos = ["nombre","edad","telefono","mail","estado","producto","ejecutivo"];

  const etapaIdFromLabel = (val) => {
    if (val === null || val === undefined || val === "") return "nuevo";
    const s = String(val).toLowerCase().trim();
    const found = ETAPAS.find(e => e.label.toLowerCase() === s || e.id === s || e.label.toLowerCase().includes(s));
    return found ? found.id : "nuevo";
  };

  const leads = [];
  const warnings = { omitidasSinNombre: 0, sinTelefono: 0, sinMail: 0, sinEdad: 0 };

  for (const row of rows) {
    let nombre, edad, telefono, correo, estado, producto, ejecutivo, etapaVal;
    if (conHeaders) {
      nombre    = String(row[headers.nombre]    || "").trim();
      edad      = String(row[headers.edad]      || "").trim();
      telefono  = String(row[headers.telefono]  || "").trim();
      correo    = String(row[headers.mail]      || "").trim();
      estado    = String(row[headers.estado]    || "").trim();
      producto  = String(row[headers.producto]  || "").trim();
      ejecutivo = String(row[headers.ejecutivo] || "").trim();
      etapaVal  = headers.etapa ? row[headers.etapa] : "";
    } else {
      const vals = keys.map(k => row[k]);
      nombre    = String(vals[0] || "").trim();
      edad      = String(vals[1] || "").trim();
      telefono  = String(vals[2] || "").trim();
      correo    = String(vals[3] || "").trim();
      estado    = String(vals[4] || "").trim();
      producto  = String(vals[5] || "").trim();
      ejecutivo = String(vals[6] || "").trim();
      etapaVal  = "";
    }

    if (!nombre) { warnings.omitidasSinNombre++; continue; }
    if (!telefono) warnings.sinTelefono++;
    if (!correo)   warnings.sinMail++;
    if (!edad)     warnings.sinEdad++;

    leads.push({
      id: uid(),
      nombre,
      edad,
      telefono,
      correo,
      estado,
      producto: producto || PRODUCTOS_LEAD[0],
      ejecutivo,
      etapa: etapaIdFromLabel(etapaVal),
      ultimoContacto: hoy(),
      notas: "",
      objeciones: "",
      intereses: "",
      motivador: "",
      checklist: { ...EMPTY_CHECK },
      seguimientos: [],
      sinSeguimiento: false,
      asignadoA: null,
      mesCreacion: hoy().slice(0,7),
    });
  }

  return { leads, warnings };
}

/* ═══════════════════════════════════════════
   IMPORTAR LEADS MODAL — Vista previa + confirmación
═══════════════════════════════════════════ */
function ImportarLeadsModal({ datos, onConfirm, onClose }) {
  const { nuevos, duplicados, warnings } = datos;
  const [tab, setTab] = useState("nuevos"); // 'nuevos' | 'duplicados'
  const listaVis = tab === "nuevos" ? nuevos : duplicados;

  return (
    <MFModal onClose={onClose} width={820}>
      <MHead title="Vista previa de importación" sub={`${nuevos.length + duplicados.length} leads procesados`} onClose={onClose}/>

      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        <Tag color={B.green}>✓ {nuevos.length} nuevos</Tag>
        {duplicados.length > 0 && <Tag color={B.blue}>🔄 {duplicados.length} duplicados (omitidos)</Tag>}
        {warnings.omitidasSinNombre > 0 && <Tag color={B.redBright}>⚠ {warnings.omitidasSinNombre} sin nombre (omitidas)</Tag>}
        {warnings.sinTelefono > 0 && <Tag color={B.amber}>⚠ {warnings.sinTelefono} sin teléfono</Tag>}
        {warnings.sinMail > 0 && <Tag color={B.amber}>⚠ {warnings.sinMail} sin mail</Tag>}
      </div>

      {/* Pestañas Nuevos / Duplicados */}
      {duplicados.length > 0 && (
        <div style={{display:"flex",gap:4,marginBottom:12,background:B.cream,borderRadius:8,padding:4}}>
          <button onClick={()=>setTab("nuevos")} style={{flex:1,padding:"8px 12px",borderRadius:6,border:"none",background:tab==="nuevos"?B.white:"transparent",color:tab==="nuevos"?B.navy:"#6b7280",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",boxShadow:tab==="nuevos"?B.shadow:"none"}}>
            ✓ Nuevos ({nuevos.length})
          </button>
          <button onClick={()=>setTab("duplicados")} style={{flex:1,padding:"8px 12px",borderRadius:6,border:"none",background:tab==="duplicados"?B.white:"transparent",color:tab==="duplicados"?B.blue:"#6b7280",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",boxShadow:tab==="duplicados"?B.shadow:"none"}}>
            🔄 Duplicados ({duplicados.length})
          </button>
        </div>
      )}

      {nuevos.length === 0 && duplicados.length === 0 ? (
        <div style={{textAlign:"center",padding:"30px 20px",color:"#6b7280",fontSize:13}}>
          No se detectó ningún lead con nombre. Revisa que tu archivo tenga al menos la columna "Nombre" con datos.
        </div>
      ) : listaVis.length === 0 ? (
        <div style={{textAlign:"center",padding:"30px 20px",color:"#6b7280",fontSize:13}}>
          {tab === "nuevos" ? "Todos los leads del archivo ya existen en tu pipeline." : "No hay duplicados."}
        </div>
      ) : (
        <div style={{overflowX:"auto",maxHeight:380,border:`1px solid ${B.gray}`,borderRadius:8,background:B.white}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:780}}>
            <thead>
              <tr style={{background:B.cream,position:"sticky",top:0,zIndex:1}}>
                {["Nombre","Edad","Teléfono","Mail","Estado","Producto","Ejecutivo","Etapa"].map(h =>
                  <th key={h} style={{textAlign:"left",padding:"9px 10px",borderBottom:`2px solid ${B.gray}`,fontSize:10,color:"#6b7280",textTransform:"uppercase",letterSpacing:".5px",whiteSpace:"nowrap"}}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {listaVis.map((l) => {
                const et = ETAPAS.find(e => e.id === l.etapa);
                const opacity = tab === "duplicados" ? 0.55 : 1;
                return (
                  <tr key={l.id} style={{borderBottom:`1px solid ${B.gray}33`,opacity}}>
                    <td style={{padding:"8px 10px",fontWeight:600,color:B.navy,whiteSpace:"nowrap"}}>{l.nombre}</td>
                    <td style={{padding:"8px 10px",color:"#6b7280"}}>{l.edad || "—"}</td>
                    <td style={{padding:"8px 10px",color:l.telefono?B.black:B.amber,whiteSpace:"nowrap"}}>{l.telefono || "—"}</td>
                    <td style={{padding:"8px 10px",color:l.correo?B.black:B.amber,fontSize:11}}>{l.correo || "—"}</td>
                    <td style={{padding:"8px 10px",color:"#6b7280"}}>{l.estado || "—"}</td>
                    <td style={{padding:"8px 10px",color:"#6b7280"}}>{l.producto || "—"}</td>
                    <td style={{padding:"8px 10px",color:"#6b7280"}}>{l.ejecutivo || "—"}</td>
                    <td style={{padding:"8px 10px"}}><Tag color={et?.color || B.navy} small>{et?.icon || ""} {et?.label || "Nuevo"}</Tag></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{display:"flex",gap:10,marginTop:20}}>
        <Btn onClick={onClose} color={B.navy} outline full>Cancelar</Btn>
        <Btn onClick={onConfirm} bg={B.green} full disabled={nuevos.length === 0}>
          ✓ Importar {nuevos.length} {nuevos.length === 1 ? "nuevo" : "nuevos"}
        </Btn>
      </div>
    </MFModal>
  );
}

function Pipeline({leads,setLeads,filtroNav,esAdmin,cuentas,usuario}) {
  const [leadAct,setLeadAct]=useState(null);
  const [nuevoM,setNuevoM]=useState(false);
  const [contactoL,setContactoL]=useState(null);
  const [preview,setPreview]=useState(null); // { leads, warnings } | null
  const [busq,setBusq]=useState("");
  const [filtProd,setFiltProd]=useState("");
  const [filtTemp,setFiltTemp]=useState("");
  const fileRef=useRef();
  const emptyL={id:uid(),nombre:"",telefono:"",correo:"",edad:"",producto:PRODUCTOS_LEAD[0],estado:"",etapa:"nuevo",ultimoContacto:hoy(),notas:"",objeciones:"",intereses:"",motivador:"",checklist:{...EMPTY_CHECK},seguimientos:[],sinSeguimiento:false,asignadoA:null,mesCreacion:hoy().slice(0,7)};
  function save(d){setLeads(p=>p.find(l=>l.id===d.id)?p.map(l=>l.id===d.id?d:l):[...p,d]);}
  function del(id){setLeads(p=>p.filter(l=>l.id!==id));}
  let vis=leads;
  if(filtroNav==="activos") vis=vis.filter(l=>!l.sinSeguimiento&&!["otro","cierre"].includes(l.etapa));
  else if(filtroNav&&filtroNav!=="todos") vis=vis.filter(l=>l.etapa===filtroNav);
  if(busq) vis=vis.filter(l=>l.nombre.toLowerCase().includes(busq.toLowerCase())||l.estado?.toLowerCase().includes(busq.toLowerCase()));
  if(filtProd) vis=vis.filter(l=>l.producto===filtProd);
  if(filtTemp) vis=vis.filter(l=>getTempLead(l)?.nivel===filtTemp);
  const etapasVis=(filtroNav&&!["todos","activos"].includes(filtroNav)&&ETAPAS.find(e=>e.id===filtroNav))?ETAPAS.filter(e=>e.id===filtroNav):ETAPAS;

  async function importar(e){
    const file = e.target.files?.[0]; if(!file) return;
    try{
      const { default: XLSX } = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
      const ab = await file.arrayBuffer();
      const wb = XLSX.read(ab);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const parsed = parsearLeads(rows);
      // Clasificar contra los leads existentes en el pipeline
      const { nuevos, duplicados } = clasificarDuplicados(parsed.leads, leads);
      if (!nuevos.length && !duplicados.length && !parsed.warnings.omitidasSinNombre) {
        alert("El archivo está vacío o no se detectaron filas con datos.");
      } else {
        setPreview({ nuevos, duplicados, warnings: parsed.warnings });
      }
    } catch(err){
      alert("Error al leer el archivo: " + (err.message || err));
    }
    e.target.value = "";
  }

  function confirmarImport(){
    if (!preview) return;
    const n = preview.nuevos.length;
    if (n === 0) { setPreview(null); return; }
    setLeads(p => [...p, ...preview.nuevos]);
    setPreview(null);
    setTimeout(() => alert(`✅ ${n} ${n === 1 ? "lead importado" : "leads importados"}`), 100);
  }

  async function exportar(){
    try{
      const { default: XLSX } = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
      // Orden EXACTO: las 7 columnas pedidas + Etapa + checklist
      const data = vis.map(l => ({
        "Nombre":             l.nombre,
        "Edad":               l.edad,
        "Teléfono":           l.telefono,
        "Mail":               l.correo,
        "Estado":             l.estado,
        "Producto solicitado": l.producto,
        "Ejecutivo":          l.ejecutivo || "",
        "Etapa":              ETAPAS.find(e => e.id === l.etapa)?.label || "",
        "WA 1":               l.checklist?.wa1      ? "✓" : "",
        "WA 2":               l.checklist?.wa2      ? "✓" : "",
        "Llamada 1":          l.checklist?.call1    ? "✓" : "",
        "Llamada 2":          l.checklist?.call2    ? "✓" : "",
        "Correo enviado":     l.checklist?.email    ? "✓" : "",
        "Desea seguimiento":  l.checklist?.sigues   ? "✓" : "",
        "Sin interés":        l.checklist?.noInteres ? "✓" : "",
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Leads MarFlow");
      XLSX.writeFile(wb, `marflow_leads_${hoy()}.xlsx`);
    } catch(err){
      alert("Error al exportar: " + (err.message || err));
    }
  }
  return <div>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
      <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="🔍 Buscar por nombre o estado..." style={{flex:1,minWidth:0,padding:"11px 13px",borderRadius:8,border:`1.5px solid ${B.gray}`,background:B.white,color:B.black,fontFamily:"'Poppins',sans-serif",fontSize:16,outline:"none",minHeight:44,WebkitAppearance:"none"}} onFocus={e=>e.target.style.borderColor=B.gold} onBlur={e=>e.target.style.borderColor=B.gray}/>
      <Sel value={filtProd} onChange={setFiltProd} options={[{v:"",l:"Todos productos"},...PRODUCTOS_LEAD.map(p=>({v:p,l:p}))]}/>
      <Sel value={filtTemp} onChange={setFiltTemp} options={[{v:"",l:"Temperatura"},{v:"caliente",l:"🔥 Caliente"},{v:"tibio",l:"🟡 Tibio"},{v:"frio",l:"❄️ Frío"}]}/>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={importar}/>
      <Btn onClick={()=>fileRef.current?.click()} color={B.green} outline small>📂 Importar</Btn>
      <Btn onClick={exportar} color={B.navy} outline small>📥 Exportar</Btn>
      {esAdmin&&<Btn onClick={()=>setNuevoM(true)} bg={B.navy} small>+ Lead</Btn>}
    </div>
    <div className="mf-kanban">
      {etapasVis.map(etapa=>{
        const cols=vis.filter(l=>l.etapa===etapa.id);
        return <div key={etapa.id} className="mf-kanban-col">
          <div style={{background:B.white,border:`1px solid ${B.gray}`,borderTop:`3px solid ${etapa.color}`,borderRadius:"0 0 9px 9px",padding:"10px 13px",marginBottom:8,boxShadow:B.shadow}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{color:etapa.color,fontSize:13}}>{etapa.icon}</span><span style={{fontSize:12,fontWeight:700,color:B.navy}}>{etapa.label}</span></div>
              <span style={{background:etapa.color+"14",color:etapa.color,borderRadius:20,padding:"1px 9px",fontSize:11,fontWeight:700}}>{cols.length}</span>
            </div>
          </div>
          {cols.length===0?<div style={{border:`1.5px dashed ${B.gray}`,borderRadius:10,padding:"20px 8px",textAlign:"center",color:"#9ca3af",fontSize:11,background:B.cream}}>Sin leads</div>:cols.map(l=><LeadCard key={l.id} lead={l} onClick={setLeadAct} onContacto={setContactoL}/>)}
        </div>;
      })}
    </div>
    {leadAct&&<LeadModal lead={leadAct} onClose={()=>setLeadAct(null)} onSave={save} onDelete={del} cuentas={cuentas} usuario={usuario}/>}
    {nuevoM&&<LeadModal lead={emptyL} onClose={()=>setNuevoM(false)} onSave={save} onDelete={()=>{}} cuentas={cuentas} usuario={usuario}/>}
    {contactoL&&<ContactoModal lead={contactoL} onClose={()=>setContactoL(null)}/>}
    {preview&&<ImportarLeadsModal datos={preview} onConfirm={confirmarImport} onClose={()=>setPreview(null)}/>}
  </div>;
}

function Agenda({eventos,setEventos,leads,esAsistente,usuario}) {
  const now=new Date();
  const [mes,setMes]=useState(now.getMonth());
  const [anio,setAnio]=useState(now.getFullYear());
  const [diaClick,setDiaClick]=useState(null);
  const [modalEv,setModalEv]=useState(false);
  const [modalDia,setModalDia]=useState(false);
  const [editId,setEditId]=useState(null);
  const [confirmEvDel,setConfirmEvDel]=useState(null);
  const [popupCot,setPopupCot]=useState(null);
  const emptyEv={id:uid(),titulo:"",fechaInicio:hoy(),fechaFin:"",horaInicio:"",horaFin:"",tipo:"trabajo",subtipo:"info1",repeticion:"none",nota:"",leadId:"",agendadoPor:usuario?.nombre||"",recordatorioCot:false};
  const [form,setForm]=useState(emptyEv);
  const sf=(k,v)=>setForm(f=>({...f,[k]:v}));
  const strD=d=>`${anio}-${String(mes+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  function mapEvDia(d){
    const all=eventos.filter(ev=>{const start=ev.fechaInicio||ev.fecha||"";const end=ev.fechaFin||start;return d>=start&&d<=end;});
    if(!esAsistente)return all;
    return all.map(ev=>ev.tipo==="personal"?{...ev,titulo:"Ocupado 🔒",nota:"",leadId:"",_privado:true}:ev);
  }
  const tipoC=t=>TIPO_EVENTO.find(x=>x.id===t)?.color||"#9ca3af";
  const tipoL=t=>TIPO_EVENTO.find(x=>x.id===t)?.label||t;
  function abrirNuevo(fecha){setForm({...emptyEv,id:uid(),fechaInicio:fecha,fechaFin:fecha});setEditId(null);setModalEv(true);}
  function abrirEditar(ev){
    if(ev._privado)return;
    if(esAsistente&&ev.agendadoPor!==usuario?.nombre)return;
    const fi=ev.fechaInicio||ev.fecha||hoy();const ff=ev.fechaFin||fi;
    setForm({...emptyEv,...ev,fechaInicio:fi,fechaFin:ff});setEditId(ev.id);setModalEv(true);
  }
  function guardar(){
    if(!form.titulo.trim()||!form.fechaInicio)return;
    const fi=form.fechaInicio;const ff=form.fechaFin&&form.fechaFin>=fi?form.fechaFin:fi;
    const saved={...form,fechaInicio:fi,fechaFin:ff,fecha:fi};
    if(editId)setEventos(p=>p.map(ev=>ev.id===editId?saved:ev));else setEventos(p=>[...p,saved]);
    setModalEv(false);
    if(form.recordatorioCot&&form.tipo==="cita"){const lead=leads.find(l=>l.id===form.leadId);const payload={titulo:form.titulo,leadNombre:lead?.nombre||""};setTimeout(()=>setPopupCot(payload),30*60*1000);}
  }
  function elimEv(id){setEventos(p=>p.filter(ev=>ev.id!==id));setModalDia(false);}
  const diasMes=getDias(anio,mes);const primerDia=getPrimerDia(anio,mes);const diasMesAnt=getDias(anio,mes===0?11:mes-1);
  const strFull=(y,m,d)=>`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const celdas=[
    ...Array.from({length:primerDia},(_,i)=>{const d=diasMesAnt-primerDia+1+i;const[py,pm]=mes===0?[anio-1,11]:[anio,mes-1];return{dia:d,tipo:"prev",fecha:strFull(py,pm,d)};}),
    ...Array.from({length:diasMes},(_,i)=>({dia:i+1,tipo:"actual",fecha:strFull(anio,mes,i+1)})),
  ];
  let nextDia=1;
  while(celdas.length%7!==0){const[ny,nm]=mes===11?[anio+1,0]:[anio,mes+1];celdas.push({dia:nextDia,tipo:"next",fecha:strFull(ny,nm,nextDia)});nextDia++;}
  const diasConEvs=diaClick?mapEvDia(strD(diaClick)):[];
  const DIAS_MIN=["L","M","X","J","V","S","D"];
  const AGENDA_CSS=`.mf-cal-wrap{width:100%;box-sizing:border-box;overflow-x:hidden;}.mf-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);width:100%;}.mf-cal-hdr{display:grid;grid-template-columns:repeat(7,1fr);background:#0A1F44;border-radius:12px 12px 0 0;}.mf-cell{box-sizing:border-box;overflow:hidden;border-right:1px solid rgba(10,31,68,0.06);border-bottom:1px solid rgba(10,31,68,0.06);cursor:pointer;transition:background .12s;-webkit-tap-highlight-color:transparent;display:flex;flex-direction:column;}.mf-cell:hover{background:rgba(10,31,68,0.03)!important;}.mf-cell.today{background:rgba(10,31,68,0.04);}.mf-cell.selected{background:rgba(198,169,107,0.10)!important;}.mf-cell.weekend{background:#faf8f4;}.mf-daynum{border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:500;transition:all .15s;}.mf-daynum.today-num{background:#0A1F44;color:#fff;font-weight:800;}.mf-daynum.sel-num{border:2px solid #C6A96B;color:#C6A96B;font-weight:700;}.mf-daynum.weekend-num{color:#C6A96B;}.mf-pill{display:block;width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;border-radius:4px;font-weight:600;cursor:pointer;transition:opacity .12s;box-sizing:border-box;}.mf-pill:hover{opacity:.8;}@media(max-width:390px){.mf-cell{min-height:48px;padding:3px 2px 2px;}.mf-daynum{width:20px;height:20px;font-size:10px;}.mf-pill{font-size:7px;padding:1px 3px;margin-bottom:1px;line-height:1.4;}.mf-legend{display:none!important;}}@media(min-width:391px) and (max-width:600px){.mf-cell{min-height:60px;padding:4px 3px 3px;}.mf-daynum{width:22px;height:22px;font-size:11px;}.mf-pill{font-size:8px;padding:1px 4px;margin-bottom:1px;line-height:1.5;}}@media(min-width:601px) and (max-width:900px){.mf-cell{min-height:80px;padding:5px 4px 4px;}.mf-daynum{width:26px;height:26px;font-size:12px;}.mf-pill{font-size:9px;padding:2px 5px;margin-bottom:2px;line-height:1.5;}}@media(min-width:901px){.mf-cell{min-height:100px;padding:6px 6px 4px;}.mf-daynum{width:30px;height:30px;font-size:13px;}.mf-pill{font-size:10px;padding:2px 6px;margin-bottom:2px;line-height:1.6;}}`;
  return (
    <div className="mf-cal-wrap">
      <style>{AGENDA_CSS}</style>
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,flexWrap:"nowrap",justifyContent:"space-between",width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0,minWidth:0}}>
          <button onClick={()=>{if(mes===0){setMes(11);setAnio(a=>a-1);}else setMes(m=>m-1);}} style={{width:38,height:38,borderRadius:9,border:`1px solid ${B.gray}`,background:B.white,color:B.navy,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>‹</button>
          <div style={{textAlign:"center",minWidth:0,padding:"0 2px"}}>
            <span style={{fontWeight:800,color:B.navy,letterSpacing:"-.5px",fontSize:18}}>{MESES[mes]}</span>
            <span style={{fontSize:12,color:"#64748b",marginLeft:5,fontWeight:400}}>{anio}</span>
          </div>
          <button onClick={()=>{if(mes===11){setMes(0);setAnio(a=>a+1);}else setMes(m=>m+1);}} style={{width:38,height:38,borderRadius:9,border:`1px solid ${B.gray}`,background:B.white,color:B.navy,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>›</button>
        </div>
        <div className="mf-legend" style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",flex:1,justifyContent:"center"}}>
          {TIPO_EVENTO.filter(t=>!esAsistente||!t.privado).map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:"#64748b",fontWeight:500,whiteSpace:"nowrap"}}><div style={{width:7,height:7,borderRadius:"50%",background:t.color,flexShrink:0}}/>{t.label.replace(" 🔒","").replace(" ✈️","")}</div>))}
        </div>
        <div style={{display:"flex",gap:5,flexShrink:0}}>
          <button onClick={()=>{setMes(now.getMonth());setAnio(now.getFullYear());}} style={{padding:"0 12px",height:38,borderRadius:8,border:`1px solid ${B.gray}`,background:B.white,color:B.navy,fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>Hoy</button>
          <button onClick={()=>abrirNuevo(hoy())} style={{padding:"0 13px",height:38,borderRadius:8,border:"none",background:B.navy,color:"#fff",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>+ Evento</button>
        </div>
      </div>
      <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.gray}`,overflow:"hidden",boxShadow:B.shadow}}>
        <div className="mf-cal-hdr">
          {DIAS_MIN.map((d,i)=>(<div key={i} style={{textAlign:"center",padding:"10px 0",fontSize:10,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",color:i>=5?B.gold:"rgba(255,255,255,0.7)"}}>{d}</div>))}
        </div>
        <div className="mf-cal-grid">
          {celdas.map((celda,i)=>{
            const{dia,tipo,fecha:fs}=celda;
            const esGhost=tipo!=="actual";const evs=esGhost?[]:mapEvDia(fs);const esH=fs===hoy();const sel=!esGhost&&diaClick===dia;const colIdx=i%7;const esFin=colIdx>=5;
            const cellClass=["mf-cell",esGhost?"ghost":"",esH?"today":"",sel?"selected":"",esFin&&!esGhost?"weekend":""].filter(Boolean).join(" ");
            return(<div key={`${tipo}-${dia}-${i}`} className={cellClass} style={esGhost?{opacity:.35,cursor:"default",background:esFin?"#faf8f4":"#f9f9f9"}:{}} onClick={()=>{if(esGhost)return;setDiaClick(dia===diaClick?null:dia);setModalDia(true);}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                <div className={["mf-daynum",esH&&!esGhost?"today-num":"",sel&&!esH?"sel-num":"",esFin&&!esH&&!esGhost?"weekend-num":""].filter(Boolean).join(" ")} style={esGhost?{color:"#bbb"}:{}}>{dia}</div>
                {evs.length>0&&<span style={{fontSize:8,color:"#94a3b8",fontWeight:600,marginRight:1}}>{evs.length}</span>}
              </div>
              {!esGhost&&(<div style={{overflow:"hidden",flex:1}}>
                {evs.slice(0,2).map(ev=>(<div key={ev.id} className="mf-pill" onClick={e=>{e.stopPropagation();if(!ev._privado)abrirEditar(ev);}} style={{background:ev._privado?"#f3f4f680":tipoC(ev.tipo)+"20",color:ev._privado?"#9ca3af":tipoC(ev.tipo),borderLeft:`2.5px solid ${tipoC(ev.tipo)}`}}>{ev.horaInicio?`${ev.horaInicio} `:""}{ev.titulo}</div>))}
                {evs.length>2&&<div style={{fontSize:8,color:"#94a3b8",fontWeight:600,paddingLeft:2,lineHeight:1.4}}>+{evs.length-2} más</div>}
              </div>)}
            </div>);
          })}
        </div>
      </div>
      {modalDia&&diaClick&&(
        <MFModal onClose={()=>{setModalDia(false);setDiaClick(null);}} width={440}>
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4}}>{["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"][(new Date(`${anio}-${String(mes+1).padStart(2,"0")}-${String(diaClick).padStart(2,"0")}`).getDay()+6)%7]}</div>
                <div style={{fontSize:36,fontWeight:800,color:B.navy,lineHeight:1,letterSpacing:"-1px"}}>{diaClick}</div>
                <div style={{fontSize:14,color:"#64748b",marginTop:2}}>{MESES[mes]} {anio}</div>
              </div>
              <button onClick={()=>{setModalDia(false);setDiaClick(null);}} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:22,lineHeight:1,padding:4}}>✕</button>
            </div>
            <div style={{height:1,background:`linear-gradient(90deg,transparent,${B.gold}55,transparent)`,marginTop:16}}/>
          </div>
          {diasConEvs.length===0&&(<div style={{textAlign:"center",padding:"32px 0"}}><div style={{fontSize:28,marginBottom:8}}>📅</div><div style={{fontSize:14,color:"#94a3b8",fontWeight:500}}>Sin eventos este día</div></div>)}
          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {diasConEvs.map((ev,idx)=>(
              <div key={ev.id} style={{display:"flex",gap:12,padding:"14px 0",borderBottom:idx<diasConEvs.length-1?`1px solid ${B.gray}22`:"none"}}>
                <div style={{width:60,flexShrink:0,paddingTop:2}}>
                  {!ev._privado&&ev.horaInicio?(<><div style={{fontSize:12,fontWeight:600,color:B.navy}}>{ev.horaInicio}</div>{ev.horaFin&&<div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{ev.horaFin}</div>}</>):(<div style={{fontSize:11,color:"#94a3b8"}}>Todo el día</div>)}
                </div>
                <div style={{width:3,borderRadius:2,background:tipoC(ev.tipo),flexShrink:0,alignSelf:"stretch",minHeight:40}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:ev._privado?"#94a3b8":B.navy,marginBottom:4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{ev.titulo}</div>
                  {!ev._privado&&(<>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:ev.nota||ev.agendadoPor?6:0}}>
                      <Tag color={tipoC(ev.tipo)} small>{tipoL(ev.tipo).replace(" 🔒","").replace(" ✈️"," ✈")}</Tag>
                      {ev.tipo==="trabajo"&&ev.subtipo&&<Tag color={B.navy} small>{SUBTIPO_LABEL[ev.subtipo]||ev.subtipo}</Tag>}
                      {ev.repeticion&&ev.repeticion!=="none"&&<Tag color={B.gold} small>↻ {REPETICION.find(r=>r.v===ev.repeticion)?.l}</Tag>}
                      {ev.fechaFin&&ev.fechaFin!==ev.fechaInicio&&<Tag color="#7c3aed" small>📅 Hasta {fmtF(ev.fechaFin)}</Tag>}
                    </div>
                    {ev.agendadoPor&&(<div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#64748b",marginBottom:4}}><span style={{width:18,height:18,borderRadius:"50%",background:B.navy+"20",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,color:B.navy,flexShrink:0}}>{initials(ev.agendadoPor)}</span><span>Agendado por <strong style={{color:B.navy}}>{ev.agendadoPor}</strong></span></div>)}
                    {ev.nota&&<div style={{fontSize:11,color:"#64748b",lineHeight:1.6,marginTop:2}}>{ev.nota}</div>}
                  </>)}
                </div>
                {!ev._privado&&(!esAsistente||ev.agendadoPor===usuario?.nombre)&&(
                  <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                    <button onClick={()=>{abrirEditar(ev);setModalDia(false);}} style={{width:28,height:28,borderRadius:7,border:`1px solid ${B.gray}`,background:B.white,color:"#64748b",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=B.navy;e.currentTarget.style.color=B.navy;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=B.gray;e.currentTarget.style.color="#64748b";}}>✏️</button>
                    <button onClick={()=>setConfirmEvDel(ev.id)} style={{width:28,height:28,borderRadius:7,border:`1px solid ${B.gray}`,background:B.white,color:"#64748b",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}} onMouseEnter={e=>{e.currentTarget.style.borderColor=B.redBright;e.currentTarget.style.color=B.redBright;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=B.gray;e.currentTarget.style.color="#64748b";}}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button onClick={()=>{abrirNuevo(strD(diaClick));setModalDia(false);}} style={{width:"100%",marginTop:16,padding:"12px",borderRadius:10,border:`1.5px dashed ${B.gray}`,background:"transparent",color:B.navy,fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}} onMouseEnter={e=>{e.currentTarget.style.borderColor=B.gold;e.currentTarget.style.background=B.goldDim;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=B.gray;e.currentTarget.style.background="transparent";}}>
            <span style={{fontSize:16}}>+</span> Agregar evento
          </button>
        </MFModal>
      )}
      {modalEv&&(
        <MFModal onClose={()=>setModalEv(false)} width={500}>
          <MHead title={editId?"Editar evento":"Nuevo evento"} onClose={()=>setModalEv(false)}/>
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <FL label="Título"><Inp value={form.titulo} onChange={v=>sf("titulo",v)} placeholder="Descripción del evento"/></FL>
            <FL label="Tipo de evento">
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {TIPO_EVENTO.filter(t=>!esAsistente||!t.soloAdmin).map(t=>(<button key={t.id} onClick={()=>sf("tipo",t.id)} style={{padding:"6px 13px",borderRadius:20,border:`1.5px solid ${form.tipo===t.id?t.color:B.gray}`,background:form.tipo===t.id?t.color+"16":B.cream,color:form.tipo===t.id?t.color:"#64748b",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:11,cursor:"pointer"}}>{t.label}</button>))}
              </div>
              {form.tipo==="personal"&&<div style={{fontSize:11,color:"#94a3b8",marginTop:5,fontStyle:"italic"}}>🔒 Asistentes solo verán "Ocupado"</div>}
            </FL>
            {(form.tipo==="trabajo"||form.tipo==="cita")&&(
              <FL label={form.tipo==="trabajo"?"Tipo de actividad":"Tipo de cita"}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {TIPO_EVENTO.find(t=>t.id===form.tipo)?.subtipos.map(v=>(<button key={v} onClick={()=>sf("subtipo",v)} style={{padding:"6px 14px",borderRadius:20,border:`1.5px solid ${form.subtipo===v?TIPO_EVENTO.find(t=>t.id===form.tipo)?.color:B.gray}`,background:form.subtipo===v?TIPO_EVENTO.find(t=>t.id===form.tipo)?.color+"14":B.cream,color:form.subtipo===v?TIPO_EVENTO.find(t=>t.id===form.tipo)?.color:"#64748b",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer"}}>{SUBTIPO_LABEL[v]||v}</button>))}
                </div>
              </FL>
            )}
            {form.tipo==="cita"&&(
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",borderRadius:10,background:form.recordatorioCot?"#fffbeb":"#f8f8f8",border:`1.5px solid ${form.recordatorioCot?"#fbbf24":B.gray}`,cursor:"pointer"}} onClick={()=>sf("recordatorioCot",!form.recordatorioCot)}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:18}}>📄</span>
                  <div><div style={{fontSize:12,fontWeight:700,color:B.navy}}>Recordatorio: Enviar cotización</div><div style={{fontSize:10,color:"#64748b"}}>Te aparecerá un pop-up recordatorio</div></div>
                </div>
                <div style={{width:42,height:24,borderRadius:12,background:form.recordatorioCot?"#f59e0b":B.gray,position:"relative"}}>
                  <div style={{position:"absolute",top:3,left:form.recordatorioCot?20:3,width:18,height:18,borderRadius:"50%",background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                </div>
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
              <FL label="Fecha inicio"><Inp type="date" value={form.fechaInicio} onChange={v=>sf("fechaInicio",v)}/></FL>
              <FL label="Fecha fin (opcional)"><Inp type="date" value={form.fechaFin} onChange={v=>sf("fechaFin",v)}/></FL>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
              <FL label="Hora inicio"><HoraSelect value={form.horaInicio} onChange={v=>sf("horaInicio",v)}/></FL>
              <FL label="Hora fin"><HoraSelect value={form.horaFin} onChange={v=>sf("horaFin",v)}/></FL>
            </div>
            <FL label="Repetición"><Sel value={form.repeticion} onChange={v=>sf("repeticion",v)} options={REPETICION}/></FL>
            {form.tipo==="cita"&&(
              <FL label="Vincular cliente">
                <Sel value={form.leadId} onChange={v=>sf("leadId",v)} options={[{v:"",l:"-- Seleccionar cliente --"},...leads.map(l=>({v:l.id,l:`${l.nombre} · ${l.producto}`}))]}/>
                {form.leadId&&leads.find(l=>l.id===form.leadId)&&(<div style={{marginTop:6,padding:"8px 12px",borderRadius:8,background:B.greenDim,border:`1px solid ${B.green}22`,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:13}}>👤</span><div><div style={{fontSize:12,fontWeight:700,color:B.green}}>{leads.find(l=>l.id===form.leadId)?.nombre}</div><div style={{fontSize:10,color:"#64748b"}}>{leads.find(l=>l.id===form.leadId)?.producto}</div></div></div>)}
              </FL>
            )}
            <FL label="Notas"><Inp value={form.nota} onChange={v=>sf("nota",v)} rows={2} placeholder="Detalles del evento..."/></FL>
          </div>
          {editId&&<div style={{marginTop:12}}><Btn onClick={()=>setConfirmEvDel(editId)} color={B.redBright} outline small>Eliminar evento</Btn></div>}
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:20}}>
            <Btn onClick={()=>setModalEv(false)} color="#64748b" outline small>Cancelar</Btn>
            <Btn onClick={guardar} bg={B.navy} small>Guardar evento</Btn>
          </div>
        </MFModal>
      )}
      {popupCot&&(<div style={{position:"fixed",inset:0,background:"rgba(10,31,68,.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}><div style={{background:B.white,borderRadius:18,padding:32,maxWidth:380,width:"100%",boxShadow:B.shadowLg,animation:"fadeUp .25s ease",textAlign:"center"}}><div style={{fontSize:44,marginBottom:12}}>📄</div><div style={{fontSize:18,fontWeight:800,color:B.navy,marginBottom:8}}>Recordatorio</div><div style={{fontSize:14,color:"#475569",lineHeight:1.6,marginBottom:6}}>Tienes pendiente enviar la <strong>cotización</strong></div>{popupCot.leadNombre&&<div style={{fontSize:13,color:B.green,fontWeight:600,marginBottom:6}}>👤 {popupCot.leadNombre}</div>}<div style={{fontSize:13,color:"#64748b",marginBottom:24}}>{popupCot.titulo}</div><div style={{display:"flex",gap:10,justifyContent:"center"}}><button onClick={()=>setPopupCot(null)} style={{padding:"10px 24px",borderRadius:10,border:`1.5px solid ${B.gray}`,background:B.cream,color:B.navy,fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:13,cursor:"pointer"}}>Ya lo hice ✓</button><button onClick={()=>setPopupCot(null)} style={{padding:"10px 24px",borderRadius:10,border:"none",background:B.navy,color:"#fff",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:13,cursor:"pointer"}}>Entendido</button></div></div></div>)}
      {confirmEvDel&&<ConfirmModal titulo="¿Eliminar este evento?" mensaje="Esta acción no se puede deshacer." icono="🗓️" textoConfirm="Sí, eliminar" colorConfirm={B.redBright} onConfirm={()=>{elimEv(confirmEvDel);setConfirmEvDel(null);setModalEv(false);}} onCancel={()=>setConfirmEvDel(null)}/>}
    </div>
  );
}
function _AgendaPanelLateral(){return null;}

function ListaLeads({leads,setLeads,cuentas,usuario,esAsistente}) {
  const now=new Date();
  const mesHoy=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const nextDate=new Date(now.getFullYear(),now.getMonth()+1,1);
  const mesSig=`${nextDate.getFullYear()}-${String(nextDate.getMonth()+1).padStart(2,"0")}`;
  const [tab,setTab]=useState("actual");
  const [busq,setBusq]=useState("");
  const [filtProd,setFiltProd]=useState("");
  const [filtEtapa,setFiltEtapa]=useState("");
  const [filtTemp,setFiltTemp]=useState("");
  const [contactoL,setContactoL]=useState(null);
  const [leadAct,setLeadAct]=useState(null);
  const [nuevoM,setNuevoM]=useState(false);
  const [seleccionados,setSeleccionados]=useState(()=>new Set());
  const [confirmandoBorrado,setConfirmandoBorrado]=useState(false);
  const emptyL={id:uid(),nombre:"",telefono:"",correo:"",edad:"",producto:PRODUCTOS_LEAD[0],estado:"",etapa:"nuevo",ultimoContacto:hoy(),notas:"",objeciones:"",intereses:"",motivador:"",checklist:{...EMPTY_CHECK},seguimientos:[],sinSeguimiento:false,asignadoA:null,mesCreacion:tab==="sig"?mesSig:mesHoy};
  const mesesDisponibles=[...new Set(leads.map(l=>l.mesCreacion||l.ultimoContacto?.slice(0,7)||mesHoy).filter(Boolean))].sort().reverse();
  const leadsActual=leads.filter(l=>{const mc=l.mesCreacion||l.ultimoContacto?.slice(0,7)||mesHoy;return mc===mesHoy||(mc<mesHoy&&l.etapa==="seguimiento"&&!l.sinSeguimiento);});
  const leadsSiguiente=leads.filter(l=>{const mc=l.mesCreacion||l.ultimoContacto?.slice(0,7)||mesHoy;return mc===mesSig;});
  const leadsHistorico=(tab!=="actual"&&tab!=="sig")?leads.filter(l=>(l.mesCreacion||l.ultimoContacto?.slice(0,7)||mesHoy)===tab):[];
  let base=tab==="actual"?leadsActual:tab==="sig"?leadsSiguiente:leadsHistorico;
  if(busq)base=base.filter(l=>l.nombre.toLowerCase().includes(busq.toLowerCase())||l.telefono?.includes(busq)||l.estado?.toLowerCase().includes(busq.toLowerCase()));
  if(filtProd)base=base.filter(l=>l.producto===filtProd);
  if(filtEtapa)base=base.filter(l=>l.etapa===filtEtapa);
  if(filtTemp)base=base.filter(l=>getTempLead(l)?.nivel===filtTemp);
  const vis=base;
  const total=vis.length;const activos=vis.filter(l=>!l.sinSeguimiento&&!["otro","cierre"].includes(l.etapa)).length;const sinSeg=vis.filter(l=>l.sinSeguimiento).length;const calientes=vis.filter(l=>getTempLead(l)?.nivel==="caliente").length;
  const seguAnt=tab==="actual"?leadsActual.filter(l=>{const mc=l.mesCreacion||l.ultimoContacto?.slice(0,7)||mesHoy;return mc<mesHoy&&l.etapa==="seguimiento"&&!l.sinSeguimiento;}).length:0;
  function save(d){setLeads(p=>p.find(l=>l.id===d.id)?p.map(l=>l.id===d.id?d:l):[...p,d]);}
  function del(id){setLeads(p=>p.filter(l=>l.id!==id));}

  // ── Selección múltiple ──
  function toggleSeleccion(id, e){
    if (e) e.stopPropagation();
    setSeleccionados(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  const visIds = vis.map(l => l.id);
  const todosVisSeleccionados = visIds.length > 0 && visIds.every(id => seleccionados.has(id));
  function toggleSeleccionarTodos(){
    if (todosVisSeleccionados) {
      setSeleccionados(prev => { const n = new Set(prev); visIds.forEach(id => n.delete(id)); return n; });
    } else {
      setSeleccionados(prev => new Set([...prev, ...visIds]));
    }
  }
  function limpiarSeleccion(){ setSeleccionados(new Set()); }
  function confirmarBorradoMasivo(){
    setLeads(p => p.filter(l => !seleccionados.has(l.id)));
    setSeleccionados(new Set());
    setConfirmandoBorrado(false);
  }

  const LISTA_CSS=`.mf-table{width:100%;border-collapse:collapse;min-width:580px;}.mf-th{text-align:left;padding:10px 12px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.8px;border-bottom:2px solid #E5E7EB;white-space:nowrap;background:#F8F6F2;position:sticky;top:0;z-index:1;}.mf-td{padding:10px 12px;font-size:13px;border-bottom:1px solid rgba(229,231,235,.5);vertical-align:middle;}.mf-tr{transition:background .12s;cursor:pointer;}.mf-tr:hover .mf-td{background:rgba(10,31,68,.025);}.mf-tr.rojo .mf-td{background:#fef2f2;}.mf-tr.seg-ant .mf-td{background:#fffbeb;}.mf-tel-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 11px;border-radius:20px;border:1px solid #E5E7EB;background:#fff;color:#0A1F44;font-family:'Poppins',sans-serif;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;white-space:nowrap;}.mf-tel-btn:hover{border-color:#0A1F44;background:#0A1F44;color:#fff;}@media(max-width:640px){.mf-col-hide{display:none!important;}}`;
  const fmtMes=m=>{const[y,mo]=m.split("-");return `${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(mo)-1]} ${y}`;};
  return(<div>
    <style>{LISTA_CSS}</style>
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",gap:0,background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:4,overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none"}}>
        <button onClick={()=>setTab("actual")} style={{flexShrink:0,padding:"8px 16px",borderRadius:9,border:"none",background:tab==="actual"?B.navy:"transparent",color:tab==="actual"?B.white:"#64748b",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>📅 {fmtMes(mesHoy)}<span style={{marginLeft:6,padding:"1px 7px",borderRadius:20,background:tab==="actual"?"rgba(255,255,255,.2)":"rgba(10,31,68,.08)",fontSize:10,fontWeight:700}}>{leadsActual.length}</span></button>
        <div style={{width:1,background:B.gray,margin:"4px 2px",flexShrink:0}}/>
        {!esAsistente&&(<button onClick={()=>setTab("sig")} style={{flexShrink:0,padding:"8px 14px",borderRadius:9,border:"none",background:tab==="sig"?B.green:"transparent",color:tab==="sig"?B.white:"#64748b",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>📆 {fmtMes(mesSig)}<span style={{marginLeft:4,padding:"1px 6px",borderRadius:20,background:tab==="sig"?"rgba(255,255,255,.2)":"rgba(10,31,68,.08)",fontSize:10,fontWeight:700}}>{leadsSiguiente.length}</span></button>)}
        <div style={{width:1,background:B.gray,margin:"4px 2px",flexShrink:0}}/>
        {mesesDisponibles.filter(m=>m!==mesHoy&&m!==mesSig).map(m=>(<button key={m} onClick={()=>setTab(m)} style={{flexShrink:0,padding:"8px 14px",borderRadius:9,border:"none",background:tab===m?B.navyMid||"#122550":"transparent",color:tab===m?B.white:"#64748b",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>{fmtMes(m)}<span style={{marginLeft:4,padding:"1px 6px",borderRadius:20,background:tab===m?"rgba(255,255,255,.18)":"rgba(10,31,68,.08)",fontSize:10,fontWeight:700}}>{leads.filter(l=>(l.mesCreacion||l.ultimoContacto?.slice(0,7)||mesHoy)===m).length}</span></button>))}
      </div>
      {tab==="actual"&&seguAnt>0&&(<div style={{marginTop:8,padding:"8px 14px",borderRadius:8,background:"#fffbeb",border:"1px solid #fde68a",fontSize:12,color:B.amber,fontWeight:500,display:"flex",alignItems:"center",gap:6}}><span>⟳</span><span>{seguAnt} lead{seguAnt!==1?"s":""} de meses anteriores en <strong>Seguimiento</strong> incluido{seguAnt!==1?"s":""}.</span></div>)}
      {tab==="sig"&&!esAsistente&&(<div style={{marginTop:8,padding:"8px 14px",borderRadius:8,background:B.greenDim,border:`1px solid ${B.green}28`,fontSize:12,color:B.green,fontWeight:500,display:"flex",alignItems:"center",gap:6}}><span>📆</span><span>Leads del <strong>próximo mes</strong>.</span></div>)}
    </div>
    <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
      {[{l:"Total",v:total,c:B.navy},{l:"Activos",v:activos,c:B.green},{l:"🔥 Calientes",v:calientes,c:"#dc2626"},{l:"Sin seguimiento",v:sinSeg,c:B.redBright}].map((s,i)=>(<div key={i} style={{background:B.white,border:`1px solid ${B.gray}`,borderLeft:`3px solid ${s.c}`,borderRadius:9,padding:"10px 14px",boxShadow:B.shadow}}><div style={{fontSize:9,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".6px"}}>{s.l}</div><div style={{fontSize:22,fontWeight:800,color:s.c,lineHeight:1.2,marginTop:2}}>{s.v}</div></div>))}
    </div>
    <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
      <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="🔍 Nombre, teléfono o estado..." style={{flex:1,minWidth:0,padding:"11px 13px",borderRadius:8,border:`1.5px solid ${B.gray}`,background:B.white,fontFamily:"'Poppins',sans-serif",fontSize:16,outline:"none",minHeight:44,WebkitAppearance:"none"}} onFocus={e=>e.target.style.borderColor=B.gold} onBlur={e=>e.target.style.borderColor=B.gray}/>
      <Sel value={filtProd} onChange={setFiltProd} options={[{v:"",l:"Producto"},...PRODUCTOS_LEAD.map(p=>({v:p,l:p}))]}/>
      <Sel value={filtEtapa} onChange={setFiltEtapa} options={[{v:"",l:"Etapa"},...ETAPAS.map(e=>({v:e.id,l:e.label}))]}/>
      <Sel value={filtTemp} onChange={setFiltTemp} options={[{v:"",l:"Temperatura"},{v:"caliente",l:"🔥 Caliente"},{v:"tibio",l:"🟡 Tibio"},{v:"frio",l:"❄️ Frío"}]}/>
      {(busq||filtProd||filtEtapa||filtTemp)&&(<button onClick={()=>{setBusq("");setFiltProd("");setFiltEtapa("");setFiltTemp("");}} style={{padding:"7px 12px",borderRadius:8,border:`1px solid ${B.gray}`,background:B.white,color:"#64748b",fontFamily:"'Poppins',sans-serif",fontSize:11,cursor:"pointer"}}>✕ Limpiar</button>)}
      <button onClick={()=>setNuevoM(true)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:B.navy,color:"#fff",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>+ Lead</button>
    </div>
    <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.gray}`,boxShadow:B.shadow,overflow:"hidden"}}>
      <div className="mf-table-wrap">
        <table className="mf-table">
          <thead><tr>
            <th className="mf-th" style={{width:36,textAlign:"center",padding:"10px 6px"}}>
              <input type="checkbox" checked={todosVisSeleccionados} onChange={toggleSeleccionarTodos} aria-label="Seleccionar todos los visibles" style={{width:16,height:16,cursor:"pointer",accentColor:B.navy}}/>
            </th>
            <th className="mf-th">#</th><th className="mf-th">Nombre</th><th className="mf-th">Contacto</th><th className="mf-th mf-col-hide">Estado</th><th className="mf-th mf-col-hide">Producto</th><th className="mf-th">Etapa</th><th className="mf-th">T°</th><th className="mf-th mf-col-hide">Último contacto</th><th className="mf-th">Checklist</th>
          </tr></thead>
          <tbody>
            {vis.length===0&&(<tr><td colSpan={10} className="mf-td" style={{textAlign:"center",color:"#94a3b8",padding:"40px 16px"}}>Sin leads en este período</td></tr>)}
            {vis.map((lead,idx)=>{
              const etapa=ETAPAS.find(e=>e.id===lead.etapa)||ETAPAS[0];const temp=getTempLead(lead);const alerts=getAlertas(lead);const sinSeg2=lead.sinSeguimiento||lead.checklist?.noInteres;const mc=lead.mesCreacion||lead.ultimoContacto?.slice(0,7)||mesHoy;const esSeguAnt=tab==="actual"&&mc<mesHoy&&lead.etapa==="seguimiento";const chkDone=Object.values(lead.checklist||{}).filter(Boolean).length;const chkTot=CHECKLIST_DEF.length;
              const seleccionado=seleccionados.has(lead.id);
              return(<tr key={lead.id} className={`mf-tr${sinSeg2?" rojo":esSeguAnt?" seg-ant":""}`} onClick={()=>setLeadAct(lead)} style={seleccionado?{background:B.gold+"12"}:{}}>
                <td className="mf-td" style={{width:36,textAlign:"center",padding:"10px 6px"}} onClick={e=>e.stopPropagation()}>
                  <input type="checkbox" checked={seleccionado} onChange={(e)=>toggleSeleccion(lead.id, e)} aria-label={`Seleccionar ${lead.nombre}`} style={{width:16,height:16,cursor:"pointer",accentColor:B.navy}}/>
                </td>
                <td className="mf-td" style={{color:"#94a3b8",fontSize:11,width:32}}>{idx+1}</td>
                <td className="mf-td"><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:32,height:32,borderRadius:"50%",flexShrink:0,background:sinSeg2?B.redDim:esSeguAnt?"#fde68a44":B.navy+"12",border:`1.5px solid ${sinSeg2?B.redBright+"44":esSeguAnt?"#fcd34d":B.navy+"20"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:sinSeg2?B.redBright:esSeguAnt?B.amber:B.navy}}>{initials(lead.nombre)}</div><div style={{minWidth:0}}><div style={{fontWeight:700,color:sinSeg2?B.redBright:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{sinSeg2?"🚫 ":esSeguAnt?"⟳ ":""}{lead.nombre}</div><div style={{fontSize:10,color:"#94a3b8"}}>{lead.edad&&`${lead.edad} años`}{esSeguAnt&&<span style={{color:B.amber,fontWeight:600}}> · seguimiento anterior</span>}</div>{alerts.slice(0,1).map((a,i)=>(<div key={i} style={{fontSize:9,color:a.color,fontWeight:600}}>{a.msg}</div>))}</div></div></td>
                <td className="mf-td" onClick={e=>e.stopPropagation()}><button className="mf-tel-btn" onClick={()=>setContactoL(lead)}>📞 {lead.telefono||"--"}</button></td>
                <td className="mf-td mf-col-hide" style={{color:"#475569",fontSize:12}}>{lead.estado||"--"}</td>
                <td className="mf-td mf-col-hide">{lead.producto&&<Tag color={B.navy} small>{lead.producto}</Tag>}</td>
                <td className="mf-td"><Tag color={etapa.color} small>{etapa.icon} {etapa.label}</Tag></td>
                <td className="mf-td" style={{fontSize:18,textAlign:"center"}}>{temp?.icon||<span style={{color:"#e5e7eb",fontSize:12}}>--</span>}</td>
                <td className="mf-td mf-col-hide" style={{fontSize:11,color:"#94a3b8"}}>{fmtF(lead.ultimoContacto)}</td>
                <td className="mf-td" onClick={e=>e.stopPropagation()}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:48,height:5,background:B.gray,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",borderRadius:3,transition:"width .3s",width:`${Math.round(chkDone/chkTot*100)}%`,background:sinSeg2?B.redBright:chkDone>=5?B.green:chkDone>=3?B.amber:B.blue}}/></div><span style={{fontSize:10,color:"#94a3b8",fontWeight:600,whiteSpace:"nowrap"}}>{chkDone}/{chkTot}</span></div></td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
      <div style={{padding:"10px 16px",borderTop:`1px solid ${B.gray}`,fontSize:11,color:"#94a3b8",fontWeight:500}}>{vis.length} lead{vis.length!==1?"s":""} · {tab==="actual"?`${fmtMes(mesHoy)} (mes actual)`:fmtMes(tab)}</div>
    </div>
    {contactoL&&<ContactoModal lead={contactoL} onClose={()=>setContactoL(null)}/>}
    {leadAct&&<LeadModal lead={leadAct} onClose={()=>setLeadAct(null)} onSave={save} onDelete={del} cuentas={cuentas} usuario={usuario}/>}
    {nuevoM&&<LeadModal lead={{...emptyL,mesCreacion:tab==="sig"?mesSig:mesHoy}} onClose={()=>setNuevoM(false)} onSave={d=>{save(d);setNuevoM(false);}} onDelete={()=>{}} cuentas={cuentas} usuario={usuario}/>}

    {/* Barra de acción de selección múltiple — flotante abajo */}
    {seleccionados.size > 0 && (
      <div style={{
        position:"fixed", bottom:18, left:"50%", transform:"translateX(-50%)",
        zIndex:800, background:B.navy, color:B.white,
        borderRadius:14, padding:"12px 16px",
        boxShadow:"0 12px 40px rgba(10,31,68,.4)",
        display:"flex", alignItems:"center", gap:14, flexWrap:"wrap",
        border:`1px solid ${B.gold}55`,
        animation:"fadeUp .2s ease",
        maxWidth:"calc(100vw - 32px)",
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:B.gold,color:B.navy,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13}}>
            {seleccionados.size}
          </div>
          <span style={{fontSize:13,fontWeight:600}}>
            {seleccionados.size === 1 ? "1 lead seleccionado" : `${seleccionados.size} leads seleccionados`}
          </span>
        </div>
        <button onClick={()=>setConfirmandoBorrado(true)} style={{
          padding:"9px 16px", borderRadius:9, border:"none",
          background:B.redBright, color:"#fff",
          fontFamily:"'Poppins',sans-serif", fontWeight:700, fontSize:12,
          cursor:"pointer", display:"inline-flex", alignItems:"center", gap:6,
          boxShadow:`0 4px 14px ${B.redBright}66`,
        }}>
          🗑 Eliminar
        </button>
        <button onClick={limpiarSeleccion} style={{
          padding:"9px 14px", borderRadius:9,
          border:"1px solid rgba(255,255,255,0.2)",
          background:"transparent", color:"rgba(255,255,255,0.85)",
          fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:12,
          cursor:"pointer",
        }}>
          Limpiar
        </button>
      </div>
    )}

    {/* Modal de confirmación de borrado masivo */}
    {confirmandoBorrado && (
      <ConfirmModal
        titulo={`¿Eliminar ${seleccionados.size} ${seleccionados.size === 1 ? "lead" : "leads"}?`}
        mensaje="Esta acción no se puede deshacer. Los leads seleccionados se borrarán permanentemente."
        icono="🗑️"
        textoConfirm={`Sí, eliminar ${seleccionados.size}`}
        onConfirm={confirmarBorradoMasivo}
        onCancel={()=>setConfirmandoBorrado(false)}
      />
    )}
  </div>);
}

function Mensajes() {
  const [cat,setCat]=useState("primer_contacto");
  const [copiado,setCopiado]=useState(null);
  const [editando,setEditando]=useState(null);
  const [tmpl,setTmpl]=useState(MENSAJES_TPL);
  const cats=[{id:"primer_contacto",l:"Primer contacto",c:B.navy},{id:"seguimiento",l:"Seguimiento",c:B.purple},{id:"cierre",l:"Cierre",c:B.green},{id:"reactivacion",l:"Reactivación",c:B.teal}];
  const catAct=cats.find(c=>c.id===cat);
  function copiar(txt,k){navigator.clipboard?.writeText(txt);setCopiado(k);setTimeout(()=>setCopiado(null),1800);}
  return <div>
    <div style={{display:"flex",gap:6,marginBottom:20,background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:5}}>
      {cats.map(c=><button key={c.id} onClick={()=>setCat(c.id)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:"none",background:cat===c.id?c.c:B.cream,color:cat===c.id?B.white:"#6b7280",fontFamily:"Poppins",fontWeight:600,fontSize:12,cursor:"pointer",transition:"all .15s"}}>{c.l}</button>)}
    </div>
    <div style={{display:"grid",gap:12,marginBottom:24}}>
      {(tmpl[cat]||[]).map((m,i)=>{const k=`${cat}-${i}`;const wa=`https://wa.me/?text=${encodeURIComponent(m.body)}`;return <div key={i} style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,overflow:"hidden",boxShadow:B.shadow}}><div style={{background:B.cream,padding:"11px 16px",borderBottom:`1px solid ${B.gray}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,fontWeight:700,color:B.navy}}>{m.titulo}</div><div style={{display:"flex",gap:6}}><Btn onClick={()=>setEditando({cat,idx:i,body:m.body})} color="#6b7280" outline small>Editar</Btn><a href={wa} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}><Btn color="#25d366" outline small>WhatsApp</Btn></a><Btn onClick={()=>copiar(m.body,k)} color={copiado===k?B.green:catAct.c} outline small>{copiado===k?"✓ Copiado":"Copiar"}</Btn></div></div><div style={{padding:"14px 16px"}}><pre style={{fontFamily:"Poppins",fontSize:13,color:"#4b5563",lineHeight:1.8,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.body}</pre></div></div>;})}
    </div>
    <div style={{background:B.navy,borderRadius:14,padding:"20px 24px",position:"relative",overflow:"hidden"}}>
      <svg style={{position:"absolute",bottom:0,right:0,opacity:.1}} width="200" height="80" viewBox="0 0 200 80"><path d="M0 50 Q50 20 100 40 Q150 60 200 20 L200 80 L0 80Z" fill={B.gold}/></svg>
      <div style={{fontSize:14,fontWeight:700,color:B.white,marginBottom:14}}>Principios · Ventas de alto valor</div>
      {[{n:"01",t:"Vende tranquilidad, no pólizas",d:"Tu cliente compra certeza de que su familia estará bien."},{n:"02",t:"El silencio cierra ventas",d:"Tras presentar, guarda silencio. El primero en hablar, pierde."},{n:"03",t:"5 contactos antes de descartar",d:"El 80% de ventas ocurre después del 5to contacto."},{n:"04",t:"Referidos en el momento cumbre",d:"Pregunta al cierre: '¿Conoces a alguien que se beneficiaría?'"},{n:"05",t:"Urgencia real, nunca inventada",d:"Usa fechas de vigencia reales. La urgencia falsa destruye la confianza."}].map(tip=>(<div key={tip.n} style={{display:"flex",gap:14,marginBottom:12,paddingBottom:12,borderBottom:`1px solid rgba(255,255,255,.08)`}}><div style={{fontSize:20,fontWeight:800,color:B.gold,flexShrink:0,width:28}}>{tip.n}</div><div><div style={{fontSize:12,fontWeight:700,color:B.white,marginBottom:2}}>{tip.t}</div><div style={{fontSize:11,color:"rgba(255,255,255,.45)"}}>{tip.d}</div></div></div>))}
    </div>
    {editando&&<MFModal onClose={()=>setEditando(null)} width={500}><MHead title="Editar mensaje" onClose={()=>setEditando(null)}/><Inp value={editando.body} onChange={v=>setEditando(p=>({...p,body:v}))} rows={10} placeholder="Escribe el mensaje..."/><div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}><Btn onClick={()=>setEditando(null)} color="#6b7280" outline small>Cancelar</Btn><Btn onClick={()=>{setTmpl(p=>({...p,[editando.cat]:p[editando.cat].map((m,i)=>i===editando.idx?{...m,body:editando.body}:m)}));setEditando(null);}} bg={B.navy} small>Guardar</Btn></div></MFModal>}
  </div>;
}

function Cobranza() {
  const [datos,setDatos]=useState([]);const [cargando,setCargando]=useState(false);const [filtProd,setFiltProd]=useState("");const [tab,setTab]=useState("dashboard");const fileRef=useRef();
  const ahora=new Date();const mesBd=`${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}`;const mesSig=new Date(ahora.getFullYear(),ahora.getMonth()+1,1);const mesSigBd=`${mesSig.getFullYear()}-${String(mesSig.getMonth()+1).padStart(2,"0")}`;
  function normFecha(v){if(!v)return null;const s=String(v).trim();if(/^\d{5}$/.test(s)){const d=new Date((Number(s)-25569)*86400000);return d.toISOString().split("T")[0];}if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)){const[d,m,y]=s.split("/");return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;}if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;try{const d=new Date(s);if(!isNaN(d.getTime()))return d.toISOString().split("T")[0];}catch{}return null;}
  async function cargarExcel(e){const file=e.target.files?.[0];if(!file)return;setCargando(true);try{const{default:XLSX}=await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");const ab=await file.arrayBuffer();const wb=XLSX.read(ab);const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{defval:""});const mapped=rows.map(r=>{const poliza=String(r["Póliza"]||r["Poliza"]||r["No. Póliza"]||r["POLIZA"]||r["poliza"]||"").trim();const nombre=String(r["Nombre"]||r["Cliente"]||r["NOMBRE"]||r["nombre"]||"").trim();const producto=String(r["Producto"]||r["PRODUCTO"]||r["producto"]||r["Ramo"]||"").trim();const vencStr=r["Vencimiento"]||r["Fecha Vencimiento"]||r["FechaVencimiento"]||r["VENCIMIENTO"]||r["Renovación"]||r["Renovacion"]||"";const vencimiento=normFecha(vencStr);const diasAtraso=Number(r["Días Atraso"]||r["Dias Atraso"]||r["DiasAtraso"]||r["dias_atraso"]||0)||0;const estatus=String(r["Estatus"]||r["Status"]||r["ESTATUS"]||"Al corriente").trim();const telefono=String(r["Teléfono"]||r["Telefono"]||r["TEL"]||"").trim();return{poliza,nombre,producto,vencimiento,diasAtraso,estatus,telefono};}).filter(r=>r.nombre||r.poliza);setDatos(mapped);setTab("dashboard");}catch{alert("Error al leer el archivo.");}setCargando(false);e.target.value="";}
  async function exportarFiltrado(lista,nombre){try{const{default:XLSX}=await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");const data=lista.map(r=>({Póliza:r.poliza,Cliente:r.nombre,Producto:r.producto,"Fecha vencimiento":fmtF(r.vencimiento),"Días atraso":r.diasAtraso,Estatus:r.estatus,Teléfono:r.telefono}));const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Cobranza MarFlow");XLSX.writeFile(wb,`marflow_cobranza_${nombre}_${hoy()}.xlsx`);}catch{alert("Error al exportar.");}}
  const datosFilt=datos.filter(d=>!filtProd||d.producto.toLowerCase().includes(filtProd.toLowerCase()));
  const renovMes=datosFilt.filter(d=>d.vencimiento&&d.vencimiento.startsWith(mesBd));
  const renovSig=datosFilt.filter(d=>d.vencimiento&&d.vencimiento.startsWith(mesSigBd));
  const atraso35=datosFilt.filter(d=>d.diasAtraso>35);
  const alCorriente=datosFilt.filter(d=>d.diasAtraso===0||d.estatus.toLowerCase().includes("corriente")||d.estatus.toLowerCase().includes("vigente"));
  const statusColor=d=>{if(d.diasAtraso>35)return{bg:B.redLight,border:B.redBright+"44",text:B.redBright,badge:"🔴 Crítico"};if(d.diasAtraso>0&&d.diasAtraso<=35)return{bg:B.amberLight||"#fffbeb",border:B.amber+"44",text:B.amber,badge:"🟡 Atraso"};return{bg:B.greenLight||"#dcfce7",border:B.green+"44",text:B.green,badge:"🟢 Al corriente"};};
  function Tabla({lista,cols,titulo,color,onExport}){if(lista.length===0)return <div style={{fontSize:12,color:"#9ca3af",textAlign:"center",padding:"20px 0"}}>Sin registros</div>;return <><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontSize:13,fontWeight:700,color}}>{titulo} · {lista.length} registro{lista.length!==1?"s":""}</div><Btn onClick={onExport} color={B.navy} outline small>📥 Exportar</Btn></div><div className="mf-table-wrap"><table style={{width:"100%",borderCollapse:"collapse",minWidth:550}}><thead><tr style={{background:B.cream}}>{cols.map(c=><th key={c} style={{textAlign:"left",padding:"9px 12px",fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".7px",borderBottom:`1px solid ${B.gray}`}}>{c}</th>)}</tr></thead><tbody>{lista.map((r,i)=>{const sc=statusColor(r);return <tr key={i} style={{background:sc.bg,borderBottom:`1px solid ${B.gray}22`}}><td style={{padding:"10px 12px",fontSize:12,fontWeight:600,color:B.navy}}>{r.poliza||"--"}</td><td style={{padding:"10px 12px",fontSize:12,color:B.black}}>{r.nombre}</td><td style={{padding:"10px 12px"}}><Tag color={B.navy} small>{r.producto||"--"}</Tag></td><td style={{padding:"10px 12px",fontSize:12,color:"#6b7280"}}>{fmtF(r.vencimiento)}</td>{cols.includes("Días atraso")&&<td style={{padding:"10px 12px"}}><span style={{fontWeight:700,color:sc.text,fontSize:12}}>{r.diasAtraso>0?`${r.diasAtraso}d`:"--"}</span></td>}{cols.includes("Estatus")&&<td style={{padding:"10px 12px"}}><Tag color={sc.text} small>{sc.badge}</Tag></td>}{cols.includes("Contacto")&&<td style={{padding:"10px 12px"}}>{r.telefono?<a href={`https://wa.me/52${r.telefono.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{textDecoration:"none",fontSize:11,color:"#25d366",fontWeight:600}}>💬 WA</a>:<span style={{color:"#9ca3af",fontSize:11}}>--</span>}</td>}</tr>;})}</tbody></table></div></>;}
  if(datos.length===0)return(<div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 20px",textAlign:"center"}}><div style={{width:80,height:80,borderRadius:"50%",background:B.goldDim,border:`2px solid ${B.goldBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,marginBottom:20}}>💰</div><div style={{fontSize:20,fontWeight:700,color:B.navy,marginBottom:8}}>Módulo de Cobranza</div><div style={{fontSize:13,color:"#6b7280",maxWidth:420,lineHeight:1.7,marginBottom:28}}>Sube tu archivo Excel de cobranza para ver renovaciones, atrasos y alertas automáticas.</div><input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={cargarExcel}/><Btn onClick={()=>fileRef.current?.click()} bg={B.navy} style={{padding:"12px 28px",fontSize:14}} disabled={cargando}>{cargando?"Procesando...":"📂 Subir Excel de cobranza"}</Btn></div>);
  return <div><div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}><input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={cargarExcel}/><Btn onClick={()=>fileRef.current?.click()} color={B.green} outline small>📂 Actualizar Excel</Btn><input value={filtProd} onChange={e=>setFiltProd(e.target.value)} placeholder="Filtrar por producto..." style={{padding:"11px 13px",borderRadius:8,border:`1.5px solid ${B.gray}`,background:B.white,color:B.black,fontFamily:"'Poppins',sans-serif",fontSize:16,outline:"none",minHeight:44,WebkitAppearance:"none",flex:1,minWidth:0}} onFocus={e=>e.target.style.borderColor=B.gold} onBlur={e=>e.target.style.borderColor=B.gray}/><div style={{fontSize:12,color:"#9ca3af"}}>{datosFilt.length} registros</div></div><div style={{display:"flex",gap:4,marginBottom:20,background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:5}}>{[{v:"dashboard",l:"📊 Dashboard"},{v:"renovMes",l:`🔄 Reno. este mes (${renovMes.length})`},{v:"renovSig",l:`📅 Reno. próx. mes (${renovSig.length})`},{v:"atraso",l:`⚠️ Atraso +35d (${atraso35.length})`},{v:"todos",l:"📋 Todos"}].map(t=>(<button key={t.v} onClick={()=>setTab(t.v)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:"none",background:tab===t.v?B.navy:B.cream,color:tab===t.v?B.white:"#6b7280",fontFamily:"Poppins",fontWeight:600,fontSize:11,cursor:"pointer"}}>{t.l}</button>))}</div>{tab==="dashboard"&&<div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:18}}>{[{l:"Total registros",v:datosFilt.length,c:B.navy,icon:"📋"},{l:"Renovaciones este mes",v:renovMes.length,c:B.amber,icon:"🔄"},{l:"Renovaciones próx. mes",v:renovSig.length,c:B.blue,icon:"📅"},{l:"Atraso crítico +35d",v:atraso35.length,c:B.redBright,icon:"🔴"},{l:"Al corriente",v:alCorriente.length,c:B.green,icon:"🟢"}].map((s,i)=>(<div key={i} style={{background:B.white,border:`1px solid ${B.gray}`,borderLeft:`4px solid ${s.c}`,borderRadius:12,padding:"14px 16px",boxShadow:B.shadow}}><div style={{fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:".6px",marginBottom:6}}>{s.l}</div><div style={{fontSize:30,fontWeight:800,color:s.c,lineHeight:1,marginBottom:2}}>{s.v}</div><div style={{fontSize:18}}>{s.icon}</div></div>))}</div>{atraso35.length>0&&<div style={{background:B.redLight,border:`1.5px solid ${B.redBright}33`,borderRadius:12,padding:"16px 20px",marginBottom:16}}><div style={{fontSize:14,fontWeight:700,color:B.redBright,marginBottom:10}}>🔴 Cobranza crítica ({atraso35.slice(0,5).length})</div>{atraso35.slice(0,5).map((r,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${B.redBright}22`}}><div><div style={{fontSize:12,fontWeight:700,color:B.navy}}>{r.nombre}</div><div style={{fontSize:11,color:B.redBright,fontWeight:600}}>{r.diasAtraso}d · {r.producto}</div></div>{r.telefono&&<a href={`https://wa.me/52${r.telefono.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{width:30,height:30,borderRadius:"50%",background:"#dcfce7",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,textDecoration:"none"}}>💬</a>}</div>))}</div>}{renovMes.length>0&&<div style={{background:B.amberLight||"#fffbeb",border:`1.5px solid ${B.amber}33`,borderRadius:12,padding:"16px 20px"}}><div style={{fontSize:14,fontWeight:700,color:B.amber,marginBottom:10}}>🔄 Renovaciones {MESES[ahora.getMonth()]} ({renovMes.slice(0,5).length})</div>{renovMes.slice(0,5).map((r,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${B.amber}22`}}><div><div style={{fontSize:12,fontWeight:700,color:B.navy}}>{r.nombre}</div><div style={{fontSize:11,color:B.amber}}>{r.producto} · Vence: {fmtF(r.vencimiento)}</div></div>{r.telefono&&<a href={`https://wa.me/52${r.telefono.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{width:28,height:28,borderRadius:"50%",background:"#dcfce7",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,textDecoration:"none"}}>💬</a>}</div>))}</div>}</div>}{tab==="renovMes"&&<div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}><Tabla lista={renovMes} cols={["Póliza","Cliente","Producto","Vencimiento","Estatus","Contacto"]} titulo={`Renovaciones ${MESES[ahora.getMonth()]}`} color={B.amber} onExport={()=>exportarFiltrado(renovMes,"reno_mes_actual")}/></div>}{tab==="renovSig"&&<div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}><Tabla lista={renovSig} cols={["Póliza","Cliente","Producto","Vencimiento","Estatus","Contacto"]} titulo={`Renovaciones ${MESES[mesSig.getMonth()]}`} color={B.blue} onExport={()=>exportarFiltrado(renovSig,"reno_mes_siguiente")}/></div>}{tab==="atraso"&&<div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}><Tabla lista={atraso35} cols={["Póliza","Cliente","Producto","Vencimiento","Días atraso","Estatus","Contacto"]} titulo="Cobranza +35 días de atraso" color={B.redBright} onExport={()=>exportarFiltrado(atraso35,"cobranza_critica")}/></div>}{tab==="todos"&&<div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}><Tabla lista={datosFilt} cols={["Póliza","Cliente","Producto","Vencimiento","Días atraso","Estatus","Contacto"]} titulo="Todos los registros" color={B.navy} onExport={()=>exportarFiltrado(datosFilt,"todos")}/></div>}</div>;
}

function Usuarios({usuario,cuentas,setCuentas}) {
  const [modal,setModal]=useState(false);const [form,setForm]=useState({nombre:"",usuario:"",pass:"",rol:"admin",adminRef:""});const [err,setErr]=useState("");const [confirmUser,setConfirmUser]=useState(null);
  const esSA=usuario.rol==="superadmin";const visibles=esSA?cuentas:cuentas.filter(c=>c.id===usuario.id||c.adminId===usuario.id);const rolColor={superadmin:B.gold,admin:B.navy,asistente:B.purple};const rolLabel={superadmin:"⭐ Superadmin",admin:"👤 Admin",asistente:"🤝 Asistente"};
  function crear(){setErr("");if(!form.nombre.trim()||!form.usuario.trim()||!form.pass.trim()){setErr("Completa todos los campos");return;}if(cuentas.find(c=>c.usuario.toLowerCase()===form.usuario.toLowerCase())){setErr("Usuario ya existe");return;}let nc;if(esSA){if(form.rol==="asistente"){const adm=cuentas.find(c=>c.usuario.toLowerCase()===form.adminRef.toLowerCase()&&["admin","superadmin"].includes(c.rol));if(!adm){setErr("Admin no encontrado");return;}nc={id:uid(),nombre:form.nombre,usuario:form.usuario,pass:form.pass,rol:"asistente",adminId:adm.id,color:B.purple};}else nc={id:uid(),nombre:form.nombre,usuario:form.usuario,pass:form.pass,rol:"admin",adminId:null,color:B.navy};}else nc={id:uid(),nombre:form.nombre,usuario:form.usuario,pass:form.pass,rol:"asistente",adminId:usuario.id,color:B.purple};const nc2=[...cuentas,nc];LS.set("mf_cuentas",nc2);setCuentas(nc2);setModal(false);setForm({nombre:"",usuario:"",pass:"",rol:"admin",adminRef:""});}
  function eliminar(id){if(id===usuario.id||id===SUPERADMIN_ID)return;const c=cuentas.find(x=>x.id===id);setConfirmUser({id,nombre:c?.nombre||"este usuario"});}
  function confirmarEliminar(){if(!confirmUser)return;const nc2=cuentas.filter(c=>c.id!==confirmUser.id);LS.set("mf_cuentas",nc2);setCuentas(nc2);setConfirmUser(null);}
  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}><div><div style={{fontSize:16,fontWeight:700,color:B.navy,marginBottom:4}}>Gestión de usuarios</div><div style={{fontSize:12,color:"#6b7280"}}>{esSA?"Superadmin -- única que puede crear administradores":"Puedes crear asistentes vinculados a tu cuenta"}</div></div><Btn onClick={()=>{setModal(true);setErr("");}} bg={B.navy} small>+ Crear usuario</Btn></div>
    {esSA&&<div style={{background:B.goldDim,border:`1.5px solid ${B.goldBorder}`,borderRadius:10,padding:"11px 16px",marginBottom:18,fontSize:12,color:B.amber,fontWeight:600}}>⭐ Solo tú puedes crear administradores.</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:12}}>
      {visibles.map(c=>{const adminDe=c.adminId?cuentas.find(a=>a.id===c.adminId):null;return <div key={c.id} style={{background:B.white,border:`1px solid ${c.id===SUPERADMIN_ID?B.goldBorder:B.gray}`,borderRadius:12,padding:18,display:"flex",alignItems:"center",gap:13,boxShadow:B.shadow}}><Av name={c.nombre} size={44} color={rolColor[c.rol]||B.navy}/><div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,color:B.navy,fontSize:14}}>{c.nombre}</div><div style={{fontSize:11,color:"#9ca3af"}}>@{c.usuario}</div>{adminDe&&<div style={{fontSize:10,color:"#6b7280"}}>Asistente de: {adminDe.nombre}</div>}<div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}><Tag color={rolColor[c.rol]||B.navy} small>{rolLabel[c.rol]}</Tag>{c.id===usuario.id&&<Tag color={B.green} small>Tú</Tag>}</div></div>{c.id!==usuario.id&&c.id!==SUPERADMIN_ID&&(esSA||(usuario.rol==="admin"&&c.adminId===usuario.id))&&(<button onClick={()=>eliminar(c.id)} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:18}} onMouseEnter={e=>e.target.style.color=B.redBright} onMouseLeave={e=>e.target.style.color="#d1d5db"}>✕</button>)}</div>;})}
    </div>
    {modal&&<MFModal onClose={()=>setModal(false)} width={400}><MHead title="Crear usuario" onClose={()=>setModal(false)}/><div style={{display:"flex",flexDirection:"column",gap:12}}><FL label="Nombre completo"><Inp value={form.nombre} onChange={v=>setForm(f=>({...f,nombre:v}))}/></FL><FL label="Usuario"><Inp value={form.usuario} onChange={v=>setForm(f=>({...f,usuario:v}))}/></FL><FL label="ß"><Inp value={form.pass} onChange={v=>setForm(f=>({...f,pass:v}))} type="password"/></FL>{esSA&&<FL label="Tipo"><Sel value={form.rol} onChange={v=>setForm(f=>({...f,rol:v}))} options={[{v:"admin",l:"👤 Admin"},{v:"asistente",l:"🤝 Asistente"}]}/></FL>}{esSA&&form.rol==="asistente"&&<FL label="Usuario del administrador"><Inp value={form.adminRef} onChange={v=>setForm(f=>({...f,adminRef:v}))} placeholder="Usuario del admin"/></FL>}{!esSA&&<div style={{background:B.blueDim,border:`1px solid ${B.blue}20`,borderRadius:8,padding:"9px 13px",fontSize:12,color:B.blue,fontWeight:500}}>Los asistentes tendrán acceso solo a tu agenda.</div>}{err&&<div style={{fontSize:12,color:B.redBright,background:B.redDim,padding:"9px 13px",borderRadius:8,fontWeight:500}}>{err}</div>}</div><div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}><Btn onClick={()=>setModal(false)} color="#6b7280" outline small>Cancelar</Btn><Btn onClick={crear} bg={B.navy} small>Crear</Btn></div></MFModal>}
    {confirmUser&&<ConfirmModal titulo="¿Eliminar usuario?" mensaje={`Vas a eliminar la cuenta de "${confirmUser.nombre}".`} icono="👤" textoConfirm="Sí, eliminar" colorConfirm={B.redBright} onConfirm={confirmarEliminar} onCancel={()=>setConfirmUser(null)}/>}
  </div>;
}

// Detecta si la URL viene del link de recuperación (#access_token=...&type=recovery)
function detectarRecovery() {
  if (typeof window === "undefined") return false;
  const hash = window.location.hash || "";
  const search = window.location.search || "";
  return hash.includes("type=recovery") || search.includes("type=recovery");
}

export default function App() {
  const [usuario,setUsuario]=useState(null);
  const [cuentas,setCuentas]=useState([]);
  const [seccion,setSeccion]=useState("dashboard");
  const [filtroNav,setFiltroNav]=useState("todos");
  // Estado: leads/eventos vienen de Supabase (ya no de localStorage).
  // La estructura sigue siendo { [adminId]: [...] } por compatibilidad.
  const [allLeads,setAllLeads]=useState({});
  const [allEventos,setAllEventos]=useState({});
  const [notifOpen,setNotifOpen]=useState(false);
  const [sessionStart]=useState(()=>Date.now());
  const [authReady,setAuthReady]=useState(false);
  const [datosCargando,setDatosCargando]=useState(false);
  const [recoveryMode,setRecoveryMode]=useState(()=>detectarRecovery());
  const [loginMsg,setLoginMsg]=useState("");

  // Cargar perfil desde la tabla cuentas (con auto-create si el trigger falló)
  async function cargarPerfil(userId) {
    let { data, error } = await supabase
      .from("cuentas").select("*").eq("id", userId).maybeSingle();
    if (error) { console.error("cargarPerfil error:", error); return null; }
    if (!data) {
      const { data: userData } = await supabase.auth.getUser();
      const meta = userData?.user?.user_metadata || {};
      const emailUser = userData?.user?.email || "";
      const prefijo = emailUser.split("@")[0] || "usuario";
      const { data: nuevo, error: insErr } = await supabase
        .from("cuentas")
        .insert({
          id: userId,
          nombre: meta.nombre || prefijo,
          usuario: prefijo + "_" + userId.substring(0, 4),
          rol: meta.rol || "admin",
        })
        .select().single();
      if (insErr) { console.error("auto-create perfil falló:", insErr); return null; }
      data = nuevo;
    }
    return {
      id: data.id, nombre: data.nombre, usuario: data.usuario,
      rol: data.rol, color: data.color, adminId: data.admin_id,
    };
  }

  async function cargarEquipo() {
    const { data } = await supabase.from("cuentas").select("*");
    if (data) setCuentas(data.map(c => ({
      id: c.id, nombre: c.nombre, usuario: c.usuario,
      rol: c.rol, color: c.color, adminId: c.admin_id,
    })));
  }

  // Carga inicial de leads + sus seguimientos desde Supabase
  async function cargarLeadsDeDB(adminId) {
    if (!adminId) return;
    const { data: leadsData, error: leadsErr } = await supabase
      .from("leads").select("*").eq("admin_id", adminId);
    if (leadsErr) { console.error("cargarLeads error:", leadsErr); return; }
    const ids = (leadsData || []).map(l => l.id);
    let segs = [];
    if (ids.length > 0) {
      const { data } = await supabase.from("seguimientos").select("*").in("lead_id", ids);
      segs = data || [];
    }
    const hidratados = (leadsData || []).map(row => leadFromDB(row, segs));
    setAllLeads(prev => ({ ...prev, [adminId]: hidratados }));
  }

  async function cargarEventosDeDB(adminId) {
    if (!adminId) return;
    const { data, error } = await supabase.from("eventos").select("*").eq("admin_id", adminId);
    if (error) { console.error("cargarEventos error:", error); return; }
    setAllEventos(prev => ({ ...prev, [adminId]: (data || []).map(eventoFromDB) }));
  }

  // Sincroniza el array de seguimientos de un lead contra la DB (diff: insert / delete)
  async function sincronizarSeguimientos(leadId, segsAnteriores, segsNuevos, autorId) {
    const oldIds = new Set((segsAnteriores || []).map(s => s.id));
    const newIds = new Set((segsNuevos || []).map(s => s.id));
    const aInsertar = (segsNuevos || []).filter(s => !oldIds.has(s.id));
    const aBorrar = (segsAnteriores || []).filter(s => !newIds.has(s.id));
    if (aInsertar.length) {
      const rows = aInsertar.map(s => ({
        id: s.id, lead_id: leadId, fecha: s.fecha || hoy(),
        tipo: s.tipo || null, texto: s.texto || "",
        autor_id: s.autorId || autorId || null,
      }));
      const { error } = await supabase.from("seguimientos").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
      if (error) console.error("insert seguimientos error:", error);
    }
    if (aBorrar.length) {
      const { error } = await supabase.from("seguimientos").delete().in("id", aBorrar.map(s => s.id));
      if (error) console.error("delete seguimientos error:", error);
    }
  }

  // Verificar sesión al cargar y escuchar cambios
  useEffect(() => {
    let mounted = true;
    const enRecovery = detectarRecovery();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user && !enRecovery) {
        const perfil = await cargarPerfil(session.user.id);
        if (perfil) {
          setUsuario(perfil);
          setSeccion(perfil.rol === "asistente" ? "agenda" : "dashboard");
          const targetCid = perfil.rol === "asistente" ? perfil.adminId : perfil.id;
          setDatosCargando(true);
          await Promise.all([cargarEquipo(), cargarLeadsDeDB(targetCid), cargarEventosDeDB(targetCid)]);
          setDatosCargando(false);
        }
      }
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") { setRecoveryMode(true); return; }
      if (event === "SIGNED_OUT") { setUsuario(null); setCuentas([]); setAllLeads({}); setAllEventos({}); return; }
      if (event === "SIGNED_IN" && session?.user && !recoveryMode && !detectarRecovery()) {
        const perfil = await cargarPerfil(session.user.id);
        if (perfil) {
          setUsuario(perfil);
          const targetCid = perfil.rol === "asistente" ? perfil.adminId : perfil.id;
          setDatosCargando(true);
          await Promise.all([cargarEquipo(), cargarLeadsDeDB(targetCid), cargarEventosDeDB(targetCid)]);
          setDatosCargando(false);
        }
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cid=usuario?.rol==="asistente"?usuario.adminId:usuario?.id;
  const leads=cid?(allLeads[cid]||[]):[];
  const eventos=cid?(allEventos[cid]||[]):[];

  // setLeads: aplica el cambio al state local Y sincroniza con Supabase.
  // IMPORTANTE: la sincronización va FUERA del updater de setState para evitar
  // doble ejecución bajo React StrictMode (que dispararía duplicate key errors).
  function setLeads(fn) {
    if (!cid) return;
    const old = allLeads[cid] || [];
    const next = typeof fn === "function" ? fn(old) : fn;
    setAllLeads(prev => ({ ...prev, [cid]: next }));
    sincronizarLeadsConDB(old, next, cid, usuario?.id);
  }

  async function sincronizarLeadsConDB(oldLeads, newLeads, adminId, autorId) {
    const oldMap = new Map(oldLeads.map(l => [l.id, l]));
    const newMap = new Map(newLeads.map(l => [l.id, l]));
    const inserted = newLeads.filter(l => !oldMap.has(l.id));
    const deleted = oldLeads.filter(l => !newMap.has(l.id));
    const updated = newLeads.filter(l => {
      const o = oldMap.get(l.id);
      if (!o) return false;
      const { seguimientos: _s1, ...lNoSegs } = l;
      const { seguimientos: _s2, ...oNoSegs } = o;
      return JSON.stringify(lNoSegs) !== JSON.stringify(oNoSegs);
    });
    const errores = [];
    try {
      if (inserted.length) {
        const rows = inserted.map(l => leadToDB(l, adminId));
        // upsert con ignoreDuplicates: protege contra dobles llamadas (StrictMode, doble click, etc.)
        const { error } = await supabase.from("leads").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
        if (error) { console.error("INSERT leads error:", error); errores.push(`INSERT: ${error.message}`); }
        else {
          for (const l of inserted) {
            if (l.seguimientos?.length) await sincronizarSeguimientos(l.id, [], l.seguimientos, autorId);
          }
        }
      }
      if (deleted.length) {
        const { error } = await supabase.from("leads").delete().in("id", deleted.map(l => l.id));
        if (error) { console.error("DELETE leads error:", error); errores.push(`DELETE: ${error.message}`); }
      }
      for (const l of updated) {
        const { error } = await supabase.from("leads").update(leadToDB(l, adminId)).eq("id", l.id);
        if (error) { console.error("UPDATE lead error:", error); errores.push(`UPDATE: ${error.message}`); }
      }
      for (const l of newLeads) {
        const o = oldMap.get(l.id);
        if (!o) continue;
        const segsOld = o.seguimientos || [];
        const segsNew = l.seguimientos || [];
        if (JSON.stringify(segsOld) !== JSON.stringify(segsNew)) {
          await sincronizarSeguimientos(l.id, segsOld, segsNew, autorId);
        }
      }
    } catch (e) {
      console.error("sincronizarLeadsConDB falló:", e);
      errores.push(`Excepción: ${e.message || e}`);
    }
    if (errores.length) {
      alert("⚠️ No se pudieron guardar los cambios en Supabase:\n\n" + errores.join("\n") + "\n\nRevisa la consola (Cmd+Option+I) para más detalle.");
    }
    return { ok: errores.length === 0, errores };
  }

  function setEventos(fn) {
    if (!cid) return;
    const old = allEventos[cid] || [];
    const next = typeof fn === "function" ? fn(old) : fn;
    setAllEventos(prev => ({ ...prev, [cid]: next }));
    sincronizarEventosConDB(old, next, cid, usuario?.id);
  }

  async function sincronizarEventosConDB(oldEv, newEv, adminId, creadorId) {
    const oldMap = new Map(oldEv.map(e => [e.id, e]));
    const newMap = new Map(newEv.map(e => [e.id, e]));
    const inserted = newEv.filter(e => !oldMap.has(e.id));
    const deleted = oldEv.filter(e => !newMap.has(e.id));
    const updated = newEv.filter(e => {
      const o = oldMap.get(e.id);
      return o && JSON.stringify(o) !== JSON.stringify(e);
    });
    const errores = [];
    try {
      if (inserted.length) {
        const rows = inserted.map(e => eventoToDB(e, adminId, creadorId));
        const { error } = await supabase.from("eventos").upsert(rows, { onConflict: "id", ignoreDuplicates: true });
        if (error) { console.error("INSERT eventos error:", error); errores.push(`INSERT: ${error.message}`); }
      }
      if (deleted.length) {
        const { error } = await supabase.from("eventos").delete().in("id", deleted.map(e => e.id));
        if (error) { console.error("DELETE eventos error:", error); errores.push(`DELETE: ${error.message}`); }
      }
      for (const e of updated) {
        const { error } = await supabase.from("eventos").update(eventoToDB(e, adminId, creadorId)).eq("id", e.id);
        if (error) { console.error("UPDATE evento error:", error); errores.push(`UPDATE: ${error.message}`); }
      }
    } catch (e) {
      console.error("sincronizarEventosConDB falló:", e);
      errores.push(`Excepción: ${e.message || e}`);
    }
    if (errores.length) {
      alert("⚠️ No se pudieron guardar los eventos en Supabase:\n\n" + errores.join("\n") + "\n\nRevisa la consola (Cmd+Option+I) para más detalle.");
    }
  }

  async function onLogin(u){
    setUsuario(u);
    setSeccion(u.rol==="asistente"?"agenda":"dashboard");
    const targetCid = u.rol === "asistente" ? u.adminId : u.id;
    setDatosCargando(true);
    await Promise.all([cargarEquipo(), cargarLeadsDeDB(targetCid), cargarEventosDeDB(targetCid)]);
    setDatosCargando(false);
  }

  async function logout(){
    await supabase.auth.signOut();
    // El listener onAuthStateChange limpia el resto
  }

  if(!authReady) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#060e1c",color:"#C6A96B",fontFamily:"'Poppins',sans-serif",fontSize:14}}>Cargando...</div>;

  // Mientras se cargan datos desde Supabase tras el login
  if(usuario && datosCargando) return <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#F8F6F2",color:"#0A1F44",fontFamily:"'Poppins',sans-serif",gap:14}}>
    <div style={{width:32,height:32,border:"3px solid #C6A96B33",borderTopColor:"#C6A96B",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>
    <div style={{fontSize:13,fontWeight:500,color:"#64748b"}}>Cargando tus leads y eventos...</div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>;

  // Modo recuperación de contraseña (después del link del correo)
  if (recoveryMode) {
    return <RecoveryPassword
      onSuccess={() => {
        setRecoveryMode(false);
        setUsuario(null);
        setLoginMsg("Contraseña actualizada. Inicia sesión con tu nueva contraseña.");
      }}
      onCancel={async () => {
        window.history.replaceState(null, "", window.location.pathname);
        await supabase.auth.signOut();
        setRecoveryMode(false);
        setUsuario(null);
      }}
    />;
  }

  if(!usuario) return <Auth onLogin={onLogin} mensajeInicial={loginMsg}/>;

  const esAdmin=["admin","superadmin"].includes(usuario.rol);
  const esAsistente=usuario.rol==="asistente";
  const alertaCount=leads.filter(l=>!l.sinSeguimiento&&getAlertas(l).some(a=>["riesgo","sin_contacto"].includes(a.tipo))&&!["otro","cierre"].includes(l.etapa)).length;

  const NAV=[
    ...(esAdmin?[{id:"dashboard",icon:"*",l:"Dashboard"}]:[]),
    ...(esAdmin?[{id:"pipeline",icon:"#",l:"Pipeline"}]:[]),
    {id:"lista",icon:"☰",l:"Leads"},
    {id:"agenda",icon:"📅",l:"Agenda"},
    ...(esAdmin?[{id:"metricas",icon:"📊",l:"Métricas"}]:[]),
    ...(esAdmin?[{id:"mensajes",icon:"✉",l:"Mensajes"}]:[]),
    ...(esAdmin?[{id:"cobranza",icon:"💰",l:"Cobranza"}]:[]),
    ...(esAdmin?[{id:"usuarios",icon:"👤",l:"Usuarios"}]:[]),
  ];

  const APP_CSS=`
    html,body,*{box-sizing:border-box!important;}
    html{width:100%;max-width:100vw;overflow-x:hidden;-webkit-text-size-adjust:100%;text-size-adjust:100%;}
    body{width:100%;max-width:100vw;overflow-x:hidden;overscroll-behavior-y:contain;}
    input,select,textarea,button{font-family:'Poppins',sans-serif;-webkit-appearance:none;appearance:none;border-radius:8px;font-size:16px;}
    select{font-size:14px;}
    .mf-app{width:100%;max-width:100vw;min-height:100%;min-height:-webkit-fill-available;overflow-x:hidden;overflow-y:auto;position:relative;}
    .mf-header{position:sticky;top:0;z-index:400;width:100%;max-width:100vw;background:#0A1F44;border-bottom:1px solid rgba(198,169,107,0.15);box-shadow:0 2px 16px rgba(10,31,68,.3);}
    .mf-header-row1{display:flex;align-items:center;justify-content:space-between;padding:0 14px;height:60px;gap:8px;width:100%;}
    .mf-header-row2{display:flex;align-items:center;padding:0 10px 9px;gap:2px;width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;background:#0A1F44;}
    .mf-header-row2::-webkit-scrollbar{display:none;}
    .mf-nav-btn{flex-shrink:0;display:inline-flex;align-items:center;gap:4px;min-height:36px;padding:6px 12px;border-radius:18px;border:none;font-family:'Poppins',sans-serif;font-weight:600;font-size:12px;cursor:pointer;transition:all 0.15s ease;white-space:nowrap;-webkit-tap-highlight-color:transparent;position:relative;user-select:none;-webkit-user-select:none;}
    .mf-nav-btn.active{background:#C6A96B;color:#0A1F44;box-shadow:0 2px 8px rgba(198,169,107,.35);}
    .mf-nav-btn.inactive{background:transparent;color:rgba(255,255,255,0.55);}
    .mf-nav-btn.inactive:active{background:rgba(255,255,255,0.1);color:#fff;}
    .mf-main{width:100%;max-width:100vw;padding:12px;overflow-x:hidden;}
    @media(min-width:480px){.mf-main{padding:16px;}}
    @media(min-width:768px){.mf-main{padding:20px;}}
    @media(min-width:1024px){.mf-main{padding:28px;max-width:1440px;margin:0 auto;}}
    .mf-pipeline-filters{width:100%;max-width:100vw;display:flex;gap:5px;padding:7px 12px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;background:rgba(255,255,255,0.97);border-bottom:1px solid rgba(229,231,235,0.7);}
    .mf-pipeline-filters::-webkit-scrollbar{display:none;}
    .mf-pipeline-filters>button{flex-shrink:0;min-height:34px;}
    .mf-kanban{display:flex;gap:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:20px;align-items:flex-start;scrollbar-width:thin;}
    .mf-kanban-col{min-width:240px;max-width:260px;flex-shrink:0;}
    .mf-table-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}
    .mf-user-name{display:none;}
    @media(min-width:500px){.mf-user-name{display:block;}}
    .mf-app{padding-bottom:env(safe-area-inset-bottom);}
    .mf-header{padding-top:env(safe-area-inset-top);}
  `;

  return (
    <div className="mf-app" style={{fontFamily:"'Poppins',sans-serif",background:"#F8F6F2",color:"#1A1A1A"}} onClick={()=>notifOpen&&setNotifOpen(false)}>
      <style>{CSS}</style>
      <style>{APP_CSS}</style>

      <header className="mf-header">
        <div className="mf-header-row1" style={{background:"#0A1F44"}}>
          <MarflowLogo height={36} dark={true}/>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <div style={{position:"relative"}}>
              <button onClick={()=>setNotifOpen(o=>!o)} style={{width:36,height:36,borderRadius:"50%",border:`1px solid ${notifOpen?B.gold:"rgba(255,255,255,0.3)"}`,background:notifOpen?B.gold+"22":"rgba(255,255,255,0.1)",color:notifOpen?B.gold:"#fff",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .18s",flexShrink:0,position:"relative"}}>
                🔔
                {alertaCount>0&&<span style={{position:"absolute",top:0,right:0,width:14,height:14,background:B.redBright,borderRadius:"50%",fontSize:8,color:"#fff",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{alertaCount}</span>}
              </button>
              {notifOpen&&(
                <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:44,right:0,width:320,background:B.white,borderRadius:14,border:`1px solid ${B.gray}`,boxShadow:B.shadowLg,zIndex:800,animation:"fadeUp .18s ease",overflow:"hidden"}}>
                  <div style={{background:B.navy,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontSize:13,fontWeight:700,color:B.white}}>Centro de actividad</div><button onClick={()=>setNotifOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.6)",cursor:"pointer",fontSize:16}}>✕</button></div>
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${B.gray}`,background:B.goldDim}}><div style={{fontSize:10,fontWeight:600,color:"#64748b",textTransform:"uppercase",letterSpacing:".7px",marginBottom:4}}>Sesión actual</div><div style={{fontSize:22,fontWeight:800,color:B.navy,lineHeight:1}}>{Math.floor((Date.now()-sessionStart)/60000)} min</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>desde que ingresaste hoy</div></div>
                  <div style={{padding:"12px 16px",borderBottom:`1px solid ${B.gray}`}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".7px",marginBottom:8}}>Alertas de leads</div>
                    {alertaCount===0&&<div style={{fontSize:12,color:B.green,fontWeight:500}}>✓ Todo en orden</div>}
                    {leads.filter(l=>getAlertas(l).some(a=>a.tipo==="riesgo")).slice(0,3).map(l=>(<div key={l.id} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}><span style={{fontSize:10,animation:"pulse 1.4s infinite",color:B.redBright}}>●</span><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.nombre}</div><div style={{fontSize:10,color:B.redBright}}>⚠ Riesgo de pérdida</div></div></div>))}
                    {leads.filter(l=>getAlertas(l).some(a=>a.tipo==="sin_contacto")).slice(0,3).map(l=>(<div key={l.id} style={{display:"flex",gap:8,alignItems:"center",marginBottom:6}}><span style={{fontSize:10,color:B.amber}}>●</span><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,color:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.nombre}</div><div style={{fontSize:10,color:B.amber}}>{diasDesde(l.ultimoContacto)}d sin contacto</div></div></div>))}
                  </div>
                  <div style={{padding:"12px 16px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".7px",marginBottom:8}}>Tus patrones de uso</div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:8}}>
                      {[{l:"Mejor día",v:"Martes",ic:"📅"},{l:"Mejor horario",v:"10-12am",ic:"⏰"},{l:"Hora + respuestas",v:"11am",ic:"💬"},{l:"Leads activos",v:leads.filter(l=>!l.sinSeguimiento&&!["otro","cierre"].includes(l.etapa)).length,ic:"*"}].map((m,i)=>(<div key={i} style={{background:B.cream,borderRadius:9,padding:"9px 11px"}}><div style={{fontSize:14,marginBottom:3}}>{m.ic}</div><div style={{fontSize:16,fontWeight:800,color:B.navy,lineHeight:1}}>{m.v}</div><div style={{fontSize:9,color:"#94a3b8",marginTop:2,textTransform:"uppercase",letterSpacing:".5px"}}>{m.l}</div></div>))}
                    </div>
                    <div style={{marginTop:10,fontSize:10,color:"#94a3b8",fontStyle:"italic",textAlign:"center"}}>Las métricas detalladas se irán construyendo con el uso de la app</div>
                  </div>
                  {esAdmin&&(()=>{
                    const miEquipo=usuario.rol==="superadmin"?cuentas.filter(c=>c.rol==="asistente"):cuentas.filter(c=>c.rol==="asistente"&&c.adminId===usuario.id);
                    if(miEquipo.length===0)return null;
                    const actHoy=(uid)=>{const all=allLeads[cuentas.find(c=>c.id===uid)?.adminId||uid]||leads;return all.flatMap(l=>l.seguimientos||[]).filter(s=>s.autor&&s.fecha===hoy()).length;};
                    return(<div style={{padding:"12px 16px",borderTop:`1px solid ${B.gray}`}}><div style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".7px",marginBottom:8}}>{usuario.rol==="superadmin"?"Actividad de todos los asistentes":"Actividad de tu equipo"}</div>{miEquipo.map(c=>{const act=actHoy(c.id);const adminNombre=cuentas.find(a=>a.id===c.adminId)?.nombre||"";return(<div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:`1px solid ${B.gray}22`}}><Av name={c.nombre} size={28} color={B.purple}/><div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:700,color:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nombre}</div>{usuario.rol==="superadmin"&&adminNombre&&<div style={{fontSize:9,color:"#94a3b8"}}>Admin: {adminNombre}</div>}</div><div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:14,fontWeight:800,color:act>0?B.green:"#94a3b8"}}>{act}</div><div style={{fontSize:9,color:"#94a3b8"}}>hoy</div></div></div>);})}</div>);
                  })()}
                </div>
              )}
            </div>
            {alertaCount>0&&(<div style={{minWidth:20,height:20,padding:"0 5px",background:B.redBright,borderRadius:10,fontSize:9,color:"#fff",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{alertaCount}</div>)}
            <Av name={usuario.nombre} size={32} color={usuario.color||B.gold}/>
            <div className="mf-user-nasme"><div style={{fontSize:12,fontWeight:700,color:"#fff",lineHeight:1.2}}>{usuario.nombre}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.5)",textTransform:"capitalize",letterSpacing:".3px"}}>{usuario.rol}</div></div>
            <button onClick={logout} style={{padding:"6px 12px",minHeight:34,borderRadius:8,border:"1px solid rgba(255,255,255,0.25)",background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.8)",fontFamily:"'Poppins',sans-serif",fontSize:11,cursor:"pointer",flexShrink:0,fontWeight:500}}>Salir</button>
          </div>
        </div>
        <div className="mf-header-row2">
          {NAV.map(n=>(<button key={n.id} className={`mf-nav-btn ${seccion===n.id?"active":"inactive"}`} onClick={()=>setSeccion(n.id)}><span>{n.icon}</span><span>{n.l}</span>{n.id==="dashboard"&&alertaCount>0&&(<span style={{position:"absolute",top:3,right:3,width:13,height:13,background:B.redBright,borderRadius:"50%",fontSize:7,color:"#fff",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{alertaCount}</span>)}</button>))}
        </div>
      </header>

      {seccion==="pipeline"&&esAdmin&&(
        <div className="mf-pipeline-filters">
          {[{v:"todos",l:"Todos"},{v:"activos",l:"Activos"},...ETAPAS.map(et=>({v:et.id,l:`${et.icon} ${et.label}`,c:et.color}))].map(o=>(<button key={o.v} onClick={()=>setFiltroNav(o.v)} style={{padding:"5px 12px",borderRadius:20,border:`1.5px solid ${filtroNav===o.v?(o.c||B.navy):B.gray}`,background:filtroNav===o.v?(o.c||B.navy)+"12":B.cream,color:filtroNav===o.v?(o.c||B.navy):"#6b7280",fontFamily:"Poppins",fontWeight:600,fontSize:11,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{o.l}</button>))}
        </div>
      )}

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
