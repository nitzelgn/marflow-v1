
import { useState } from "react";
import { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES,
  TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK,
  MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT,
  uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia,
  getTempLead, getAlertas, LS, mkDemo } from "./shared.js";

function MarflowLogo({ height = 40, dark = true }) {
  const gold = "#C6A96B";
  const w = Math.round(height * 4.2);
  return (
    <svg width={w} height={height} viewBox="0 0 210 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 36 C18 24 30 40 44 32 C58 24 70 38 84 30"
        stroke={gold} strokeWidth="2.2" strokeLinecap="round" opacity="0.55"/>
      <path d="M8 28 C18 16 30 32 44 24 C58 16 70 28 84 20"
        stroke={gold} strokeWidth="3" strokeLinecap="round"/>
      <path d="M76 20 C80 14 86 16 90 13"
        stroke={gold} strokeWidth="2" strokeLinecap="round" opacity="0.85"/>
      <circle cx="91" cy="10" r="4.5" fill={gold}/>
      <text x="102" y="35" fontFamily="Poppins,Arial,sans-serif"
        fontWeight="700" fontSize="26" fill="#FFFFFF">MAR</text>
      <text x="152" y="35" fontFamily="Poppins,Arial,sans-serif"
        fontWeight="700" fontSize="26" fill={gold}>FLOW</text>
    </svg>
  );
}


/* ===========================================
   COMPONENTES BASE
=========================================== */
const GD = () => <div style={{height:1,background:`linear-gradient(90deg,transparent,${B.gold}55,transparent)`,margin:"14px 0"}}/>;

const Tag = ({color,children,small}) =>
  <span style={{display:"inline-flex",alignItems:"center",gap:3,padding:small?"1px 9px":"3px 11px",borderRadius:20,fontSize:small?10:11,fontWeight:600,background:color+"14",color,border:`1px solid ${color}25`,whiteSpace:"nowrap"}}>{children}</span>;

/* -- CONFIRM MODAL -- reemplaza window.confirm en toda la app -- */
function ConfirmModal({titulo,mensaje,icono="⚠️",onConfirm,onCancel,textoConfirm="Sí, eliminar",colorConfirm=B.redBright}) {
  return (
    <div onClick={onCancel}
      style={{position:"fixed",inset:0,background:"rgba(10,31,68,.55)",zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()}
        style={{background:B.white,borderRadius:16,padding:32,maxWidth:360,width:"100%",boxShadow:B.shadowLg,animation:"fadeUp .2s ease",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:12}}>{icono}</div>
        <div style={{fontSize:18,fontWeight:800,color:B.navy,marginBottom:8}}>{titulo}</div>
        {mensaje&&<div style={{fontSize:14,color:"#64748b",lineHeight:1.6,marginBottom:24}}>{mensaje}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={onCancel}
            style={{flex:1,padding:"11px 20px",borderRadius:10,border:`1.5px solid ${B.gray}`,background:B.white,color:"#64748b",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:13,cursor:"pointer"}}>
            Cancelar
          </button>
          <button onClick={()=>{onConfirm();}}
            style={{flex:1,padding:"11px 20px",borderRadius:10,border:"none",background:colorConfirm,color:"#fff",fontFamily:"'Poppins',sans-serif",fontWeight:700,fontSize:13,cursor:"pointer",boxShadow:`0 4px 14px ${colorConfirm}44`}}>
            {textoConfirm}
          </button>
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
    style={{
      padding:small?"7px 14px":"10px 20px",
      minHeight:small?36:44,
      borderRadius:8,
      border:outline?`1px solid ${c}40`:"none",
      background:bk,
      color:disabled?"#9ca3af":outline?c:"#fff",
      fontFamily:"'Poppins',sans-serif",fontWeight:600,
      fontSize:small?12:14,
      cursor:disabled?"not-allowed":"pointer",
      transition:"all .15s",
      width:full?"100%":"auto",
      display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,
      WebkitTapHighlightColor:"transparent",
      touchAction:"manipulation",
      ...sx
    }}>
    {children}
  </button>;
}

function Inp({value,onChange,type="text",placeholder,maxLength,onKeyDown,rows}) {
  // font-size 16px on inputs prevents iOS zoom on focus
  const s={
    padding:"11px 13px",borderRadius:8,
    border:`1.5px solid ${B.gray}`,
    background:B.white,color:B.black,
    fontFamily:"'Poppins',sans-serif",
    fontSize:16, // iOS zoom prevention
    outline:"none",width:"100%",
    transition:"border-color .15s",
    minHeight:44, // touch target
    WebkitAppearance:"none",
  };
  const ev={onFocus:e=>e.target.style.borderColor=B.gold,onBlur:e=>e.target.style.borderColor=B.gray};
  return rows
    ? <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...s,resize:"vertical",minHeight:"auto"}} {...ev}/>
    : <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} onKeyDown={onKeyDown} style={s} {...ev}/>;
}

