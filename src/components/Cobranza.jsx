import { useState, useRef } from "react";
import { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES,
  TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK,
  MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT,
  uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia,
  getTempLead, getAlertas, LS, mkDemo } from "./shared.js";
import { MarflowLogo, ConfirmModal, Av, Btn, Inp, Sel, FL,
  MFModal, MHead, HoraSelect, ContactoModal, GD, Tag } from "./ui.jsx";

function Cobranza() {
  const [datos,setDatos]=useState([]);
  const [cargando,setCargando]=useState(false);
  const [filtProd,setFiltProd]=useState("");
  const [tab,setTab]=useState("dashboard");
  const fileRef=useRef();

  const ahora=new Date();
  const mesBd=`${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}`;
  const mesSig=new Date(ahora.getFullYear(), ahora.getMonth()+1, 1);
  const mesSigBd=`${mesSig.getFullYear()}-${String(mesSig.getMonth()+1).padStart(2,"0")}`;

  // Normalizar fecha desde distintos formatos Excel
  function normFecha(v) {
    if(!v) return null;
    const s=String(v).trim();
    // Excel numeric date
    if(/^\d{5}$/.test(s)){const d=new Date((Number(s)-25569)*86400000);return d.toISOString().split("T")[0];}
    // dd/mm/yyyy
    if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)){const[d,m,y]=s.split("/");return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;}
    // yyyy-mm-dd
    if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
    // ISO
    try{const d=new Date(s);if(!isNaN(d.getTime()))return d.toISOString().split("T")[0];}catch{}
    return null;
  }

  async function cargarExcel(e){
    const file=e.target.files?.[0];if(!file)return;
    setCargando(true);
    try{
      const {default:XLSX}=await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
      const ab=await file.arrayBuffer();
      const wb=XLSX.read(ab);
      const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{defval:""});
      const mapped=rows.map(r=>{
        // Mapeo flexible de columnas
        const poliza=String(r["Póliza"]||r["Poliza"]||r["No. Póliza"]||r["No Poliza"]||r["POLIZA"]||r["poliza"]||"").trim();
        const nombre=String(r["Nombre"]||r["Cliente"]||r["NOMBRE"]||r["nombre"]||"").trim();
        const producto=String(r["Producto"]||r["PRODUCTO"]||r["producto"]||r["Ramo"]||"").trim();
        const vencStr=r["Vencimiento"]||r["Fecha Vencimiento"]||r["FechaVencimiento"]||r["VENCIMIENTO"]||r["fecha_vencimiento"]||r["Renovación"]||r["Renovacion"]||"";
        const vencimiento=normFecha(vencStr);
        const diasAtraso=Number(r["Días Atraso"]||r["Dias Atraso"]||r["DiasAtraso"]||r["DIAS_ATRASO"]||r["dias_atraso"]||0)||0;
        const estatus=String(r["Estatus"]||r["Status"]||r["ESTATUS"]||r["status"]||"Al corriente").trim();
        const telefono=String(r["Teléfono"]||r["Telefono"]||r["TEL"]||r["tel"]||"").trim();
        return {poliza,nombre,producto,vencimiento,diasAtraso,estatus,telefono,_raw:r};
      }).filter(r=>r.nombre||r.poliza);
      setDatos(mapped);
      setTab("dashboard");
    }catch(err){alert("Error al leer el archivo. Verifica que sea un .xlsx válido.");}
    setCargando(false);
    e.target.value="";
  }

  async function exportarFiltrado(lista,nombre){
    try{
      const {default:XLSX}=await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
      const data=lista.map(r=>({Póliza:r.poliza,Cliente:r.nombre,Producto:r.producto,"Fecha vencimiento":fmtF(r.vencimiento),"Días atraso":r.diasAtraso,Estatus:r.estatus,Teléfono:r.telefono}));
      const ws=XLSX.utils.json_to_sheet(data);
      const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Cobranza MarFlow");
      XLSX.writeFile(wb,`marflow_cobranza_${nombre}_${hoy()}.xlsx`);
    }catch{alert("Error al exportar.");}
  }

  const datosFilt=datos.filter(d=>!filtProd||d.producto.toLowerCase().includes(filtProd.toLowerCase()));
  const renovMes=datosFilt.filter(d=>d.vencimiento&&d.vencimiento.startsWith(mesBd));
  const renovSig=datosFilt.filter(d=>d.vencimiento&&d.vencimiento.startsWith(mesSigBd));
  const atraso35=datosFilt.filter(d=>d.diasAtraso>35);
  const alCorriente=datosFilt.filter(d=>d.diasAtraso===0||d.estatus.toLowerCase().includes("corriente")||d.estatus.toLowerCase().includes("vigente"));
  const proxVenc=datosFilt.filter(d=>{if(!d.vencimiento)return false;const dif=Math.floor((new Date(d.vencimiento).getTime()-Date.now())/86400000);return dif>=0&&dif<=30;});

  const statusColor=d=>{
    if(d.diasAtraso>35) return {bg:B.redLight,border:B.redBright+"44",text:B.redBright,badge:"🔴 Crítico"};
    if(d.diasAtraso>0&&d.diasAtraso<=35) return {bg:B.amberLight||"#fffbeb",border:B.amber+"44",text:B.amber,badge:"🟡 Atraso"};
    return {bg:B.greenLight||"#dcfce7",border:B.green+"44",text:B.green,badge:"🟢 Al corriente"};
  };

  function Tabla({lista,cols,titulo,color,onExport}){
    if(lista.length===0) return <div style={{fontSize:12,color:"#9ca3af",textAlign:"center",padding:"20px 0"}}>Sin registros</div>;
    return <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,color}}>{titulo} · {lista.length} registro{lista.length!==1?"s":""}</div>
        <Btn onClick={onExport} color={B.navy} outline small>📥 Exportar</Btn>
      </div>
      <div className="mf-table-wrap">
        <table style={{width:"100%",borderCollapse:"collapse",minWidth:550}}>
          <thead><tr style={{background:B.cream}}>
            {cols.map(c=><th key={c} style={{textAlign:"left",padding:"9px 12px",fontSize:10,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:".7px",borderBottom:`1px solid ${B.gray}`}}>{c}</th>)}
          </tr></thead>
          <tbody>
            {lista.map((r,i)=>{
              const sc=statusColor(r);
              return <tr key={i} style={{background:sc.bg,borderBottom:`1px solid ${B.gray}22`}}>
                <td style={{padding:"10px 12px",fontSize:12,fontWeight:600,color:B.navy}}>{r.poliza||"--"}</td>
                <td style={{padding:"10px 12px",fontSize:12,color:B.black}}>{r.nombre}</td>
                <td style={{padding:"10px 12px"}}><Tag color={B.navy} small>{r.producto||"--"}</Tag></td>
                <td style={{padding:"10px 12px",fontSize:12,color:"#6b7280"}}>{fmtF(r.vencimiento)}</td>
                {cols.includes("Días atraso")&&<td style={{padding:"10px 12px"}}>
                  <span style={{fontWeight:700,color:sc.text,fontSize:12}}>{r.diasAtraso>0?`${r.diasAtraso}d`:"--"}</span>
                </td>}
                {cols.includes("Estatus")&&<td style={{padding:"10px 12px"}}><Tag color={sc.text} small>{sc.badge}</Tag></td>}
                {cols.includes("Contacto")&&<td style={{padding:"10px 12px"}}>
                  {r.telefono?<a href={`https://wa.me/52${r.telefono.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{textDecoration:"none",fontSize:11,color:"#25d366",fontWeight:600}}>💬 WA</a>:<span style={{color:"#9ca3af",fontSize:11}}>--</span>}
                </td>}
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </>;
  }

  if(datos.length===0) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 20px",textAlign:"center"}}>
      <div style={{width:80,height:80,borderRadius:"50%",background:B.goldDim,border:`2px solid ${B.goldBorder}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,marginBottom:20}}>💰</div>
      <div style={{fontSize:20,fontWeight:700,color:B.navy,marginBottom:8}}>Módulo de Cobranza</div>
      <div style={{fontSize:13,color:"#6b7280",maxWidth:420,lineHeight:1.7,marginBottom:28}}>
        Sube tu archivo Excel de cobranza. El sistema detectará automáticamente renovaciones próximas, atrasos críticos y generará alertas para acción inmediata.
      </div>
      <div style={{background:B.cream,border:`1px solid ${B.gray}`,borderRadius:12,padding:"14px 20px",marginBottom:24,textAlign:"left",maxWidth:360}}>
        <div style={{fontSize:11,fontWeight:700,color:"#6b7280",marginBottom:8,textTransform:"uppercase",letterSpacing:.7}}>Columnas esperadas (flexibles)</div>
        {[["Póliza","Número de póliza"],["Nombre / Cliente","Nombre del asegurado"],["Producto","GMMI, PLU3, EDU, Auto..."],["Vencimiento","Fecha de vencimiento"],["Días Atraso","Días de atraso (número)"],["Estatus","Al corriente / Vencido"],["Teléfono","Para contacto directo"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",gap:8,marginBottom:5}}>
            <span style={{fontSize:11,fontWeight:600,color:B.navy,minWidth:100}}>{k}</span>
            <span style={{fontSize:11,color:"#9ca3af"}}>{v}</span>
          </div>
        ))}
      </div>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={cargarExcel}/>
      <Btn onClick={()=>fileRef.current?.click()} bg={B.navy} style={{padding:"12px 28px",fontSize:14}} disabled={cargando}>
        {cargando?"Procesando...":"📂 Subir Excel de cobranza"}
      </Btn>
    </div>
  );

  return <div>
    {/* Toolbar */}
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={cargarExcel}/>
      <Btn onClick={()=>fileRef.current?.click()} color={B.green} outline small>📂 Actualizar Excel</Btn>
      <input value={filtProd} onChange={e=>setFiltProd(e.target.value)} placeholder="Filtrar por producto..."
        style={{padding:"11px 13px",borderRadius:8,border:`1.5px solid ${B.gray}`,background:B.white,color:B.black,fontFamily:"'Poppins',sans-serif",fontSize:16,outline:"none",minHeight:44,WebkitAppearance:"none",flex:1,minWidth:0}}
        onFocus={e=>e.target.style.borderColor=B.gold} onBlur={e=>e.target.style.borderColor=B.gray}/>
      <div style={{fontSize:12,color:"#9ca3af"}}>{datosFilt.length} registros cargados</div>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:4,marginBottom:20,background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:5}}>
      {[{v:"dashboard",l:"📊 Dashboard"},{v:"renovMes",l:`🔄 Reno. este mes (${renovMes.length})`},{v:"renovSig",l:`📅 Reno. próx. mes (${renovSig.length})`},{v:"atraso",l:`⚠️ Atraso +35d (${atraso35.length})`},{v:"todos",l:"📋 Todos"}].map(t=>(
        <button key={t.v} onClick={()=>setTab(t.v)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:"none",background:tab===t.v?B.navy:B.cream,color:tab===t.v?B.white:"#6b7280",fontFamily:"Poppins",fontWeight:600,fontSize:11,cursor:"pointer",transition:"all .15s"}}>
          {t.l}
        </button>
      ))}
    </div>

    {/* Dashboard */}
    {tab==="dashboard"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:12,marginBottom:18}}>
        {[
          {l:"Total registros",v:datosFilt.length,c:B.navy,icon:"📋"},
          {l:"Renovaciones este mes",v:renovMes.length,c:B.amber,icon:"🔄"},
          {l:"Renovaciones próx. mes",v:renovSig.length,c:B.blue,icon:"📅"},
          {l:"Atraso crítico +35d",v:atraso35.length,c:B.redBright,icon:"🔴"},
          {l:"Al corriente",v:alCorriente.length,c:B.green,icon:"🟢"},
        ].map((s,i)=>(
          <div key={i} style={{background:B.white,border:`1px solid ${B.gray}`,borderLeft:`4px solid ${s.c}`,borderRadius:12,padding:"14px 16px",boxShadow:B.shadow}}>
            <div style={{fontSize:10,fontWeight:600,color:"#6b7280",textTransform:"uppercase",letterSpacing:".6px",marginBottom:6}}>{s.l}</div>
            <div style={{fontSize:30,fontWeight:800,color:s.c,lineHeight:1,marginBottom:2}}>{s.v}</div>
            <div style={{fontSize:18}}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Alertas críticas */}
      {atraso35.length>0&&<div style={{background:B.redLight,border:`1.5px solid ${B.redBright}33`,borderRadius:12,padding:"16px 20px",marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:B.redBright,marginBottom:10}}>🔴 Cobranza crítica -- acción inmediata ({atraso35.slice(0,5).length})</div>
        {atraso35.slice(0,5).map((r,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:`1px solid ${B.redBright}22`}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:B.navy}}>{r.nombre} <span style={{color:"#9ca3af",fontWeight:400}}>· {r.poliza}</span></div>
              <div style={{fontSize:11,color:B.redBright,fontWeight:600}}>{r.diasAtraso} días de atraso · {r.producto}</div>
            </div>
            {r.telefono&&<a href={`https://wa.me/52${r.telefono.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{width:30,height:30,borderRadius:"50%",background:"#dcfce7",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,textDecoration:"none"}}>💬</a>}
          </div>
        ))}
      </div>}

      {/* Renovaciones este mes */}
      {renovMes.length>0&&<div style={{background:B.amberLight||"#fffbeb",border:`1.5px solid ${B.amber}33`,borderRadius:12,padding:"16px 20px",marginBottom:16}}>
        <div style={{fontSize:14,fontWeight:700,color:B.amber,marginBottom:10}}>🔄 Renovaciones {MESES[ahora.getMonth()]} ({renovMes.slice(0,5).length})</div>
        {renovMes.slice(0,5).map((r,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:`1px solid ${B.amber}22`}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:B.navy}}>{r.nombre}</div>
              <div style={{fontSize:11,color:B.amber}}>{r.producto} · Vence: {fmtF(r.vencimiento)}</div>
            </div>
            {r.telefono&&<a href={`https://wa.me/52${r.telefono.replace(/\D/g,"")}`} target="_blank" rel="noreferrer" style={{width:28,height:28,borderRadius:"50%",background:"#dcfce7",border:"1px solid #bbf7d0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,textDecoration:"none"}}>💬</a>}
          </div>
        ))}
      </div>}
    </div>}

    {/* Tablas */}
    {tab==="renovMes"&&<div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}>
      <Tabla lista={renovMes} cols={["Póliza","Cliente","Producto","Vencimiento","Estatus","Contacto"]} titulo={`Renovaciones ${MESES[ahora.getMonth()]}`} color={B.amber} onExport={()=>exportarFiltrado(renovMes,"reno_mes_actual")}/>
    </div>}
    {tab==="renovSig"&&<div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}>
      <Tabla lista={renovSig} cols={["Póliza","Cliente","Producto","Vencimiento","Estatus","Contacto"]} titulo={`Renovaciones ${MESES[mesSig.getMonth()]}`} color={B.blue} onExport={()=>exportarFiltrado(renovSig,"reno_mes_siguiente")}/>
    </div>}
    {tab==="atraso"&&<div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}>
      <Tabla lista={atraso35} cols={["Póliza","Cliente","Producto","Vencimiento","Días atraso","Estatus","Contacto"]} titulo="Cobranza +35 días de atraso" color={B.redBright} onExport={()=>exportarFiltrado(atraso35,"cobranza_critica")}/>
    </div>}
    {tab==="todos"&&<div style={{background:B.white,border:`1px solid ${B.gray}`,borderRadius:12,padding:"18px 20px",boxShadow:B.shadow}}>
      <Tabla lista={datosFilt} cols={["Póliza","Cliente","Producto","Vencimiento","Días atraso","Estatus","Contacto"]} titulo="Todos los registros" color={B.navy} onExport={()=>exportarFiltrado(datosFilt,"todos")}/>
    </div>}
  </div>;
}

/* ===========================================
   USUARIOS
=========================================== */

export default Cobranza;

