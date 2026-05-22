import { useState } from "react";
import { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES,
  TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK,
  MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT,
  uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia,
  getTempLead, getAlertas, LS, mkDemo } from "./shared.js";
import { MarflowLogo, ConfirmModal, Av, Btn, Inp, Sel, FL,
  MFModal, MHead, HoraSelect, ContactoModal, GD, Tag } from "./ui.jsx";

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
      {(tmpl[cat]||[]).map((m,i)=>{
        const k=`${cat}-${i}`;
        const wa=`https://wa.me/?text=${encodeURIComponent(m.body)}`;
        return <div key={i} style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,overflow:"hidden",boxShadow:B.shadow}}>
          <div style={{background:B.cream,padding:"11px 16px",borderBottom:`1px solid ${B.gray}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,fontWeight:700,color:B.navy}}>{m.titulo}</div>
            <div style={{display:"flex",gap:6}}>
              <Btn onClick={()=>setEditando({cat,idx:i,body:m.body})} color="#6b7280" outline small>Editar</Btn>
              <a href={wa} target="_blank" rel="noreferrer" style={{textDecoration:"none"}}><Btn color="#25d366" outline small>WhatsApp</Btn></a>
              <Btn onClick={()=>copiar(m.body,k)} color={copiado===k?B.green:catAct.c} outline small>{copiado===k?"✓ Copiado":"Copiar"}</Btn>
            </div>
          </div>
          <div style={{padding:"14px 16px"}}>
            <pre style={{fontFamily:"Poppins",fontSize:13,color:"#4b5563",lineHeight:1.8,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{m.body}</pre>
          </div>
        </div>;
      })}
    </div>
    <div style={{background:B.navy,borderRadius:14,padding:"20px 24px",position:"relative",overflow:"hidden"}}>
      <svg style={{position:"absolute",bottom:0,right:0,opacity:.1}} width="200" height="80" viewBox="0 0 200 80"><path d="M0 50 Q50 20 100 40 Q150 60 200 20 L200 80 L0 80Z" fill={B.gold}/></svg>
      <div style={{fontSize:14,fontWeight:700,color:B.white,marginBottom:14}}>Principios · Ventas de alto valor</div>
      {[{n:"01",t:"Vende tranquilidad, no pólizas",d:"Tu cliente compra certeza de que su familia estará bien."},{n:"02",t:"El silencio cierra ventas",d:"Tras presentar, guarda silencio. El primero en hablar, pierde."},{n:"03",t:"5 contactos antes de descartar",d:"El 80% de ventas ocurre después del 5to contacto."},{n:"04",t:"Referidos en el momento cumbre",d:"Pregunta al cierre: '¿Conoces a alguien que se beneficiaría?'"},{n:"05",t:"Urgencia real, nunca inventada",d:"Usa fechas de vigencia reales. La urgencia falsa destruye la confianza."}].map(tip=>(
        <div key={tip.n} style={{display:"flex",gap:14,marginBottom:12,paddingBottom:12,borderBottom:`1px solid rgba(255,255,255,.08)`}}>
          <div style={{fontSize:20,fontWeight:800,color:B.gold,flexShrink:0,width:28}}>{tip.n}</div>
          <div><div style={{fontSize:12,fontWeight:700,color:B.white,marginBottom:2}}>{tip.t}</div><div style={{fontSize:11,color:"rgba(255,255,255,.45)"}}>{tip.d}</div></div>
        </div>
      ))}
    </div>
    {editando&&<MFModal onClose={()=>setEditando(null)} width={500}>
      <MHead title="Editar mensaje" onClose={()=>setEditando(null)}/>
      <Inp value={editando.body} onChange={v=>setEditando(p=>({...p,body:v}))} rows={10} placeholder="Escribe el mensaje..."/>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:14}}>
        <Btn onClick={()=>setEditando(null)} color="#6b7280" outline small>Cancelar</Btn>
        <Btn onClick={()=>{setTmpl(p=>({...p,[editando.cat]:p[editando.cat].map((m,i)=>i===editando.idx?{...m,body:editando.body}:m)}));setEditando(null);}} bg={B.navy} small>Guardar</Btn>
      </div>
    </MFModal>}
  </div>;
}

/* ===========================================
   COBRANZA
=========================================== */

export default Mensajes;
