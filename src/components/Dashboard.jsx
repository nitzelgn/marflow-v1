import { useState } from "react";
import { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES,
  TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK,
  MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT,
  uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia,
  getTempLead, getAlertas, LS, mkDemo } from "./shared.js";
import { MarflowLogo, ConfirmModal, Av, Btn, Inp, Sel, FL,
  MFModal, MHead, HoraSelect, ContactoModal, GD, Tag } from "./ui.jsx";
import { LeadCard, LeadModal } from "./LeadCard.jsx";

function VentaDelDia({leads}) {
  const calientes=leads.filter(l=>!l.sinSeguimiento&&getTempLead(l)?.nivel==="caliente").slice(0,4);
  const pendientes=leads.filter(l=>!l.sinSeguimiento&&getAlertas(l).length>0&&!["otro","cierre"].includes(l.etapa)).slice(0,4);
  const reactivar=leads.filter(l=>!l.sinSeguimiento&&diasDesde(l.ultimoContacto)>=15&&!["otro","cierre"].includes(l.etapa)).slice(0,4);
  const Block=({title,color,items,emptyMsg})=>(
    <div style={{background:"rgba(255,255,255,.07)",borderRadius:10,padding:"12px 14px"}}>
      <div style={{fontSize:11,fontWeight:700,color,marginBottom:10,textTransform:"uppercase",letterSpacing:.6}}>{title}</div>
      {items.length===0?<div style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>{emptyMsg}</div>
      :items.map(l=>(
        <div key={l.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:color,flexShrink:0}}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,color:B.white,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.nombre}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>{l.producto}</div>
          </div>
        </div>
      ))}
    </div>
  );
  return <div style={{background:B.navy,borderRadius:14,padding:"20px 24px",marginBottom:20,position:"relative",overflow:"hidden"}}>
    <svg style={{position:"absolute",bottom:0,right:0,opacity:.1}} width="220" height="90" viewBox="0 0 220 90">
      <path d="M0 60 Q55 20 110 45 Q165 70 220 25 L220 90 L0 90Z" fill={B.gold}/>
    </svg>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
      <span style={{fontSize:22}}>🎯</span>
      <div>
        <div style={{fontSize:15,fontWeight:700,color:B.white}}>Venta del día</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,.45)"}}>Tus prioridades de hoy · {new Date().toLocaleDateString("es-MX",{weekday:"long",day:"numeric",month:"long"})}</div>
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8}}>
      <Block title="🔥 Calientes" color="#fca5a5" items={calientes} emptyMsg="Sin leads calientes"/>
      <Block title="⏰ Seguimientos" color="#93c5fd" items={pendientes} emptyMsg="Al día ✓"/>
      <Block title="♻️ Reactivar" color="#c4b5fd" items={reactivar} emptyMsg="Sin reactivaciones"/>
    </div>
  </div>;
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
              <div style={{width:90,height:6,background:B.gray,borderRadius:3}}>
                <div style={{height:"100%",width:`${Math.round(t.v/total*100)}%`,background:t.c,borderRadius:3,transition:"width .5s"}}/>
              </div>
              <span style={{fontSize:13,fontWeight:700,color:t.c,minWidth:20,textAlign:"right"}}>{t.v}</span>
            </div>
          </div>
        ))}
        <div style={{marginTop:8,paddingTop:12,borderTop:`1px solid ${B.gray}`,fontSize:11,color:"#9ca3af"}}>
          Total leads: {leads.length}
        </div>
      </div>
      <div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}>
        <div style={{fontSize:14,fontWeight:700,color:B.navy,marginBottom:14}}>Pipeline por etapa</div>
        {ETAPAS.map(et=>{const cnt=leads.filter(l=>l.etapa===et.id).length;return(
          <div key={et.id} style={{marginBottom:9}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:B.black}}>{et.icon} {et.label}</span>
              <span style={{fontSize:11,fontWeight:700,color:et.color}}>{cnt}</span>
            </div>
            <div style={{height:3,background:B.gray,borderRadius:2}}>
              <div style={{height:"100%",width:`${Math.round(cnt/total*100)}%`,background:et.color,borderRadius:2,transition:"width .5s"}}/>
            </div>
          </div>
        );})}
      </div>
    </div>
  </div>;
}

