import { useState } from "react";
import { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES,
  TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK,
  MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT,
  uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia,
  getTempLead, getAlertas, LS, mkDemo } from "./shared.js";
import { MarflowLogo, ConfirmModal, Av, Btn, Inp, Sel, FL,
  MFModal, MHead, HoraSelect, ContactoModal, GD, Tag } from "./ui.jsx";
import { LeadCard, LeadModal } from "./LeadCard.jsx";

function ListaLeads({leads, setLeads, cuentas, usuario, esAsistente}) {
  const now      = new Date();
  const mesHoy   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const nextDate = new Date(now.getFullYear(), now.getMonth()+1, 1);
  const mesSig   = `${nextDate.getFullYear()}-${String(nextDate.getMonth()+1).padStart(2,"0")}`;

  const [tab,setTab]             = useState("actual");
  const [busq,setBusq]           = useState("");
  const [filtProd,setFiltProd]   = useState("");
  const [filtEtapa,setFiltEtapa] = useState("");
  const [filtTemp,setFiltTemp]   = useState("");
  const [contactoL,setContactoL] = useState(null);
  const [leadAct,setLeadAct]     = useState(null);
  const [nuevoM,setNuevoM]       = useState(false); // modal nuevo lead (asistente + admin)

  const emptyL = {id:uid(),nombre:"",telefono:"",correo:"",edad:"",producto:PRODUCTOS_LEAD[0],estado:"",etapa:"nuevo",ultimoContacto:hoy(),notas:"",objeciones:"",intereses:"",motivador:"",checklist:{...EMPTY_CHECK},seguimientos:[],sinSeguimiento:false,asignadoA:null,mesCreacion:tab==="sig"?mesSig:mesHoy};

  /* -- Meses disponibles (histórico) -- */
  const mesesDisponibles = [...new Set(
    leads.map(l => l.mesCreacion || l.ultimoContacto?.slice(0,7) || mesHoy).filter(Boolean)
  )].sort().reverse();

  /* -- Filtrado por mes -- */
  const leadsActual = leads.filter(l => {
    const mc = l.mesCreacion || l.ultimoContacto?.slice(0,7) || mesHoy;
    return mc === mesHoy || (mc < mesHoy && l.etapa==="seguimiento" && !l.sinSeguimiento);
  });
  const leadsSiguiente = leads.filter(l => {
    const mc = l.mesCreacion || l.ultimoContacto?.slice(0,7) || mesHoy;
    return mc === mesSig;
  });
  const leadsHistorico = (tab !== "actual" && tab !== "sig")
    ? leads.filter(l => (l.mesCreacion||l.ultimoContacto?.slice(0,7)||mesHoy) === tab)
    : [];

  let base = tab==="actual" ? leadsActual : tab==="sig" ? leadsSiguiente : leadsHistorico;
  if (busq)      base = base.filter(l => l.nombre.toLowerCase().includes(busq.toLowerCase())||l.telefono?.includes(busq)||l.estado?.toLowerCase().includes(busq.toLowerCase()));
  if (filtProd)  base = base.filter(l => l.producto===filtProd);
  if (filtEtapa) base = base.filter(l => l.etapa===filtEtapa);
  if (filtTemp)  base = base.filter(l => getTempLead(l)?.nivel===filtTemp);
  const vis = base;

  const total     = vis.length;
  const activos   = vis.filter(l=>!l.sinSeguimiento&&!["otro","cierre"].includes(l.etapa)).length;
  const sinSeg    = vis.filter(l=>l.sinSeguimiento).length;
  const calientes = vis.filter(l=>getTempLead(l)?.nivel==="caliente").length;
  const seguAnt   = tab==="actual" ? leadsActual.filter(l=>{const mc=l.mesCreacion||l.ultimoContacto?.slice(0,7)||mesHoy;return mc<mesHoy&&l.etapa==="seguimiento"&&!l.sinSeguimiento;}).length : 0;

  function save(d) { setLeads(p=>p.find(l=>l.id===d.id)?p.map(l=>l.id===d.id?d:l):[...p,d]); }
  function del(id) { setLeads(p=>p.filter(l=>l.id!==id)); }

  const LISTA_CSS = `
    .mf-table{width:100%;border-collapse:collapse;min-width:580px;}
    .mf-th{text-align:left;padding:10px 12px;font-size:10px;font-weight:700;color:#64748b;
      text-transform:uppercase;letter-spacing:.8px;border-bottom:2px solid #E5E7EB;
      white-space:nowrap;background:#F8F6F2;position:sticky;top:0;z-index:1;}
    .mf-td{padding:10px 12px;font-size:13px;
      border-bottom:1px solid rgba(229,231,235,.5);vertical-align:middle;}
    .mf-tr{transition:background .12s;cursor:pointer;}
    .mf-tr:hover .mf-td{background:rgba(10,31,68,.025);}
    .mf-tr.rojo .mf-td{background:#fef2f2;}
    .mf-tr.rojo:hover .mf-td{background:#fee2e2;}
    .mf-tr.seg-ant .mf-td{background:#fffbeb;}
    .mf-tel-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 11px;
      border-radius:20px;border:1px solid #E5E7EB;background:#fff;color:#0A1F44;
      font-family:'Poppins',sans-serif;font-size:11px;font-weight:600;
      cursor:pointer;transition:all .15s;white-space:nowrap;}
    .mf-tel-btn:hover{border-color:#0A1F44;background:#0A1F44;color:#fff;}
    @media(max-width:640px){.mf-col-hide{display:none!important;}}
  `;

  const fmtMes = m => {
    const [y,mo] = m.split("-");
    return `${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(mo)-1]} ${y}`;
  };

  return (
    <div>
      <style>{LISTA_CSS}</style>

      {/* -- Pestañas de mes -- */}
      <div style={{marginBottom:16}}>
        <div style={{
          display:"flex",gap:0,
          background:B.white,border:`1px solid ${B.gray}`,
          borderRadius:12,padding:4,
          overflowX:"auto",WebkitOverflowScrolling:"touch",
          scrollbarWidth:"none",
        }}>
          {/* Pestaña mes actual */}
          <button onClick={()=>setTab("actual")}
            style={{flexShrink:0,padding:"8px 16px",borderRadius:9,border:"none",background:tab==="actual"?B.navy:"transparent",color:tab==="actual"?B.white:"#64748b",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",transition:"all .18s",whiteSpace:"nowrap"}}>
            📅 {fmtMes(mesHoy)}
            <span style={{marginLeft:6,padding:"1px 7px",borderRadius:20,background:tab==="actual"?"rgba(255,255,255,.2)":"rgba(10,31,68,.08)",fontSize:10,fontWeight:700}}>
              {leadsActual.length}
            </span>
          </button>

          {/* Separador */}
          <div style={{width:1,background:B.gray,margin:"4px 2px",flexShrink:0}}/>

          {/* Siguiente mes -- admin puede agregar leads aquí */}
          {!esAsistente && (
            <button onClick={()=>setTab("sig")}
              style={{flexShrink:0,padding:"8px 14px",borderRadius:9,border:"none",background:tab==="sig"?B.green:"transparent",color:tab==="sig"?B.white:"#64748b",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:11,cursor:"pointer",transition:"all .18s",whiteSpace:"nowrap"}}>
              📆 {fmtMes(mesSig)}
              <span style={{marginLeft:4,padding:"1px 6px",borderRadius:20,background:tab==="sig"?"rgba(255,255,255,.2)":"rgba(10,31,68,.08)",fontSize:10,fontWeight:700}}>
                {leadsSiguiente.length}
              </span>
            </button>
          )}

          {/* Separador */}
          <div style={{width:1,background:B.gray,margin:"4px 2px",flexShrink:0}}/>

          {/* Meses históricos */}
          {mesesDisponibles.filter(m=>m!==mesHoy&&m!==mesSig).map(m=>(
            <button key={m} onClick={()=>setTab(m)}
              style={{flexShrink:0,padding:"8px 14px",borderRadius:9,border:"none",background:tab===m?B.navyMid||"#122550":"transparent",color:tab===m?B.white:"#64748b",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:11,cursor:"pointer",transition:"all .18s",whiteSpace:"nowrap"}}>
              {fmtMes(m)}
              <span style={{marginLeft:4,padding:"1px 6px",borderRadius:20,background:tab===m?"rgba(255,255,255,.18)":"rgba(10,31,68,.08)",fontSize:10,fontWeight:700}}>
                {leads.filter(l=>(l.mesCreacion||l.ultimoContacto?.slice(0,7)||mesHoy)===m).length}
              </span>
            </button>
          ))}
        </div>

        {/* Aviso seguimientos anteriores */}
        {tab==="actual" && seguAnt > 0 && (
          <div style={{marginTop:8,padding:"8px 14px",borderRadius:8,background:"#fffbeb",border:"1px solid #fde68a",fontSize:12,color:B.amber,fontWeight:500,display:"flex",alignItems:"center",gap:6}}>
            <span>⟳</span>
            <span>{seguAnt} lead{seguAnt!==1?"s":""} de meses anteriores en <strong>Seguimiento</strong> incluido{seguAnt!==1?"s":""}.</span>
          </div>
        )}
        {tab==="sig" && !esAsistente && (
          <div style={{marginTop:8,padding:"8px 14px",borderRadius:8,background:B.greenDim||"#16653412",border:`1px solid ${B.green}28`,fontSize:12,color:B.green,fontWeight:500,display:"flex",alignItems:"center",gap:6}}>
            <span>📆</span>
            <span>Leads del <strong>próximo mes -- {fmtMes(mesSig)}</strong>. Agrégalos con anticipación.</span>
          </div>
        )}
      </div>

      {/* -- Stats -- */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
        {[
          {l:"Total",    v:total,     c:B.navy},
          {l:"Activos",  v:activos,   c:B.green},
          {l:"🔥 Calientes", v:calientes, c:"#dc2626"},
          {l:"Sin seguimiento", v:sinSeg, c:B.redBright},
        ].map((s,i)=>(
          <div key={i} style={{
            background:B.white,border:`1px solid ${B.gray}`,
            borderLeft:`3px solid ${s.c}`,borderRadius:9,
            padding:"10px 14px",boxShadow:B.shadow,
          }}>
            <div style={{fontSize:9,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:".6px"}}>{s.l}</div>
            <div style={{fontSize:22,fontWeight:800,color:s.c,lineHeight:1.2,marginTop:2}}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* -- Filtros -- */}
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input
          value={busq} onChange={e=>setBusq(e.target.value)}
          placeholder="🔍 Nombre, teléfono o estado..."
          style={{flex:1,minWidth:0,padding:"11px 13px",borderRadius:8,border:`1.5px solid ${B.gray}`,background:B.white,fontFamily:"'Poppins',sans-serif",fontSize:16,outline:"none",minHeight:44,WebkitAppearance:"none"}}
          onFocus={e=>e.target.style.borderColor=B.gold}
          onBlur={e=>e.target.style.borderColor=B.gray}/>
        <Sel value={filtProd}  onChange={setFiltProd}  options={[{v:"",l:"Producto"},...PRODUCTOS_LEAD.map(p=>({v:p,l:p}))]}/>
        <Sel value={filtEtapa} onChange={setFiltEtapa} options={[{v:"",l:"Etapa"},...ETAPAS.map(e=>({v:e.id,l:e.label}))]}/>
        <Sel value={filtTemp}  onChange={setFiltTemp}  options={[{v:"",l:"Temperatura"},{v:"caliente",l:"🔥 Caliente"},{v:"tibio",l:"🟡 Tibio"},{v:"frio",l:"❄️ Frío"}]}/>
        {(busq||filtProd||filtEtapa||filtTemp) && (
          <button onClick={()=>{setBusq("");setFiltProd("");setFiltEtapa("");setFiltTemp("");}}
            style={{padding:"7px 12px",borderRadius:8,border:`1px solid ${B.gray}`,background:B.white,color:"#64748b",fontFamily:"'Poppins',sans-serif",fontSize:11,cursor:"pointer"}}>
            ✕ Limpiar
          </button>
        )}
        {/* + Lead -- admin y asistente pueden agregar manualmente */}
        <button onClick={()=>setNuevoM(true)}
          style={{padding:"8px 14px",borderRadius:8,border:"none",background:B.navy,color:"#fff",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
          + Lead
        </button>
      </div>

      {/* -- Tabla -- */}
      <div style={{background:B.white,borderRadius:12,border:`1px solid ${B.gray}`,boxShadow:B.shadow,overflow:"hidden"}}>
        <div className="mf-table-wrap">
          <table className="mf-table">
            <thead>
              <tr>
                <th className="mf-th">#</th>
                <th className="mf-th">Nombre</th>
                <th className="mf-th">Contacto</th>
                <th className="mf-th mf-col-hide">Estado</th>
                <th className="mf-th mf-col-hide">Producto</th>
                <th className="mf-th">Etapa</th>
                <th className="mf-th">T°</th>
                <th className="mf-th mf-col-hide">Último contacto</th>
                <th className="mf-th">Checklist</th>
              </tr>
            </thead>
            <tbody>
              {vis.length === 0 && (
                <tr><td colSpan={9} className="mf-td" style={{textAlign:"center",color:"#94a3b8",padding:"40px 16px"}}>
                  Sin leads en este período
                </td></tr>
              )}
              {vis.map((lead,idx)=>{
                const etapa   = ETAPAS.find(e=>e.id===lead.etapa) || ETAPAS[0];
                const temp    = getTempLead(lead);
                const alerts  = getAlertas(lead);
                const sinSeg2 = lead.sinSeguimiento || lead.checklist?.noInteres;
                const mc      = lead.mesCreacion || lead.ultimoContacto?.slice(0,7) || mesHoy;
                const esSeguAnt = tab==="actual" && mc < mesHoy && lead.etapa==="seguimiento";
                const chkDone = Object.values(lead.checklist||{}).filter(Boolean).length;
                const chkTot  = CHECKLIST_DEF.length;

                return (
                  <tr key={lead.id}
                    className={`mf-tr${sinSeg2?" rojo":esSeguAnt?" seg-ant":""}`}
                    onClick={()=>setLeadAct(lead)}>

                    <td className="mf-td" style={{color:"#94a3b8",fontSize:11,width:32}}>{idx+1}</td>

                    <td className="mf-td">
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{
                          width:32,height:32,borderRadius:"50%",flexShrink:0,
                          background:sinSeg2?B.redDim:esSeguAnt?"#fde68a44":B.navy+"12",
                          border:`1.5px solid ${sinSeg2?B.redBright+"44":esSeguAnt?"#fcd34d":B.navy+"20"}`,
                          display:"flex",alignItems:"center",justifyContent:"center",
                          fontSize:11,fontWeight:700,
                          color:sinSeg2?B.redBright:esSeguAnt?B.amber:B.navy,
                        }}>
                          {initials(lead.nombre)}
                        </div>
                        <div style={{minWidth:0}}>
                          <div style={{fontWeight:700,color:sinSeg2?B.redBright:B.navy,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>
                            {sinSeg2?"🚫 ":esSeguAnt?"⟳ ":""}{lead.nombre}
                          </div>
                          <div style={{fontSize:10,color:"#94a3b8"}}>{lead.edad&&`${lead.edad} años`}{esSeguAnt&&<span style={{color:B.amber,fontWeight:600}}> · seguimiento anterior</span>}</div>
                          {alerts.slice(0,1).map((a,i)=>(
                            <div key={i} style={{fontSize:9,color:a.color,fontWeight:600}}>{a.msg}</div>
                          ))}
                        </div>
                      </div>
                    </td>

                    <td className="mf-td" onClick={e=>e.stopPropagation()}>
                      <button className="mf-tel-btn" onClick={()=>setContactoL(lead)}>
                        📞 {lead.telefono||"--"}
                      </button>
                    </td>

                    <td className="mf-td mf-col-hide" style={{color:"#475569",fontSize:12}}>{lead.estado||"--"}</td>

                    <td className="mf-td mf-col-hide">
                      {lead.producto && <Tag color={B.navy} small>{lead.producto}</Tag>}
                    </td>

                    <td className="mf-td">
                      <Tag color={etapa.color} small>{etapa.icon} {etapa.label}</Tag>
                    </td>

                    <td className="mf-td" style={{fontSize:18,textAlign:"center"}}>
                      {temp?.icon || <span style={{color:"#e5e7eb",fontSize:12}}>--</span>}
                    </td>

                    <td className="mf-td mf-col-hide" style={{fontSize:11,color:"#94a3b8"}}>
                      {fmtF(lead.ultimoContacto)}
                    </td>

                    <td className="mf-td" onClick={e=>e.stopPropagation()}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <div style={{width:48,height:5,background:B.gray,borderRadius:3,overflow:"hidden"}}>
                          <div style={{
                            height:"100%",borderRadius:3,transition:"width .3s",
                            width:`${Math.round(chkDone/chkTot*100)}%`,
                            background:sinSeg2?B.redBright:chkDone>=5?B.green:chkDone>=3?B.amber:B.blue,
                          }}/>
                        </div>
                        <span style={{fontSize:10,color:"#94a3b8",fontWeight:600,whiteSpace:"nowrap"}}>{chkDone}/{chkTot}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{padding:"10px 16px",borderTop:`1px solid ${B.gray}`,fontSize:11,color:"#94a3b8",fontWeight:500}}>
          {vis.length} lead{vis.length!==1?"s":""} · {tab==="actual"?`${fmtMes(mesHoy)} (mes actual)`:fmtMes(tab)}
        </div>
      </div>

      {contactoL && <ContactoModal lead={contactoL} onClose={()=>setContactoL(null)}/>}
      {leadAct   && <LeadModal lead={leadAct} onClose={()=>setLeadAct(null)} onSave={save} onDelete={del} cuentas={cuentas} usuario={usuario}/>}
      {nuevoM    && <LeadModal lead={{...emptyL, mesCreacion:tab==="sig"?mesSig:mesHoy}} onClose={()=>setNuevoM(false)} onSave={d=>{save(d);setNuevoM(false);}} onDelete={()=>{}} cuentas={cuentas} usuario={usuario}/>}
    </div>
  );
}


/* ===========================================
   MENSAJES
=========================================== */

export default ListaLeads;


