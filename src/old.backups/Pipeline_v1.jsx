import { useState, useRef } from "react";
import { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES,
  TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK,
  MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT,
  uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia,
  getTempLead, getAlertas, LS, mkDemo } from "../components/shared.js";
import { MarflowLogo, ConfirmModal, Av, Btn, Inp, Sel, FL,
  MFModal, MHead, HoraSelect, ContactoModal, GD, Tag } from "../components/ui.jsx";
import { LeadCard, LeadModal } from "../components/LeadCard.jsx";

function Pipeline({leads,setLeads,filtroNav,esAdmin,cuentas,usuario}) {
  const [leadAct,setLeadAct]=useState(null);
  const [nuevoM,setNuevoM]=useState(false);
  const [contactoL,setContactoL]=useState(null);
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

  const etapasVis=(filtroNav&&!["todos","activos"].includes(filtroNav)&&ETAPAS.find(e=>e.id===filtroNav))
    ?ETAPAS.filter(e=>e.id===filtroNav):ETAPAS;

  // Normaliza el producto segun las reglas de negocio
  function normalizarProducto(raw) {
    const v = String(raw || "").trim().toLowerCase();
    if (!v) return "";  // vacio, no asignar Vida por default
    if (/ahorro|plus|opti|optimaxx/.test(v))      return "Ahorro";
    if (/educaci[oó]n|edu/.test(v))                return "Educación";
    if (/patrimonial|elite|inversi[oó]n/.test(v))  return "Patrimonial";
    if (/vida/.test(v))                             return "Vida";
    if (/gastos|m[eé]dicos|gmm|gm/.test(v))        return "GMM";
    if (/auto/.test(v))                             return "Auto";
    if (/hogar/.test(v))                            return "Hogar";
    // Si no coincide, devuelve el texto original
    return String(raw).trim();
  }

  async function importar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { default: XLSX } = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
      const ab  = await file.arrayBuffer();
      const wb  = XLSX.read(ab);
      const ws  = wb.Sheets[wb.SheetNames[0]];

      // header:1 nos da arrays puros — asi manejamos cualquier orden de columnas
      const [headers, ...rows] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

      if (!headers || !rows.length) {
        alert("El archivo está vacío o no tiene datos.");
        return;
      }

      // Mapa de encabezados reales a índices (insensible a mayúsculas y espacios)
      const idx = {};
      headers.forEach((h, i) => {
        const clean = String(h).trim().toLowerCase()
          .replace(/é/g,"e").replace(/ó/g,"o").replace(/á/g,"a")
          .replace(/í/g,"i").replace(/ú/g,"u");
        idx[clean] = i;
      });

      // Helpers para leer una celda por nombre de columna (varios alias)
      const col = (row, ...keys) => {
        for (const k of keys) {
          const clean = k.toLowerCase()
            .replace(/é/g,"e").replace(/ó/g,"o").replace(/á/g,"a")
            .replace(/í/g,"i").replace(/ú/g,"u");
          if (idx[clean] !== undefined) {
            const val = row[idx[clean]];
            if (val !== undefined && val !== "") return String(val).trim();
          }
        }
        return "";
      };

      const mesActual = hoy().slice(0, 7);

      const nuevos = rows
        .filter(row => row.some(cell => cell !== "")) // ignora filas completamente vacías
        .map(row => ({
          id:             uid(),
          nombre:         col(row, "Nombre", "nombre"),
          edad:           col(row, "Edad", "edad"),
          telefono:       col(row, "Teléfono", "Telefono", "telefono", "Tel", "tel"),
          correo:         col(row, "Correo electrónico", "Correo", "correo", "Email", "email"),
          estado:         col(row, "Estado", "estado"),
          producto:       normalizarProducto(col(row, "Producto", "producto")),
          etapa:          "nuevo",
          ultimoContacto: hoy(),
          notas:          "",
          objeciones:     "",
          intereses:      "",
          motivador:      "",
          checklist:      { ...EMPTY_CHECK },
          seguimientos:   [],
          sinSeguimiento: false,
          asignadoA:      null,
          mesCreacion:    mesActual,
        }))
        .filter(r => r.nombre); // al menos nombre es requerido

      if (!nuevos.length) {
        alert("No se encontraron leads válidos.\n\nAsegúrate de que el archivo tenga estas columnas:\nNombre | Edad | Teléfono | Correo electrónico | Estado | Producto");
        return;
      }

      // Filtrar duplicados: mismo nombre + teléfono dentro del mismo mes
      setLeads(prev => {
        const esDuplicado = (nuevo) => prev.some(existing => {
          const mismoMes = (existing.mesCreacion || "") === nuevo.mesCreacion;
          const mismoNombre = existing.nombre.trim().toLowerCase() === nuevo.nombre.trim().toLowerCase();
          const mismoTel = existing.telefono.trim() === nuevo.telefono.trim() && nuevo.telefono !== "";
          const mismoCorreo = existing.correo.trim().toLowerCase() === nuevo.correo.trim().toLowerCase() && nuevo.correo !== "";
          return mismoMes && mismoNombre && (mismoTel || mismoCorreo);
        });

        const sinDuplicados = nuevos.filter(n => !esDuplicado(n));
        const duplicados    = nuevos.length - sinDuplicados.length;

        if (sinDuplicados.length === 0) {
          setTimeout(() => alert(`⚠️ Todos los ${nuevos.length} leads ya existen en el sistema este mes. No se importó ninguno.`), 100);
          return prev;
        }

        if (duplicados > 0) {
          setTimeout(() => alert(`✅ ${sinDuplicados.length} lead${sinDuplicados.length !== 1 ? "s" : ""} importado${sinDuplicados.length !== 1 ? "s" : ""} correctamente.\n⚠️ ${duplicados} omitido${duplicados !== 1 ? "s" : ""} por duplicado en este mes.`), 100);
        } else {
          setTimeout(() => alert(`✅ ${sinDuplicados.length} lead${sinDuplicados.length !== 1 ? "s" : ""} importado${sinDuplicados.length !== 1 ? "s" : ""} correctamente.`), 100);
        }

        return [...prev, ...sinDuplicados];
      });

    } catch (err) {
      console.error(err);
      alert("Error al leer el archivo.\nVerifica que sea un Excel (.xlsx) o CSV válido.");
    }
    e.target.value = "";
  }

  async function exportar(){
    try{
      const {default:XLSX}=await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
      const data=vis.map(l=>({Nombre:l.nombre,Edad:l.edad,Estado:l.estado,Teléfono:l.telefono,Correo:l.correo,Producto:l.producto,Etapa:ETAPAS.find(e=>e.id===l.etapa)?.label,Temperatura:getTempLead(l)?.label||"--","Sin seguimiento":l.sinSeguimiento?"✓":"","WA1":l.checklist?.wa1?"✓":"","WA2":l.checklist?.wa2?"✓":"","Llamada1":l.checklist?.call1?"✓":"","Llamada2":l.checklist?.call2?"✓":"","Correo enviado":l.checklist?.email?"✓":"","Último contacto":l.ultimoContacto,Notas:l.notas}));
      const ws=XLSX.utils.json_to_sheet(data);
      const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Leads MarFlow");
      XLSX.writeFile(wb,`marflow_leads_${hoy()}.xlsx`);
    }catch{alert("Error al exportar.");}
  }

  return <div>
    <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
      <input value={busq} onChange={e=>setBusq(e.target.value)} placeholder="🔍 Buscar por nombre o estado..."
        style={{flex:1,minWidth:0,padding:"11px 13px",borderRadius:8,border:`1.5px solid ${B.gray}`,background:B.white,color:B.black,fontFamily:"'Poppins',sans-serif",fontSize:16,outline:"none",minHeight:44,WebkitAppearance:"none"}}
        onFocus={e=>e.target.style.borderColor=B.gold} onBlur={e=>e.target.style.borderColor=B.gray}/>
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
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{color:etapa.color,fontSize:13}}>{etapa.icon}</span>
                <span style={{fontSize:12,fontWeight:700,color:B.navy}}>{etapa.label}</span>
              </div>
              <span style={{background:etapa.color+"14",color:etapa.color,borderRadius:20,padding:"1px 9px",fontSize:11,fontWeight:700}}>{cols.length}</span>
            </div>
          </div>
          {cols.length===0
            ?<div style={{border:`1.5px dashed ${B.gray}`,borderRadius:10,padding:"20px 8px",textAlign:"center",color:"#9ca3af",fontSize:11,background:B.cream}}>Sin leads</div>
            :cols.map(l=><LeadCard key={l.id} lead={l} onClick={setLeadAct} onContacto={setContactoL}/>)
          }
        </div>;
      })}
    </div>
    {leadAct&&<LeadModal lead={leadAct} onClose={()=>setLeadAct(null)} onSave={save} onDelete={del} cuentas={cuentas} usuario={usuario}/>}
    {nuevoM&&<LeadModal lead={emptyL} onClose={()=>setNuevoM(false)} onSave={save} onDelete={()=>{}} cuentas={cuentas} usuario={usuario}/>}
    {contactoL&&<ContactoModal lead={contactoL} onClose={()=>setContactoL(null)}/>}
  </div>;
}

/* ===========================================
   AGENDA -- MOBILE FIRST COMPLETA
=========================================== */

/* ===========================================
   AGENDA -- PREMIUM MOBILE-FIRST
   · Logo real · Viaje · Rango fechas · Sin lista mes
=========================================== */

export default Pipeline;