/* ===========================================
   DASHBOARD
=========================================== */
function Dashboard({leads,setFiltroNav,setSeccion}) {
  const activos=leads.filter(l=>!l.sinSeguimiento&&!["otro","cierre"].includes(l.etapa));
  const cierres=leads.filter(l=>l.etapa==="cierre");
  const riesgo=leads.filter(l=>getAlertas(l).some(a=>a.tipo==="riesgo"));
  const sinC=leads.filter(l=>getAlertas(l).some(a=>a.tipo==="sin_contacto"));
  function irA(f){setFiltroNav(f);setSeccion("pipeline");}

  return <div style={{animation:"fadeUp .3s ease"}}>
    <VentaDelDia leads={leads}/>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:18}}>
      {[{l:"Leads activos",v:activos.length,c:B.navy,sub:"En seguimiento activo",icon:"*",a:()=>irA("activos")},
        {l:"Cierres del mes",v:cierres.length,c:B.green,sub:"Conversiones logradas",icon:"✓",a:()=>irA("cierre")},
        {l:"En riesgo pérdida",v:riesgo.length,c:B.redBright,sub:"Actuar hoy",icon:"⚠",a:()=>irA("seguimiento")},
        {l:"Sin contacto",v:sinC.length,c:B.amber,sub:"Requieren atención",icon:"⏰",a:()=>irA("activos")},
      ].map((c,i)=>(
        <div key={i} onClick={c.a} style={{background:B.white,border:`1px solid ${B.gray}`,borderLeft:`4px solid ${c.c}`,borderRadius:12,padding:"16px 18px",cursor:"pointer",transition:"all .15s",boxShadow:B.shadow}}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow=B.shadowMd;e.currentTarget.style.transform="translateY(-2px)";}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow=B.shadow;e.currentTarget.style.transform="none";}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <div style={{fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:".6px"}}>{c.l}</div>
            <span style={{color:c.c,fontSize:15}}>{c.icon}</span>
          </div>
          <div style={{fontSize:32,fontWeight:800,color:c.c,lineHeight:1,marginBottom:4}}>{c.v}</div>
          <div style={{fontSize:11,color:"#9ca3af"}}>{c.sub}</div>
        </div>
      ))}
    </div>
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
      <div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}>
        <div style={{fontSize:14,fontWeight:700,color:B.navy,marginBottom:14}}>📋 Actividad reciente</div>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr style={{background:B.cream}}>{["Nombre","Producto","Etapa","T°"].map(h=><th key={h} style={{textAlign:"left",padding:"7px 10px",fontSize:9,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".7px",borderBottom:`1px solid ${B.gray}`}}>{h}</th>)}</tr></thead>
          <tbody>
            {[...leads].sort((a,b)=>(b.ultimoContacto||"").localeCompare(a.ultimoContacto||"")).slice(0,6).map(l=>{
              const e=ETAPAS.find(et=>et.id===l.etapa)||ETAPAS[0];const temp=getTempLead(l);
              return <tr key={l.id} style={{borderBottom:`1px solid ${B.gray}22`}}>
                <td style={{padding:"8px 10px",fontSize:12,fontWeight:600,color:B.navy}}>{l.nombre}</td>
                <td style={{padding:"8px 10px"}}><Tag color={B.navy} small>{l.producto}</Tag></td>
                <td style={{padding:"8px 10px"}}><Tag color={e.color} small>{e.icon} {e.label}</Tag></td>
                <td style={{padding:"8px 10px",fontSize:16}}>{temp?.icon||"--"}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>;
}

/* ===========================================
   LEAD CARD
=========================================== */

