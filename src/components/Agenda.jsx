import { useState } from "react";
import { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES,
  TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK,
  MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT,
  uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia,
  getTempLead, getAlertas, LS, mkDemo } from "./shared.js";
import { MarflowLogo, ConfirmModal, Av, Btn, Inp, Sel, FL,
  MFModal, MHead, HoraSelect, ContactoModal, GD, Tag } from "./ui.jsx";

function Agenda({eventos,setEventos,leads,esAsistente,usuario}) {
  const now = new Date();
  const [mes,setMes]   = useState(now.getMonth());
  const [anio,setAnio] = useState(now.getFullYear());
  const [diaClick,setDiaClick] = useState(null);
  const [modalEv,setModalEv]   = useState(false);
  const [modalDia,setModalDia] = useState(false);
  const [editId,setEditId]     = useState(null);
  const [confirmEvDel,setConfirmEvDel] = useState(null); // id del evento a eliminar
  const [popupCot,setPopupCot]         = useState(null); // {titulo, leadNombre}

  const emptyEv = {
    id:uid(), titulo:"", fechaInicio:hoy(), fechaFin:"",
    horaInicio:"", horaFin:"",
    tipo:"trabajo", subtipo:"info1",
    repeticion:"none", nota:"", leadId:"",
    agendadoPor: usuario?.nombre || "",
    recordatorioCot: false,
  };
  const [form,setForm] = useState(emptyEv);
  const sf = (k,v) => setForm(f=>({...f,[k]:v}));

  const strD   = d => `${anio}-${String(mes+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const strMes = `${anio}-${String(mes+1).padStart(2,"0")}`;

  // Asistentes ven viaje, ocultan personal
  function mapEvDia(d) {
    const all = eventos.filter(ev => {
      const start = ev.fechaInicio || ev.fecha || "";
      const end   = ev.fechaFin   || start;
      return d >= start && d <= end;
    });
    if (!esAsistente) return all;
    return all.map(ev =>
      ev.tipo === "personal"
        ? {...ev, titulo:"Ocupado 🔒", nota:"", leadId:"", _privado:true}
        : ev
    );
  }

  const tipoC = t => TIPO_EVENTO.find(x=>x.id===t)?.color || "#9ca3af";
  const tipoL = t => TIPO_EVENTO.find(x=>x.id===t)?.label || t;

  function abrirNuevo(fecha) {
    // Asistente SÍ puede crear sus propios eventos
    setForm({...emptyEv, id:uid(), fechaInicio:fecha, fechaFin:fecha});
    setEditId(null); setModalEv(true);
  }
  function abrirEditar(ev) {
    if (ev._privado) return;
    // Asistente solo edita eventos que él agendó
    if (esAsistente && ev.agendadoPor !== usuario?.nombre) return;
    const fi = ev.fechaInicio || ev.fecha || hoy();
    const ff = ev.fechaFin    || fi;
    setForm({...emptyEv, ...ev, fechaInicio:fi, fechaFin:ff});
    setEditId(ev.id); setModalEv(true);
  }
  function guardar() {
    if (!form.titulo.trim() || !form.fechaInicio) return;
    const fi = form.fechaInicio;
    const ff = form.fechaFin && form.fechaFin >= fi ? form.fechaFin : fi;
    const saved = {...form, fechaInicio:fi, fechaFin:ff, fecha:fi};
    if (editId) setEventos(p => p.map(ev => ev.id===editId ? saved : ev));
    else        setEventos(p => [...p, saved]);
    setModalEv(false);
    // Popup recordatorio cotización -- aparece 30 minutos después
    if (form.recordatorioCot && form.tipo==="cita") {
      const lead = leads.find(l=>l.id===form.leadId);
      const payload = {titulo:form.titulo, leadNombre:lead?.nombre||""};
      setTimeout(()=>setPopupCot(payload), 30 * 60 * 1000); // 30 min en ms
    }
  }
  function elimEv(id) {
    setEventos(p => p.filter(ev => ev.id !== id));
    setModalDia(false);
  }

  // Calendar grid -- días ghost del mes anterior y siguiente con su número real
  const diasMes   = getDias(anio, mes);
  const primerDia = getPrimerDia(anio, mes);
  const diasMesAnt = getDias(anio, mes === 0 ? 11 : mes - 1);

  // Celdas: objetos {dia, tipo: "actual"|"prev"|"next", fecha}
  const strFull = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const celdas = [
    // días del mes anterior
    ...Array.from({length:primerDia}, (_,i) => {
      const d = diasMesAnt - primerDia + 1 + i;
      const [py,pm] = mes===0 ? [anio-1,11] : [anio,mes-1];
      return {dia:d, tipo:"prev", fecha:strFull(py,pm,d)};
    }),
    // días del mes actual
    ...Array.from({length:diasMes}, (_,i) => ({
      dia:i+1, tipo:"actual", fecha:strFull(anio,mes,i+1)
    })),
  ];
  // Completar filas con días del mes siguiente
  let nextDia = 1;
  while (celdas.length % 7 !== 0) {
    const [ny,nm] = mes===11 ? [anio+1,0] : [anio,mes+1];
    celdas.push({dia:nextDia, tipo:"next", fecha:strFull(ny,nm,nextDia)});
    nextDia++;
  }

  const diasConEvs = diaClick ? mapEvDia(strD(diaClick)) : [];
  const DIAS_MIN   = ["L","M","X","J","V","S","D"];

  const AGENDA_CSS = `
    .mf-cal-wrap{width:100%;box-sizing:border-box;overflow-x:hidden;}
    .mf-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);width:100%;}
    .mf-cal-hdr{display:grid;grid-template-columns:repeat(7,1fr);background:#0A1F44;border-radius:12px 12px 0 0;}
    .mf-cell{box-sizing:border-box;overflow:hidden;border-right:1px solid rgba(10,31,68,0.06);border-bottom:1px solid rgba(10,31,68,0.06);cursor:pointer;transition:background .12s;-webkit-tap-highlight-color:transparent;display:flex;flex-direction:column;}
    .mf-cell:hover{background:rgba(10,31,68,0.03)!important;}
    .mf-cell.empty{background:#f9f8f6;cursor:default;}
    .mf-cell.today{background:rgba(10,31,68,0.04);}
    .mf-cell.selected{background:rgba(198,169,107,0.10)!important;}
    .mf-cell.weekend{background:#faf8f4;}
    .mf-daynum{border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-weight:500;transition:all .15s;}
    .mf-daynum.today-num{background:#0A1F44;color:#fff;font-weight:800;}
    .mf-daynum.sel-num{border:2px solid #C6A96B;color:#C6A96B;font-weight:700;}
    .mf-daynum.weekend-num{color:#C6A96B;}
    .mf-pill{display:block;width:100%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;border-radius:4px;font-weight:600;cursor:pointer;transition:opacity .12s;box-sizing:border-box;}
    .mf-pill:hover{opacity:.8;}
    .mf-pill.multiday{border-radius:3px;}
    /* Responsive */
    @media(max-width:390px){
      .mf-cell{min-height:48px;padding:3px 2px 2px;}
      .mf-daynum{width:20px;height:20px;font-size:10px;}
      .mf-pill{font-size:7px;padding:1px 3px;margin-bottom:1px;line-height:1.4;}
      .mf-nav-month{font-size:16px;}
      .mf-legend{display:none!important;}
    }
    @media(min-width:391px) and (max-width:600px){
      .mf-cell{min-height:60px;padding:4px 3px 3px;}
      .mf-daynum{width:22px;height:22px;font-size:11px;}
      .mf-pill{font-size:8px;padding:1px 4px;margin-bottom:1px;line-height:1.5;}
      .mf-nav-month{font-size:18px;}
    }
    @media(min-width:601px) and (max-width:900px){
      .mf-cell{min-height:80px;padding:5px 4px 4px;}
      .mf-daynum{width:26px;height:26px;font-size:12px;}
      .mf-pill{font-size:9px;padding:2px 5px;margin-bottom:2px;line-height:1.5;}
      .mf-nav-month{font-size:20px;}
    }
    @media(min-width:901px){
      .mf-cell{min-height:100px;padding:6px 6px 4px;}
      .mf-daynum{width:30px;height:30px;font-size:13px;}
      .mf-pill{font-size:10px;padding:2px 6px;margin-bottom:2px;line-height:1.6;}
      .mf-nav-month{font-size:22px;}
    }
  `;

  return (
    <div className="mf-cal-wrap">
      <style>{AGENDA_CSS}</style>

      {/* -- NAV BAR -- */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,flexWrap:"nowrap",justifyContent:"space-between",width:"100%"}}>
        {/* Flechas + mes */}
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0,minWidth:0}}>
          <button
            onClick={()=>{if(mes===0){setMes(11);setAnio(a=>a-1);}else setMes(m=>m-1);}}
            style={{width:38,height:38,borderRadius:9,border:`1px solid ${B.gray}`,background:B.white,color:B.navy,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,WebkitTapHighlightColor:"transparent"}}>‹</button>
          <div style={{textAlign:"center",minWidth:0,padding:"0 2px"}}>
            <span className="mf-nav-month" style={{fontWeight:800,color:B.navy,letterSpacing:"-.5px"}}>{MESES[mes]}</span>
            <span style={{fontSize:12,color:"#64748b",marginLeft:5,fontWeight:400}}>{anio}</span>
          </div>
          <button
            onClick={()=>{if(mes===11){setMes(0);setAnio(a=>a+1);}else setMes(m=>m+1);}}
            style={{width:38,height:38,borderRadius:9,border:`1px solid ${B.gray}`,background:B.white,color:B.navy,fontSize:18,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,WebkitTapHighlightColor:"transparent"}}>›</button>
        </div>

        {/* Leyenda -- oculta en mobile (via CSS .mf-legend) */}
        <div className="mf-legend" style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",flex:1,justifyContent:"center"}}>
          {TIPO_EVENTO.filter(t => !esAsistente || !t.privado).map(t=>(
            <div key={t.id} style={{display:"flex",alignItems:"center",gap:3,fontSize:10,color:"#64748b",fontWeight:500,whiteSpace:"nowrap"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:t.color,flexShrink:0}}/>
              {t.label.replace(" 🔒","").replace(" ✈️","")}
            </div>
          ))}
        </div>

        {/* Botones */}
        <div style={{display:"flex",gap:5,flexShrink:0}}>
          <button
            onClick={()=>{setMes(now.getMonth());setAnio(now.getFullYear());}}
            style={{padding:"0 12px",height:38,borderRadius:8,border:`1px solid ${B.gray}`,background:B.white,color:B.navy,fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",WebkitTapHighlightColor:"transparent"}}>
            Hoy
          </button>
          <button
            onClick={()=>abrirNuevo(hoy())}
            style={{padding:"0 13px",height:38,borderRadius:8,border:"none",background:B.navy,color:"#fff",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",WebkitTapHighlightColor:"transparent"}}>
            + Evento
          </button>
        </div>
      </div>

      {/* -- GRID CALENDARIO -- */}
      <div style={{background:B.white,borderRadius:14,border:`1px solid ${B.gray}`,overflow:"hidden",boxShadow:B.shadow}}>
        {/* Headers L-D */}
        <div className="mf-cal-hdr">
          {DIAS_MIN.map((d,i)=>(
            <div key={i} style={{textAlign:"center",padding:"10px 0",fontSize:10,fontWeight:700,letterSpacing:"0.8px",textTransform:"uppercase",color:i>=5?B.gold:"rgba(255,255,255,0.7)"}}>
              {d}
            </div>
          ))}
        </div>

        {/* Celdas -- días actuales + ghost prev/next */}
        <div className="mf-cal-grid">
          {celdas.map((celda,i)=>{
            const {dia, tipo, fecha: fs} = celda;
            const esGhost  = tipo !== "actual";
            const evs      = esGhost ? [] : mapEvDia(fs);
            const esH      = fs === hoy();
            const sel      = !esGhost && diaClick === dia;
            const colIdx   = i % 7;
            const esFin    = colIdx >= 5;

            const cellClass = [
              "mf-cell",
              esGhost ? "ghost" : "",
              esH  ? "today"    : "",
              sel  ? "selected" : "",
              esFin && !esGhost ? "weekend" : ""
            ].filter(Boolean).join(" ");

            return (
              <div
                key={`${tipo}-${dia}-${i}`}
                className={cellClass}
                style={esGhost ? {opacity:.35, cursor:"default", background:esFin?"#faf8f4":"#f9f9f9"} : {}}
                onClick={()=>{
                  if(esGhost) return;
                  setDiaClick(dia === diaClick ? null : dia);
                  setModalDia(true);
                }}>
                {/* Número día */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                  <div className={[
                    "mf-daynum",
                    esH && !esGhost  ? "today-num"   : "",
                    sel && !esH      ? "sel-num"      : "",
                    esFin && !esH && !esGhost ? "weekend-num" : ""
                  ].filter(Boolean).join(" ")}
                    style={esGhost ? {color:"#bbb"} : {}}>
                    {dia}
                  </div>
                  {evs.length > 0 && (
                    <span style={{fontSize:8,color:"#94a3b8",fontWeight:600,marginRight:1}}>{evs.length}</span>
                  )}
                </div>
                {/* Pills eventos */}
                {!esGhost && (
                  <div style={{overflow:"hidden",flex:1}}>
                    {evs.slice(0,2).map(ev=>(
                      <div
                        key={ev.id}
                        className="mf-pill"
                        onClick={e=>{e.stopPropagation(); if(!ev._privado) abrirEditar(ev);}}
                        style={{
                          background: ev._privado ? "#f3f4f680" : tipoC(ev.tipo)+"20",
                          color:      ev._privado ? "#9ca3af"   : tipoC(ev.tipo),
                          borderLeft: `2.5px solid ${tipoC(ev.tipo)}`,
                        }}>
                        {ev.horaInicio ? `${ev.horaInicio} ` : ""}{ev.titulo}
                      </div>
                    ))}
                    {evs.length > 2 && (
                      <div style={{fontSize:8,color:"#94a3b8",fontWeight:600,paddingLeft:2,lineHeight:1.4}}>
                        +{evs.length-2} más
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* -- MODAL DÍA -- estilo lista tipo Google Calendar -- */}
      {modalDia && diaClick && (
        <MFModal onClose={()=>{setModalDia(false);setDiaClick(null);}} width={440}>
          {/* Header fecha prominente */}
          <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{
                  fontFamily:"'Poppins',sans-serif",
                  fontSize:13,fontWeight:600,
                  color:"#64748b",textTransform:"uppercase",letterSpacing:"1px",marginBottom:4
                }}>
                  {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"][
                    (new Date(`${anio}-${String(mes+1).padStart(2,"0")}-${String(diaClick).padStart(2,"0")}`).getDay()+6)%7
                  ]}
                </div>
                <div style={{
                  fontFamily:"'Poppins',sans-serif",
                  fontSize:36,fontWeight:800,
                  color:B.navy,lineHeight:1,letterSpacing:"-1px"
                }}>
                  {diaClick}
                </div>
                <div style={{fontSize:14,color:"#64748b",marginTop:2,fontWeight:400}}>
                  {MESES[mes]} {anio}
                </div>
              </div>
              <button onClick={()=>{setModalDia(false);setDiaClick(null);}}
                style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:22,lineHeight:1,padding:4}}>✕</button>
            </div>
            <div style={{height:1,background:`linear-gradient(90deg,transparent,${B.gold}55,transparent)`,marginTop:16}}/>
          </div>

          {/* Lista de eventos -- estilo Google Calendar */}
          {diasConEvs.length === 0 && (
            <div style={{textAlign:"center",padding:"32px 0"}}>
              <div style={{fontSize:28,marginBottom:8}}>📅</div>
              <div style={{fontSize:14,color:"#94a3b8",fontWeight:500}}>Sin eventos este día</div>
            </div>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:0}}>
            {diasConEvs.map((ev,idx)=>(
              <div key={ev.id} style={{
                display:"flex",gap:12,
                padding:"14px 0",
                borderBottom:idx<diasConEvs.length-1?`1px solid ${B.gray}22`:"none",
              }}>
                {/* Hora izquierda */}
                <div style={{width:60,flexShrink:0,paddingTop:2}}>
                  {!ev._privado && ev.horaInicio ? (
                    <>
                      <div style={{fontSize:12,fontWeight:600,color:B.navy}}>{ev.horaInicio}</div>
                      {ev.horaFin&&<div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{ev.horaFin}</div>}
                    </>
                  ) : (
                    <div style={{fontSize:11,color:"#94a3b8"}}>Todo el día</div>
                  )}
                </div>

                {/* Línea de color */}
                <div style={{width:3,borderRadius:2,background:tipoC(ev.tipo),flexShrink:0,alignSelf:"stretch",minHeight:40}}/>

                {/* Contenido */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{
                    fontSize:14,fontWeight:700,
                    color:ev._privado?"#94a3b8":B.navy,
                    marginBottom:4,
                    overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"
                  }}>
                    {ev.titulo}
                  </div>
                  {!ev._privado && (
                    <>
                      {/* Tags */}
                      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:ev.nota||ev.agendadoPor?6:0}}>
                        <Tag color={tipoC(ev.tipo)} small>
                          {tipoL(ev.tipo).replace(" 🔒","").replace(" ✈️"," ✈")}
                        </Tag>
                        {ev.tipo==="trabajo"&&ev.subtipo&&(
                          <Tag color={B.navy} small>{SUBTIPO_LABEL[ev.subtipo]||ev.subtipo}</Tag>
                        )}
                        {ev.repeticion&&ev.repeticion!=="none"&&(
                          <Tag color={B.gold} small>↻ {REPETICION.find(r=>r.v===ev.repeticion)?.l}</Tag>
                        )}
                        {ev.fechaFin&&ev.fechaFin!==ev.fechaInicio&&(
                          <Tag color="#7c3aed" small>📅 Hasta {fmtF(ev.fechaFin)}</Tag>
                        )}
                      </div>
                      {/* Quién agendó */}
                      {ev.agendadoPor && (
                        <div style={{
                          display:"flex",alignItems:"center",gap:6,
                          fontSize:11,color:"#64748b",marginBottom:4
                        }}>
                          <span style={{
                            width:18,height:18,borderRadius:"50%",
                            background:B.navy+"20",
                            display:"inline-flex",alignItems:"center",justifyContent:"center",
                            fontSize:8,fontWeight:700,color:B.navy,flexShrink:0
                          }}>
                            {initials(ev.agendadoPor)}
                          </span>
                          <span>Agendado por <strong style={{color:B.navy}}>{ev.agendadoPor}</strong></span>
                        </div>
                      )}
                      {ev.nota && (
                        <div style={{fontSize:11,color:"#64748b",lineHeight:1.6,marginTop:2}}>{ev.nota}</div>
                      )}
                    </>
                  )}
                </div>

                {/* Acciones: admin ve todo, asistente solo sus eventos */}
                {!ev._privado && (!esAsistente || ev.agendadoPor===usuario?.nombre) && (
                  <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
                    <button
                      onClick={()=>{abrirEditar(ev);setModalDia(false);}}
                      style={{width:28,height:28,borderRadius:7,border:`1px solid ${B.gray}`,background:B.white,color:"#64748b",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=B.navy;e.currentTarget.style.color=B.navy;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=B.gray;e.currentTarget.style.color="#64748b";}}>✏️</button>
                    <button
                      onClick={()=>setConfirmEvDel(ev.id)}
                      style={{width:28,height:28,borderRadius:7,border:`1px solid ${B.gray}`,background:B.white,color:"#64748b",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=B.redBright;e.currentTarget.style.color=B.redBright;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=B.gray;e.currentTarget.style.color="#64748b";}}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={()=>{abrirNuevo(strD(diaClick));setModalDia(false);}}
            style={{
              width:"100%",marginTop:16,padding:"12px",
              borderRadius:10,border:`1.5px dashed ${B.gray}`,
              background:"transparent",color:B.navy,
              fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:13,
              cursor:"pointer",transition:"all .15s",
              display:"flex",alignItems:"center",justifyContent:"center",gap:6
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=B.gold;e.currentTarget.style.background=B.goldDim;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=B.gray;e.currentTarget.style.background="transparent";}}>
            <span style={{fontSize:16}}>+</span> Agregar evento
          </button>
        </MFModal>
      )}

      {/* -- MODAL FORM EVENTO -- admin y asistente -- */}
      {modalEv && (
        <MFModal onClose={()=>setModalEv(false)} width={500}>
          <MHead title={editId?"Editar evento":"Nuevo evento"} onClose={()=>setModalEv(false)}/>
          <div style={{display:"flex",flexDirection:"column",gap:13}}>

            <FL label="Título">
              <Inp value={form.titulo} onChange={v=>sf("titulo",v)} placeholder="Descripción del evento"/>
            </FL>

            {/* Tipo -- asistente solo ve Trabajo y Cita cliente */}
            <FL label="Tipo de evento">
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {TIPO_EVENTO.filter(t => !esAsistente || !t.soloAdmin).map(t=>(
                  <button key={t.id} onClick={()=>sf("tipo",t.id)}
                    style={{padding:"6px 13px",borderRadius:20,border:`1.5px solid ${form.tipo===t.id?t.color:B.gray}`,background:form.tipo===t.id?t.color+"16":B.cream,color:form.tipo===t.id?t.color:"#64748b",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:11,cursor:"pointer",transition:"all .15s"}}>
                    {t.label}
                  </button>
                ))}
              </div>
              {form.tipo==="personal"&&<div style={{fontSize:11,color:"#94a3b8",marginTop:5,fontStyle:"italic"}}>🔒 Asistentes solo verán "Ocupado"</div>}
            </FL>

            {/* Subtipo -- solo cuando tipo tiene subtipos */}
            {(form.tipo==="trabajo" || form.tipo==="cita") && (
              <FL label={form.tipo==="trabajo" ? "Tipo de actividad" : "Tipo de cita"}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                  {TIPO_EVENTO.find(t=>t.id===form.tipo)?.subtipos.map(v=>(
                    <button key={v} onClick={()=>sf("subtipo",v)}
                      style={{padding:"6px 14px",borderRadius:20,
                        border:`1.5px solid ${form.subtipo===v?TIPO_EVENTO.find(t=>t.id===form.tipo)?.color:B.gray}`,
                        background:form.subtipo===v?TIPO_EVENTO.find(t=>t.id===form.tipo)?.color+"14":B.cream,
                        color:form.subtipo===v?TIPO_EVENTO.find(t=>t.id===form.tipo)?.color:"#64748b",
                        fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:12,cursor:"pointer",transition:"all .15s"}}>
                      {SUBTIPO_LABEL[v]||v}
                    </button>
                  ))}
                </div>
              </FL>
            )}

            {/* Recordatorio cotización -- solo en Cita cliente */}
            {form.tipo==="cita" && (
              <div style={{
                display:"flex",alignItems:"center",justifyContent:"space-between",
                padding:"12px 14px",borderRadius:10,
                background:form.recordatorioCot?"#fffbeb":"#f8f8f8",
                border:`1.5px solid ${form.recordatorioCot?"#fbbf24":B.gray}`,
                transition:"all .2s",cursor:"pointer"
              }} onClick={()=>sf("recordatorioCot",!form.recordatorioCot)}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:18}}>📄</span>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:B.navy}}>Recordatorio: Enviar cotización</div>
                    <div style={{fontSize:10,color:"#64748b"}}>Te aparecerá un pop-up recordatorio para enviar la cotización después de esta cita</div>
                  </div>
                </div>
                <div style={{
                  width:42,height:24,borderRadius:12,
                  background:form.recordatorioCot?"#f59e0b":B.gray,
                  position:"relative",transition:"background .2s",flexShrink:0,
                }}>
                  <div style={{
                    position:"absolute",top:3,
                    left:form.recordatorioCot?20:3,
                    width:18,height:18,borderRadius:"50%",
                    background:"#fff",transition:"left .2s",
                    boxShadow:"0 1px 3px rgba(0,0,0,.2)"
                  }}/>
                </div>
              </div>
            )}

            {/* Fechas */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
              <FL label="Fecha inicio">
                <Inp type="date" value={form.fechaInicio} onChange={v=>sf("fechaInicio",v)}/>
              </FL>
              <FL label="Fecha fin (opcional)">
                <Inp type="date" value={form.fechaFin} onChange={v=>sf("fechaFin",v)}/>
              </FL>
            </div>

            {/* Horas */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10}}>
              <FL label="Hora inicio"><HoraSelect value={form.horaInicio} onChange={v=>sf("horaInicio",v)}/></FL>
              <FL label="Hora fin"><HoraSelect value={form.horaFin} onChange={v=>sf("horaFin",v)}/></FL>
            </div>

            <FL label="Repetición">
              <Sel value={form.repeticion} onChange={v=>sf("repeticion",v)} options={REPETICION}/>
            </FL>

            {/* Vincular lead -- SOLO cuando tipo es "cita" */}
            {form.tipo==="cita" && (
              <FL label="Vincular cliente">
                <Sel value={form.leadId} onChange={v=>sf("leadId",v)}
                  options={[{v:"",l:"-- Seleccionar cliente --"},...leads.map(l=>({v:l.id,l:`${l.nombre} · ${l.producto}`}))]}/>
                {form.leadId && leads.find(l=>l.id===form.leadId) && (
                  <div style={{marginTop:6,padding:"8px 12px",borderRadius:8,background:B.greenDim||"#16653412",border:`1px solid ${B.green}22`,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13}}>👤</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:B.green}}>{leads.find(l=>l.id===form.leadId)?.nombre}</div>
                      <div style={{fontSize:10,color:"#64748b"}}>{leads.find(l=>l.id===form.leadId)?.producto} · {leads.find(l=>l.id===form.leadId)?.estado}</div>
                    </div>
                  </div>
                )}
              </FL>
            )}

            <FL label="Notas">
              <Inp value={form.nota} onChange={v=>sf("nota",v)} rows={2} placeholder="Detalles del evento..."/>
            </FL>
          </div>

          {editId && (
            <div style={{marginTop:12}}>
              <Btn onClick={()=>setConfirmEvDel(editId)} color={B.redBright} outline small>Eliminar evento</Btn>
            </div>
          )}
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:20}}>
            <Btn onClick={()=>setModalEv(false)} color="#64748b" outline small>Cancelar</Btn>
            <Btn onClick={guardar} bg={B.navy} small>Guardar evento</Btn>
          </div>
        </MFModal>
      )}

      {/* -- POPUP RECORDATORIO COTIZACIÓN -- */}
      {popupCot && (
        <div style={{position:"fixed",inset:0,background:"rgba(10,31,68,.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:B.white,borderRadius:18,padding:32,maxWidth:380,width:"100%",boxShadow:B.shadowLg,animation:"fadeUp .25s ease",textAlign:"center"}}>
            <div style={{fontSize:44,marginBottom:12}}>📄</div>
            <div style={{fontSize:18,fontWeight:800,color:B.navy,marginBottom:8}}>Recordatorio</div>
            <div style={{fontSize:14,color:"#475569",lineHeight:1.6,marginBottom:6}}>
              Tienes pendiente enviar la <strong>cotización</strong>
            </div>
            {popupCot.leadNombre && (
              <div style={{fontSize:13,color:B.green,fontWeight:600,marginBottom:6}}>
                👤 {popupCot.leadNombre}
              </div>
            )}
            <div style={{fontSize:13,color:"#64748b",marginBottom:24}}>
              {popupCot.titulo}
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setPopupCot(null)}
                style={{padding:"10px 24px",borderRadius:10,border:`1.5px solid ${B.gray}`,background:B.cream,color:B.navy,fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:13,cursor:"pointer"}}>
                Ya lo hice ✓
              </button>
              <button onClick={()=>setPopupCot(null)}
                style={{padding:"10px 24px",borderRadius:10,border:"none",background:B.navy,color:"#fff",fontFamily:"'Poppins',sans-serif",fontWeight:600,fontSize:13,cursor:"pointer"}}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -- CONFIRM ELIMINAR EVENTO -- */}
      {confirmEvDel && <ConfirmModal
        titulo="¿Eliminar este evento?"
        mensaje="Esta acción no se puede deshacer."
        icono="🗓️"
        textoConfirm="Sí, eliminar"
        colorConfirm={B.redBright}
        onConfirm={()=>{elimEv(confirmEvDel);setConfirmEvDel(null);setModalEv(false);}}
        onCancel={()=>setConfirmEvDel(null)}
      />}
    </div>
  );
}

/* PLACEHOLDER */

/* PLACEHOLDER */
function _AgendaPanelLateral() { return null; }

/* ===========================================
   LISTA LEADS -- por mes + pestañas historial
=========================================== */

export default Agenda;

