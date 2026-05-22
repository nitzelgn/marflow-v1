import { useState } from "react";
import { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES,
  TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK,
  MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT,
  uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia,
  getTempLead, getAlertas, LS, mkDemo } from "./shared.js";
import { MarflowLogo, ConfirmModal, Av, Btn, Inp, Sel, FL,
  MFModal, MHead, HoraSelect, ContactoModal, GD, Tag } from "./ui.jsx";

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

export default Metricas;
