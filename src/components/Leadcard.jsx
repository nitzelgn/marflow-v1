import { useState } from "react";
import { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES,
  TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK,
  MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT,
  uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia,
  getTempLead, getAlertas, LS, mkDemo } from "./shared.js";
import { MarflowLogo, ConfirmModal, Av, Btn, Inp, Sel, FL,
  MFModal, MHead, HoraSelect, ContactoModal, GD, Tag } from "./ui.jsx";

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

/* ===========================================
   LEAD MODAL
=========================================== */
function LeadModal({lead,onClose,onSave,onDelete,cuentas,usuario}) {
  const [f,setF]=useState({...lead});
  const [tab,setTab]=useState("info");
  const [nota,setNota]=useState("");
  const [tipoN,setTipoN]=useState("llamada");
  const [confirmDel,setConfirmDel]=useState(false);
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
      {id:uid(),fecha:hoy(),texto:nota,tipo:tipoN,
       autor:usuario?.nombre||"",          // ← quién registró
       rol:usuario?.rol||""},
      ...(p.seguimientos||[])
    ]}));
    setNota("");
  }

  // Cuando el asistente cambia etapa, se registra automáticamente en historial
  function cambiarEtapa(nueva){
    const anterior = f.etapa;
    if(nueva===anterior) return;
    const etL = ETAPAS.find(e=>e.id===nueva)?.label||nueva;
    const etA = ETAPAS.find(e=>e.id===anterior)?.label||anterior;
    // "otro" = sin interés → sinSeguimiento automático
    const autoSinSeg = nueva==="otro";
    setF(p=>({...p,
      etapa:nueva,
      sinSeguimiento: autoSinSeg ? true : p.sinSeguimiento,
      checklist: autoSinSeg ? {...p.checklist, noInteres:true} : p.checklist,
      seguimientos:[
        {id:uid(),fecha:hoy(),
         texto:`Etapa: ${etA} → ${etL}${autoSinSeg?" (sin seguimiento automático)":""}`,
         tipo:"nota",
         autor:usuario?.nombre||"",
         rol:usuario?.rol||"",
         _auto:true},
        ...(p.seguimientos||[])
      ]
    }));
  }

  function guardar(){
    onSave({...f, ultimoContacto:hoy(), ultimaActualizacion:{por:usuario?.nombre||"", rol:usuario?.rol||"", fecha:hoy()}});
    onClose();
  }

  // Asistente solo ve checklist + historial + info básica (no estrategia ni eliminar)
  const TABS_ADMIN = [{v:"info",l:"Info"},{v:"etapa",l:"Etapa"},{v:"checklist",l:"Seguimiento"},{v:"historial",l:`Historial (${(f.seguimientos||[]).length})`},{v:"estrategia",l:"Estrategia"}];
  const TABS_ASIST = [{v:"checklist",l:"Seguimiento"},{v:"historial",l:`Historial (${(f.seguimientos||[]).length})`},{v:"info",l:"Info"}];
  const TABS = esAsistente ? TABS_ASIST : TABS_ADMIN;

  const asistentes=(cuentas||[]).filter(c=>c.rol==="asistente"&&c.adminId===(usuario.rol==="superadmin"?c.adminId:usuario.id));
  const tipoColor={llamada:B.blue,whatsapp:"#25d366",visita:B.purple,correo:B.amber,nota:"#9ca3af"};

  return <MFModal onClose={onClose} width={640}>
    <MHead title={lead.nombre||"Nuevo lead"} sub={`${f.producto} · ${f.estado}${temp?` · ${temp.icon} ${temp.label}`:""}`} onClose={onClose}/>

    {f.sinSeguimiento&&<div style={{background:B.redLight,border:`1.5px solid ${B.redBright}33`,borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:20}}>🚫</span>
        <div><div style={{fontSize:13,fontWeight:700,color:B.redBright}}>Sin seguimiento</div><div style={{fontSize:11,color:"#6b7280"}}>No interesado / perdido definitivo</div></div>
      </div>
      <Btn onClick={toggleSinSeg} color={B.green} outline small>Reactivar</Btn>
    </div>}

    <div style={{display:"flex",gap:3,marginBottom:18,background:B.cream,borderRadius:10,padding:4}}>
      {TABS.map(t=>(
        <button key={t.v} onClick={()=>setTab(t.v)} style={{flex:1,padding:"7px 2px",borderRadius:7,border:"none",background:tab===t.v?B.white:"transparent",color:tab===t.v?B.navy:"#6b7280",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:10,cursor:"pointer",transition:"all .15s",boxShadow:tab===t.v?B.shadow:"none"}}>
          {t.l}
        </button>
      ))}
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
        {ETAPAS.map(et=>(
          <button key={et.id} onClick={()=>cambiarEtapa(et.id)}
            style={{padding:"8px 16px",borderRadius:20,border:`1.5px solid ${f.etapa===et.id?et.color:B.gray}`,background:f.etapa===et.id?et.color+"14":B.cream,color:f.etapa===et.id?et.color:"#6b7280",fontFamily:"Poppins",fontWeight:600,fontSize:12,cursor:"pointer"}}>
            {et.icon} {et.label}
          </button>
        ))}
      </div>
      <div style={{background:f.sinSeguimiento?B.redLight:B.cream,border:`1.5px solid ${f.sinSeguimiento?B.redBright+"44":B.gray}`,borderRadius:12,padding:"14px 16px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:f.sinSeguimiento?B.redBright:B.navy}}>🚫 Sin seguimiento</div>
            <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>No interesado / perdido definitivo. Se marca en rojo y deja de aparecer en alertas.</div>
          </div>
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
                  {s.autor&&(
                    <span style={{
                      display:"inline-flex",alignItems:"center",gap:3,
                      padding:"1px 7px",borderRadius:20,
                      background:s.rol==="asistente"?"#7c3aed14":"#1e40af14",
                      color:s.rol==="asistente"?"#7c3aed":B.navy,
                      fontSize:9,fontWeight:700,
                    }}>
                      {s.rol==="asistente"?"🤝":"👤"} {s.autor}
                    </span>
                  )}
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
      {!esAsistente
        ? <Btn onClick={()=>setConfirmDel(true)} color={B.redBright} outline small>Eliminar lead</Btn>
        : <div style={{fontSize:10,color:"#94a3b8",fontStyle:"italic"}}>Asistente · solo puede registrar seguimientos</div>
      }
      <div style={{display:"flex",gap:8}}>
        <Btn onClick={onClose} color="#6b7280" outline small>Cancelar</Btn>
        <Btn onClick={guardar} bg={B.navy} small>Guardar</Btn>
      </div>
    </div>
    {confirmDel&&<ConfirmModal
      titulo="¿Eliminar lead?"
      mensaje={`Vas a eliminar a "${lead.nombre}" permanentemente. Esta acción no se puede deshacer.`}
      icono="🗑️"
      textoConfirm="Sí, eliminar"
      colorConfirm={B.redBright}
      onConfirm={()=>{onDelete(lead.id);onClose();}}
      onCancel={()=>setConfirmDel(false)}
    />}
  </MFModal>;
}

/* ===========================================
   PIPELINE
=========================================== */

export { LeadCard, LeadModal };