function Sel({value,onChange,options}) {
  return <select value={value} onChange={e=>onChange(e.target.value)}
    style={{
      padding:"11px 13px",borderRadius:8,
      border:`1.5px solid ${B.gray}`,
      background:B.white,color:B.black,
      fontFamily:"'Poppins',sans-serif",
      fontSize:16, // iOS zoom prevention
      outline:"none",width:"100%",
      minHeight:44,
      WebkitAppearance:"none",appearance:"none",
      backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2364748b' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat:"no-repeat",
      backgroundPosition:"right 12px center",
      paddingRight:36,
    }}>
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
    <div
      onClick={e=>e.target===e.currentTarget&&onClose()}
      style={{
        position:"fixed",inset:0,
        background:"rgba(10,31,68,.5)",
        zIndex:900,
        display:"flex",
        // Mobile: slide up from bottom; Desktop: centered
        alignItems:"flex-end",
        justifyContent:"center",
      }}>
      <style>{`
        @media(min-width:520px){.mf-modal-sheet{align-self:center!important;border-radius:16px!important;margin:16px;max-height:90vh!important;}}
      `}</style>
      <div
        className="mf-modal-sheet"
        style={{
          background:B.white,
          borderRadius:"20px 20px 0 0",
          padding:"24px 16px 32px",
          paddingBottom:"max(32px, calc(32px + env(safe-area-inset-bottom)))",
          width:"100%",
          maxWidth:width,
          maxHeight:"92vh",
          overflowY:"auto",
          WebkitOverflowScrolling:"touch",
          boxShadow:B.shadowLg,
          animation:"fadeUp .22s ease",
          border:`1px solid ${B.gray}`,
          borderBottom:"none",
          alignSelf:"flex-end",
        }}>
        {/* Handle bar */}
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

/* ===========================================
   CONTACTO MODAL
=========================================== */
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

/* ===========================================
   LOBO SVG -- minimalista geométrico
=========================================== */
function WolfMark({size=120, opacity=1}) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" style={{opacity}}>
      {/* Cuerpo/silueta del lobo mirando de perfil hacia arriba -- geométrico */}
      {/* Cabeza */}
      <polygon points="60,8 80,28 72,48 60,44 48,48 40,28" fill={B.gold} opacity="0.92"/>
      {/* Oreja izquierda */}
      <polygon points="40,28 30,10 48,26" fill={B.gold} opacity="0.75"/>
      {/* Oreja derecha */}
      <polygon points="80,28 90,10 72,26" fill={B.gold} opacity="0.75"/>
      {/* Hocico */}
      <polygon points="60,44 52,54 60,58 68,54" fill={B.gold} opacity="0.6"/>
      {/* Cuello / pecho */}
      <polygon points="48,48 60,44 72,48 76,72 60,78 44,72" fill={B.gold} opacity="0.5"/>
      {/* Ojo izquierdo */}
      <circle cx="52" cy="34" r="3.5" fill={B.navy}/>
      <circle cx="52" cy="33" r="1.2" fill="rgba(255,255,255,0.6)"/>
      {/* Ojo derecho */}
      <circle cx="68" cy="34" r="3.5" fill={B.navy}/>
      <circle cx="68" cy="33" r="1.2" fill="rgba(255,255,255,0.6)"/>
      {/* Nariz */}
      <ellipse cx="60" cy="48" rx="4" ry="2.5" fill={B.navy} opacity="0.7"/>
      {/* Línea de detalle -- mandíbula */}
      <path d="M50 42 Q60 50 70 42" stroke={B.navy} strokeWidth="1" fill="none" opacity="0.3"/>
      {/* Patas frontales sugeridas */}
      <polygon points="44,72 38,96 50,96 54,76" fill={B.gold} opacity="0.35"/>
      <polygon points="76,72 82,96 70,96 66,76" fill={B.gold} opacity="0.35"/>
      {/* Cola curva */}
      <path d="M76 72 Q100 60 96 40 Q92 30 86 36" stroke={B.gold} strokeWidth="3" fill="none" opacity="0.45" strokeLinecap="round"/>
    </svg>
  );
}

/* ===========================================
   AUTH -- LOGIN PREMIUM
=========================================== */

export { MarflowLogo, ConfirmModal, Av, Btn, Inp, Sel, FL,
  MFModal, MHead, HoraSelect, ContactoModal, GD, Tag, WolfMark };
