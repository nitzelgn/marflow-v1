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

const PRODUCTOS_LEAD = ["Vida","GMM","Auto","Hogar","Retiro","Ahorro","Inversión","Patrimonial","Educación","Otro"];

// Clasificación por línea de negocio (Allianz México)
const PRODUCTOS_RIESGOS = ["Vida","GMM","Auto","Hogar"];
const PRODUCTOS_AHORRO  = ["Retiro","Ahorro","Inversión","Patrimonial","Educación"];

// Productos que tienen póliza con fecha de renovación (cartera vigente)
const POLIZA_PRODUCTOS = ["Auto","GMM","Hogar","Vida"];

// Estados de oportunidad — reemplaza el concepto "temperatura" (frío/tibio/caliente)
// Sistema híbrido: manual prevalece; si no hay manual, se calcula auto vía getEstadoOportunidad()
const ESTADOS_OPORTUNIDAD = [
  { v:"muy_interesado",    l:"Muy interesado",    sub:"Cliente receptivo y activo",            color:"#b91c1c" },
  { v:"alta_oportunidad",  l:"Alta oportunidad",  sub:"Referido o alta probabilidad de cierre", color:"#C6A96B" },
  { v:"seguimiento_debil", l:"Seguimiento débil", sub:"Pocas interacciones o muchos días sin actividad", color:"#d97706" },
  { v:"en_pausa",          l:"En pausa",          sub:"Cliente pidió esperar o retomar después", color:"#64748b" },
  { v:"patrimonial",       l:"Perfil patrimonial", sub:"Capacidad financiera elevada o alto ticket", color:"#7c3aed" },
];

// Tipos de pendientes operativos (tareas dentro de cada lead)
const PENDIENTE_TIPOS = [
  { v:"cotizacion",  l:"Enviar cotización" },
  { v:"documentos",  l:"Solicitar documentos" },
  { v:"informacion", l:"Pedir información faltante" },
  { v:"pago",        l:"Compartir liga de pago" },
  { v:"comparativo", l:"Preparar comparativo" },
  { v:"solicitud",   l:"Llenar solicitud" },
  { v:"emision",     l:"Revisar emisión" },
  { v:"otro",        l:"Otro" },
];
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

// adminId del usuario actual (admin → su propio id, asistente → admin asignado)
const getAdminId = u => u?.rol === "asistente" ? u?.adminId : u?.id;

// ── Registro de actividad (timeline en Configuración) ─────────────
// Se llama desde save/del/togglePend/etc. para guardar un evento de
// auditoría en Supabase. Fire-and-forget: nunca bloquea la UI.
async function registrarActividad({ adminId, autor, tipo, entidad, entidadId, entidadNombre, metadata }) {
  if (!adminId || !tipo) return;
  try {
    await supabase.from("actividad").insert({
      admin_id: adminId,
      autor_id: autor?.id || null,
      autor_nombre: autor?.nombre || "",
      tipo,
      entidad: entidad || "lead",
      entidad_id: entidadId || null,
      entidad_nombre: entidadNombre || "",
      metadata: metadata || {},
    });
  } catch { /* no bloquear UX si falla */ }
}

// Compara dos leads y devuelve la primera acción notable detectada
function diffLead(viejo, nuevo) {
  if (!viejo || !nuevo) return null;
  if (viejo.etapa !== nuevo.etapa)
    return { tipo: "lead.etapa", metadata: { de: viejo.etapa, a: nuevo.etapa } };
  if ((viejo.producto||"") !== (nuevo.producto||""))
    return { tipo: "lead.producto", metadata: { de: viejo.producto||"—", a: nuevo.producto||"—" } };
  if ((viejo.asignadoA||"") !== (nuevo.asignadoA||""))
    return { tipo: "lead.asignado", metadata: { de: viejo.asignadoA||"—", a: nuevo.asignadoA||"—" } };
  if (!!viejo.sinSeguimiento !== !!nuevo.sinSeguimiento)
    return { tipo: nuevo.sinSeguimiento ? "lead.perdido" : "lead.recuperado", metadata: {} };
  // Pendientes nuevos
  const vPendIds = new Set((viejo.pendientes||[]).map(p => p.id));
  const pendNuevo = (nuevo.pendientes||[]).find(p => !vPendIds.has(p.id));
  if (pendNuevo) return { tipo: "lead.pendiente_add", metadata: { texto: pendNuevo.texto||"" } };
  // Pendientes completados
  const pendDone = (nuevo.pendientes||[]).find(p => {
    if (!p.hecho) return false;
    const v = (viejo.pendientes||[]).find(x => x.id === p.id);
    return v && !v.hecho;
  });
  if (pendDone) return { tipo: "lead.pendiente_done", metadata: { texto: pendDone.texto||"" } };
  // Póliza nueva
  const vPolIds = new Set((viejo.polizas||[]).map(p => p.id));
  const polNueva = (nuevo.polizas||[]).find(p => !vPolIds.has(p.id));
  if (polNueva) return { tipo: "lead.poliza_add", metadata: { producto: polNueva.producto||"", numero: polNueva.numero||"" } };
  // Notas (cambio en notas, objeciones o intereses)
  if ((viejo.notas||"") !== (nuevo.notas||""))
    return { tipo: "lead.nota", metadata: {} };
  // Edición genérica
  const camposBase = ["nombre","telefono","correo","edad","estado","objeciones","intereses","motivador","ultimoContacto"];
  if (camposBase.some(c => (viejo[c]||"") !== (nuevo[c]||"")))
    return { tipo: "lead.editado", metadata: {} };
  return null;
}

// Etiqueta humana por tipo (se usa en el timeline)
const ACTIVIDAD_LABEL = {
  "lead.creado":    { l: "creó",                  icon: "plus"    },
  "lead.editado":   { l: "editó",                 icon: "edit"    },
  "lead.eliminado": { l: "eliminó",               icon: "trash"   },
  "lead.etapa":     { l: "cambió etapa de",       icon: "arrow"   },
  "lead.producto":  { l: "cambió producto de",    icon: "edit"    },
  "lead.asignado":  { l: "reasignó",              icon: "user"    },
  "lead.perdido":   { l: "marcó como perdido a",  icon: "x"       },
  "lead.recuperado":{ l: "recuperó a",            icon: "check"   },
  "lead.nota":      { l: "agregó nota a",         icon: "edit"    },
  "lead.pendiente_add":  { l: "agregó pendiente a",     icon: "plus"  },
  "lead.pendiente_done": { l: "completó pendiente de",  icon: "check" },
  "lead.poliza_add":     { l: "registró póliza de",     icon: "shield"},
  "evento.creado":     { l: "agendó",                  icon: "calendar" },
  "evento.editado":    { l: "editó evento",            icon: "edit"     },
  "evento.eliminado":  { l: "eliminó evento",          icon: "trash"    },
  "evento.fecha":      { l: "reagendó",                icon: "calendar" },
  "evento.completado": { l: "completó",                icon: "check"    },
};

// Devuelve el objeto ESTADOS_OPORTUNIDAD del estado actual del lead, o null.
// Híbrido: si el asesor asignó manualmente → prevalece. Si no, calcula:
//   - es_referido true → "alta_oportunidad"
//   - interacciones <= 1 y días sin contacto >= 5 → "seguimiento_debil"
function getEstadoOportunidad(lead) {
  if (!lead) return null;
  if (lead.sinSeguimiento) return null;
  // 1) Manual prevalece
  if (lead.estadoOportunidad) {
    return ESTADOS_OPORTUNIDAD.find(e => e.v === lead.estadoOportunidad) || null;
  }
  // 2) Referido → alta oportunidad
  if (lead.esReferido) {
    return ESTADOS_OPORTUNIDAD.find(e => e.v === "alta_oportunidad");
  }
  // 3) Seguimiento débil: pocas interacciones + sin contacto reciente
  const chk = lead.checklist || {};
  const interact = [chk.wa1, chk.wa2, chk.call1, chk.call2, chk.email].filter(Boolean).length;
  const dias = diasDesde(lead.ultimoContacto);
  if (interact <= 1 && dias >= 5) {
    return ESTADOS_OPORTUNIDAD.find(e => e.v === "seguimiento_debil");
  }
  return null;
}

// Wrapper de compatibilidad para código que aún referencia getTempLead.
// Devuelve null o un objeto con el shape antiguo { nivel, color, label } basado
// en el estado de oportunidad equivalente. Marca para eliminación futura.
function getTempLead(lead) {
  const e = getEstadoOportunidad(lead);
  if (!e) return null;
  const nivelMap = { muy_interesado: "caliente", alta_oportunidad: "caliente",
                     seguimiento_debil: "tibio", en_pausa: "tibio", patrimonial: "tibio" };
  return { nivel: nivelMap[e.v] || "frio", color: e.color, label: e.l };
}

// ── Prioridades de hoy (lógica del sector asegurador/patrimonial) ──
// 1) En cotización Riesgos: producto Auto/GMM/Hogar/Vida + etapa asesorado +
//    sin contacto >2 días (cotización fría = riesgo de perderla con otro agente)
function enCotizacionRiesgos(leads) {
  return (leads || []).filter(l =>
    !l.sinSeguimiento &&
    l.etapa === "asesorado" &&
    PRODUCTOS_RIESGOS.includes(l.producto) &&
    diasDesde(l.ultimoContacto) >= 2
  );
}
// 2) Asesorados Ahorro: producto Retiro/Ahorro/Inversión/Patrimonial/Educación
//    + etapa asesorado + sin contacto >14 días (perdiendo oportunidad patrimonial)
function asesoradosAhorroPendientes(leads) {
  return (leads || []).filter(l =>
    !l.sinSeguimiento &&
    l.etapa === "asesorado" &&
    PRODUCTOS_AHORRO.includes(l.producto) &&
    diasDesde(l.ultimoContacto) >= 14
  );
}
// 3) Seguimiento urgente: leads activos en riesgo de perderse
// Devuelve true si el lead está actualmente en pausa con fecha futura.
function leadEnPausaActiva(l) {
  if (!l || l.estadoOportunidad !== "en_pausa") return false;
  if (!l.pausaHasta) return true; // pausa indefinida
  return l.pausaHasta >= hoy();
}

function seguimientoUrgente(leads) {
  return (leads || []).filter(l => {
    if (l.sinSeguimiento) return false;
    if (["otro","cierre"].includes(l.etapa)) return false;
    if (leadEnPausaActiva(l)) return false;
    const d = diasDesde(l.ultimoContacto);
    // Lead nuevo sin contacto en >2 días
    if (l.etapa === "nuevo" && d >= 2) return true;
    // Cliente en seguimiento sin actividad reciente (riesgo de pérdida)
    if (l.etapa === "seguimiento" && d >= 5) return true;
    // Lead con estado "muy interesado" o "alta oportunidad" sin actividad reciente
    const eo = getEstadoOportunidad(l);
    if ((eo?.v === "muy_interesado" || eo?.v === "alta_oportunidad") && d >= 3) return true;
    // Cita pendiente sin reagendar (>3 días en etapa cita)
    if (l.etapa === "cita" && d >= 3) return true;
    return false;
  });
}
// 4) Pendientes operativos: todos los pendientes abiertos de todos los leads
function totalPendientesAbiertos(leads) {
  return (leads || []).reduce((sum, l) => {
    const abiertos = (l.pendientes || []).filter(p => !p.hecho).length;
    return sum + abiertos;
  }, 0);
}
function leadsConPendientes(leads) {
  return (leads || []).filter(l => (l.pendientes || []).some(p => !p.hecho));
}

// 5) Renovaciones pendientes: pólizas Auto/GMM/Hogar/Vida que renuevan en ≤30 días
//    sin seguimiento iniciado. Devuelve [{ lead, poliza, dias }] (1 por póliza).
function diasParaFecha(fechaISO) {
  if (!fechaISO) return null;
  const target = new Date(fechaISO + "T00:00:00");
  const today = new Date(hoy() + "T00:00:00");
  return Math.round((target - today) / 86400000);
}
function renovacionesPendientes(leads) {
  const out = [];
  (leads || []).forEach(l => {
    (l.polizas || []).forEach(p => {
      if (!POLIZA_PRODUCTOS.includes(p.producto)) return;
      if (p.seguimientoIniciado) return;
      const d = diasParaFecha(p.fechaRenovacion);
      if (d === null) return;
      if (d < 0 || d > 30) return;
      out.push({ lead: l, poliza: p, dias: d });
    });
  });
  return out.sort((a, b) => a.dias - b.dias);
}

function getAlertas(lead) {
  if(lead.sinSeguimiento) return [];
  if(leadEnPausaActiva(lead)) return [];
  const dias = diasDesde(lead.ultimoContacto);
  const a = [];
  if(!["otro","cierre"].includes(lead.etapa)) {
    if(dias>=15) a.push({tipo:"reactivar", msg:`${dias}d · Reactivar`, color:B.purple});
    else if(dias>=2) a.push({tipo:"sin_contacto", msg:`${dias}d sin contacto`, color:B.amber});
  }
  if(lead.etapa==="seguimiento" && dias>=5) a.push({tipo:"riesgo", msg:"Riesgo de pérdida", color:B.redBright});
  if(lead.etapa==="cita" && dias>=1) a.push({tipo:"cot", msg:"Confirmar cita", color:B.blue});
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

// Badge premium minimalista para "Estado de oportunidad"
// Pasa `lead` y se resuelve automático, o `estado` (objeto de ESTADOS_OPORTUNIDAD).
function BadgeEstado({ lead, estado, size = "sm" }) {
  const e = estado || (lead ? getEstadoOportunidad(lead) : null);
  if (!e) return null;
  const padding = size === "xs" ? "2px 7px" : size === "md" ? "5px 11px" : "3px 9px";
  const fontSize = size === "xs" ? 9.5 : size === "md" ? 11 : 10;
  const dotSize = size === "xs" ? 5 : size === "md" ? 7 : 6;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding,
      borderRadius:999,
      background:`${e.color}10`,
      border:`1px solid ${e.color}28`,
      color:e.color,
      fontFamily:"'Poppins',sans-serif",
      fontWeight:600,
      fontSize,
      letterSpacing:"0.04em",
      textTransform:"uppercase",
      lineHeight:1,
      whiteSpace:"nowrap",
    }}>
      <span style={{width:dotSize, height:dotSize, borderRadius:"50%", background:e.color}}/>
      {e.l}
    </span>
  );
}

// Badge "Referido" — discreto, gold champagne
function BadgeReferido({ size = "sm" }) {
  const padding = size === "xs" ? "2px 7px" : "3px 9px";
  const fontSize = size === "xs" ? 9.5 : 10;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5,
      padding,
      borderRadius:999,
      background:"rgba(198,169,107,0.10)",
      border:"1px solid rgba(198,169,107,0.30)",
      color:"#8b7340",
      fontFamily:"'Poppins',sans-serif",
      fontWeight:600,
      fontSize,
      letterSpacing:"0.06em",
      textTransform:"uppercase",
      lineHeight:1,
      whiteSpace:"nowrap",
    }}>Referido</span>
  );
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

/* ═══════════════════════════════════════════
   MARFLOW WORDMARK — logotype oficial recreado en código
   "MAR" en blanco + "FLOW" en gold champagne
   Sans-serif geométrica fina con letter-spacing amplio
═══════════════════════════════════════════ */
function MarflowWordmark({ height = 18, colorMar = "#FFFFFF", colorFlow = "#C6A96B" }) {
  return (
    <div
      role="img"
      aria-label="MARFLOW"
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        fontFamily: "'Helvetica Neue', 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif",
        fontWeight: 300,
        fontSize: height,
        lineHeight: 1,
        letterSpacing: `${(height * 0.16).toFixed(2)}px`,
        userSelect: "none",
        WebkitUserSelect: "none",
        whiteSpace: "nowrap",
        textRendering: "geometricPrecision",
      }}
    >
      <span style={{ color: colorMar }}>MAR</span>
      <span style={{ color: colorFlow }}>FLOW</span>
    </div>
  );
}

function WolfMark({size=120, opacity=1}) {
  return (
    <svg width={size} height={size} viewBox="0 0 0 0" fill="none" style={{opacity}}>
      <path d="M76 72 Q100 60 96 40 Q92 30 86 36" stroke={B.gold} strokeWidth="3" fill="none" opacity="0.45" strokeLinecap="round"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════
   ICONOS minimalistas estilo Lucide / Feather
   SVG inline para no agregar dependencias
═══════════════════════════════════════════ */
const IconEye = ({size=18, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconEyeOff = ({size=18, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
    <line x1="2" x2="22" y1="2" y2="22"/>
  </svg>
);
const IconCheck = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);
const IconAlert = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);
const IconArrowRight = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/>
    <path d="m12 5 7 7-7 7"/>
  </svg>
);
const IconLoader = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{animation:"mfSpin .8s linear infinite"}}>
    <line x1="12" y1="2" y2="6" x2="12"/>
    <line x1="12" y1="18" y2="22" x2="12"/>
    <line x1="4.93" y1="4.93" y2="7.76" x2="7.76"/>
    <line x1="16.24" y1="16.24" y2="19.07" x2="19.07"/>
    <line x1="2" y1="12" y2="12" x2="6"/>
    <line x1="18" y1="12" y2="12" x2="22"/>
    <line x1="4.93" y1="19.07" y2="16.24" x2="7.76"/>
    <line x1="16.24" y1="7.76" y2="4.93" x2="19.07"/>
  </svg>
);
const IconChevronRight = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconChevronLeft = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
);
const IconAlertCircle = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" x2="12" y1="8" y2="12"/>
    <line x1="12" x2="12.01" y1="16" y2="16"/>
  </svg>
);
const IconClock = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconCalendar = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
    <line x1="16" x2="16" y1="2" y2="6"/>
    <line x1="8" x2="8" y1="2" y2="6"/>
    <line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
);
const IconTrendingUp = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
);
const IconRefresh = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10"/>
    <polyline points="1 20 1 14 7 14"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
);
const IconStar = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconUser = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconUsers = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconLayers = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 2 7 12 12 22 7 12 2"/>
    <polyline points="2 17 12 22 22 17"/>
    <polyline points="2 12 12 17 22 12"/>
  </svg>
);
const IconBarChart = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="20" y2="10"/>
    <line x1="18" x2="18" y1="20" y2="4"/>
    <line x1="6" x2="6" y1="20" y2="16"/>
  </svg>
);
const IconMail = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/>
    <path d="m22 7-10 5L2 7"/>
  </svg>
);
const IconDollar = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="2" y2="22"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconHome = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const IconPhoneCall = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconSearch = ({size=16, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);
const IconUpload = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" x2="12" y1="3" y2="15"/>
  </svg>
);
const IconDownload = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" x2="12" y1="15" y2="3"/>
  </svg>
);
const IconPlus = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" x2="12" y1="5" y2="19"/>
    <line x1="5" x2="19" y1="12" y2="12"/>
  </svg>
);
const IconX = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);
const IconMinusCircle = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="8" x2="16" y1="12" y2="12"/>
  </svg>
);
const IconTrash = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" x2="10" y1="11" y2="17"/>
    <line x1="14" x2="14" y1="11" y2="17"/>
  </svg>
);
const IconLock = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconShield = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
  </svg>
);
const IconFingerprint = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 11v2a14 14 0 0 0 2.5 8"/>
    <path d="M16 11v2a23 23 0 0 0 .5 4.5"/>
    <path d="M8 14a18.5 18.5 0 0 0 1.5 6"/>
    <path d="M6 11a6 6 0 0 1 8-5.7"/>
    <path d="M19 13a13 13 0 0 1-1 4"/>
    <path d="M19.5 9.5a8 8 0 0 0-14 0"/>
    <path d="M3 16a26 26 0 0 0 .8 4.7"/>
    <path d="M12 5a7 7 0 0 1 7 7"/>
  </svg>
);
const IconClock2 = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);
const IconEdit = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconBell = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);
const IconFlame = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);
const IconLink2 = ({size=14, color="currentColor"}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 17H7A5 5 0 0 1 7 7h2"/>
    <path d="M15 7h2a5 5 0 1 1 0 10h-2"/>
    <line x1="8" x2="16" y1="12" y2="12"/>
  </svg>
);

function Auth({onLogin, mensajeInicial}) {
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [pass2,setPass2]=useState("");
  const [nombre,setNombre]=useState("");
  const [apellidos,setApellidos]=useState("");
  const [telefono,setTelefono]=useState("");
  const [estado,setEstado]=useState("");
  const [err,setErr]=useState("");
  const [info,setInfo]=useState(mensajeInicial||"");
  const [loading,setLoading]=useState(false);
  const [modo,setModo]=useState("login"); // 'login' | 'signup' | 'forgot'
  const [verPass,setVerPass]=useState(false);
  const [verPass2,setVerPass2]=useState(false);

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
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passSegura = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/; // mín 8, al menos una letra y un número
        if (!nombre.trim()) { setErr("Escribe tu nombre"); setLoading(false); return; }
        if (!apellidos.trim()) { setErr("Escribe tu(s) apellido(s)"); setLoading(false); return; }
        if (!telefono.trim() || telefono.replace(/\D/g,"").length < 10) {
          setErr("Escribe un teléfono válido (mínimo 10 dígitos)"); setLoading(false); return;
        }
        if (!emailRegex.test(email.trim())) { setErr("El correo no es válido"); setLoading(false); return; }
        if (!passSegura.test(pass)) {
          setErr("La contraseña debe tener mínimo 8 caracteres, con al menos una letra y un número");
          setLoading(false); return;
        }
        if (pass !== pass2) { setErr("Las contraseñas no coinciden"); setLoading(false); return; }

        const nombreCompleto = `${nombre.trim()} ${apellidos.trim()}`;
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
          options: { data: {
            nombre: nombreCompleto,
            nombre_pila: nombre.trim(),
            apellidos: apellidos.trim(),
            telefono: telefono.trim(),
            estado: estado || null,
            rol: "admin",
          }}
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
    setModo(nuevo); setErr(""); setInfo("");
    setPass(""); setPass2(""); setNombre(""); setApellidos(""); setTelefono(""); setEstado("");
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
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&display=swap');
    *,*::before,*::after{box-sizing:border-box;}

    .mf-auth-page {
      min-height: 100vh; min-height: 100dvh;
      background: #F8F6F2;
      display: flex; align-items: center; justify-content: center;
      padding: 24px 20px;
      font-family: 'Poppins', sans-serif;
      color: #0A1F44;
      position: relative; overflow: hidden;
    }
    @media (min-width: 768px) { .mf-auth-page { padding: 40px; } }

    .mf-auth-glow { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .mf-auth-glow-1, .mf-auth-glow-2 {
      position: absolute; border-radius: 50%;
      filter: blur(80px); pointer-events: none;
    }
    .mf-auth-glow-1 {
      width: 480px; height: 480px;
      top: -160px; left: -160px;
      background: radial-gradient(circle, rgba(198,169,107,0.20), transparent 70%);
      opacity: 0.7;
    }
    .mf-auth-glow-2 {
      width: 620px; height: 620px;
      bottom: -240px; right: -200px;
      background: radial-gradient(circle, rgba(10,31,68,0.08), transparent 70%);
      opacity: 0.8;
    }

    .mf-auth-inner {
      width: 100%; max-width: 440px;
      position: relative; z-index: 1;
      animation: mfFadeUp .7s cubic-bezier(.16,1,.3,1);
    }

    .mf-auth-logo-wrap {
      text-align: center;
      margin-bottom: 28px;
      animation: mfFadeIn .9s ease;
    }
    .mf-auth-logo-img {
      height: 160px; width: auto;
      object-fit: contain;
      filter: drop-shadow(0 16px 36px rgba(10, 31, 68, 0.12));
      user-select: none; -webkit-user-drag: none;
    }
    @media (min-width: 480px) {
      .mf-auth-logo-img { height: 190px; }
    }
    @media (min-width: 768px) {
      .mf-auth-logo-wrap { margin-bottom: 40px; }
      .mf-auth-logo-img { height: 220px; }
    }

    .mf-auth-select {
      cursor: pointer;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' stroke='%230A1F44' stroke-opacity='0.45' stroke-width='1.6' fill='none' stroke-linecap='round'/></svg>");
      background-repeat: no-repeat;
      background-position: right 16px center;
      padding-right: 40px;
    }
    .mf-auth-select:invalid { color: rgba(10,31,68,0.28); }

    .mf-auth-headline {
      font-family: 'Cormorant Garamond', serif;
      font-size: clamp(32px, 5.5vw, 46px);
      font-weight: 500;
      line-height: 1.05;
      letter-spacing: -0.02em;
      color: #0A1F44;
      text-align: center;
      margin: 0 0 14px;
    }

    .mf-auth-subhead {
      text-align: center;
      font-size: 14px;
      font-weight: 400;
      color: rgba(10,31,68,0.55);
      line-height: 1.6;
      max-width: 360px;
      margin: 0 auto 36px;
    }

    .mf-auth-card {
      background: rgba(255,255,255,0.7);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid rgba(10,31,68,0.06);
      border-radius: 20px;
      padding: 28px 22px;
      box-shadow:
        0 4px 32px rgba(10,31,68,0.04),
        0 1px 2px rgba(10,31,68,0.03),
        inset 0 1px 0 rgba(255,255,255,0.6);
    }
    @media (min-width: 768px) {
      .mf-auth-card { padding: 38px 34px; border-radius: 24px; }
    }

    .mf-auth-field { margin-bottom: 18px; }
    .mf-auth-field:last-of-type { margin-bottom: 6px; }

    .mf-auth-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0;
    }
    @media (min-width: 480px) {
      .mf-auth-row {
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }
    }
    .mf-auth-field-half { margin-bottom: 18px; }

    .mf-auth-label {
      display: flex; justify-content: space-between; align-items: baseline;
      font-size: 11px; font-weight: 600;
      color: rgba(10,31,68,0.55);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }
    .mf-auth-label-hint {
      font-size: 10px; font-weight: 400;
      color: rgba(10,31,68,0.35);
      text-transform: none;
      letter-spacing: 0;
      margin-left: 6px;
    }

    .mf-auth-input {
      width: 100%;
      padding: 13px 16px;
      background: rgba(255,255,255,0.85);
      border: 1px solid rgba(10,31,68,0.08);
      border-radius: 12px;
      color: #0A1F44;
      font-family: 'Poppins', sans-serif;
      font-size: 16px;
      font-weight: 400;
      outline: none;
      transition: all .2s cubic-bezier(.4,0,.2,1);
      -webkit-appearance: none;
    }
    .mf-auth-input::placeholder { color: rgba(10,31,68,0.28); }
    .mf-auth-input:focus {
      border-color: rgba(198,169,107,0.6);
      background: #fff;
      box-shadow: 0 0 0 4px rgba(198,169,107,0.10);
    }

    .mf-auth-forgot {
      background: none; border: none; padding: 0;
      color: rgba(10,31,68,0.55);
      font-family: 'Poppins', sans-serif;
      font-size: 11px; font-weight: 500;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: color .15s;
      text-transform: none;
    }
    .mf-auth-forgot:hover { color: #C6A96B; }

    .mf-auth-pass-wrap { position: relative; }
    .mf-auth-pass-toggle {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      background: transparent; border: none; cursor: pointer;
      padding: 8px; border-radius: 8px;
      font-size: 17px; line-height: 1;
      color: rgba(10,31,68,0.4);
      transition: background .15s;
    }
    .mf-auth-pass-toggle:hover { background: rgba(10,31,68,0.05); }

    .mf-auth-btn {
      width: 100%;
      padding: 15px 20px;
      background: linear-gradient(135deg, #0A1F44 0%, #122550 100%);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-family: 'Poppins', sans-serif;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 0.02em;
      cursor: pointer;
      transition: all .25s cubic-bezier(.4,0,.2,1);
      margin-top: 14px;
      box-shadow: 0 4px 14px rgba(10,31,68,0.12);
    }
    .mf-auth-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(10,31,68,0.22);
    }
    .mf-auth-btn:active:not(:disabled) { transform: translateY(0); }
    .mf-auth-btn:disabled { opacity: 0.65; cursor: not-allowed; }

    .mf-auth-btn-secondary {
      width: 100%;
      padding: 13px 18px;
      background: transparent;
      border: 1px solid rgba(10,31,68,0.10);
      border-radius: 12px;
      color: rgba(10,31,68,0.75);
      font-family: 'Poppins', sans-serif;
      font-size: 13px;
      font-weight: 500;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: all .2s;
    }
    .mf-auth-btn-secondary:hover {
      border-color: rgba(198,169,107,0.40);
      background: rgba(198,169,107,0.05);
      color: #0A1F44;
    }

    .mf-auth-alert {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 11px 14px;
      border-radius: 10px;
      font-size: 13px;
      line-height: 1.5;
      margin-bottom: 14px;
    }
    .mf-auth-alert.err {
      background: rgba(220,38,38,0.06);
      border: 1px solid rgba(220,38,38,0.18);
      color: #991b1b;
    }
    .mf-auth-alert.info {
      background: rgba(22,101,52,0.06);
      border: 1px solid rgba(22,101,52,0.18);
      color: #166534;
    }
    .mf-auth-alert-icon { font-size: 14px; line-height: 1.4; flex-shrink: 0; }

    .mf-auth-divider {
      display: flex; align-items: center; gap: 14px;
      margin: 22px 0 16px;
    }
    .mf-auth-divider-line {
      flex: 1; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(10,31,68,0.10), transparent);
    }
    .mf-auth-divider-text {
      font-size: 10px;
      color: rgba(10,31,68,0.35);
      text-transform: uppercase;
      letter-spacing: 0.18em;
      font-weight: 500;
      white-space: nowrap;
    }

    .mf-auth-footer {
      margin-top: 36px;
      text-align: center;
    }
    .mf-auth-footer-dots {
      display: flex; justify-content: center; gap: 6px;
      margin-bottom: 14px;
    }
    .mf-auth-footer-dot {
      width: 5px; height: 5px; border-radius: 50%;
      background: rgba(10,31,68,0.15);
    }
    .mf-auth-footer-dot.active { background: #C6A96B; }
    .mf-auth-footer-text {
      font-size: 10px;
      color: rgba(10,31,68,0.35);
      letter-spacing: 0.22em;
      text-transform: uppercase;
      font-weight: 500;
    }

    .mf-auth-spinner {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: mfSpin .7s linear infinite;
    }

    @keyframes mfFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes mfFadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes mfSpin { to { transform: rotate(360deg); } }
  `;

  const titulo = modo==="forgot" ? "Recuperar acceso"
               : modo==="signup" ? "Crear tu cuenta"
               : "Bienvenido de vuelta";
  const subtitulo = modo==="forgot" ? "Te enviaremos un correo para que crees una contraseña nueva."
                  : modo==="signup" ? "Únete a la plataforma inteligente para asesores de alto rendimiento."
                  : "La plataforma inteligente para asesores de alto rendimiento.";

  return (
    <div className="mf-auth-page">
      <style>{AUTH_CSS}</style>

      <div className="mf-auth-glow">
        <div className="mf-auth-glow-1"/>
        <div className="mf-auth-glow-2"/>
      </div>

      <div className="mf-auth-inner">
        {/* Logo oficial */}
        <div className="mf-auth-logo-wrap">
          <img
            src="/icon-512.png"
            alt="MarFlow"
            className="mf-auth-logo-img"
            draggable="false"
          />
        </div>

        {/* Headline + subhead */}
        <h1 className="mf-auth-headline">{titulo}</h1>
        <p className="mf-auth-subhead">{subtitulo}</p>

        {/* Card */}
        <div className="mf-auth-card">
          {modo==="signup" && (
            <>
              <div className="mf-auth-row">
                <div className="mf-auth-field mf-auth-field-half">
                  <label className="mf-auth-label"><span>Nombre(s)</span></label>
                  <input
                    className="mf-auth-input"
                    value={nombre}
                    onChange={e=>setNombre(e.target.value)}
                    placeholder="Mariana"
                    onKeyDown={e=>e.key==="Enter"&&login()}
                    autoCapitalize="words"
                    autoComplete="given-name"
                  />
                </div>
                <div className="mf-auth-field mf-auth-field-half">
                  <label className="mf-auth-label"><span>Apellido(s)</span></label>
                  <input
                    className="mf-auth-input"
                    value={apellidos}
                    onChange={e=>setApellidos(e.target.value)}
                    placeholder="González Nava"
                    onKeyDown={e=>e.key==="Enter"&&login()}
                    autoCapitalize="words"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div className="mf-auth-field">
                <label className="mf-auth-label"><span>Estado</span></label>
                <select
                  className="mf-auth-input mf-auth-select"
                  value={estado}
                  onChange={e=>setEstado(e.target.value)}
                >
                  <option value="">Selecciona tu estado</option>
                  {ESTADOS_MX.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="mf-auth-field">
                <label className="mf-auth-label"><span>Teléfono</span></label>
                <input
                  className="mf-auth-input"
                  type="tel"
                  inputMode="numeric"
                  value={telefono}
                  onChange={e=>setTelefono(e.target.value)}
                  placeholder="10 dígitos"
                  onKeyDown={e=>e.key==="Enter"&&login()}
                  autoComplete="tel"
                />
              </div>
            </>
          )}

          <div className="mf-auth-field">
            <label className="mf-auth-label"><span>{modo==="signup"?"Correo electrónico":"Email"}</span></label>
            <input
              className="mf-auth-input"
              type="email"
              value={email}
              onChange={e=>setEmail(e.target.value)}
              placeholder="tu@email.com"
              onKeyDown={e=>e.key==="Enter"&&login()}
              autoCapitalize="none" autoCorrect="off" spellCheck={false}
              autoComplete={modo==="signup"?"email":"username"}
            />
          </div>

          {modo!=="forgot" && (
            <div className="mf-auth-field">
              <label className="mf-auth-label">
                <span>Contraseña{modo==="signup" && <span className="mf-auth-label-hint">(mín. 8, letras y números)</span>}</span>
                {modo==="login" && (
                  <button type="button" onClick={()=>cambiarModo("forgot")} className="mf-auth-forgot">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </label>
              <div className="mf-auth-pass-wrap">
                <input
                  className="mf-auth-input"
                  type={verPass?"text":"password"}
                  value={pass}
                  onChange={e=>setPass(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e=>e.key==="Enter"&&login()}
                  style={{paddingRight:48}}
                  autoComplete={modo==="signup"?"new-password":"current-password"}
                />
                <button type="button" onClick={()=>setVerPass(v=>!v)} aria-label={verPass?"Ocultar contraseña":"Mostrar contraseña"} className="mf-auth-pass-toggle">
                  {verPass ? <IconEyeOff/> : <IconEye/>}
                </button>
              </div>
            </div>
          )}

          {modo==="signup" && (
            <div className="mf-auth-field">
              <label className="mf-auth-label"><span>Confirmar contraseña</span></label>
              <div className="mf-auth-pass-wrap">
                <input
                  className="mf-auth-input"
                  type={verPass2?"text":"password"}
                  value={pass2}
                  onChange={e=>setPass2(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={e=>e.key==="Enter"&&login()}
                  style={{paddingRight:48}}
                  autoComplete="new-password"
                />
                <button type="button" onClick={()=>setVerPass2(v=>!v)} aria-label={verPass2?"Ocultar":"Mostrar"} className="mf-auth-pass-toggle">
                  {verPass2 ? <IconEyeOff/> : <IconEye/>}
                </button>
              </div>
            </div>
          )}

          {err && (
            <div className="mf-auth-alert err">
              <span className="mf-auth-alert-icon"><IconAlert size={16}/></span>
              <span>{err}</span>
            </div>
          )}
          {info && (
            <div className="mf-auth-alert info">
              <span className="mf-auth-alert-icon"><IconCheck size={16}/></span>
              <span>{info}</span>
            </div>
          )}

          <button className="mf-auth-btn" onClick={login} disabled={loading}>
            {loading
              ? (<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:10}}>
                  <IconLoader size={15} color="#fff"/>
                  {modo==="signup"?"Creando cuenta…":modo==="forgot"?"Enviando…":"Verificando…"}
                </span>)
              : (<span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  {modo==="signup"?"Registrarme":modo==="forgot"?"Enviar instrucciones":"Iniciar sesión"}
                  <IconArrowRight size={15} color="#fff"/>
                </span>)}
          </button>

          <div className="mf-auth-divider">
            <div className="mf-auth-divider-line"/>
            <div className="mf-auth-divider-text">
              {modo==="signup"?"o si ya tienes cuenta":modo==="forgot"?"o regresa al inicio":"o crea una cuenta"}
            </div>
            <div className="mf-auth-divider-line"/>
          </div>

          <button onClick={()=>cambiarModo(modo==="login"?"signup":"login")} className="mf-auth-btn-secondary">
            {modo==="signup"?"Iniciar sesión":modo==="forgot"?"Volver al inicio":"Registrarse"}
          </button>
        </div>

        {/* Footer */}
        <div className="mf-auth-footer">
          <div className="mf-auth-footer-dots">
            <span className="mf-auth-footer-dot active"/>
            <span className="mf-auth-footer-dot"/>
            <span className="mf-auth-footer-dot"/>
          </div>
          <div className="mf-auth-footer-text">© 2026 MarFlow · Acceso privado</div>
        </div>
      </div>
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

/* ═══════════════════════════════════════════
   BIOMETRÍA WebAuthn (Face ID / Touch ID nativo del browser)
   - Sin librerías externas, sólo navigator.credentials API
   - Modelo "lock screen": la biometría desbloquea la sesión guardada de Supabase
   - NUNCA almacenamos contraseñas ni tokens; solo el credentialId
═══════════════════════════════════════════ */
const BIO_KEY_CRED = "mf_biometric_cred";
const BIO_KEY_USER = "mf_biometric_user";
const BIO_SESSION_UNLOCKED = "mf_bio_unlocked";

function biometriaSoportada() {
  return typeof window !== "undefined" && !!(window.PublicKeyCredential && navigator.credentials);
}

async function biometriaPlataformaDisponible() {
  if (!biometriaSoportada()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch { return false; }
}

function biometriaActiva(usuarioId) {
  try {
    const cred = localStorage.getItem(BIO_KEY_CRED);
    const user = localStorage.getItem(BIO_KEY_USER);
    return !!(cred && user && (!usuarioId || user === usuarioId));
  } catch { return false; }
}

async function registrarBiometria(usuario) {
  if (!biometriaSoportada()) throw new Error("Tu dispositivo no soporta biometría");
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const userIdBytes = new TextEncoder().encode(usuario.id);

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: { name: "MarFlow", id: window.location.hostname },
      user: {
        id: userIdBytes,
        name: usuario.usuario || usuario.id,
        displayName: usuario.nombre || "Usuario MarFlow",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },   // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        requireResidentKey: false,
      },
      timeout: 60000,
      attestation: "none",
    },
  });

  const credId = new Uint8Array(credential.rawId);
  const credIdB64 = btoa(String.fromCharCode(...credId));
  localStorage.setItem(BIO_KEY_CRED, credIdB64);
  localStorage.setItem(BIO_KEY_USER, usuario.id);
  sessionStorage.setItem(BIO_SESSION_UNLOCKED, "true");
}

async function verificarBiometria() {
  if (!biometriaSoportada()) throw new Error("Biometría no soportada");
  const credB64 = localStorage.getItem(BIO_KEY_CRED);
  if (!credB64) throw new Error("No hay biometría configurada");

  const credBytes = Uint8Array.from(atob(credB64), c => c.charCodeAt(0));
  const challenge = crypto.getRandomValues(new Uint8Array(32));

  await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: [{ type: "public-key", id: credBytes, transports: ["internal"] }],
      userVerification: "required",
      timeout: 60000,
      rpId: window.location.hostname,
    },
  });
  // Si no lanzó, la verificación fue exitosa
  sessionStorage.setItem(BIO_SESSION_UNLOCKED, "true");
  return true;
}

function desactivarBiometria() {
  localStorage.removeItem(BIO_KEY_CRED);
  localStorage.removeItem(BIO_KEY_USER);
  sessionStorage.removeItem(BIO_SESSION_UNLOCKED);
}

function bioSessionDesbloqueada() {
  try { return sessionStorage.getItem(BIO_SESSION_UNLOCKED) === "true"; }
  catch { return false; }
}

// ── Push notifications (Web Push API) ──────────────────────────
// VAPID public key (segura para exponer al cliente). La privada vive en Supabase Edge Function.
const VAPID_PUBLIC_KEY = "BETs4u0cIpY8XSHeG0dW0dYRjVv160i30zx3ECKoZtRtHvpGpuSAPTQ1JQyIuH9dbygQCE4RWzIGIymcqvzhPEo";

function pushSoportado() {
  return typeof window !== "undefined"
    && "serviceWorker" in navigator
    && "PushManager" in window
    && "Notification" in window;
}

// Convierte la VAPID public key a Uint8Array (formato requerido por PushManager)
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function pedirPermisoPush() {
  if (!pushSoportado()) throw new Error("Tu dispositivo no soporta notificaciones push. iOS necesita 16.4+ y MarFlow instalada como app.");
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permiso denegado. Activa las notificaciones en los ajustes del navegador.");
  return permission;
}

async function suscribirPush(usuario) {
  if (!pushSoportado()) throw new Error("Push no soportado.");
  const reg = await navigator.serviceWorker.ready;
  // Si ya hay suscripción activa, reusarla
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }
  // Guardar suscripción en Supabase
  const json = sub.toJSON();
  const adminId = getAdminId(usuario);
  const device = navigator.userAgent.slice(0, 120);
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: usuario.id,
    admin_id: adminId,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh || "",
    auth: json.keys?.auth || "",
    device_info: device,
    last_used: new Date().toISOString(),
  }, { onConflict: "user_id,endpoint" });
  if (error) throw error;
  return sub;
}

async function desuscribirPush(usuario) {
  if (!pushSoportado()) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await sub.unsubscribe();
    await supabase.from("push_subscriptions")
      .delete()
      .eq("user_id", usuario.id)
      .eq("endpoint", endpoint);
  }
}

async function getSuscripcionActiva() {
  if (!pushSoportado()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch { return null; }
}

// Invocar la Edge Function para enviar una push de prueba
async function enviarPushDePrueba(usuario) {
  const adminId = getAdminId(usuario);
  const { data, error } = await supabase.functions.invoke("send-push-notification", {
    body: {
      admin_id: adminId,
      title: "Hola desde MarFlow",
      body: "Tus notificaciones están funcionando correctamente.",
      url: "/",
    },
  });
  if (error) {
    const msg = error?.context?.body
      ? (typeof error.context.body === "string" ? error.context.body : JSON.stringify(error.context.body))
      : (error?.message || "Error desconocido en backend");
    throw new Error(`Backend: ${msg}`);
  }
  if (!data) throw new Error("Backend no devolvió respuesta.");
  if (data.error) throw new Error(`Backend: ${data.error}`);
  if (typeof data.sent !== "number") throw new Error("Respuesta inválida del backend.");
  if (data.sent === 0) {
    const errs = (data.errors || []).join(" · ");
    if (data.total === 0) throw new Error("Sin suscripciones activas en este dispositivo. Activa de nuevo.");
    throw new Error(`No se envió ninguna push (${data.total} suscripciones). ${errs || ""}`);
  }
  return data;
}

// Diagnóstico completo del estado de push en este dispositivo
async function diagnosticoPush(usuario) {
  const result = {
    soporta: pushSoportado(),
    permiso: typeof Notification !== "undefined" ? Notification.permission : "n/a",
    swRegistrado: false,
    swActivo: false,
    suscripcion: null,
    endpoint: null,
    enSupabase: null,
  };
  if (!result.soporta) return result;

  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    result.swRegistrado = !!reg;
    result.swActivo = !!reg?.active;
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const json = sub.toJSON();
        result.suscripcion = "presente";
        result.endpoint = json.endpoint;
      } else {
        result.suscripcion = "ausente";
      }
    }
  } catch (e) {
    result.swRegistrado = "error";
  }

  // Ver si la suscripción del cliente coincide con alguna en Supabase
  if (result.endpoint && usuario?.id) {
    const { data, error } = await supabase.from("push_subscriptions")
      .select("id")
      .eq("user_id", usuario.id)
      .eq("endpoint", result.endpoint)
      .maybeSingle();
    if (error) result.enSupabase = `error: ${error.message}`;
    else result.enSupabase = data ? "guardada" : "no encontrada";
  }
  return result;
}

// ── Timeout de inactividad configurable (5/10/15 min) ──
const IDLE_TIMEOUT_KEY = "mf_idle_timeout_min";
const IDLE_TIMEOUT_OPTIONS = [5, 10, 15];
function getIdleTimeoutMin() {
  try {
    const v = parseInt(localStorage.getItem(IDLE_TIMEOUT_KEY), 10);
    return IDLE_TIMEOUT_OPTIONS.includes(v) ? v : 15;
  } catch { return 15; }
}
function setIdleTimeoutMinLS(min) {
  try { localStorage.setItem(IDLE_TIMEOUT_KEY, String(min)); }
  catch {}
}

/* ═══════════════════════════════════════════
   PANTALLA DE BLOQUEO BIOMÉTRICO
═══════════════════════════════════════════ */
function BiometricLockScreen({ onUnlocked, onUsePassword }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function intentar() {
    if (loading) return;
    setErr(""); setLoading(true);
    try {
      await verificarBiometria();
      onUnlocked();
    } catch (e) {
      setErr(e?.name === "NotAllowedError" ? "Verificación cancelada o fallida."
           : (e?.message || "No se pudo verificar."));
      setLoading(false);
    }
  }

  // Auto-prompt al cargar (mejor UX)
  useEffect(() => {
    const t = setTimeout(intentar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      minHeight: "100vh", minHeight: "100dvh",
      background: "#F8F6F2",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
      fontFamily: "'Poppins', sans-serif",
      position: "relative", overflow: "hidden",
    }} className="mf-fade-in">
      <div style={{position:"absolute",top:-160,left:-160,width:480,height:480,borderRadius:"50%",background:"radial-gradient(circle,rgba(198,169,107,0.18),transparent 70%)",filter:"blur(80px)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:-200,right:-200,width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(10,31,68,0.08),transparent 70%)",filter:"blur(80px)",pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:380,textAlign:"center",position:"relative",zIndex:1}}>
        <img src="/icon-512.png" alt="MarFlow"
          style={{height:80,width:80,objectFit:"contain",margin:"0 auto 24px",display:"block",filter:"drop-shadow(0 12px 28px rgba(10,31,68,0.10))"}}
          draggable="false"/>

        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(198,169,107,0.10)",
          border: "1px solid rgba(198,169,107,0.25)",
          margin: "0 auto 20px",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#C6A96B",
        }}>
          <IconFingerprint size={32} color="#C6A96B"/>
        </div>

        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28, fontWeight: 500,
          color: "#0A1F44",
          letterSpacing: "-0.02em",
          margin: "0 0 8px",
        }}>Tu sesión está activa</h1>
        <p style={{
          fontSize: 14, color: "rgba(10,31,68,0.55)",
          margin: "0 0 28px", lineHeight: 1.5,
        }}>Verifica con biometría para continuar.</p>

        {err && (
          <div style={{
            display:"flex",alignItems:"center",gap:8,
            padding:"10px 14px",borderRadius:10,
            background:"rgba(220,38,38,0.06)",
            border:"1px solid rgba(220,38,38,0.18)",
            color:"#991b1b", fontSize:13, marginBottom:14,
            justifyContent:"center",
          }}>
            <IconAlert size={15} color="#991b1b"/>{err}
          </div>
        )}

        <button onClick={intentar} disabled={loading}
          style={{
            width:"100%",
            padding:"14px 20px",
            borderRadius:12,
            border:"none",
            background:"linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
            color:"#fff",
            fontFamily:"'Poppins',sans-serif",
            fontSize:14, fontWeight:600,
            cursor:"pointer",
            boxShadow:"0 4px 14px rgba(10,31,68,0.18)",
            transition:"all var(--mf-t-fast) var(--mf-ease-out)",
            opacity: loading ? 0.7 : 1,
            display:"inline-flex", alignItems:"center", justifyContent:"center", gap:8,
            marginBottom:12,
          }}>
          {loading ? <><IconLoader size={14} color="#fff"/> Verificando…</> : <><IconFingerprint size={15} color="#fff"/> Desbloquear</>}
        </button>

        <button onClick={onUsePassword}
          style={{
            width:"100%",
            padding:"12px 18px",
            borderRadius:12,
            border:"1px solid rgba(10,31,68,0.10)",
            background:"transparent",
            color:"rgba(10,31,68,0.65)",
            fontFamily:"'Poppins',sans-serif",
            fontSize:13, fontWeight:500,
            cursor:"pointer",
            transition:"all var(--mf-t-fast) var(--mf-ease-out)",
          }}>
          Usar contraseña
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MODAL DE AVISO DE INACTIVIDAD (1 min antes del logout)
═══════════════════════════════════════════ */
function IdleWarningModal({ onContinue, onLogout, countdownSeconds = 60 }) {
  const [seconds, setSeconds] = useState(countdownSeconds);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(t); onLogout(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mm = String(Math.floor(seconds/60)).padStart(1,"0");
  const ss = String(seconds%60).padStart(2,"0");

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1200,
      background:"rgba(10,31,68,0.40)",
      backdropFilter:"blur(8px)",
      WebkitBackdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:24,
      animation:"mfFadeIn .25s var(--mf-ease-out)",
    }} onClick={(e)=>{ if(e.target===e.currentTarget) onContinue(); }}>
      <div style={{
        background:"#F8F6F2",
        borderRadius:20,
        padding:"32px 28px 26px",
        maxWidth:400, width:"100%",
        boxShadow:"0 24px 60px rgba(10,31,68,0.25)",
        border:"1px solid rgba(10,31,68,0.05)",
        animation:"mfFadeUp .35s var(--mf-ease-spring)",
        textAlign:"center",
        fontFamily:"'Poppins', sans-serif",
      }}>
        <div style={{
          width:56, height:56, borderRadius:"50%",
          background:"rgba(198,169,107,0.10)",
          border:"1px solid rgba(198,169,107,0.25)",
          margin:"0 auto 18px",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <IconClock2 size={26} color="#C6A96B"/>
        </div>

        <h2 style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:24, fontWeight:500,
          color:"#0A1F44",
          letterSpacing:"-0.01em",
          margin:"0 0 8px",
        }}>Sesión a punto de cerrarse</h2>

        <p style={{
          fontSize:13.5, color:"rgba(10,31,68,0.60)",
          lineHeight:1.55,
          margin:"0 0 18px",
        }}>Por seguridad, tu sesión se cerrará pronto por inactividad.</p>

        <div style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:42, fontWeight:500,
          color:"#0A1F44",
          letterSpacing:"-0.02em",
          margin:"0 0 24px",
          fontVariantNumeric:"tabular-nums",
        }}>{mm}:{ss}</div>

        <div style={{display:"flex", gap:10, flexDirection:"column"}}>
          <button onClick={onContinue}
            style={{
              padding:"13px 18px",
              borderRadius:12, border:"none",
              background:"linear-gradient(135deg, #C6A96B 0%, #d4bc89 100%)",
              color:"#0A1F44",
              fontFamily:"'Poppins',sans-serif",
              fontWeight:600, fontSize:13.5,
              cursor:"pointer",
              boxShadow:"0 4px 14px rgba(198,169,107,0.35)",
              transition:"all var(--mf-t-fast) var(--mf-ease-out)",
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 18px rgba(198,169,107,0.45)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 14px rgba(198,169,107,0.35)";}}>
            Seguir usando MarFlow
          </button>
          <button onClick={onLogout}
            style={{
              padding:"11px 18px",
              borderRadius:12,
              border:"1px solid rgba(10,31,68,0.10)",
              background:"transparent",
              color:"rgba(10,31,68,0.65)",
              fontFamily:"'Poppins',sans-serif",
              fontWeight:500, fontSize:12.5,
              cursor:"pointer",
              transition:"all var(--mf-t-fast) var(--mf-ease-out)",
            }}>
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TOAST PREMIUM — feedback no intrusivo de operaciones
═══════════════════════════════════════════ */
function Toast({ id, type = "success", message, onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 2700);
    const t2 = setTimeout(onClose, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const variants = {
    success: { dot: "#16a34a", text: "#166534", icon: <IconCheck size={14} color="#166534"/> },
    error:   { dot: "#dc2626", text: "#991b1b", icon: <IconAlert size={14} color="#991b1b"/> },
    info:    { dot: "#0A1F44", text: "#0A1F44", icon: <IconAlertCircle size={14} color="#0A1F44"/> },
  };
  const v = variants[type] || variants.success;

  return (
    <div
      onClick={onClose}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px",
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px) saturate(180%)",
        WebkitBackdropFilter: "blur(12px) saturate(180%)",
        border: "1px solid rgba(10,31,68,0.08)",
        borderLeft: `3px solid ${v.dot}`,
        borderRadius: 12,
        boxShadow: "0 12px 32px rgba(10,31,68,0.14), 0 2px 8px rgba(10,31,68,0.06)",
        fontFamily: "'Poppins', sans-serif",
        fontSize: 13,
        color: v.text,
        maxWidth: 380,
        minWidth: 240,
        cursor: "pointer",
        opacity: exiting ? 0 : 1,
        transform: exiting ? "translateX(20px)" : "translateX(0)",
        animation: exiting ? "none" : "mfSlideInRight 0.35s var(--mf-ease-spring)",
        transition: "opacity 0.3s var(--mf-ease-out), transform 0.3s var(--mf-ease-out)",
      }}
    >
      {v.icon}
      <span style={{ flex: 1, lineHeight: 1.45, letterSpacing: "0.005em" }}>{message}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LOGOUT CONFIRMATION MODAL — pregunta antes de cerrar sesión
═══════════════════════════════════════════ */
function LogoutConfirmModal({ onConfirm, onCancel, usuario }) {
  return (
    <div style={{
      position:"fixed", inset:0, zIndex:1200,
      background:"rgba(10,31,68,0.40)",
      backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:24,
      animation:"mfFadeIn .25s var(--mf-ease-out)",
    }} onClick={(e)=>{ if(e.target===e.currentTarget) onCancel(); }}>
      <div style={{
        background:"#F8F6F2",
        borderRadius:20,
        padding:"32px 28px 26px",
        maxWidth:400, width:"100%",
        boxShadow:"0 24px 60px rgba(10,31,68,0.25)",
        border:"1px solid rgba(10,31,68,0.05)",
        animation:"mfFadeUp .35s var(--mf-ease-spring)",
        textAlign:"center",
        fontFamily:"'Poppins', sans-serif",
      }}>
        <div style={{
          width:56, height:56, borderRadius:"50%",
          background:"rgba(10,31,68,0.06)",
          border:"1px solid rgba(10,31,68,0.10)",
          margin:"0 auto 18px",
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          <IconLock size={24} color={B.navy}/>
        </div>

        <h2 style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:24, fontWeight:500,
          color:B.navy, letterSpacing:"-0.01em",
          margin:"0 0 10px",
        }}>¿Cerrar sesión?</h2>

        <p style={{
          fontSize:13.5, color:"rgba(10,31,68,0.60)",
          lineHeight:1.55, margin:"0 0 24px",
        }}>
          {usuario?.nombre
            ? <>Vas a cerrar tu sesión de <strong style={{color:B.navy}}>{usuario.nombre.split(" ")[0]}</strong>.</>
            : "Vas a salir de MarFlow."}
        </p>

        <div style={{display:"flex", gap:10, flexDirection:"column"}}>
          <button onClick={onConfirm}
            style={{
              padding:"13px 18px", borderRadius:12, border:"none",
              background:"linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
              color:"#fff",
              fontFamily:"'Poppins',sans-serif",
              fontWeight:600, fontSize:13.5,
              cursor:"pointer",
              boxShadow:"0 4px 14px rgba(10,31,68,0.20)",
              transition:"all var(--mf-t-fast) var(--mf-ease-out)",
            }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 18px rgba(10,31,68,0.28)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 14px rgba(10,31,68,0.20)";}}>
            Sí, cerrar sesión
          </button>
          <button onClick={onCancel}
            style={{
              padding:"11px 18px", borderRadius:12,
              border:"1px solid rgba(10,31,68,0.10)",
              background:"transparent",
              color:"rgba(10,31,68,0.65)",
              fontFamily:"'Poppins',sans-serif",
              fontWeight:500, fontSize:12.5,
              cursor:"pointer",
              transition:"all var(--mf-t-fast) var(--mf-ease-out)",
            }}>
            No, cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   CONFIGURACIÓN — actividad reciente, biométrico y accesibilidad
═══════════════════════════════════════════ */

// Encabezado editorial reusable entre secciones de Configuración
function SeccionTitulo({ eyebrow, titulo, sub }) {
  return (
    <div style={{margin:"40px 0 16px"}}>
      <div style={{
        fontSize:10, fontWeight:500,
        color:"rgba(10,31,68,0.40)",
        textTransform:"uppercase", letterSpacing:"0.22em",
        marginBottom:6,
      }}>{eyebrow}</div>
      <div style={{
        fontFamily:"'Cormorant Garamond', serif",
        fontSize:24, fontWeight:500,
        color:"#0A1F44", letterSpacing:"-0.015em",
        lineHeight:1.15, marginBottom:sub?4:0,
      }}>{titulo}</div>
      {sub && <div style={{fontSize:12.5, color:"rgba(10,31,68,0.55)", lineHeight:1.5}}>{sub}</div>}
    </div>
  );
}

// Icono discreto para timeline de actividad (mapeado en ACTIVIDAD_LABEL)
function ActividadIcon({ tipo, color = "rgba(10,31,68,0.55)" }) {
  const which = ACTIVIDAD_LABEL[tipo]?.icon || "edit";
  const props = { size: 12, color };
  switch (which) {
    case "plus":     return <IconPlus {...props}/>;
    case "edit":     return <IconRefresh {...props}/>;
    case "trash":    return <IconTrash {...props}/>;
    case "arrow":    return <IconArrowRight {...props}/>;
    case "user":     return <IconUser {...props}/>;
    case "x":        return <IconX {...props}/>;
    case "check":    return <IconCheck {...props}/>;
    case "shield":   return <IconShield {...props}/>;
    case "calendar": return <IconCalendar {...props}/>;
    default:         return <IconRefresh {...props}/>;
  }
}

// Color por familia de evento
function colorActividad(tipo) {
  if (!tipo) return "rgba(10,31,68,0.45)";
  if (tipo.startsWith("evento.")) return "#7c3aed";
  if (tipo === "lead.creado")     return "#059669";
  if (tipo === "lead.eliminado")  return "#dc2626";
  if (tipo === "lead.perdido")    return "#dc2626";
  if (tipo === "lead.recuperado") return "#059669";
  if (tipo === "lead.etapa")      return "#0A1F44";
  if (tipo === "lead.poliza_add") return "#7c3aed";
  if (tipo.startsWith("lead.pendiente_")) return "#C6A96B";
  return "rgba(10,31,68,0.55)";
}

// Formato relativo "hace X" para timeline
function tiempoRelativo(iso) {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000)        return "hace un momento";
  if (ms < 3_600_000)     return `hace ${Math.floor(ms/60_000)} min`;
  if (ms < 86_400_000)    return `hace ${Math.floor(ms/3_600_000)} h`;
  if (ms < 7*86_400_000)  return `hace ${Math.floor(ms/86_400_000)} d`;
  return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

// Timeline de últimas 15 acciones del admin (Supabase) — sub-sección de Configuración
function SeccionActividadReciente({ usuario }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const adminId = getAdminId(usuario);

  async function cargar() {
    if (!adminId) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("actividad")
        .select("*")
        .eq("admin_id", adminId)
        .order("created_at", { ascending: false })
        .limit(15);
      if (!error) setItems(data || []);
    } catch { /* silencio */ }
    setLoading(false);
  }

  useEffect(() => {
    cargar();
    if (!adminId) return;
    // Realtime: refrescar cuando llegue una actividad nueva
    const channel = supabase
      .channel(`actividad-${adminId}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "actividad", filter: `admin_id=eq.${adminId}` },
        () => cargar())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminId]);

  return (
    <div>
      <SeccionTitulo eyebrow="Historial" titulo="Actividad reciente"
        sub="Últimos 15 movimientos sobre leads y agenda. Se actualiza en vivo."/>
      <div style={{
        background:"#fff",
        border:"1px solid rgba(10,31,68,0.05)",
        borderRadius:16,
        padding:"6px 4px",
        boxShadow:"var(--mf-shadow-xs)",
      }}>
        {loading ? (
          <div style={{padding:"36px 16px", textAlign:"center", color:"rgba(10,31,68,0.45)", fontSize:12.5}}>
            <IconLoader size={16} color="rgba(10,31,68,0.45)"/>
          </div>
        ) : items.length === 0 ? (
          <div style={{padding:"36px 18px", textAlign:"center", color:"rgba(10,31,68,0.50)"}}>
            <div style={{fontFamily:"'Cormorant Garamond', serif", fontSize:18, color:"#0A1F44", marginBottom:4}}>Sin actividad aún</div>
            <div style={{fontSize:12.5}}>Conforme uses MarFlow, verás aquí los movimientos.</div>
          </div>
        ) : (
          <>
            <style>{`
              .mf-act-row { padding: 14px 16px; gap: 12px; }
              .mf-act-text { font-size: 13px; }
              .mf-act-time { font-size: 10.5px; }
              @media (max-width: 480px) {
                .mf-act-row { padding: 12px 12px; gap: 10px; }
                .mf-act-text { font-size: 12.5px; }
                .mf-act-time { font-size: 10px; }
              }
            `}</style>
            {items.map((a, i) => {
              const label = ACTIVIDAD_LABEL[a.tipo]?.l || "modificó";
              const color = colorActividad(a.tipo);
              const meta = a.metadata || {};
              return (
                <div key={a.id} className="mf-act-row" style={{
                  display:"flex", alignItems:"flex-start",
                  borderBottom: i < items.length-1 ? "1px solid rgba(10,31,68,0.04)" : "none",
                }}>
                  <div style={{
                    width:28, height:28, borderRadius:8, flexShrink:0,
                    background: `${color}10`,
                    border: `1px solid ${color}22`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    marginTop:1,
                  }}>
                    <ActividadIcon tipo={a.tipo} color={color}/>
                  </div>
                  <div style={{
                    flex:1, minWidth:0,
                    overflowWrap:"anywhere", wordBreak:"break-word",
                  }}>
                    <div className="mf-act-text" style={{
                      color:"#0A1F44", lineHeight:1.45, letterSpacing:"-0.005em",
                    }}>
                      <strong style={{fontWeight:600}}>{a.autor_nombre || "—"}</strong>{" "}
                      <span style={{color:"rgba(10,31,68,0.55)"}}>{label}</span>{" "}
                      <strong style={{fontWeight:600}}>{a.entidad_nombre || "—"}</strong>
                      {meta.de && meta.a && (
                        <span style={{color:"rgba(10,31,68,0.45)"}}> · {meta.de} → {meta.a}</span>
                      )}
                      {meta.texto && (
                        <span style={{color:"rgba(10,31,68,0.50)", fontStyle:"italic"}}> · {meta.texto}</span>
                      )}
                      {meta.producto && meta.numero && (
                        <span style={{color:"rgba(10,31,68,0.50)"}}> · {meta.producto} {meta.numero}</span>
                      )}
                    </div>
                    <div className="mf-act-time" style={{
                      color:"rgba(10,31,68,0.42)", marginTop:4,
                      textTransform:"uppercase", letterSpacing:"0.10em",
                    }}>
                      {tiempoRelativo(a.created_at)}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

// Sub-sección de Accesibilidad (toggles minimal)
// Sub-sección · Notificaciones push (Web Push API)
function SeccionNotificacionesPush({ usuario }) {
  const [estado, setEstado] = useState("verificando"); // "verificando" | "no_soportado" | "denegado" | "inactiva" | "activa"
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgTipo, setMsgTipo] = useState("info"); // "ok" | "err" | "info"
  const [diag, setDiag] = useState(null);
  const [diagAbierto, setDiagAbierto] = useState(false);

  async function refrescar() {
    if (!pushSoportado()) { setEstado("no_soportado"); return; }
    if (Notification.permission === "denied") { setEstado("denegado"); return; }
    const sub = await getSuscripcionActiva();
    setEstado(sub ? "activa" : "inactiva");
  }
  async function refrescarDiagnostico() {
    try { setDiag(await diagnosticoPush(usuario)); }
    catch (e) { setDiag({ error: String(e?.message || e) }); }
  }
  useEffect(() => { refrescar(); refrescarDiagnostico(); /* eslint-disable-next-line */ }, []);

  function setMsgOk(t)  { setMsg(t); setMsgTipo("ok"); }
  function setMsgErr(t) { setMsg(t); setMsgTipo("err"); }

  async function activar() {
    setMsg(""); setLoading(true);
    try {
      await pedirPermisoPush();
      await suscribirPush(usuario);
      setMsgOk("Notificaciones activadas en este dispositivo.");
      await refrescar(); await refrescarDiagnostico();
    } catch (e) {
      const m = e?.message || "";
      if (/Permiso denegado/i.test(m)) setMsgErr("Diste denegar. Ve a Ajustes de iPhone → Notificaciones → MarFlow y habilita.");
      else if (/no soporta|no soportado/i.test(m)) setMsgErr("Este dispositivo no soporta push. iOS 16.4+ con MarFlow instalada como app.");
      else setMsgErr(m || "No se pudieron activar las notificaciones.");
    } finally { setLoading(false); }
  }

  async function desactivar() {
    setMsg(""); setLoading(true);
    try {
      await desuscribirPush(usuario);
      setMsgOk("Notificaciones desactivadas en este dispositivo.");
      await refrescar(); await refrescarDiagnostico();
    } catch (e) {
      setMsgErr(e?.message || "No se pudieron desactivar.");
    } finally { setLoading(false); }
  }

  async function probar() {
    setMsg(""); setLoading(true);
    try {
      await refrescarDiagnostico();
      const d = await diagnosticoPush(usuario);
      if (!d.soporta) throw new Error("Este dispositivo no soporta push. iOS 16.4+ y MarFlow instalada como app.");
      if (d.permiso !== "granted") throw new Error(`Permisos: "${d.permiso}". Activa las notificaciones primero.`);
      if (!d.swActivo) throw new Error("Service Worker no activo. Cierra MarFlow y reábrela desde la pantalla de inicio.");
      if (d.suscripcion !== "presente") throw new Error("No hay suscripción local. Activa de nuevo.");
      if (d.enSupabase !== "guardada") throw new Error("La suscripción no está guardada en Supabase. Desactiva y reactiva.");

      const r = await enviarPushDePrueba(usuario);
      setMsgOk(`Push enviada · ${r.sent}/${r.total} dispositivos. Si tarda más de 30s, revisa Ajustes iOS.`);
    } catch (e) {
      setMsgErr(e?.message || "No se pudo enviar la prueba.");
    } finally { setLoading(false); }
  }

  const statusColor = estado === "activa" ? "#059669"
                    : estado === "no_soportado" || estado === "denegado" ? "#dc2626"
                    : "rgba(10,31,68,0.45)";
  const statusLabel = estado === "verificando" ? "Verificando…"
                    : estado === "no_soportado" ? "No disponible en este dispositivo"
                    : estado === "denegado" ? "Permiso denegado"
                    : estado === "activa" ? "Activas" : "Inactivas";

  return (
    <div>
      <SeccionTitulo eyebrow="Notificaciones" titulo="Push al iPhone"
        sub="Recibe avisos críticos cuando MarFlow está cerrada — renovaciones, citas, seguimientos."/>

      <div style={{
        background:"#fff",
        border:"1px solid rgba(10,31,68,0.05)",
        borderRadius:16,
        padding:"22px 24px",
        boxShadow:"var(--mf-shadow-xs)",
      }}>
        <div style={{display:"flex", alignItems:"flex-start", gap:14, marginBottom:14, flexWrap:"wrap"}}>
          <div style={{
            width:42, height:42, borderRadius:10,
            background:"rgba(124,58,237,0.08)",
            border:"1px solid rgba(124,58,237,0.18)",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0,
          }}>
            <IconBell size={18} color="#7c3aed"/>
          </div>
          <div style={{flex:"1 1 200px", minWidth:0}}>
            <div style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:20, fontWeight:500,
              color:"#0A1F44", letterSpacing:"-0.01em",
              marginBottom:4,
            }}>Notificaciones push</div>
            <div style={{fontSize:13, color:"rgba(10,31,68,0.60)", lineHeight:1.55}}>
              Te avisamos solo de lo importante. Pocas notificaciones, premium y discretas.
            </div>
          </div>
          <span style={{
            fontSize:10, fontWeight:600,
            color: statusColor,
            background: `${statusColor}10`,
            border: `1px solid ${statusColor}28`,
            padding:"4px 10px", borderRadius:8,
            textTransform:"uppercase", letterSpacing:"0.10em",
            whiteSpace:"nowrap", flexShrink:0,
          }}>{statusLabel}</span>
        </div>

        {/* Advertencia iOS */}
        {estado === "no_soportado" && (
          <div style={{
            padding:"10px 13px", borderRadius:10,
            background:"rgba(10,31,68,0.03)",
            border:"1px solid rgba(10,31,68,0.08)",
            fontSize:12, color:"rgba(10,31,68,0.65)",
            lineHeight:1.55, marginBottom:12,
          }}>
            <strong>Requisitos:</strong> iOS 16.4 o superior · MarFlow instalada en tu pantalla de inicio (no abierta en Safari) · navegador moderno.
          </div>
        )}

        {/* Mensaje informativo (con color según tipo) */}
        {msg && (
          <div style={{
            padding:"10px 13px", borderRadius:10,
            background: msgTipo === "ok"  ? "rgba(5,150,105,0.06)"
                      : msgTipo === "err" ? "rgba(220,38,38,0.05)"
                                          : "rgba(10,31,68,0.03)",
            border: msgTipo === "ok"  ? "1px solid rgba(5,150,105,0.22)"
                  : msgTipo === "err" ? "1px solid rgba(220,38,38,0.20)"
                                      : "1px solid rgba(10,31,68,0.06)",
            color: msgTipo === "ok"  ? "#047857"
                 : msgTipo === "err" ? "#991b1b"
                                     : "rgba(10,31,68,0.70)",
            fontSize:12.5, lineHeight:1.5, marginBottom:12,
          }}>{msg}</div>
        )}

        {/* Acciones */}
        <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
          {estado === "inactiva" && (
            <button onClick={activar} disabled={loading} style={{
              display:"inline-flex", alignItems:"center", gap:7,
              padding:"10px 16px", borderRadius:10, border:"none",
              background:"linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
              color:"#fff", fontFamily:"'Poppins',sans-serif",
              fontWeight:600, fontSize:12.5, cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}>
              <IconBell size={13} color="#fff"/>
              {loading ? "Activando…" : "Activar notificaciones"}
            </button>
          )}
          {estado === "activa" && (
            <>
              <button onClick={probar} disabled={loading} style={{
                display:"inline-flex", alignItems:"center", gap:7,
                padding:"10px 16px", borderRadius:10,
                border:"1px solid rgba(10,31,68,0.08)",
                background:"#fff", color:"#0A1F44",
                fontFamily:"'Poppins',sans-serif",
                fontWeight:500, fontSize:12.5, cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}>{loading ? "Enviando…" : "Enviar prueba"}</button>
              <button onClick={desactivar} disabled={loading} style={{
                display:"inline-flex", alignItems:"center", gap:7,
                padding:"10px 16px", borderRadius:10,
                border:"1px solid rgba(220,38,38,0.20)",
                background:"transparent", color:"#991b1b",
                fontFamily:"'Poppins',sans-serif",
                fontWeight:500, fontSize:12.5, cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
              }}>Desactivar</button>
            </>
          )}
          {estado === "denegado" && (
            <div style={{fontSize:12, color:"rgba(10,31,68,0.55)", lineHeight:1.5}}>
              Diste denegar antes. Activa las notificaciones para "MarFlow" en los ajustes de iPhone → Notificaciones → MarFlow.
            </div>
          )}
        </div>

        {/* Bloque DIAGNÓSTICO colapsable — útil para depurar */}
        <div style={{marginTop:16, borderTop:"1px solid rgba(10,31,68,0.06)", paddingTop:12}}>
          <button onClick={()=>{ setDiagAbierto(o=>!o); refrescarDiagnostico(); }} style={{
            all:"unset", cursor:"pointer", width:"100%",
            display:"flex", alignItems:"center", justifyContent:"space-between",
            fontSize:11, color:"rgba(10,31,68,0.55)", letterSpacing:"0.01em",
          }}>
            <span style={{textTransform:"uppercase", letterSpacing:"0.18em", fontWeight:500}}>Diagnóstico técnico</span>
            <span style={{fontSize:9}}>{diagAbierto ? "▲" : "▼"}</span>
          </button>
          {diagAbierto && diag && (
            <div style={{
              marginTop:10, padding:"12px 14px", borderRadius:10,
              background:"rgba(10,31,68,0.03)",
              border:"1px solid rgba(10,31,68,0.06)",
              fontFamily:"ui-monospace, 'SF Mono', Menlo, monospace",
              fontSize:11, lineHeight:1.7, color:"rgba(10,31,68,0.75)",
              wordBreak:"break-all",
            }}>
              <div>Soporta push: <strong>{String(diag.soporta)}</strong></div>
              <div>Permiso Notification: <strong>{String(diag.permiso)}</strong></div>
              <div>SW registrado: <strong>{String(diag.swRegistrado)}</strong></div>
              <div>SW activo: <strong>{String(diag.swActivo)}</strong></div>
              <div>Suscripción local: <strong>{String(diag.suscripcion)}</strong></div>
              <div>En Supabase: <strong>{String(diag.enSupabase)}</strong></div>
              {diag.endpoint && (
                <div style={{marginTop:6, fontSize:10, color:"rgba(10,31,68,0.50)"}}>
                  endpoint: {diag.endpoint.slice(0, 80)}…
                </div>
              )}
              {diag.error && <div style={{color:"#991b1b", marginTop:6}}>error: {diag.error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ACCESIBILIDAD_DEFAULT = { fontSize: "normal", reduceMotion: false, highContrast: false, betterReading: false, darkMode: false };

function SeccionAccesibilidad({ accesibilidad, onChange }) {
  const v = { ...ACCESIBILIDAD_DEFAULT, ...(accesibilidad||{}) };
  function set(k, val) { onChange({ ...v, [k]: val }); }

  return (
    <div>
      <SeccionTitulo eyebrow="Experiencia" titulo="Accesibilidad"
        sub="Ajusta cómo se ve MarFlow para que sea más cómodo y legible."/>
      <div style={{
        background:"#fff",
        border:"1px solid rgba(10,31,68,0.05)",
        borderRadius:16,
        boxShadow:"var(--mf-shadow-xs)",
        overflow:"hidden",
      }}>
        {/* Tamaño texto: 3 pills */}
        <AccRow titulo="Tamaño de texto" sub="Afecta la app completa.">
          <div style={{display:"flex", gap:6}}>
            {[{v:"small",l:"S"},{v:"normal",l:"M"},{v:"large",l:"L"}].map(o=>{
              const active = v.fontSize === o.v;
              return (
                <button key={o.v} onClick={()=>set("fontSize", o.v)} style={{
                  padding:"7px 14px", borderRadius:8,
                  border: `1px solid ${active ? "rgba(198,169,107,0.45)" : "rgba(10,31,68,0.08)"}`,
                  background: active ? "rgba(198,169,107,0.08)" : "#fff",
                  color: active ? "#0A1F44" : "rgba(10,31,68,0.55)",
                  fontFamily:"'Poppins',sans-serif",
                  fontWeight: active ? 600 : 500, fontSize:12,
                  cursor:"pointer",
                  transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                }}>{o.l}</button>
              );
            })}
          </div>
        </AccRow>

        <AccRow titulo="Alto contraste" sub="Resalta los textos sobre los fondos.">
          <AccToggle on={v.highContrast} onChange={()=>set("highContrast", !v.highContrast)}/>
        </AccRow>

        <AccRow titulo="Reducir animaciones" sub="Recomendado si te marean o usas teclado.">
          <AccToggle on={v.reduceMotion} onChange={()=>set("reduceMotion", !v.reduceMotion)}/>
        </AccRow>

        <AccRow titulo="Mejor lectura" sub="Aumenta interlineado para texto largo.">
          <AccToggle on={v.betterReading} onChange={()=>set("betterReading", !v.betterReading)}/>
        </AccRow>

        <AccRow titulo="Modo oscuro" sub="Cambia toda la paleta a tema oscuro." last>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <span style={{
              fontSize:9.5, fontWeight:600,
              color:"rgba(198,169,107,0.95)",
              background:"rgba(198,169,107,0.10)",
              border:"1px solid rgba(198,169,107,0.22)",
              padding:"3px 8px", borderRadius:6,
              textTransform:"uppercase", letterSpacing:"0.12em",
            }}>Próximamente</span>
            <AccToggle on={false} onChange={()=>{}} disabled/>
          </div>
        </AccRow>
      </div>
    </div>
  );
}

function AccRow({ titulo, sub, children, last }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:14, flexWrap:"wrap",
      padding:"14px 16px",
      borderBottom: last ? "none" : "1px solid rgba(10,31,68,0.04)",
    }}>
      <div style={{flex:"1 1 180px", minWidth:0}}>
        <div style={{fontSize:13.5, fontWeight:500, color:"#0A1F44", letterSpacing:"-0.005em"}}>{titulo}</div>
        {sub && <div style={{fontSize:11.5, color:"rgba(10,31,68,0.50)", marginTop:2, lineHeight:1.45, overflowWrap:"anywhere"}}>{sub}</div>}
      </div>
      <div style={{flexShrink:0}}>{children}</div>
    </div>
  );
}

function AccToggle({ on, onChange, disabled }) {
  return (
    <button onClick={disabled ? undefined : onChange} disabled={disabled} style={{
      width:38, height:22, borderRadius:11,
      border:"none",
      background: on ? "#0A1F44" : "rgba(10,31,68,0.15)",
      position:"relative",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      transition:"background var(--mf-t-fast) var(--mf-ease-out)",
      padding:0,
    }}>
      <span style={{
        position:"absolute", top:3, left: on ? 19 : 3,
        width:16, height:16, borderRadius:"50%",
        background:"#fff",
        boxShadow:"0 1px 3px rgba(10,31,68,0.20)",
        transition:"left var(--mf-t-fast) var(--mf-ease-out)",
      }}/>
    </button>
  );
}

function Configuracion({ usuario, idleTimeoutMin, onChangeIdleTimeout, accesibilidad, onChangeAccesibilidad }) {
  const [bioActivada, setBioActivada] = useState(() => biometriaActiva(usuario?.id));
  const [bioPlataforma, setBioPlataforma] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    biometriaPlataformaDisponible().then(setBioPlataforma);
  }, []);

  async function activar() {
    setMsg(""); setLoading(true);
    try {
      await registrarBiometria(usuario);
      setBioActivada(true);
      setMsg("✓ Biometría activada. La próxima vez que entres podrás desbloquear con Face ID / Touch ID.");
    } catch (e) {
      setMsg("✗ " + (e?.message || "No se pudo activar la biometría."));
    } finally { setLoading(false); }
  }

  function desactivar() {
    desactivarBiometria();
    setBioActivada(false);
    setMsg("Biometría desactivada para este dispositivo.");
  }

  const soportada = biometriaSoportada();

  return (
    <div className="mf-fade-in" style={{maxWidth:720, margin:"0 auto", width:"100%"}}>
      <div style={{marginBottom:32}}>
        <div style={{
          fontSize:10.5, fontWeight:500,
          color:"rgba(10,31,68,0.45)",
          textTransform:"uppercase", letterSpacing:"0.22em",
          marginBottom:8,
        }}>Preferencias</div>
        <h1 style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:"clamp(26px, 6vw, 32px)", fontWeight:500,
          color:"#0A1F44", letterSpacing:"-0.02em",
          margin:"0 0 8px", lineHeight:1.1,
        }}>Configuración</h1>
        <p style={{fontSize:13.5, color:"rgba(10,31,68,0.55)", margin:0, lineHeight:1.5}}>
          Controla cómo accedes a MarFlow, revisa la actividad reciente y ajusta la experiencia visual.
        </p>
      </div>

      {/* ═══ Sección · Actividad reciente ═══ */}
      <SeccionActividadReciente usuario={usuario}/>

      {/* ═══ Sección · Biométrico y acceso ═══ */}
      <SeccionTitulo eyebrow="Acceso" titulo="Biométrico y sesión"
        sub="Cómo te identifica MarFlow en este dispositivo."/>

      {/* Tarjeta biometría */}
      <div style={{
        background:"#fff",
        border:"1px solid rgba(10,31,68,0.06)",
        borderRadius:16,
        padding:"22px 24px",
        boxShadow:"var(--mf-shadow-xs)",
        marginBottom:14,
      }}>
        <div style={{display:"flex", alignItems:"flex-start", gap:14, marginBottom:16}}>
          <div style={{
            width:42, height:42, borderRadius:10,
            background:"rgba(198,169,107,0.10)",
            border:"1px solid rgba(198,169,107,0.20)",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0,
          }}>
            <IconFingerprint size={20} color="#C6A96B"/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:20, fontWeight:500,
              color:"#0A1F44", letterSpacing:"-0.01em",
              marginBottom:4,
            }}>Acceso biométrico</div>
            <div style={{fontSize:13, color:"rgba(10,31,68,0.60)", lineHeight:1.55}}>
              {soportada && bioPlataforma
                ? "Usa Face ID o Touch ID para desbloquear tu sesión cuando regreses a la app."
                : "Tu dispositivo no soporta biometría o el navegador no la expone."}
            </div>
          </div>
          <span style={{
            fontSize:10, fontWeight:600,
            color: bioActivada ? "#166534" : "rgba(10,31,68,0.45)",
            background: bioActivada ? "rgba(22,101,52,0.08)" : "rgba(10,31,68,0.05)",
            padding:"4px 10px", borderRadius:8,
            textTransform:"uppercase", letterSpacing:"0.10em",
            whiteSpace:"nowrap",
          }}>{bioActivada ? "Activa" : "Inactiva"}</span>
        </div>

        {msg && (
          <div style={{
            padding:"10px 13px", borderRadius:10,
            background: msg.startsWith("✓") ? "rgba(22,101,52,0.05)"
                      : msg.startsWith("✗") ? "rgba(220,38,38,0.05)"
                      : "rgba(10,31,68,0.04)",
            border: `1px solid ${msg.startsWith("✓") ? "rgba(22,101,52,0.18)"
                      : msg.startsWith("✗") ? "rgba(220,38,38,0.18)"
                      : "rgba(10,31,68,0.08)"}`,
            color: msg.startsWith("✓") ? "#166534"
                 : msg.startsWith("✗") ? "#991b1b"
                 : "rgba(10,31,68,0.70)",
            fontSize:12.5, lineHeight:1.5,
            marginBottom:12,
          }}>{msg.replace(/^[✓✗]\s*/, "")}</div>
        )}

        {!soportada || !bioPlataforma ? (
          <div style={{
            padding:"10px 13px", borderRadius:10,
            background:"rgba(10,31,68,0.03)",
            border:"1px solid rgba(10,31,68,0.06)",
            fontSize:12, color:"rgba(10,31,68,0.55)",
            lineHeight:1.55, fontStyle:"italic",
          }}>
            Tu dispositivo no expone autenticación biométrica al navegador. Funciona en iOS 16+ (Safari) y la mayoría de dispositivos Android/Windows modernos.
          </div>
        ) : !bioActivada ? (
          <button onClick={activar} disabled={loading}
            style={{
              display:"inline-flex", alignItems:"center", gap:7,
              padding:"10px 16px", borderRadius:10, border:"none",
              background:"linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
              color:"#fff",
              fontFamily:"'Poppins',sans-serif",
              fontWeight:600, fontSize:12.5,
              cursor:"pointer",
              boxShadow:"0 1px 2px rgba(10,31,68,0.10)",
              opacity: loading ? 0.7 : 1,
              transition:"all var(--mf-t-fast) var(--mf-ease-out)",
            }}>
            {loading ? <><IconLoader size={13} color="#fff"/> Activando…</> : <><IconFingerprint size={13} color="#fff"/> Activar biometría</>}
          </button>
        ) : (
          <button onClick={desactivar}
            style={{
              display:"inline-flex", alignItems:"center", gap:7,
              padding:"10px 16px", borderRadius:10,
              border:"1px solid rgba(220,38,38,0.20)",
              background:"transparent",
              color:"#991b1b",
              fontFamily:"'Poppins',sans-serif",
              fontWeight:500, fontSize:12.5,
              cursor:"pointer",
              transition:"all var(--mf-t-fast) var(--mf-ease-out)",
            }}
            onMouseEnter={e=>{e.currentTarget.style.background="rgba(220,38,38,0.04)";}}
            onMouseLeave={e=>{e.currentTarget.style.background="transparent";}}>
            <IconLock size={13} color="#991b1b"/> Desactivar biometría
          </button>
        )}
      </div>

      {/* Tarjeta auto-logout (interactiva con selector de tiempo) */}
      <div style={{
        background:"#fff",
        border:"1px solid rgba(10,31,68,0.06)",
        borderRadius:16,
        padding:"22px 24px",
        boxShadow:"var(--mf-shadow-xs)",
      }}>
        <div style={{display:"flex", alignItems:"flex-start", gap:14, marginBottom:18}}>
          <div style={{
            width:42, height:42, borderRadius:10,
            background:"rgba(10,31,68,0.05)",
            border:"1px solid rgba(10,31,68,0.08)",
            display:"flex", alignItems:"center", justifyContent:"center",
            flexShrink:0,
          }}>
            <IconShield size={20} color={B.navy}/>
          </div>
          <div style={{flex:1}}>
            <div style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:20, fontWeight:500,
              color:B.navy, letterSpacing:"-0.01em",
              marginBottom:4,
            }}>Cierre automático por inactividad</div>
            <div style={{fontSize:13, color:"rgba(10,31,68,0.60)", lineHeight:1.55}}>
              Tu sesión se cerrará después del tiempo seleccionado sin actividad. Verás un aviso 1 minuto antes para extender.
            </div>
          </div>
        </div>

        {/* Selector de tiempo: 3 pills */}
        <div style={{
          display:"flex", gap:8, flexWrap:"wrap",
          padding:"12px 0 4px",
        }}>
          {IDLE_TIMEOUT_OPTIONS.map(min => {
            const active = idleTimeoutMin === min;
            return (
              <button key={min}
                onClick={()=>onChangeIdleTimeout(min)}
                style={{
                  display:"inline-flex", alignItems:"center", gap:7,
                  padding:"10px 16px", borderRadius:10,
                  border: `1px solid ${active ? "rgba(198,169,107,0.50)" : "rgba(10,31,68,0.08)"}`,
                  background: active ? "rgba(198,169,107,0.08)" : B.white,
                  color: active ? B.navy : "rgba(10,31,68,0.65)",
                  fontFamily:"'Poppins',sans-serif",
                  fontWeight: active ? 600 : 500,
                  fontSize:12.5,
                  letterSpacing:"0.005em",
                  cursor:"pointer",
                  transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                  fontVariantNumeric:"tabular-nums",
                }}
                onMouseEnter={e=>{if(!active){e.currentTarget.style.borderColor="rgba(198,169,107,0.30)"; e.currentTarget.style.background="rgba(198,169,107,0.03)";}}}
                onMouseLeave={e=>{if(!active){e.currentTarget.style.borderColor="rgba(10,31,68,0.08)"; e.currentTarget.style.background=B.white;}}}>
                {active && <IconCheck size={12} color={B.gold}/>}
                {min} minutos
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Sección · Accesibilidad ═══ */}
      {/* ═══ Sección · Notificaciones push ═══ */}
      <SeccionNotificacionesPush usuario={usuario}/>

      <SeccionAccesibilidad accesibilidad={accesibilidad} onChange={onChangeAccesibilidad}/>
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
  const total = leads.length || 1;
  const activos = leads.filter(l=>!l.sinSeguimiento&&!["otro","cierre"].includes(l.etapa)).length;
  const cierres = leads.filter(l=>l.etapa==="cierre").length;
  const perdidos = leads.filter(l=>l.etapa==="otro"||l.sinSeguimiento).length;
  const contactados = leads.filter(l=>(l.checklist?.wa1||l.checklist?.call1)&&!l.sinSeguimiento).length;
  const conv = Math.round((cierres/total)*100);
  const contRatio = Math.round((contactados/total)*100);
  // Distribución por Estado de oportunidad (reemplaza calientes/tibios/fríos)
  const distEstadoOp = ESTADOS_OPORTUNIDAD.map(e => ({
    l: e.l,
    v: leads.filter(l => getEstadoOportunidad(l)?.v === e.v).length,
    c: e.color,
  }));
  const sinEstado = leads.filter(l => !l.sinSeguimiento && !getEstadoOportunidad(l)).length;

  // KPIs principales
  const kpis = [
    { l:"Conversión",      v:`${conv}%`,        sub:"Cierres / total",       dot:B.gold,      icon:<IconTrendingUp size={13} color="rgba(10,31,68,0.40)"/> },
    { l:"Contactados",     v:`${contRatio}%`,   sub:"Han recibido contacto", dot:B.blue,      icon:<IconPhoneCall  size={13} color="rgba(10,31,68,0.40)"/> },
    { l:"Activos",         v:activos,           sub:"En seguimiento",        dot:B.navy,      icon:<IconLayers     size={13} color="rgba(10,31,68,0.40)"/> },
    { l:"Cierres",         v:cierres,           sub:"Ventas concretadas",    dot:B.green,     icon:<IconStar       size={13} color="rgba(10,31,68,0.40)"/> },
    { l:"Sin seguimiento", v:perdidos,          sub:"Perdidos o descartados",dot:B.redBright, icon:<IconMinusCircle size={13} color="rgba(10,31,68,0.40)"/> },
  ];

  const temps = distEstadoOp;

  return (
    <div className="mf-fade-in" style={{maxWidth:1200, margin:"0 auto"}}>
      {/* ═══ Hero editorial ═══ */}
      <div style={{marginBottom:32}}>
        <div style={{
          fontSize:10.5, fontWeight:500,
          color:"rgba(10,31,68,0.45)",
          textTransform:"uppercase", letterSpacing:"0.22em",
          marginBottom:10,
        }}>Análisis · Tu cartera</div>
        <h1 style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:"clamp(30px, 4.8vw, 42px)",
          fontWeight:500, lineHeight:1.08,
          letterSpacing:"-0.025em",
          color:B.navy,
          margin:"0 0 10px",
        }}>Métricas</h1>
        <p style={{
          fontSize:14,
          color:"rgba(10,31,68,0.50)",
          margin:0, fontWeight:400, lineHeight:1.5,
          fontStyle:"italic",
        }}>Lo que los números dicen sobre tu pipeline.</p>
      </div>

      {/* ═══ 5 KPIs principales — estilo banca privada ═══ */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(180px, 1fr))",
        gap:14,
        marginBottom:32,
      }}>
        {kpis.map((s,i) => (
          <div key={i} className={`mf-fade-up mf-stagger-${(i%4)+1}`}
            style={{
              background:B.white,
              border:"1px solid rgba(10,31,68,0.06)",
              borderRadius:16,
              padding:"22px 22px 18px",
              boxShadow:"var(--mf-shadow-xs)",
              transition:"box-shadow var(--mf-t-normal) var(--mf-ease-out), transform var(--mf-t-normal) var(--mf-ease-out)",
            }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="var(--mf-shadow-md)"; e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="var(--mf-shadow-xs)"; e.currentTarget.style.transform="translateY(0)";}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
              <div style={{display:"flex", alignItems:"center", gap:7}}>
                <span style={{width:6,height:6,borderRadius:"50%",background:s.dot}}/>
                <span style={{
                  fontSize:10, fontWeight:600,
                  color:"rgba(10,31,68,0.50)",
                  textTransform:"uppercase", letterSpacing:"0.12em",
                }}>{s.l}</span>
              </div>
              {s.icon}
            </div>
            <div style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:"clamp(36px, 4.5vw, 48px)",
              fontWeight:500, lineHeight:1,
              letterSpacing:"-0.02em",
              color:B.navy,
              fontVariantNumeric:"tabular-nums",
              marginBottom:8,
            }}>{s.v}</div>
            <div style={{
              fontSize:11.5, color:"rgba(10,31,68,0.45)",
              letterSpacing:"0.005em",
            }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Separador editorial muy sutil */}
      <div style={{
        height:1,
        background:"linear-gradient(90deg, transparent, rgba(10,31,68,0.06), transparent)",
        margin:"4px 0 28px",
      }}/>

      {/* ═══ 2 cards de detalle ═══ */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))",
        gap:18,
      }}>
        {/* Temperatura de leads */}
        <div className="mf-fade-up mf-stagger-1" style={{
          background:B.white,
          border:"1px solid rgba(10,31,68,0.06)",
          borderRadius:16,
          padding:"22px 24px",
          boxShadow:"var(--mf-shadow-xs)",
        }}>
          <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:18}}>
            <div style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:22, fontWeight:500,
              letterSpacing:"-0.01em",
              color:B.navy,
            }}>Estado de oportunidad</div>
            <div style={{
              fontSize:10, fontWeight:500,
              color:"rgba(10,31,68,0.40)",
              textTransform:"uppercase", letterSpacing:"0.15em",
            }}>Distribución</div>
          </div>
          {temps.map(t => {
            const pct = Math.round((t.v/total)*100);
            return (
              <div key={t.l} style={{marginBottom:16}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6}}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", gap:8,
                    fontSize:13, fontWeight:500,
                    color:"rgba(10,31,68,0.85)",
                  }}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:t.c}}/>
                    {t.l}
                  </span>
                  <span style={{
                    fontFamily:"'Cormorant Garamond', serif",
                    fontSize:20, fontWeight:500,
                    color:B.navy, lineHeight:1,
                    fontVariantNumeric:"tabular-nums",
                  }}>{t.v}</span>
                </div>
                <div style={{
                  height:3, background:"rgba(10,31,68,0.05)", borderRadius:2,
                  overflow:"hidden",
                }}>
                  <div style={{
                    height:"100%", width:`${pct}%`,
                    background:t.c, borderRadius:2,
                    transition:"width var(--mf-t-slow) var(--mf-ease-out)",
                  }}/>
                </div>
              </div>
            );
          })}
          <div style={{
            marginTop:14, paddingTop:14,
            borderTop:"1px solid rgba(10,31,68,0.06)",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            fontSize:11, color:"rgba(10,31,68,0.45)",
          }}>
            <span style={{letterSpacing:"0.01em"}}>Total leads</span>
            <span style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:18, fontWeight:500,
              color:B.navy, lineHeight:1,
              fontVariantNumeric:"tabular-nums",
            }}>{leads.length}</span>
          </div>
        </div>

        {/* Pipeline por etapa */}
        <div className="mf-fade-up mf-stagger-2" style={{
          background:B.white,
          border:"1px solid rgba(10,31,68,0.06)",
          borderRadius:16,
          padding:"22px 24px",
          boxShadow:"var(--mf-shadow-xs)",
        }}>
          <div style={{display:"flex", alignItems:"baseline", justifyContent:"space-between", marginBottom:18}}>
            <div style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:22, fontWeight:500,
              letterSpacing:"-0.01em",
              color:B.navy,
            }}>Distribución por etapa</div>
            <div style={{
              fontSize:10, fontWeight:500,
              color:"rgba(10,31,68,0.40)",
              textTransform:"uppercase", letterSpacing:"0.15em",
            }}>Pipeline</div>
          </div>
          {ETAPAS.map(et => {
            const cnt = leads.filter(l => l.etapa === et.id).length;
            const pct = Math.round((cnt/total)*100);
            return (
              <div key={et.id} style={{marginBottom:12}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5}}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", gap:8,
                    fontSize:12.5, fontWeight:500,
                    color:"rgba(10,31,68,0.80)",
                  }}>
                    <span style={{width:6,height:6,borderRadius:"50%",background:et.color}}/>
                    {et.label.replace(/[¡⭐!]/g,"").trim()}
                  </span>
                  <span style={{
                    fontSize:13, fontWeight:500,
                    color:cnt > 0 ? B.navy : "rgba(10,31,68,0.30)",
                    fontVariantNumeric:"tabular-nums",
                  }}>{cnt}</span>
                </div>
                <div style={{
                  height:3, background:"rgba(10,31,68,0.05)", borderRadius:2,
                  overflow:"hidden",
                }}>
                  <div style={{
                    height:"100%", width:`${pct}%`,
                    background:et.color, borderRadius:2,
                    transition:"width var(--mf-t-slow) var(--mf-ease-out)",
                    opacity: cnt > 0 ? 0.85 : 0,
                  }}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nota footer editorial */}
      <div style={{
        marginTop:32, padding:"18px 22px",
        background:"rgba(248,246,242,0.6)",
        border:"1px solid rgba(10,31,68,0.04)",
        borderRadius:14,
        display:"flex", alignItems:"flex-start", gap:12,
      }}>
        <div style={{flexShrink:0, color:"rgba(198,169,107,0.65)", marginTop:2}}>
          <IconBarChart size={18} color="rgba(198,169,107,0.65)"/>
        </div>
        <div>
          <div style={{
            fontSize:12, fontWeight:600,
            color:"rgba(10,31,68,0.75)",
            marginBottom:3, letterSpacing:"0.005em",
          }}>Estas son tus métricas actuales</div>
          <div style={{
            fontSize:12, color:"rgba(10,31,68,0.55)",
            lineHeight:1.6, fontStyle:"italic",
          }}>Próximamente: histórico mensual, mejor día de la semana, horario óptimo de respuesta del cliente y tendencias.</div>
        </div>
      </div>
    </div>
  );
}

/* ===========================================
   DASHBOARD — usa los 3 componentes nuevos
=========================================== */
// Microcopy editorial premium — se rota por día del año (estable durante el día)
const MF_MICROCOPY = [
  "La claridad reduce fricción.",
  "Pequeñas acciones, grandes resultados.",
  "Lo importante, primero.",
  "Tu día, simplificado.",
  "Decisiones limpias, ventas claras.",
  "Disciplina silenciosa.",
  "Orden antes que velocidad.",
  "La organización también vende.",
];
function getMicrocopyDelDia() {
  const ahora = new Date();
  const inicioAño = new Date(ahora.getFullYear(), 0, 0);
  const diff = ahora - inicioAño;
  const diaDelAño = Math.floor(diff / 86400000);
  return MF_MICROCOPY[diaDelAño % MF_MICROCOPY.length];
}

function Dashboard({leads, setLeads, eventos = [], setEventos, usuario, cuentas = [], setFiltroNav, setSeccion}) {
  // (Variables activos/irA/riesgo/sinC eliminadas: ya no se renderea sidebar de indicadores)

  // Drawer de pendientes + lead seleccionado (modal completo)
  const [drawerPend, setDrawerPend] = useState(false);
  const [drawerRenov, setDrawerRenov] = useState(false);
  const [leadActDash, setLeadActDash] = useState(null);
  function saveDash(d){
    const adminId = getAdminId(usuario);
    const viejo = leads.find(l => l.id === d.id);
    if (!viejo) {
      registrarActividad({ adminId, autor: usuario, tipo: "lead.creado",
        entidad: "lead", entidadId: d.id, entidadNombre: d.nombre });
    } else {
      const diff = diffLead(viejo, d);
      if (diff) registrarActividad({ adminId, autor: usuario, ...diff,
        entidad: "lead", entidadId: d.id, entidadNombre: d.nombre });
    }
    setLeads(p => p.find(l=>l.id===d.id) ? p.map(l=>l.id===d.id?d:l) : [...p, d]);
  }
  function delDash(id){
    const viejo = leads.find(l => l.id === id);
    if (viejo) registrarActividad({ adminId: getAdminId(usuario), autor: usuario,
      tipo: "lead.eliminado", entidad: "lead", entidadId: id, entidadNombre: viejo.nombre });
    setLeads(p => p.filter(l=>l.id!==id));
  }
  function togglePendDash(leadId, pendId){
    const lead = leads.find(l => l.id === leadId);
    const pend = lead?.pendientes?.find(p => p.id === pendId);
    if (lead && pend && !pend.hecho) {
      registrarActividad({ adminId: getAdminId(usuario), autor: usuario,
        tipo: "lead.pendiente_done", entidad: "lead",
        entidadId: leadId, entidadNombre: lead.nombre,
        metadata: { texto: pend.texto } });
    }
    setLeads(p => p.map(l => l.id !== leadId ? l : {
      ...l,
      pendientes: (l.pendientes || []).map(pp => pp.id !== pendId ? pp : {
        ...pp,
        hecho: !pp.hecho,
        fechaCompletado: !pp.hecho ? hoy() : null,
      }),
    }));
  }
  function iniciarSeguimientoPolDash(leadId, polId){
    setLeads(p => p.map(l => l.id !== leadId ? l : {
      ...l,
      polizas: (l.polizas || []).map(pp => pp.id !== polId ? pp : { ...pp, seguimientoIniciado: true }),
    }));
  }

  // ── Prioridades de hoy (lógica sector asegurador/patrimonial) ──
  const cotizandoRiesgos = enCotizacionRiesgos(leads);
  const ahorroPendientes = asesoradosAhorroPendientes(leads);
  const urgentes         = seguimientoUrgente(leads);
  const totalPendientes  = totalPendientesAbiertos(leads);
  const renovaciones     = renovacionesPendientes(leads);

  // Mini-métricas (sidebar derecha)
  const mesAct = hoy().slice(0,7);
  const cierresMes = leads.filter(l => l.etapa === "cierre" && (l.mesCreacion === mesAct || (l.ultimoContacto||"").slice(0,7) === mesAct)).length;

  // ── Saludo dinámico según la hora ──
  const ahora = new Date();
  const hora = ahora.getHours();
  const saludo = hora < 12 ? "Buenos días"
               : hora < 19 ? "Buenas tardes"
               : "Buenas noches";
  const primerNombre = (usuario?.nombre || "").trim().split(/\s+/)[0] || "asesor";
  const fechaLarga = ahora.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
  const fechaLargaCap = fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1);
  const microcopy = getMicrocopyDelDia();

  // (riesgo / sinC eliminadas con la sidebar de indicadores)

  // ── 4 Prioridades de hoy (lógica sector asegurador/patrimonial) ──
  const prioridades = [
    {
      key: "cot_riesgos",
      v: cotizandoRiesgos.length,
      titulo: "En cotización (Riesgos)",
      sub: "Auto · GMM · Hogar · Vida · sin contacto >2 días",
      color: "#dc2626", // red — temperatura caliente
      icon: <IconFlame size={16} color="#dc2626"/>,
      action: ()=>{ setFiltroNav("asesorado"); setSeccion("pipeline"); },
    },
    {
      key: "ahorro",
      v: ahorroPendientes.length,
      titulo: "Asesorados (Ahorro)",
      sub: "Retiro · Ahorro · Inversión · sin contacto >2 semanas",
      color: B.gold,
      icon: <IconDollar size={16} color={B.gold}/>,
      action: ()=>{ setFiltroNav("asesorado"); setSeccion("pipeline"); },
    },
    {
      key: "urgente",
      v: urgentes.length,
      titulo: "Seguimiento urgente",
      sub: "Leads activos en riesgo de perderse",
      color: B.redBright,
      icon: <IconAlertCircle size={16} color={B.redBright}/>,
      action: ()=>{ setFiltroNav("activos"); setSeccion("pipeline"); },
    },
    {
      key: "pendientes",
      v: totalPendientes,
      titulo: "Pendientes",
      sub: "Tareas operativas abiertas en tus leads",
      color: B.navy,
      icon: <IconClock size={16} color={B.navy}/>,
      action: ()=>{ setDrawerPend(true); },
    },
    {
      key: "renovaciones",
      v: renovaciones.length,
      titulo: "Renovaciones pendientes",
      sub: "Pólizas Auto · GMM · Hogar · Vida · renuevan en ≤30 días",
      color: "#7c3aed", // violet — cartera vigente (patrimonial)
      icon: <IconShield size={16} color="#7c3aed"/>,
      action: ()=>{ setDrawerRenov(true); },
    },
  ];

  return <div className="mf-fade-in">
    {/* ═══ Hero: saludo premium banca privada ═══ */}
    <div style={{padding:"4px 0 28px"}}>
      <div style={{fontSize:10.5, fontWeight:500, color:"rgba(10,31,68,0.40)", textTransform:"uppercase", letterSpacing:"0.22em", marginBottom:10}}>
        {fechaLargaCap}
      </div>
      <h1 style={{
        fontFamily:"'Cormorant Garamond', serif",
        fontSize:"clamp(30px, 4.8vw, 42px)",
        fontWeight:500, lineHeight:1.08,
        letterSpacing:"-0.025em",
        color:B.navy,
        margin:"0 0 10px",
      }}>
        {saludo}, {primerNombre}.
      </h1>
      <p style={{
        fontSize:14,
        color:"rgba(10,31,68,0.50)",
        margin:0, fontWeight:400, lineHeight:1.5,
        fontStyle:"italic",
      }}>
        {microcopy}
      </p>

      {/* Discreto "scoreboard" de cierres del mes — solo si hay al menos 1 */}
      {cierresMes > 0 && (
        <div style={{
          marginTop:18, paddingTop:14,
          display:"inline-flex", alignItems:"baseline", gap:10,
          borderTop:"1px solid rgba(10,31,68,0.06)",
          paddingRight:24,
        }}>
          <span style={{
            fontFamily:"'Cormorant Garamond', serif",
            fontSize:32, fontWeight:500, lineHeight:1,
            color:"#059669", letterSpacing:"-0.025em",
            fontVariantNumeric:"tabular-nums",
          }}>{cierresMes}</span>
          <span style={{
            fontSize:10, fontWeight:500,
            color:"rgba(10,31,68,0.50)",
            textTransform:"uppercase", letterSpacing:"0.22em",
          }}>{cierresMes === 1 ? "cierre este mes" : "cierres este mes"}</span>
        </div>
      )}
    </div>

    {/* ═══ PRIORIDADES DE HOY (sector asegurador/patrimonial) ═══ */}
    <div style={{marginBottom:32}}>
      <div style={{
        display:"flex", alignItems:"baseline", justifyContent:"space-between",
        marginBottom:14, flexWrap:"wrap", gap:8,
      }}>
        <div style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:24, fontWeight:500,
          letterSpacing:"-0.015em",
          color:B.navy,
        }}>Prioridades de hoy</div>
        <div style={{
          fontSize:10, fontWeight:500,
          color:"rgba(10,31,68,0.40)",
          textTransform:"uppercase", letterSpacing:"0.18em",
        }}>Acciones recomendadas</div>
      </div>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))",
        gap:14,
      }}>
        {prioridades.map((p, i) => (
          <button
            key={p.key}
            onClick={p.action}
            className={`mf-fade-up mf-stagger-${(i%4)+1}`}
            style={{
              textAlign:"left",
              background:B.white,
              border:"1px solid rgba(10,31,68,0.06)",
              borderRadius:16,
              padding:"22px 22px 20px",
              cursor:"pointer",
              boxShadow:"var(--mf-shadow-xs)",
              transition:"transform var(--mf-t-normal) var(--mf-ease-out), box-shadow var(--mf-t-normal) var(--mf-ease-out), border-color var(--mf-t-fast) var(--mf-ease-out)",
              fontFamily:"'Poppins', sans-serif",
              color:B.navy,
              minHeight:148,
              display:"flex", flexDirection:"column",
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.boxShadow="var(--mf-shadow-md)";
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.borderColor= p.v > 0 ? `${p.color}40` : "rgba(198,169,107,0.20)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.boxShadow="var(--mf-shadow-xs)";
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.borderColor="rgba(10,31,68,0.06)";
            }}>
            {/* Icono + número */}
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12}}>
              <div style={{
                width:36, height:36, borderRadius:10,
                background: p.v > 0 ? `${p.color}10` : "rgba(10,31,68,0.04)",
                border: `1px solid ${p.v > 0 ? `${p.color}25` : "rgba(10,31,68,0.06)"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>{p.icon}</div>
              <div style={{
                fontFamily:"'Cormorant Garamond', serif",
                fontSize:"clamp(38px, 4.5vw, 48px)",
                fontWeight:500, lineHeight:1,
                letterSpacing:"-0.025em",
                color: p.v > 0 ? B.navy : "rgba(10,31,68,0.25)",
                fontVariantNumeric:"tabular-nums",
              }}>{p.v}</div>
            </div>

            {/* Título + descripción */}
            <div>
              <div style={{
                fontSize:13.5, fontWeight:600,
                color:B.navy,
                letterSpacing:"-0.005em",
                marginBottom:4,
              }}>{p.titulo}</div>
              <div style={{
                fontSize:11.5, color:"rgba(10,31,68,0.50)",
                lineHeight:1.45, letterSpacing:"0.005em",
              }}>{p.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>

    {/* (Indicadores eliminados — cierres del mes ahora vive integrado en el saludo arriba) */}

    {/* ═══ Drawer de Pendientes (lista compacta nombre + pendientes) ═══ */}
    {drawerPend && (
      <div
        onClick={(e)=>{ if(e.target===e.currentTarget) setDrawerPend(false); }}
        style={{
          position:"fixed", inset:0, zIndex:1100,
          background:"rgba(10,31,68,0.40)",
          backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
          display:"flex", justifyContent:"flex-end",
          animation:"mfFadeIn .25s var(--mf-ease-out)",
        }}>
        <div style={{
          width:"min(440px, 100%)",
          height:"100%",
          background:"#F8F6F2",
          boxShadow:"-12px 0 40px rgba(10,31,68,0.18)",
          display:"flex", flexDirection:"column",
          animation:"mfSlideInRight .35s var(--mf-ease-spring)",
        }}>
          {/* Header drawer */}
          <div style={{
            padding:"22px 24px 18px",
            borderBottom:"1px solid rgba(10,31,68,0.06)",
            display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:14,
          }}>
            <div>
              <div style={{
                fontSize:10, fontWeight:500,
                color:"rgba(10,31,68,0.40)",
                textTransform:"uppercase", letterSpacing:"0.22em",
                marginBottom:6,
              }}>Tareas operativas</div>
              <div style={{
                fontFamily:"'Cormorant Garamond', serif",
                fontSize:26, fontWeight:500,
                letterSpacing:"-0.015em", color:B.navy, lineHeight:1.1,
              }}>Pendientes</div>
            </div>
            <button onClick={()=>setDrawerPend(false)} style={{
              width:32, height:32, borderRadius:8,
              border:"1px solid rgba(10,31,68,0.08)",
              background:B.white, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(10,31,68,0.55)",
            }}><IconX size={14} color="currentColor"/></button>
          </div>

          {/* Lista scroll */}
          <div style={{flex:1, overflowY:"auto", padding:"14px 18px 24px"}}>
            {(() => {
              const conPend = leadsConPendientes(leads);
              if (conPend.length === 0) {
                return <div style={{
                  textAlign:"center", padding:"60px 20px",
                  color:"rgba(10,31,68,0.50)", fontSize:13,
                }}>
                  <div style={{fontFamily:"'Cormorant Garamond', serif", fontSize:20, color:B.navy, marginBottom:6}}>Sin pendientes</div>
                  Todo al día.
                </div>;
              }
              return conPend.map(l => {
                const abiertos = (l.pendientes || []).filter(p => !p.hecho);
                if (abiertos.length === 0) return null;
                return (
                  <div key={l.id} style={{
                    background:B.white,
                    border:"1px solid rgba(10,31,68,0.06)",
                    borderRadius:14,
                    padding:"14px 16px",
                    marginBottom:10,
                    boxShadow:"var(--mf-shadow-xs)",
                  }}>
                    {/* Nombre cliente → abre LeadModal */}
                    <button onClick={()=>{ setLeadActDash(l); setDrawerPend(false); }} style={{
                      all:"unset", cursor:"pointer", display:"flex", alignItems:"center", gap:8,
                      marginBottom:10, width:"100%",
                    }}>
                      <div style={{
                        width:28, height:28, borderRadius:"50%",
                        background:`${B.navy}10`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:10.5, fontWeight:700, color:B.navy,
                        letterSpacing:"0.04em",
                      }}>{initials(l.nombre)}</div>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{
                          fontSize:13.5, fontWeight:600, color:B.navy,
                          letterSpacing:"-0.005em",
                          whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                        }}>{l.nombre}</div>
                        <div style={{fontSize:10.5, color:"rgba(10,31,68,0.45)", textTransform:"uppercase", letterSpacing:"0.1em"}}>
                          {abiertos.length} pendiente{abiertos.length===1?"":"s"}
                        </div>
                      </div>
                      <IconChevronRight size={14} color="rgba(10,31,68,0.35)"/>
                    </button>

                    {/* Pendientes del lead */}
                    <div style={{display:"flex", flexDirection:"column", gap:6, paddingLeft:36}}>
                      {abiertos.map(p => {
                        const tipoObj = PENDIENTE_TIPOS.find(t => t.v === p.tipo);
                        return (
                          <button key={p.id} onClick={()=>togglePendDash(l.id, p.id)} style={{
                            all:"unset", cursor:"pointer",
                            display:"flex", alignItems:"flex-start", gap:8,
                            padding:"6px 8px", borderRadius:8,
                            background:"rgba(10,31,68,0.02)",
                          }}>
                            <div style={{
                              width:15, height:15, borderRadius:4, marginTop:1,
                              border:"1.5px solid rgba(10,31,68,0.25)",
                              flexShrink:0,
                            }}/>
                            <div style={{flex:1, minWidth:0}}>
                              <div style={{fontSize:12.5, color:B.navy, lineHeight:1.35}}>
                                {tipoObj?.l || p.tipo}{p.texto ? ` · ${p.texto}` : ""}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>
    )}

    {/* ═══ Drawer de Renovaciones (cartera vigente: Auto/GMM/Hogar/Vida ≤30d) ═══ */}
    {drawerRenov && (
      <div
        onClick={(e)=>{ if(e.target===e.currentTarget) setDrawerRenov(false); }}
        style={{
          position:"fixed", inset:0, zIndex:1100,
          background:"rgba(10,31,68,0.40)",
          backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
          display:"flex", justifyContent:"flex-end",
          animation:"mfFadeIn .25s var(--mf-ease-out)",
        }}>
        <div style={{
          width:"min(480px, 100%)",
          height:"100%",
          background:"#F8F6F2",
          boxShadow:"-12px 0 40px rgba(10,31,68,0.18)",
          display:"flex", flexDirection:"column",
          animation:"mfSlideInRight .35s var(--mf-ease-spring)",
        }}>
          {/* Header drawer */}
          <div style={{
            padding:"22px 24px 18px",
            borderBottom:"1px solid rgba(10,31,68,0.06)",
            display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:14,
          }}>
            <div>
              <div style={{
                fontSize:10, fontWeight:500,
                color:"rgba(10,31,68,0.40)",
                textTransform:"uppercase", letterSpacing:"0.22em",
                marginBottom:6,
              }}>Cartera vigente · Próximos 30 días</div>
              <div style={{
                fontFamily:"'Cormorant Garamond', serif",
                fontSize:26, fontWeight:500,
                letterSpacing:"-0.015em", color:B.navy, lineHeight:1.1,
              }}>Renovaciones pendientes</div>
            </div>
            <button onClick={()=>setDrawerRenov(false)} style={{
              width:32, height:32, borderRadius:8,
              border:"1px solid rgba(10,31,68,0.08)",
              background:B.white, cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(10,31,68,0.55)",
            }}><IconX size={14} color="currentColor"/></button>
          </div>

          {/* Lista scroll */}
          <div style={{flex:1, overflowY:"auto", padding:"14px 18px 24px"}}>
            {renovaciones.length === 0 ? (
              <div style={{
                textAlign:"center", padding:"60px 20px",
                color:"rgba(10,31,68,0.50)", fontSize:13,
              }}>
                <div style={{fontFamily:"'Cormorant Garamond', serif", fontSize:20, color:B.navy, marginBottom:6}}>Cartera al día</div>
                Ninguna póliza renueva en los próximos 30 días.
              </div>
            ) : renovaciones.map(({ lead: l, poliza: p, dias }) => {
              const etapaObj = ETAPAS.find(e => e.id === l.etapa) || ETAPAS[0];
              const urgColor = dias <= 7 ? "#dc2626" : dias <= 15 ? B.gold : "#7c3aed";
              return (
                <div key={p.id} style={{
                  background:B.white,
                  border:"1px solid rgba(10,31,68,0.06)",
                  borderRadius:14,
                  padding:"14px 16px",
                  marginBottom:10,
                  boxShadow:"var(--mf-shadow-xs)",
                }}>
                  {/* Header: producto + días restantes */}
                  <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:10}}>
                    <div>
                      <div style={{fontSize:10, color:"rgba(10,31,68,0.45)", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:4}}>
                        {p.producto}{p.numero ? ` · ${p.numero}` : ""}
                      </div>
                      <button onClick={()=>{ setLeadActDash(l); setDrawerRenov(false); }} style={{
                        all:"unset", cursor:"pointer",
                        fontSize:14, fontWeight:600, color:B.navy,
                        letterSpacing:"-0.005em",
                        display:"flex", alignItems:"center", gap:6,
                      }}>
                        {l.nombre}
                        <IconChevronRight size={12} color="rgba(10,31,68,0.40)"/>
                      </button>
                    </div>
                    <div style={{
                      fontFamily:"'Cormorant Garamond', serif",
                      fontSize:28, fontWeight:500, lineHeight:1,
                      color:urgColor, letterSpacing:"-0.025em",
                      textAlign:"right",
                    }}>
                      {dias === 0 ? "Hoy" : dias}
                      {dias > 0 && <span style={{fontSize:10.5, fontFamily:"'Poppins',sans-serif", color:"rgba(10,31,68,0.50)", marginLeft:3, letterSpacing:"0.05em", textTransform:"uppercase"}}>días</span>}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div style={{display:"flex", gap:14, fontSize:11.5, color:"rgba(10,31,68,0.55)", flexWrap:"wrap", marginBottom:10}}>
                    {p.fechaRenovacion && <div>Renueva <strong style={{color:B.navy, fontWeight:500}}>{fmtF(p.fechaRenovacion)}</strong></div>}
                    {p.primaAprox > 0 && <div>Prima ≈ <strong style={{color:B.navy, fontWeight:500}}>${Number(p.primaAprox).toLocaleString("es-MX")}</strong></div>}
                    <div>Estatus <strong style={{color:etapaObj.color, fontWeight:500}}>{etapaObj.label}</strong></div>
                  </div>

                  {/* Acciones */}
                  <div style={{display:"flex", gap:6}}>
                    <button onClick={()=>iniciarSeguimientoPolDash(l.id, p.id)} style={{
                      all:"unset", cursor:"pointer",
                      flex:1, textAlign:"center",
                      padding:"8px 10px", borderRadius:8,
                      background:"linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
                      color:"#fff",
                      fontSize:11.5, fontWeight:500,
                      letterSpacing:"0.01em",
                    }}>Iniciar seguimiento</button>
                    {l.telefono && (
                      <a href={`https://wa.me/52${(l.telefono||"").replace(/\D/g,"")}`}
                         target="_blank" rel="noreferrer"
                         style={{
                           textDecoration:"none",
                           padding:"8px 12px", borderRadius:8,
                           background:"rgba(37,211,102,0.10)",
                           color:"#1f7d3b",
                           border:"1px solid rgba(37,211,102,0.25)",
                           fontSize:11.5, fontWeight:500,
                           letterSpacing:"0.01em",
                           display:"flex", alignItems:"center",
                         }}>
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}

    {/* LeadModal abierto desde el drawer (info completa del cliente) */}
    {leadActDash && (
      <LeadModal
        lead={leadActDash}
        onClose={()=>setLeadActDash(null)}
        onSave={saveDash}
        onDelete={delDash}
        cuentas={cuentas}
        usuario={usuario}
        setEventos={setEventos}
      />
    )}
  </div>;
}

function LeadCard({lead,onClick,onContacto}) {
  const etapa=ETAPAS.find(e=>e.id===lead.etapa)||ETAPAS[0];
  const alerts=getAlertas(lead);
  const sinSeg=lead.sinSeguimiento||lead.checklist?.noInteres;
  const estadoOp = getEstadoOportunidad(lead);
  return <div onClick={()=>onClick(lead)}
    style={{
      background: sinSeg ? "rgba(220,38,38,0.03)" : B.white,
      border: `1px solid ${sinSeg ? "rgba(220,38,38,0.15)" : "rgba(10,31,68,0.06)"}`,
      borderRadius: 12,
      padding: "13px 14px 12px",
      cursor: "pointer",
      marginBottom: 8,
      boxShadow: "var(--mf-shadow-xs)",
      transition: "box-shadow var(--mf-t-normal) var(--mf-ease-out), transform var(--mf-t-normal) var(--mf-ease-out), border-color var(--mf-t-fast) var(--mf-ease-out)",
      position: "relative",
    }}
    onMouseEnter={e=>{
      e.currentTarget.style.boxShadow = "var(--mf-shadow-sm)";
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.borderColor = sinSeg ? "rgba(220,38,38,0.25)" : "rgba(198,169,107,0.20)";
    }}
    onMouseLeave={e=>{
      e.currentTarget.style.boxShadow = "var(--mf-shadow-xs)";
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.borderColor = sinSeg ? "rgba(220,38,38,0.15)" : "rgba(10,31,68,0.06)";
    }}>
    {/* Línea de color de etapa lateral, muy delgada */}
    <div style={{
      position: "absolute", left: 0, top: 10, bottom: 10, width: 2,
      background: sinSeg ? B.redBright : etapa.color,
      borderRadius: "0 2px 2px 0",
      opacity: 0.55,
    }}/>

    {/* Header: nombre + producto */}
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:5, paddingLeft:6}}>
      <div style={{flex:1, minWidth:0}}>
        <div style={{display:"flex", alignItems:"center", gap:7, marginBottom:2}}>
          {sinSeg && (
            <span style={{display:"inline-flex", color:B.redBright, flexShrink:0}}>
              <IconMinusCircle size={12}/>
            </span>
          )}
          <div style={{
            fontWeight:600, fontSize:13.5,
            color: sinSeg ? B.redBright : B.navy,
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
            letterSpacing:"-0.005em",
          }}>{lead.nombre}</div>
        </div>
        <div style={{fontSize:11, color:"rgba(10,31,68,0.45)", fontWeight:400}}>
          {lead.estado || "—"}{lead.edad ? ` · ${lead.edad} años` : ""}
        </div>
      </div>
      {!sinSeg && lead.producto && (
        <span style={{
          fontSize:10, fontWeight:500,
          color: etapa.color,
          background: etapa.color+"0e",
          border: `1px solid ${etapa.color}25`,
          padding: "2px 8px", borderRadius: 6,
          whiteSpace: "nowrap", flexShrink: 0,
          letterSpacing: "0.005em",
        }}>{lead.producto}</span>
      )}
    </div>

    {/* Estado de oportunidad + Referido (badges premium) */}
    {!sinSeg && (estadoOp || lead.esReferido) && (
      <div style={{display:"flex", flexWrap:"wrap", gap:5, marginBottom:6, paddingLeft:6}}>
        {estadoOp && <BadgeEstado estado={estadoOp} size="xs"/>}
        {lead.esReferido && <BadgeReferido size="xs"/>}
      </div>
    )}

    {/* Alertas (puntos coloreados + texto sutil, sin animaciones bruscas) */}
    {!sinSeg && alerts.length > 0 && (
      <div style={{display:"flex", flexWrap:"wrap", gap:8, marginBottom:6, paddingLeft:6}}>
        {alerts.map((a,i)=>(
          <span key={i} style={{
            display:"inline-flex", alignItems:"center", gap:5,
            fontSize:10, color:a.color, fontWeight:500,
            letterSpacing:"0.005em",
          }}>
            <span style={{
              width:5, height:5, borderRadius:"50%",
              background:a.color,
              animation: a.tipo === "riesgo" ? "mfPulseDot 1.6s var(--mf-ease-out) infinite" : "none",
            }}/>
            {a.msg}
          </span>
        ))}
      </div>
    )}

    {/* Footer: último contacto + botón contactar */}
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", paddingLeft:6, marginTop:2}}>
      <div style={{fontSize:10, color:"rgba(10,31,68,0.35)", fontWeight:400, letterSpacing:"0.01em"}}>
        Último contacto · {fmtF(lead.ultimoContacto)}
      </div>
      {!sinSeg && (
        <button onClick={e=>{e.stopPropagation(); onContacto(lead);}}
          style={{
            display:"inline-flex", alignItems:"center", gap:5,
            padding:"5px 11px", borderRadius:8,
            border:`1px solid rgba(10,31,68,0.08)`,
            background:"transparent",
            cursor:"pointer",
            fontSize:11, color:B.navy, fontWeight:500,
            fontFamily:"'Poppins',sans-serif",
            transition: "all var(--mf-t-fast) var(--mf-ease-out)",
          }}
          onMouseEnter={e=>{
            e.currentTarget.style.background = "rgba(10,31,68,0.04)";
            e.currentTarget.style.borderColor = "rgba(198,169,107,0.30)";
          }}
          onMouseLeave={e=>{
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "rgba(10,31,68,0.08)";
          }}>
          <IconPhoneCall size={12} color={B.navy}/>
          Contactar
        </button>
      )}
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

function LeadModal({lead,onClose,onSave,onDelete,cuentas,usuario,setEventos}) {
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
    let payload = { ...f, ultimoContacto: hoy(),
      ultimaActualizacion: { por: usuario?.nombre||"", rol: usuario?.rol||"", fecha: hoy() } };

    // Auto-acciones cuando estado=en_pausa con fecha: crear evento + pendiente
    const pausaCambio = f.estadoOportunidad === "en_pausa"
      && f.pausaHasta
      && (lead?.estadoOportunidad !== "en_pausa" || lead?.pausaHasta !== f.pausaHasta);
    if (pausaCambio) {
      // 1) Agregar pendiente operativo "Retomar seguimiento"
      const yaTienePend = (f.pendientes || []).some(p =>
        !p.hecho && p.tipo === "otro" && (p.texto||"").startsWith("Retomar")
      );
      if (!yaTienePend) {
        payload = {
          ...payload,
          pendientes: [
            ...(f.pendientes || []),
            { id: uid(), tipo: "otro",
              texto: `Retomar seguimiento el ${fmtF(f.pausaHasta)}`,
              hecho: false, fechaCreacion: hoy(), fechaCompletado: null },
          ],
        };
      }
      // 2) Crear evento en Agenda (si el contenedor proveyó setEventos)
      if (typeof setEventos === "function") {
        const nuevoEvento = {
          id: uid(),
          titulo: `Retomar seguimiento · ${f.nombre || "Lead"}`,
          tipo: "cita", subtipo: "seguimiento",
          fechaInicio: f.pausaHasta, fechaFin: f.pausaHasta, fecha: f.pausaHasta,
          horaInicio: "10:00", horaFin: "10:30",
          repeticion: "none", nota: "Auto-agendado por estado En pausa.",
          leadId: f.id,
          agendadoPor: usuario?.nombre || "",
          recordatorioCot: false,
        };
        setEventos(p => [...(p||[]), nuevoEvento]);
      }
    }

    onSave(payload);
    onClose();
  }
  const pendActivos = (f.pendientes||[]).filter(p=>!p.hecho).length;
  const pendLabel = pendActivos > 0 ? `Pendientes (${pendActivos})` : "Pendientes";
  const polizasN = (f.polizas||[]).length;
  const polizaLabel = polizasN > 0 ? `Póliza (${polizasN})` : "Póliza";
  const TABS_ADMIN=[{v:"info",l:"Info"},{v:"poliza",l:polizaLabel},{v:"etapa",l:"Etapa"},{v:"pendientes",l:pendLabel},{v:"checklist",l:"Seguimiento"},{v:"historial",l:`Historial (${(f.seguimientos||[]).length})`},{v:"estrategia",l:"Estrategia"}];
  const TABS_ASIST=[{v:"pendientes",l:pendLabel},{v:"poliza",l:polizaLabel},{v:"checklist",l:"Seguimiento"},{v:"historial",l:`Historial (${(f.seguimientos||[]).length})`},{v:"info",l:"Info"}];
  const TABS=esAsistente?TABS_ASIST:TABS_ADMIN;

  // Pendientes operativos del lead
  const [nuevoPendTipo, setNuevoPendTipo] = useState("cotizacion");
  const [nuevoPendTexto, setNuevoPendTexto] = useState("");
  function agregarPendiente() {
    const tipo = PENDIENTE_TIPOS.find(p => p.v === nuevoPendTipo);
    const texto = nuevoPendTexto.trim() || tipo?.l || "Pendiente";
    const nuevo = {
      id: uid(),
      tipo: nuevoPendTipo,
      texto,
      hecho: false,
      fechaCreacion: hoy(),
      fechaCompletado: null,
    };
    setF(p => ({ ...p, pendientes: [...(p.pendientes||[]), nuevo] }));
    setNuevoPendTexto("");
  }
  function togglePendiente(id) {
    setF(p => ({
      ...p,
      pendientes: (p.pendientes||[]).map(x =>
        x.id === id ? { ...x, hecho: !x.hecho, fechaCompletado: !x.hecho ? hoy() : null } : x
      ),
    }));
  }
  function eliminarPendiente(id) {
    setF(p => ({ ...p, pendientes: (p.pendientes||[]).filter(x => x.id !== id) }));
  }

  // Pólizas de cartera (Auto/GMM/Hogar/Vida con fecha de renovación)
  const [polForm, setPolForm] = useState({
    producto: POLIZA_PRODUCTOS[0], numero: "", fechaInicio: "",
    fechaRenovacion: "", primaAprox: "", notas: "",
  });
  function agregarPoliza() {
    if (!polForm.numero.trim() && !polForm.fechaRenovacion) return;
    const nueva = {
      id: uid(),
      producto: polForm.producto,
      numero: polForm.numero.trim(),
      fechaInicio: polForm.fechaInicio || null,
      fechaRenovacion: polForm.fechaRenovacion || null,
      primaAprox: polForm.primaAprox ? Number(polForm.primaAprox) || 0 : 0,
      notas: polForm.notas.trim(),
      seguimientoIniciado: false,
      fechaCreacion: hoy(),
    };
    setF(p => ({ ...p, polizas: [...(p.polizas||[]), nueva] }));
    setPolForm({ producto: POLIZA_PRODUCTOS[0], numero: "", fechaInicio: "", fechaRenovacion: "", primaAprox: "", notas: "" });
  }
  function toggleSeguimientoPoliza(id) {
    setF(p => ({
      ...p,
      polizas: (p.polizas||[]).map(x =>
        x.id === id ? { ...x, seguimientoIniciado: !x.seguimientoIniciado } : x
      ),
    }));
  }
  function eliminarPoliza(id) {
    setF(p => ({ ...p, polizas: (p.polizas||[]).filter(x => x.id !== id) }));
  }

  const asistentes=(cuentas||[]).filter(c=>c.rol==="asistente"&&c.adminId===(usuario.rol==="superadmin"?c.adminId:usuario.id));
  const tipoColor={llamada:B.blue,whatsapp:"#25d366",visita:B.purple,correo:B.amber,nota:"#9ca3af"};

  const estadoOpLead = getEstadoOportunidad(f);

  // Estados nuevos para vista vertical premium
  const [infoExpandida, setInfoExpandida] = useState(false);
  const [historialCompleto, setHistorialCompleto] = useState(false);
  const [polForm2Abierto, setPolForm2Abierto] = useState(false);
  const [masAccionesAbierto, setMasAccionesAbierto] = useState(false);
  const [sugIgnorada, setSugIgnorada] = useState(false);

  // Algoritmo de sugerencia de etapa basado en patrones del checklist
  function sugerirEtapaSiguiente() {
    if (sugIgnorada) return null;
    if (f.sinSeguimiento) return null;
    const chk = f.checklist || {};
    const tieneCita = (f.seguimientos||[]).some(s => /cita|agenda/i.test(s.texto||""));
    // Nuevo + algún contacto → Contactado/Seguimiento
    if (f.etapa === "nuevo" && (chk.wa1 || chk.call1 || chk.email)) {
      return { id: "seguimiento", razon: "Detectamos contacto inicial." };
    }
    // Seguimiento + cita en historial → Cita
    if (f.etapa === "seguimiento" && tieneCita) {
      return { id: "cita", razon: "Hay cita registrada en el historial." };
    }
    // Cita + WhatsApp/llamada después → Asesorado
    if (f.etapa === "cita" && (chk.wa2 || chk.call2)) {
      return { id: "asesorado", razon: "Hubo seguimiento posterior a la cita." };
    }
    return null;
  }
  const sugerencia = sugerirEtapaSiguiente();

  // Cadencia de contacto (compacta) — 5 pasos basados en checklist
  const cadencia = [
    { v: "email",  l: "Correo inicial",   done: !!f.checklist?.email },
    { v: "call1",  l: "Primera llamada",  done: !!f.checklist?.call1 },
    { v: "wa1",    l: "WhatsApp inicial", done: !!f.checklist?.wa1 },
    { v: "wa2",    l: "Segundo intento",  done: !!f.checklist?.wa2 },
    { v: "call2",  l: "Reactivación",     done: !!f.checklist?.call2 },
  ];
  function toggleCadencia(v) { setChk(v, !f.checklist?.[v]); }

  // Etapas visibles del pipeline (no incluye terminales sinSeg)
  const ETAPAS_PIPE = ETAPAS.filter(e => !e.sinSeg && e.id !== "no_localiz");

  return <MFModal onClose={onClose} width={720}>
    {/* ═══ HEADER PREMIUM EDITORIAL ═══ */}
    <div style={{
      display:"flex", alignItems:"flex-start", gap:14, marginBottom:18,
      paddingBottom:18, borderBottom:"1px solid rgba(10,31,68,0.06)",
    }}>
      <div style={{
        width:48, height:48, borderRadius:"50%", flexShrink:0,
        background:"rgba(10,31,68,0.05)",
        border:"1px solid rgba(10,31,68,0.08)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:14, fontWeight:600, color:B.navy, letterSpacing:"-0.005em",
      }}>{initials(f.nombre||"--")}</div>
      <div style={{flex:1, minWidth:0}}>
        <h2 style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:"clamp(22px, 4.5vw, 28px)", fontWeight:500,
          color:B.navy, letterSpacing:"-0.02em",
          margin:0, lineHeight:1.1,
          overflow:"hidden", textOverflow:"ellipsis",
        }}>{f.nombre || "Nuevo lead"}</h2>
        <div style={{display:"flex", alignItems:"center", gap:7, flexWrap:"wrap", marginTop:6, fontSize:12, color:"rgba(10,31,68,0.55)"}}>
          <span>{f.producto || "—"}</span>
          {f.estado && <><span style={{opacity:0.4}}>·</span><span>{f.estado}</span></>}
          {f.edad && <><span style={{opacity:0.4}}>·</span><span>{f.edad} años</span></>}
          {estadoOpLead && <BadgeEstado estado={estadoOpLead} size="xs"/>}
          {f.esReferido && <BadgeReferido size="xs"/>}
        </div>
      </div>
      <button onClick={onClose} style={{
        width:30, height:30, borderRadius:8,
        border:"1px solid rgba(10,31,68,0.08)",
        background:B.white, cursor:"pointer", flexShrink:0,
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"rgba(10,31,68,0.55)",
      }}><IconX size={13} color="currentColor"/></button>
    </div>

    {/* ═══ ACCIONES RÁPIDAS ═══ */}
    <div style={{display:"flex", gap:6, marginBottom:18, flexWrap:"wrap"}}>
      {f.telefono && (
        <button onClick={()=>setWam(true)} style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"8px 13px", borderRadius:8, border:"1px solid rgba(37,211,102,0.25)",
          background:"rgba(37,211,102,0.06)", color:"#1f7d3b",
          fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:11.5,
          cursor:"pointer", letterSpacing:"0.01em",
        }}>
          <svg width={12} height={12} viewBox="0 0 24 24" fill="#1f7d3b"><path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411zM12.05 21.785h-.003a9.876 9.876 0 01-5.03-1.378l-.36-.214-3.744.982 1-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c0-5.45 4.437-9.884 9.893-9.884 2.641 0 5.124 1.03 6.99 2.898a9.825 9.825 0 012.893 6.994c-.004 5.45-4.434 9.884-9.885 9.884z"/></svg>
          WhatsApp
        </button>
      )}
      {f.telefono && (
        <a href={`tel:${f.telefono}`} style={{textDecoration:"none"}}>
          <button style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"8px 13px", borderRadius:8, border:"1px solid rgba(10,31,68,0.08)",
            background:B.white, color:B.navy,
            fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:11.5,
            cursor:"pointer", letterSpacing:"0.01em",
          }}>
            <IconPhoneCall size={12} color={B.navy}/>
            Llamar
          </button>
        </a>
      )}
      {f.correo && (
        <a href={`mailto:${f.correo}`} style={{textDecoration:"none"}}>
          <button style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"8px 13px", borderRadius:8, border:"1px solid rgba(10,31,68,0.08)",
            background:B.white, color:B.navy,
            fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:11.5,
            cursor:"pointer", letterSpacing:"0.01em",
          }}>
            <IconMail size={12} color={B.navy}/>
            Correo
          </button>
        </a>
      )}
      <button onClick={()=>{
        if (typeof setEventos === "function") {
          const evt = { id: uid(), titulo: `Cita · ${f.nombre || "Lead"}`,
            tipo: "cita", subtipo: "info1",
            fechaInicio: hoy(), fechaFin: hoy(), fecha: hoy(),
            horaInicio: "10:00", horaFin: "11:00",
            repeticion: "none", nota: "Creado desde lead.",
            leadId: f.id, agendadoPor: usuario?.nombre || "",
            recordatorioCot: false };
          setEventos(p => [...(p||[]), evt]);
          setF(p => ({ ...p, seguimientos: [
            { id: uid(), fecha: hoy(), texto: "Cita agendada desde lead", tipo: "nota", autor: usuario?.nombre||"", rol: usuario?.rol||"", _auto: true },
            ...(p.seguimientos||[])
          ]}));
        }
      }} style={{
        display:"inline-flex", alignItems:"center", gap:6,
        padding:"8px 13px", borderRadius:8, border:"1px solid rgba(10,31,68,0.08)",
        background:B.white, color:B.navy,
        fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:11.5,
        cursor:"pointer", letterSpacing:"0.01em",
      }}>
        <IconCalendar size={12} color={B.navy}/>
        Agendar
      </button>

      {/* Más acciones (dropdown) */}
      <div style={{position:"relative"}}>
        <button onClick={()=>setMasAccionesAbierto(o=>!o)} style={{
          display:"inline-flex", alignItems:"center", gap:6,
          padding:"8px 13px", borderRadius:8, border:"1px solid rgba(10,31,68,0.08)",
          background:B.white, color:"rgba(10,31,68,0.65)",
          fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:11.5,
          cursor:"pointer", letterSpacing:"0.01em",
        }}>
          Más
          <span style={{fontSize:9, lineHeight:1}}>▾</span>
        </button>
        {masAccionesAbierto && (
          <div onClick={e=>e.stopPropagation()} style={{
            position:"absolute", top:38, right:0, zIndex:50,
            width:200, background:"#F8F6F2",
            border:"1px solid rgba(10,31,68,0.08)", borderRadius:12,
            boxShadow:"0 12px 30px rgba(10,31,68,0.14)",
            overflow:"hidden", animation:"mfFadeUp .18s var(--mf-ease-spring)",
          }}>
            <button onClick={()=>{setHistorialCompleto(true); setMasAccionesAbierto(false);}} style={{
              all:"unset", cursor:"pointer", display:"block", width:"100%",
              padding:"10px 14px", fontSize:12, color:B.navy, letterSpacing:"0.005em",
              borderBottom:"1px solid rgba(10,31,68,0.04)",
            }}>Ver historial completo</button>
            <button onClick={()=>{toggleSinSeg(); setMasAccionesAbierto(false);}} style={{
              all:"unset", cursor:"pointer", display:"block", width:"100%",
              padding:"10px 14px", fontSize:12, color: f.sinSeguimiento ? "#059669" : B.navy,
              letterSpacing:"0.005em",
              borderBottom:"1px solid rgba(10,31,68,0.04)",
            }}>{f.sinSeguimiento ? "Reactivar lead" : "Marcar sin seguimiento"}</button>
            {!esAsistente && (
              <button onClick={()=>{setConfirmDel(true); setMasAccionesAbierto(false);}} style={{
                all:"unset", cursor:"pointer", display:"block", width:"100%",
                padding:"10px 14px", fontSize:12, color:"#dc2626", letterSpacing:"0.005em",
              }}>Eliminar lead</button>
            )}
          </div>
        )}
      </div>
    </div>

    {/* ═══ SUGERENCIA MARFLOW ═══ */}
    {sugerencia && (() => {
      const etL = ETAPAS.find(e => e.id === sugerencia.id)?.label || sugerencia.id;
      return (
        <div style={{
          background:"linear-gradient(135deg, rgba(198,169,107,0.06), rgba(10,31,68,0.03))",
          border:"1px solid rgba(198,169,107,0.20)",
          borderRadius:12, padding:"12px 14px", marginBottom:16,
          display:"flex", alignItems:"center", gap:12, flexWrap:"wrap",
        }}>
          <div style={{
            width:30, height:30, borderRadius:"50%", flexShrink:0,
            background:"rgba(198,169,107,0.15)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}><IconStar size={13} color="#8b7340"/></div>
          <div style={{flex:1, minWidth:140}}>
            <div style={{fontSize:10, fontWeight:500, color:"rgba(10,31,68,0.45)", textTransform:"uppercase", letterSpacing:"0.18em", marginBottom:2}}>MarFlow sugiere</div>
            <div style={{fontSize:12.5, color:B.navy, lineHeight:1.4}}>
              Mover a <strong style={{fontWeight:600}}>{etL.replace(/[¡⭐!]/g,"").trim()}</strong> · <span style={{color:"rgba(10,31,68,0.55)"}}>{sugerencia.razon}</span>
            </div>
          </div>
          <div style={{display:"flex", gap:6, flexShrink:0}}>
            <button onClick={()=>{cambiarEtapa(sugerencia.id);}} style={{
              padding:"7px 14px", borderRadius:8, border:"none",
              background:"linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
              color:"#fff", fontFamily:"'Poppins',sans-serif", fontSize:11.5, fontWeight:600, cursor:"pointer",
            }}>Confirmar</button>
            <button onClick={()=>setSugIgnorada(true)} style={{
              padding:"7px 12px", borderRadius:8,
              border:"1px solid rgba(10,31,68,0.08)",
              background:"#fff", color:"rgba(10,31,68,0.55)",
              fontFamily:"'Poppins',sans-serif", fontSize:11.5, fontWeight:500, cursor:"pointer",
            }}>Ignorar</button>
          </div>
        </div>
      );
    })()}

    {/* ═══ PIPELINE VISUAL HORIZONTAL ═══ */}
    {!f.sinSeguimiento && (() => {
      const etapaIdx = ETAPAS_PIPE.findIndex(e => e.id === f.etapa);
      return (
        <div style={{marginBottom:20}}>
          <div style={{
            fontSize:10, fontWeight:500,
            color:"rgba(10,31,68,0.40)",
            textTransform:"uppercase", letterSpacing:"0.18em",
            marginBottom:10,
          }}>Pipeline</div>
          <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
            {ETAPAS_PIPE.map((et, i) => {
              const active = f.etapa === et.id;
              const pasado = etapaIdx >= 0 && i < etapaIdx;
              const color = active ? et.color : pasado ? "rgba(10,31,68,0.55)" : "rgba(10,31,68,0.30)";
              return (
                <button key={et.id} onClick={()=>cambiarEtapa(et.id)} style={{
                  all:"unset", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:6,
                  padding:"7px 11px", borderRadius:8,
                  background: active ? `${et.color}10` : "transparent",
                  border: `1px solid ${active ? `${et.color}40` : "rgba(10,31,68,0.06)"}`,
                  transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                }}>
                  <span style={{
                    width:18, height:18, borderRadius:"50%",
                    background: active ? et.color : pasado ? "rgba(10,31,68,0.40)" : "transparent",
                    border: pasado ? "none" : `1.5px solid ${active ? et.color : "rgba(10,31,68,0.20)"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    flexShrink:0,
                  }}>
                    {pasado && <IconCheck size={9} color="#fff"/>}
                  </span>
                  <span style={{
                    fontSize:11.5, fontWeight: active ? 600 : 500,
                    color, letterSpacing:"0.005em", whiteSpace:"nowrap",
                  }}>{et.label.replace(/[¡⭐!]/g, "").trim()}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    })()}

    {/* Banner sin seguimiento sin emoji */}
    {f.sinSeguimiento && (
      <div style={{background:"rgba(220,38,38,0.04)",border:"1px solid rgba(220,38,38,0.18)",borderRadius:10,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <IconMinusCircle size={18} color={B.redBright}/>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:B.redBright}}>Sin seguimiento</div>
            <div style={{fontSize:11,color:"rgba(10,31,68,0.55)"}}>No interesado / perdido definitivo</div>
          </div>
        </div>
        <button onClick={toggleSinSeg}
          style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${B.green}40`,background:"transparent",color:B.green,fontFamily:"'Poppins',sans-serif",fontWeight:500,fontSize:12,cursor:"pointer"}}>
          Reactivar
        </button>
      </div>
    )}

    {/* (Tabs removidas — vista única vertical) */}

    {/* Alertas con dots y mfPulseDot solo en riesgo */}
    {!f.sinSeguimiento && alerts.map((a,i)=>(
      <div key={i} style={{
        background: a.color + "0a",
        border: `1px solid ${a.color}22`,
        borderRadius:9, padding:"9px 13px", marginBottom:8,
        fontSize:12, color:a.color, fontWeight:500,
        display:"inline-flex", alignItems:"center", gap:8,
        letterSpacing:"0.005em",
      }}>
        <span style={{
          width:6, height:6, borderRadius:"50%", background:a.color,
          animation: a.tipo === "riesgo" ? "mfPulseDot 1.6s var(--mf-ease-out) infinite" : "none",
        }}/>
        {a.msg}
      </div>
    ))}
    {/* (Tab "Etapa" removida — ahora pipeline visual horizontal arriba) */}
    {/* (Info / Estado / Estrategia movidos al bloque "Información completa" colapsable al final) */}
    {!f.sinSeguimiento && (
      <div style={{marginBottom:20}}>
        <div style={{
          fontSize:11, fontWeight:500,
          color:"rgba(10,31,68,0.45)",
          textTransform:"uppercase", letterSpacing:"0.12em",
          marginBottom:14,
        }}>Tareas operativas pendientes</div>

        {/* Agregar pendiente */}
        <div style={{display:"flex", gap:8, marginBottom:18, flexWrap:"wrap"}}>
          <div style={{minWidth:170}}>
            <Sel value={nuevoPendTipo} onChange={setNuevoPendTipo}
              options={PENDIENTE_TIPOS.map(p => ({ v:p.v, l:p.l }))}/>
          </div>
          <div style={{flex:1, minWidth:180}}>
            <Inp value={nuevoPendTexto} onChange={setNuevoPendTexto}
              placeholder="Detalle opcional…"
              onKeyDown={e=>e.key==="Enter"&&agregarPendiente()}/>
          </div>
          <button onClick={agregarPendiente}
            style={{
              display:"inline-flex", alignItems:"center", justifyContent:"center", gap:5,
              padding:"0 14px", minHeight:44, borderRadius:8, border:"none",
              background:"linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
              color:"#fff",
              fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:12.5,
              cursor:"pointer",
              boxShadow:"0 1px 2px rgba(10,31,68,0.10)",
              transition:"all var(--mf-t-fast) var(--mf-ease-out)",
            }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 14px rgba(10,31,68,0.20)"; e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 2px rgba(10,31,68,0.10)"; e.currentTarget.style.transform="translateY(0)";}}>
            <IconPlus size={13} color="#fff"/>
          </button>
        </div>

        {/* Lista de pendientes */}
        {(f.pendientes||[]).length === 0 ? (
          <div style={{
            fontSize:13, color:"rgba(10,31,68,0.30)",
            textAlign:"center", padding:"32px 0",
            fontStyle:"italic", letterSpacing:"0.01em",
          }}>Sin pendientes para este lead</div>
        ) : (
          <div>
            {(f.pendientes||[]).map(p => {
              const tipo = PENDIENTE_TIPOS.find(t => t.v === p.tipo) || PENDIENTE_TIPOS[7];
              return (
                <div key={p.id} style={{
                  display:"flex", alignItems:"flex-start", gap:11,
                  padding:"12px 14px",
                  borderRadius:10,
                  background: p.hecho ? "rgba(22,101,52,0.04)" : B.white,
                  border: `1px solid ${p.hecho ? "rgba(22,101,52,0.20)" : "rgba(10,31,68,0.06)"}`,
                  marginBottom:8,
                  transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                }}>
                  <button onClick={()=>togglePendiente(p.id)}
                    aria-label={p.hecho ? "Marcar como pendiente" : "Marcar como hecho"}
                    style={{
                      width:20, height:20, borderRadius:5, marginTop:1,
                      border:`1.5px solid ${p.hecho ? B.green : "rgba(10,31,68,0.20)"}`,
                      background: p.hecho ? B.green : "transparent",
                      cursor:"pointer", flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                    }}>
                    {p.hecho && <IconCheck size={12} color="#fff"/>}
                  </button>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{
                      fontSize:13.5, fontWeight: p.hecho ? 400 : 600,
                      color: p.hecho ? "rgba(10,31,68,0.45)" : B.navy,
                      letterSpacing:"-0.005em",
                      textDecoration: p.hecho ? "line-through" : "none",
                      marginBottom:3,
                    }}>{p.texto}</div>
                    <div style={{
                      display:"inline-flex", alignItems:"center", gap:7,
                      fontSize:10.5, color:"rgba(10,31,68,0.45)",
                    }}>
                      <span style={{
                        padding:"1px 7px", borderRadius:5,
                        background:"rgba(10,31,68,0.04)",
                        fontWeight:500, letterSpacing:"0.01em",
                      }}>{tipo.l}</span>
                      <span style={{opacity:0.5}}>·</span>
                      <span>creado {fmtF(p.fechaCreacion)}</span>
                      {p.hecho && p.fechaCompletado && (
                        <>
                          <span style={{opacity:0.5}}>·</span>
                          <span style={{color:B.green}}>hecho {fmtF(p.fechaCompletado)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={()=>eliminarPendiente(p.id)}
                    aria-label="Eliminar pendiente"
                    style={{
                      width:24, height:24, borderRadius:6,
                      background:"transparent",
                      border:"1px solid transparent",
                      color:"rgba(10,31,68,0.35)",
                      cursor:"pointer", flexShrink:0,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(220,38,38,0.20)"; e.currentTarget.style.background="rgba(220,38,38,0.04)"; e.currentTarget.style.color=B.redBright;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent"; e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(10,31,68,0.35)";}}>
                    <IconX size={11}/>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}
    {!f.sinSeguimiento && (
      <div style={{marginBottom:20}}>
        <div style={{
          fontSize:11, fontWeight:500,
          color:"rgba(10,31,68,0.45)",
          textTransform:"uppercase", letterSpacing:"0.12em",
          marginBottom:14,
        }}>Cartera vigente · Auto · GMM · Hogar · Vida</div>

        {/* Form alta de póliza */}
        <div style={{
          background:"#FBFAF6",
          border:"1px solid rgba(10,31,68,0.06)",
          borderRadius:12,
          padding:"14px 14px 10px",
          marginBottom:18,
        }}>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:10, marginBottom:10}}>
            <FL label="Producto">
              <Sel value={polForm.producto}
                onChange={v=>setPolForm(p=>({...p,producto:v}))}
                options={POLIZA_PRODUCTOS.map(p=>({v:p,l:p}))}/>
            </FL>
            <FL label="No. Póliza">
              <Inp value={polForm.numero}
                onChange={v=>setPolForm(p=>({...p,numero:v}))}
                placeholder="Ej. 12345678"/>
            </FL>
            <FL label="Inicio vigencia">
              <Inp type="date" value={polForm.fechaInicio}
                onChange={v=>setPolForm(p=>({...p,fechaInicio:v}))}/>
            </FL>
            <FL label="Renovación">
              <Inp type="date" value={polForm.fechaRenovacion}
                onChange={v=>setPolForm(p=>({...p,fechaRenovacion:v}))}/>
            </FL>
            <FL label="Prima aprox. (MXN)">
              <Inp type="number" value={polForm.primaAprox}
                onChange={v=>setPolForm(p=>({...p,primaAprox:v}))}
                placeholder="0"/>
            </FL>
            <FL label="Notas">
              <Inp value={polForm.notas}
                onChange={v=>setPolForm(p=>({...p,notas:v}))}
                placeholder="Coberturas, etc."/>
            </FL>
          </div>
          <button onClick={agregarPoliza} style={{
            width:"100%", padding:"10px 14px", borderRadius:8, border:"none",
            background:"linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
            color:"#fff", fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:13,
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6,
            transition:"all var(--mf-t-fast) var(--mf-ease-out)",
          }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 14px rgba(10,31,68,0.20)"; e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="translateY(0)";}}>
            <IconPlus size={13} color="#fff"/> Agregar póliza
          </button>
        </div>

        {/* Lista de pólizas */}
        {(f.polizas||[]).length === 0 ? (
          <div style={{
            textAlign:"center", padding:"36px 16px",
            color:"rgba(10,31,68,0.45)",
            fontFamily:"'Cormorant Garamond', serif", fontSize:18,
            fontStyle:"italic",
          }}>Aún sin pólizas registradas para este cliente.</div>
        ) : (
          <div style={{display:"flex", flexDirection:"column", gap:10}}>
            {(f.polizas||[]).map(p => {
              const dias = diasParaFecha(p.fechaRenovacion);
              const renovUrg = dias !== null && dias >= 0 && dias <= 30;
              const renovVencida = dias !== null && dias < 0;
              const renovColor = renovVencida ? "#dc2626" : renovUrg ? B.gold : "rgba(10,31,68,0.35)";
              return (
                <div key={p.id} style={{
                  background:B.white,
                  border:"1px solid rgba(10,31,68,0.06)",
                  borderRadius:12,
                  padding:"14px 16px",
                  boxShadow:"var(--mf-shadow-xs)",
                }}>
                  {/* Header */}
                  <div style={{display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:8}}>
                    <div>
                      <div style={{fontSize:13.5, fontWeight:600, color:B.navy, letterSpacing:"-0.005em"}}>
                        {p.producto}{p.numero ? ` · ${p.numero}` : ""}
                      </div>
                      <div style={{fontSize:11, color:"rgba(10,31,68,0.45)", marginTop:2}}>
                        {p.primaAprox > 0 ? `Prima ≈ $${Number(p.primaAprox).toLocaleString("es-MX")} MXN` : "Prima no registrada"}
                      </div>
                    </div>
                    <button onClick={()=>eliminarPoliza(p.id)} style={{
                      all:"unset", cursor:"pointer", color:"rgba(10,31,68,0.35)",
                      width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center",
                      borderRadius:6, transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                    }}
                      onMouseEnter={e=>{e.currentTarget.style.color="#dc2626"; e.currentTarget.style.background="rgba(220,38,38,0.06)";}}
                      onMouseLeave={e=>{e.currentTarget.style.color="rgba(10,31,68,0.35)"; e.currentTarget.style.background="transparent";}}>
                      <IconX size={13} color="currentColor"/>
                    </button>
                  </div>

                  {/* Fechas */}
                  <div style={{display:"flex", gap:18, fontSize:11.5, color:"rgba(10,31,68,0.55)", flexWrap:"wrap", marginBottom:10}}>
                    {p.fechaInicio && <div>Vigencia desde <strong style={{color:B.navy, fontWeight:500}}>{fmtF(p.fechaInicio)}</strong></div>}
                    {p.fechaRenovacion && (
                      <div>Renueva <strong style={{color:renovColor, fontWeight:600}}>{fmtF(p.fechaRenovacion)}</strong>
                        {dias !== null && (
                          <span style={{color:renovColor, marginLeft:6, fontSize:10.5, fontWeight:500}}>
                            ({renovVencida ? `vencida hace ${Math.abs(dias)}d` : dias === 0 ? "hoy" : `en ${dias}d`})
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {p.notas && (
                    <div style={{fontSize:11.5, color:"rgba(10,31,68,0.65)", marginBottom:10, fontStyle:"italic"}}>
                      {p.notas}
                    </div>
                  )}

                  {/* Toggle seguimiento iniciado */}
                  <button onClick={()=>toggleSeguimientoPoliza(p.id)} style={{
                    all:"unset", cursor:"pointer",
                    display:"flex", alignItems:"center", gap:8,
                    padding:"6px 10px", borderRadius:6,
                    background: p.seguimientoIniciado ? "rgba(5,150,105,0.08)" : "rgba(10,31,68,0.03)",
                    border: `1px solid ${p.seguimientoIniciado ? "rgba(5,150,105,0.20)" : "rgba(10,31,68,0.08)"}`,
                  }}>
                    <div style={{
                      width:14, height:14, borderRadius:4,
                      background: p.seguimientoIniciado ? "#059669" : "transparent",
                      border: `1.5px solid ${p.seguimientoIniciado ? "#059669" : "rgba(10,31,68,0.30)"}`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      {p.seguimientoIniciado && <IconCheck size={9} color="#fff"/>}
                    </div>
                    <span style={{fontSize:11.5, fontWeight:500, color: p.seguimientoIniciado ? "#059669" : "rgba(10,31,68,0.65)"}}>
                      {p.seguimientoIniciado ? "Seguimiento de renovación iniciado" : "Marcar seguimiento iniciado"}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}
    {/* ═══ CADENCIA DE CONTACTO (compacta) ═══ */}
    {!f.sinSeguimiento && (
      <div style={{marginBottom:20}}>
        <div style={{
          fontSize:10, fontWeight:500,
          color:"rgba(10,31,68,0.40)",
          textTransform:"uppercase", letterSpacing:"0.18em",
          marginBottom:10,
        }}>Cadencia de contacto</div>
        <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
          {cadencia.map(c => (
            <button key={c.v} onClick={()=>toggleCadencia(c.v)} style={{
              all:"unset", cursor:"pointer",
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"7px 11px", borderRadius:999,
              background: c.done ? "rgba(5,150,105,0.06)" : "#fff",
              border: `1px solid ${c.done ? "rgba(5,150,105,0.25)" : "rgba(10,31,68,0.08)"}`,
              transition:"all var(--mf-t-fast) var(--mf-ease-out)",
            }}>
              <span style={{
                width:14, height:14, borderRadius:"50%",
                background: c.done ? "#059669" : "transparent",
                border: `1.5px solid ${c.done ? "#059669" : "rgba(10,31,68,0.22)"}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                flexShrink:0,
              }}>{c.done && <IconCheck size={8} color="#fff"/>}</span>
              <span style={{
                fontSize:11.5, fontWeight: c.done ? 600 : 500,
                color: c.done ? "#059669" : "rgba(10,31,68,0.65)",
                letterSpacing:"0.01em",
              }}>{c.l}</span>
            </button>
          ))}
        </div>
      </div>
    )}
    {/* ═══ HISTORIAL (últimas 3 + ver completo) ═══ */}
    <div style={{marginBottom:20}}>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:10, gap:10,
      }}>
        <div style={{
          fontSize:10, fontWeight:500,
          color:"rgba(10,31,68,0.40)",
          textTransform:"uppercase", letterSpacing:"0.18em",
        }}>Historial</div>
        {(f.seguimientos||[]).length > 3 && (
          <button onClick={()=>setHistorialCompleto(true)} style={{
            all:"unset", cursor:"pointer",
            fontSize:11, color:"rgba(10,31,68,0.55)",
            letterSpacing:"0.01em",
            display:"inline-flex", alignItems:"center", gap:4,
          }}
            onMouseEnter={e=>{e.currentTarget.style.color=B.navy;}}
            onMouseLeave={e=>{e.currentTarget.style.color="rgba(10,31,68,0.55)";}}>
            Ver historial completo
            <IconChevronRight size={11} color="currentColor"/>
          </button>
        )}
      </div>

      {/* Form alta inline compacto */}
      <div style={{display:"flex", gap:6, marginBottom:12, flexWrap:"wrap"}}>
        <div style={{minWidth:120}}>
          <Sel value={tipoN} onChange={setTipoN} options={[
            {v:"llamada",l:"Llamada"},{v:"whatsapp",l:"WhatsApp"},{v:"visita",l:"Visita"},{v:"correo",l:"Correo"},{v:"nota",l:"Nota"},
          ]}/>
        </div>
        <div style={{flex:1, minWidth:160}}>
          <Inp value={nota} onChange={setNota} placeholder="Registro rápido…" onKeyDown={e=>e.key==="Enter"&&addNota()}/>
        </div>
        <button onClick={addNota} style={{
          display:"inline-flex", alignItems:"center", justifyContent:"center",
          padding:"0 12px", minHeight:44, borderRadius:8, border:"none",
          background:"linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
          color:"#fff", cursor:"pointer",
        }}><IconPlus size={12} color="#fff"/></button>
      </div>

      {/* Solo últimas 3 actividades */}
      {(f.seguimientos||[]).length === 0 ? (
        <div style={{
          fontSize:12, color:"rgba(10,31,68,0.45)",
          textAlign:"center", padding:"20px 0",
          fontStyle:"italic", letterSpacing:"0.01em",
        }}>Sin actividad registrada aún.</div>
      ) : (
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          {(f.seguimientos||[]).slice(0, 3).map((s,i) => (
            <div key={s.id||i} style={{
              display:"flex", alignItems:"flex-start", gap:10,
              padding:"10px 12px",
              background:"rgba(248,246,242,0.6)",
              border:"1px solid rgba(10,31,68,0.05)",
              borderRadius:10,
            }}>
              <span style={{
                width:8, height:8, borderRadius:"50%", flexShrink:0, marginTop:6,
                background: tipoColor[s.tipo] || "rgba(10,31,68,0.30)",
              }}/>
              <div style={{flex:1, minWidth:0, overflowWrap:"anywhere"}}>
                <div style={{fontSize:12.5, color:B.navy, lineHeight:1.45, letterSpacing:"-0.005em"}}>{s.texto}</div>
                <div style={{
                  fontSize:10, color:"rgba(10,31,68,0.45)",
                  marginTop:3, textTransform:"uppercase", letterSpacing:"0.10em",
                }}>{fmtF(s.fecha)} · {s.tipo}{s.autor ? ` · ${s.autor}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* ═══ INFORMACIÓN COMPLETA (collapsable, cerrada por defecto) ═══ */}
    <div style={{marginBottom:18, borderTop:"1px solid rgba(10,31,68,0.06)", paddingTop:16}}>
      <button onClick={()=>setInfoExpandida(o=>!o)} style={{
        all:"unset", cursor:"pointer", width:"100%",
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:10,
        padding:"4px 0",
      }}>
        <div style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:18, fontWeight:500, color:B.navy,
          letterSpacing:"-0.01em",
        }}>Información completa</div>
        <span style={{
          fontSize:11, color:"rgba(10,31,68,0.50)", letterSpacing:"0.01em",
          display:"inline-flex", alignItems:"center", gap:4,
        }}>{infoExpandida ? "Ocultar" : "Mostrar"} <span style={{fontSize:9}}>{infoExpandida ? "▲" : "▼"}</span></span>
      </button>
    </div>
    {infoExpandida && <div style={{marginBottom:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12}}>
        <FL label="Nombre completo" span2><Inp value={f.nombre} onChange={v=>set("nombre",v)}/></FL>
        <FL label="Teléfono / WhatsApp"><Inp value={f.telefono} onChange={v=>set("telefono",v)}/></FL>
        <FL label="Edad"><Inp value={f.edad} onChange={v=>set("edad",v)} type="number"/></FL>
        <FL label="Correo" span2><Inp value={f.correo} onChange={v=>set("correo",v)} type="email"/></FL>
        <FL label="Estado de la República"><Sel value={f.estado} onChange={v=>set("estado",v)} options={[{v:"",l:"Seleccionar..."},...ESTADOS_MX.map(e=>({v:e,l:e}))]}/></FL>
        <FL label="Producto"><Sel value={f.producto} onChange={v=>set("producto",v)} options={PRODUCTOS_LEAD}/></FL>
        <FL label="Último contacto"><Inp value={f.ultimoContacto} onChange={v=>set("ultimoContacto",v)} type="date"/></FL>
        <FL label="Asignar a"><Sel value={f.asignadoA||""} onChange={v=>set("asignadoA",v)} options={[{v:"",l:"-- Sin asignar --"},...asistentes.map(a=>({v:a.id,l:a.nombre}))]}/></FL>
      </div>

      {/* Estado de oportunidad */}
      <div style={{marginTop:24}}>
        <div style={{
          fontSize:10, fontWeight:500,
          color:"rgba(10,31,68,0.40)",
          textTransform:"uppercase", letterSpacing:"0.18em",
          marginBottom:10,
        }}>Estado de oportunidad</div>
        <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:10}}>
          <button onClick={()=>set("estadoOportunidad", null)} style={{
            all:"unset", cursor:"pointer",
            padding:"6px 12px", borderRadius:999,
            border: `1px solid ${!f.estadoOportunidad ? "rgba(10,31,68,0.30)" : "rgba(10,31,68,0.08)"}`,
            background: !f.estadoOportunidad ? "rgba(10,31,68,0.04)" : "#fff",
            color: !f.estadoOportunidad ? B.navy : "rgba(10,31,68,0.50)",
            fontSize:11, fontWeight:500, letterSpacing:"0.01em",
          }}>Auto / sin estado</button>
          {ESTADOS_OPORTUNIDAD.map(e => {
            const active = f.estadoOportunidad === e.v;
            return (
              <button key={e.v} onClick={()=>set("estadoOportunidad", e.v)} style={{
                all:"unset", cursor:"pointer",
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"6px 12px", borderRadius:999,
                border: `1px solid ${active ? `${e.color}55` : "rgba(10,31,68,0.08)"}`,
                background: active ? `${e.color}10` : "#fff",
                color: active ? e.color : "rgba(10,31,68,0.55)",
                fontSize:11, fontWeight:active?600:500, letterSpacing:"0.01em",
              }}>
                <span style={{width:6, height:6, borderRadius:"50%", background: active ? e.color : "rgba(10,31,68,0.20)"}}/>
                {e.l}
              </button>
            );
          })}
        </div>
        {f.estadoOportunidad === "en_pausa" && (
          <div style={{
            background:"rgba(100,116,139,0.04)",
            border:"1px solid rgba(100,116,139,0.15)",
            borderRadius:10, padding:"12px 14px", marginTop:6,
          }}>
            <div style={{fontSize:11.5, color:"rgba(10,31,68,0.65)", marginBottom:8, lineHeight:1.45}}>
              ¿Cuándo retomas el seguimiento? Al guardar, MarFlow agendará un evento y agregará un pendiente.
            </div>
            <FL label="Retomar el día">
              <Inp type="date" value={f.pausaHasta||""} onChange={v=>set("pausaHasta", v)}/>
            </FL>
          </div>
        )}
        <div style={{
          display:"flex", alignItems:"center", gap:12, marginTop:14,
          padding:"12px 14px",
          background:"rgba(198,169,107,0.05)",
          border:"1px solid rgba(198,169,107,0.18)",
          borderRadius:10, flexWrap:"wrap",
        }}>
          <button onClick={()=>set("esReferido", !f.esReferido)} style={{
            all:"unset", cursor:"pointer",
            display:"flex", alignItems:"center", gap:9,
          }}>
            <span style={{
              width:18, height:18, borderRadius:5,
              background: f.esReferido ? "#C6A96B" : "#fff",
              border: `1.5px solid ${f.esReferido ? "#C6A96B" : "rgba(10,31,68,0.20)"}`,
              display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
            }}>{f.esReferido && <IconCheck size={11} color="#fff"/>}</span>
            <span style={{fontSize:12.5, fontWeight:600, color:B.navy, letterSpacing:"-0.005em"}}>Es referido</span>
          </button>
          {f.esReferido && (
            <div style={{flex:"1 1 180px", minWidth:140}}>
              <Inp value={f.referidoPor||""} onChange={v=>set("referidoPor", v)} placeholder="¿Por quién? (opcional)"/>
            </div>
          )}
        </div>
        <div style={{fontSize:11, color:"rgba(10,31,68,0.45)", marginTop:8, lineHeight:1.45, fontStyle:"italic"}}>
          Los referidos se marcan automáticamente como "Alta oportunidad" cuando no eliges otro estado manual.
        </div>
      </div>

      {/* Estrategia comercial */}
      <div style={{marginTop:24}}>
        <div style={{
          fontSize:10, fontWeight:500,
          color:"rgba(10,31,68,0.40)",
          textTransform:"uppercase", letterSpacing:"0.18em",
          marginBottom:10,
        }}>Estrategia comercial</div>
        <div style={{display:"grid",gap:12}}>
          <FL label="Objeciones del cliente"><Inp value={f.objeciones||""} onChange={v=>set("objeciones",v)} rows={2} placeholder="¿Qué lo detiene de comprar?"/></FL>
          <FL label="Intereses y necesidades"><Inp value={f.intereses||""} onChange={v=>set("intereses",v)} rows={2} placeholder="¿Qué busca proteger o lograr?"/></FL>
          <FL label="Motivador de compra"><Inp value={f.motivador||""} onChange={v=>set("motivador",v)} rows={2} placeholder="¿Qué lo haría decidir hoy?"/></FL>
        </div>
      </div>
    </div>}

    {/* Footer: eliminar lead + cancelar/guardar */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:24,gap:10,flexWrap:"wrap"}}>
      {!esAsistente ? (
        <button onClick={()=>setConfirmDel(true)}
          style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"8px 13px", borderRadius:8,
            border:`1px solid ${B.redBright}30`,
            background:"transparent", color:B.redBright,
            fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:12,
            cursor:"pointer",
            transition:"all var(--mf-t-fast) var(--mf-ease-out)",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background="rgba(220,38,38,0.05)"; e.currentTarget.style.borderColor=B.redBright+"55";}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor=B.redBright+"30";}}>
          <IconTrash size={12} color={B.redBright}/>Eliminar lead
        </button>
      ) : (
        <div style={{fontSize:10,color:"rgba(10,31,68,0.40)",fontStyle:"italic"}}>
          Asistente · solo puede registrar seguimientos
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <button onClick={onClose}
          style={{
            padding:"8px 14px", borderRadius:8,
            border:"1px solid rgba(10,31,68,0.08)",
            background:B.white, color:"rgba(10,31,68,0.65)",
            fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:12,
            cursor:"pointer",
          }}>Cancelar</button>
        <button onClick={guardar}
          style={{
            padding:"8px 16px", borderRadius:8, border:"none",
            background:"linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
            color:"#fff",
            fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:12.5,
            cursor:"pointer",
            boxShadow:"0 1px 2px rgba(10,31,68,0.10)",
            transition:"all var(--mf-t-fast) var(--mf-ease-out)",
          }}
          onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 14px rgba(10,31,68,0.20)"; e.currentTarget.style.transform="translateY(-1px)";}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 2px rgba(10,31,68,0.10)"; e.currentTarget.style.transform="translateY(0)";}}>
          Guardar
        </button>
      </div>
    </div>
    {confirmDel && (
      <ConfirmModal
        titulo="¿Eliminar lead?"
        mensaje={`Vas a eliminar a "${lead.nombre}" permanentemente.`}
        icono="🗑️"
        textoConfirm="Sí, eliminar"
        colorConfirm={B.redBright}
        onConfirm={()=>{onDelete(lead.id); onClose();}}
        onCancel={()=>setConfirmDel(false)}
      />
    )}
    {wam&&<EnviarWhatsAppModal lead={f} usuario={usuario} onClose={()=>setWam(false)} onEnviado={registrarSeguimientoWhatsApp}/>}

    {/* Modal: Historial completo con todas las actividades */}
    {historialCompleto && (
      <div onClick={(e)=>{if(e.target===e.currentTarget) setHistorialCompleto(false);}} style={{
        position:"fixed", inset:0, zIndex:1500,
        background:"rgba(10,31,68,0.45)",
        backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
        display:"flex", justifyContent:"center", alignItems:"center", padding:20,
        animation:"mfFadeIn .22s var(--mf-ease-out)",
      }}>
        <div style={{
          background:"#F8F6F2", borderRadius:18,
          width:"min(580px, 100%)", maxHeight:"86vh",
          display:"flex", flexDirection:"column",
          boxShadow:"0 24px 60px rgba(10,31,68,0.20)",
          animation:"mfFadeUp .25s var(--mf-ease-spring)",
        }}>
          <div style={{
            padding:"20px 24px 16px",
            borderBottom:"1px solid rgba(10,31,68,0.06)",
            display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12,
          }}>
            <div>
              <div style={{fontSize:10, color:"rgba(10,31,68,0.45)", textTransform:"uppercase", letterSpacing:"0.18em", marginBottom:4}}>Timeline completo</div>
              <div style={{fontFamily:"'Cormorant Garamond', serif", fontSize:22, fontWeight:500, color:B.navy, letterSpacing:"-0.015em"}}>
                Historial de {f.nombre || "lead"}
              </div>
            </div>
            <button onClick={()=>setHistorialCompleto(false)} style={{
              width:30, height:30, borderRadius:8,
              border:"1px solid rgba(10,31,68,0.08)",
              background:"#fff", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              color:"rgba(10,31,68,0.55)",
            }}><IconX size={12} color="currentColor"/></button>
          </div>
          <div style={{flex:1, overflowY:"auto", padding:"16px 22px 22px"}}>
            {(f.seguimientos||[]).length === 0 ? (
              <div style={{textAlign:"center", padding:"40px 20px", color:"rgba(10,31,68,0.50)", fontStyle:"italic"}}>Sin actividad registrada aún.</div>
            ) : (
              <div style={{position:"relative", paddingLeft:22}}>
                <div style={{position:"absolute", left:8, top:6, bottom:6, width:1, background:"rgba(10,31,68,0.08)"}}/>
                {(f.seguimientos||[]).map((s,i) => (
                  <div key={s.id||i} style={{position:"relative", marginBottom:14}}>
                    <div style={{
                      position:"absolute", left:-18, top:9,
                      width:9, height:9, borderRadius:"50%",
                      background: tipoColor[s.tipo] || "rgba(10,31,68,0.30)",
                      border:"2px solid #F8F6F2",
                      boxShadow:"0 0 0 1px rgba(10,31,68,0.08)",
                    }}/>
                    <div style={{
                      background:"#fff",
                      border:"1px solid rgba(10,31,68,0.05)",
                      borderRadius:10,
                      padding:"10px 14px",
                    }}>
                      <div style={{fontSize:10.5, color:"rgba(10,31,68,0.45)", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.10em"}}>
                        {fmtF(s.fecha)} · {s.tipo}{s.autor ? ` · ${s.autor}` : ""}
                      </div>
                      <div style={{fontSize:13, color:B.navy, lineHeight:1.5, letterSpacing:"-0.005em"}}>{s.texto}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
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
    pendientes: Array.isArray(row.pendientes) ? row.pendientes : [],
    polizas: Array.isArray(row.polizas) ? row.polizas : [],
    estadoOportunidad: row.estado_oportunidad || null,
    esReferido: !!row.es_referido,
    referidoPor: row.referido_por || "",
    pausaHasta: row.pausa_hasta || null,
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
    pendientes: Array.isArray(lead.pendientes) ? lead.pendientes : [],
    polizas: Array.isArray(lead.polizas) ? lead.polizas : [],
    estado_oportunidad: lead.estadoOportunidad || null,
    es_referido: !!lead.esReferido,
    referido_por: lead.referidoPor || null,
    pausa_hasta: lead.pausaHasta || null,
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

function Pipeline({leads,setLeads,setEventos,filtroNav,esAdmin,cuentas,usuario}) {
  const [leadAct,setLeadAct]=useState(null);
  const [nuevoM,setNuevoM]=useState(false);
  const [contactoL,setContactoL]=useState(null);
  const [preview,setPreview]=useState(null); // { leads, warnings } | null
  const [busq,setBusq]=useState("");
  const [filtProd,setFiltProd]=useState("");
  const [filtTemp,setFiltTemp]=useState("");
  const fileRef=useRef();
  const emptyL={id:uid(),nombre:"",telefono:"",correo:"",edad:"",producto:PRODUCTOS_LEAD[0],estado:"",etapa:"nuevo",ultimoContacto:hoy(),notas:"",objeciones:"",intereses:"",motivador:"",checklist:{...EMPTY_CHECK},seguimientos:[],sinSeguimiento:false,asignadoA:null,pendientes:[],polizas:[],estadoOportunidad:null,esReferido:false,referidoPor:"",pausaHasta:null,mesCreacion:hoy().slice(0,7)};
  function save(d){
    const adminId = getAdminId(usuario);
    const viejo = leads.find(l => l.id === d.id);
    if (!viejo) {
      registrarActividad({ adminId, autor: usuario, tipo: "lead.creado",
        entidad: "lead", entidadId: d.id, entidadNombre: d.nombre });
    } else {
      const diff = diffLead(viejo, d);
      if (diff) registrarActividad({ adminId, autor: usuario, ...diff,
        entidad: "lead", entidadId: d.id, entidadNombre: d.nombre });
    }
    setLeads(p => p.find(l => l.id === d.id) ? p.map(l => l.id === d.id ? d : l) : [...p, d]);
  }
  function del(id){
    const viejo = leads.find(l => l.id === id);
    if (viejo) registrarActividad({ adminId: getAdminId(usuario), autor: usuario,
      tipo: "lead.eliminado", entidad: "lead", entidadId: id, entidadNombre: viejo.nombre });
    setLeads(p => p.filter(l => l.id !== id));
  }
  let vis=leads;
  if(filtroNav==="activos") vis=vis.filter(l=>!l.sinSeguimiento&&!["otro","cierre"].includes(l.etapa));
  else if(filtroNav&&filtroNav!=="todos") vis=vis.filter(l=>l.etapa===filtroNav);
  if(busq) vis=vis.filter(l=>l.nombre.toLowerCase().includes(busq.toLowerCase())||l.estado?.toLowerCase().includes(busq.toLowerCase()));
  if(filtProd) vis=vis.filter(l=>l.producto===filtProd);
  if(filtTemp) vis=vis.filter(l=>getEstadoOportunidad(l)?.v===filtTemp);
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
    // El toast de éxito lo lanza sincronizarLeadsConDB automáticamente al detectar inserts.
    // No mostramos alert aquí porque sería redundante.
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
  // Botón de toolbar reusable estilo Linear
  const ToolbarBtn = ({ onClick, icon, label, variant = "ghost" }) => (
    <button onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 12px", minHeight: 36,
        borderRadius: 8,
        border: variant === "primary" ? "none" : "1px solid rgba(10,31,68,0.08)",
        background: variant === "primary" ? B.navy : B.white,
        color: variant === "primary" ? "#fff" : "rgba(10,31,68,0.85)",
        fontFamily: "'Poppins',sans-serif",
        fontSize: 12.5, fontWeight: 500,
        letterSpacing: "0.005em",
        cursor: "pointer",
        boxShadow: variant === "primary" ? "0 1px 2px rgba(10,31,68,0.10)" : "var(--mf-shadow-xs)",
        transition: "all var(--mf-t-fast) var(--mf-ease-out)",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={e=>{
        if (variant === "primary") {
          e.currentTarget.style.background = "#122550";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(10,31,68,0.20)";
        } else {
          e.currentTarget.style.background = "rgba(10,31,68,0.025)";
          e.currentTarget.style.borderColor = "rgba(198,169,107,0.30)";
        }
      }}
      onMouseLeave={e=>{
        if (variant === "primary") {
          e.currentTarget.style.background = B.navy;
          e.currentTarget.style.boxShadow = "0 1px 2px rgba(10,31,68,0.10)";
        } else {
          e.currentTarget.style.background = B.white;
          e.currentTarget.style.borderColor = "rgba(10,31,68,0.08)";
        }
      }}>
      {icon}
      <span>{label}</span>
    </button>
  );

  // Color del dot de temperatura (sin emoji)
  const tempDot = (color) => (
    <span style={{display:"inline-block", width:8, height:8, borderRadius:"50%", background:color, marginRight:6, verticalAlign:"middle"}}/>
  );

  return <div className="mf-fade-in">
    {/* ═══ Toolbar premium ═══ */}
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 10,
      alignItems: "center", marginBottom: 18,
    }}>
      {/* Buscador con icono SVG embebido */}
      <div style={{
        position: "relative", flex: 1, minWidth: 220,
        display: "flex", alignItems: "center",
      }}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          color: "rgba(10,31,68,0.35)", pointerEvents: "none",
          display: "inline-flex",
        }}>
          <IconSearch size={16}/>
        </span>
        <input
          value={busq}
          onChange={e=>setBusq(e.target.value)}
          placeholder="Buscar por nombre o estado…"
          style={{
            width: "100%", paddingLeft: 40, paddingRight: 14,
            paddingTop: 10, paddingBottom: 10, minHeight: 38,
            borderRadius: 10,
            border: "1px solid rgba(10,31,68,0.08)",
            background: B.white,
            color: B.navy,
            fontFamily: "'Poppins',sans-serif",
            fontSize: 14, fontWeight: 400,
            outline: "none",
            WebkitAppearance: "none",
            boxShadow: "var(--mf-shadow-xs)",
          }}
          onFocus={e=>{
            e.target.style.borderColor = "rgba(198,169,107,0.55)";
            e.target.style.boxShadow = "0 0 0 4px rgba(198,169,107,0.10)";
          }}
          onBlur={e=>{
            e.target.style.borderColor = "rgba(10,31,68,0.08)";
            e.target.style.boxShadow = "var(--mf-shadow-xs)";
          }}
        />
      </div>

      {/* Select Producto refinado */}
      <Sel value={filtProd} onChange={setFiltProd}
        options={[{v:"",l:"Todos los productos"},...PRODUCTOS_LEAD.map(p=>({v:p,l:p}))]}/>

      {/* Select Estado de oportunidad */}
      <Sel value={filtTemp} onChange={setFiltTemp}
        options={[
          {v:"",l:"Estado de oportunidad"},
          ...ESTADOS_OPORTUNIDAD.map(e => ({ v:e.v, l:e.l })),
        ]}/>

      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={importar}/>
      <ToolbarBtn onClick={()=>fileRef.current?.click()} icon={<IconUpload size={14}/>} label="Importar"/>
      <ToolbarBtn onClick={exportar} icon={<IconDownload size={14}/>} label="Exportar"/>
      {esAdmin && <ToolbarBtn onClick={()=>setNuevoM(true)} icon={<IconPlus size={14} color="#fff"/>} label="Nuevo lead" variant="primary"/>}
    </div>

    {/* ═══ Kanban refinado ═══ */}
    <div className="mf-kanban">
      {etapasVis.map((etapa, idx) => {
        const cols = vis.filter(l => l.etapa === etapa.id);
        return (
          <div key={etapa.id} className={`mf-kanban-col mf-fade-up mf-stagger-${(idx%4)+1}`}>
            {/* Header de columna minimalista */}
            <div style={{
              padding: "4px 4px 12px",
              marginBottom: 4,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              borderBottom: "1px solid rgba(10,31,68,0.06)",
            }}>
              <div style={{display: "flex", alignItems: "center", gap: 8}}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: etapa.color, flexShrink: 0,
                }}/>
                <span style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: B.navy,
                  letterSpacing: "0.005em",
                }}>{etapa.label.replace(/[¡⭐!]/g,"").trim()}</span>
              </div>
              <span style={{
                fontSize: 11,
                fontWeight: 500,
                color: "rgba(10,31,68,0.45)",
                fontVariantNumeric: "tabular-nums",
              }}>{cols.length}</span>
            </div>

            {/* Cards o estado vacío */}
            {cols.length === 0 ? (
              <div style={{
                border: "1px dashed rgba(10,31,68,0.10)",
                borderRadius: 10,
                padding: "22px 10px",
                textAlign: "center",
                color: "rgba(10,31,68,0.30)",
                fontSize: 11,
                background: "rgba(255,255,255,0.4)",
                fontStyle: "italic",
                letterSpacing: "0.01em",
              }}>Sin leads</div>
            ) : (
              cols.map(l => <LeadCard key={l.id} lead={l} onClick={setLeadAct} onContacto={setContactoL}/>)
            )}
          </div>
        );
      })}
    </div>
    {leadAct&&<LeadModal lead={leadAct} onClose={()=>setLeadAct(null)} onSave={save} onDelete={del} cuentas={cuentas} usuario={usuario} setEventos={setEventos}/>}
    {nuevoM&&<LeadModal lead={emptyL} onClose={()=>setNuevoM(false)} onSave={save} onDelete={()=>{}} cuentas={cuentas} usuario={usuario} setEventos={setEventos}/>}
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
    const adminId = getAdminId(usuario);
    if (editId) {
      const viejo = eventos.find(ev => ev.id === editId);
      const cambioFecha = viejo && (viejo.fechaInicio||viejo.fecha) !== saved.fechaInicio;
      registrarActividad({ adminId, autor: usuario,
        tipo: cambioFecha ? "evento.fecha" : "evento.editado",
        entidad: "evento", entidadId: saved.id, entidadNombre: saved.titulo,
        metadata: cambioFecha ? { de: viejo?.fechaInicio||viejo?.fecha||"", a: saved.fechaInicio } : {} });
      setEventos(p=>p.map(ev=>ev.id===editId?saved:ev));
    } else {
      registrarActividad({ adminId, autor: usuario, tipo: "evento.creado",
        entidad: "evento", entidadId: saved.id, entidadNombre: saved.titulo,
        metadata: { fecha: saved.fechaInicio, tipo: saved.tipo } });
      setEventos(p=>[...p,saved]);
    }
    setModalEv(false);
    if(form.recordatorioCot&&form.tipo==="cita"){const lead=leads.find(l=>l.id===form.leadId);const payload={titulo:form.titulo,leadNombre:lead?.nombre||""};setTimeout(()=>setPopupCot(payload),30*60*1000);}
  }
  function elimEv(id){
    const viejo = eventos.find(ev => ev.id === id);
    if (viejo) registrarActividad({ adminId: getAdminId(usuario), autor: usuario,
      tipo: "evento.eliminado", entidad: "evento", entidadId: id, entidadNombre: viejo.titulo });
    setEventos(p=>p.filter(ev=>ev.id!==id));setModalDia(false);
  }
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
  const AGENDA_CSS = `
    .mf-cal-wrap { width: 100%; box-sizing: border-box; overflow-x: hidden; font-family: 'Poppins', sans-serif; }
    .mf-cal-grid { display: grid; grid-template-columns: repeat(7,1fr); width: 100%; }
    .mf-cal-hdr {
      display: grid; grid-template-columns: repeat(7,1fr);
      background: rgba(248,246,242,0.6);
      border-bottom: 1px solid rgba(10,31,68,0.06);
    }
    .mf-cell {
      box-sizing: border-box; overflow: hidden;
      border-right: 1px solid rgba(10,31,68,0.04);
      border-bottom: 1px solid rgba(10,31,68,0.04);
      cursor: pointer;
      transition: background-color var(--mf-t-fast) var(--mf-ease-out);
      -webkit-tap-highlight-color: transparent;
      display: flex; flex-direction: column;
    }
    .mf-cell:hover { background: rgba(10,31,68,0.022) !important; }
    .mf-cell.today { background: rgba(198,169,107,0.04); }
    .mf-cell.selected { background: rgba(198,169,107,0.10) !important; }
    .mf-cell.weekend { background: rgba(248,246,242,0.4); }
    .mf-daynum {
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; font-weight: 500;
      color: rgba(10,31,68,0.75);
      font-variant-numeric: tabular-nums;
      transition: all var(--mf-t-fast) var(--mf-ease-out);
    }
    .mf-daynum.today-num {
      background: #0A1F44; color: #fff;
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(10,31,68,0.20);
    }
    .mf-daynum.sel-num {
      border: 1.5px solid #C6A96B;
      color: #C6A96B; font-weight: 600;
    }
    .mf-daynum.weekend-num { color: #C6A96B; }
    .mf-pill {
      display: block; width: 100%;
      overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      transition: opacity var(--mf-t-fast) var(--mf-ease-out);
      box-sizing: border-box;
      letter-spacing: 0.005em;
    }
    .mf-pill:hover { opacity: 0.75; }
    @media (max-width: 390px) {
      .mf-cell { min-height: 50px; padding: 3px 3px 2px; }
      .mf-daynum { width: 20px; height: 20px; font-size: 10.5px; }
      .mf-pill { font-size: 7.5px; padding: 1px 3px; margin-bottom: 1px; line-height: 1.4; }
      .mf-legend { display: none !important; }
    }
    @media (min-width: 391px) and (max-width: 600px) {
      .mf-cell { min-height: 62px; padding: 4px 4px 3px; }
      .mf-daynum { width: 22px; height: 22px; font-size: 11px; }
      .mf-pill { font-size: 8.5px; padding: 1.5px 4px; margin-bottom: 1.5px; line-height: 1.5; }
    }
    @media (min-width: 601px) and (max-width: 900px) {
      .mf-cell { min-height: 82px; padding: 5px 5px 4px; }
      .mf-daynum { width: 26px; height: 26px; font-size: 12px; }
      .mf-pill { font-size: 9.5px; padding: 2px 5px; margin-bottom: 2px; line-height: 1.5; }
    }
    @media (min-width: 901px) {
      .mf-cell { min-height: 104px; padding: 7px 7px 5px; }
      .mf-daynum { width: 30px; height: 30px; font-size: 13px; }
      .mf-pill { font-size: 10.5px; padding: 2.5px 6px; margin-bottom: 2.5px; line-height: 1.6; }
    }
  `;
  // Botón circular para navegación (chevron izquierda/derecha)
  const navBtnStyle = {
    width: 36, height: 36, borderRadius: 9,
    border: "1px solid rgba(10,31,68,0.08)",
    background: B.white,
    color: B.navy,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    boxShadow: "var(--mf-shadow-xs)",
    transition: "all var(--mf-t-fast) var(--mf-ease-out)",
  };

  return (
    <div className="mf-cal-wrap mf-fade-in">
      <style>{AGENDA_CSS}</style>

      {/* ═══ Header refinado ═══ */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        marginBottom: 16, flexWrap: "nowrap", justifyContent: "space-between", width: "100%",
      }}>
        {/* Navegación mes */}
        <div style={{display: "flex", alignItems: "center", gap: 8, flexShrink: 0, minWidth: 0}}>
          <button
            onClick={()=>{if(mes===0){setMes(11);setAnio(a=>a-1);}else setMes(m=>m-1);}}
            aria-label="Mes anterior"
            style={navBtnStyle}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(198,169,107,0.30)"; e.currentTarget.style.background="rgba(198,169,107,0.03)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(10,31,68,0.08)"; e.currentTarget.style.background=B.white;}}>
            <IconChevronLeft size={15} color={B.navy}/>
          </button>

          <div style={{textAlign: "center", minWidth: 0, padding: "0 6px"}}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 500, color: B.navy,
              letterSpacing: "-0.02em",
              fontSize: 22, lineHeight: 1,
            }}>{MESES[mes]}</div>
            <div style={{
              fontSize: 10, color: "rgba(10,31,68,0.45)",
              marginTop: 3, fontWeight: 500,
              letterSpacing: "0.18em", textTransform: "uppercase",
            }}>{anio}</div>
          </div>

          <button
            onClick={()=>{if(mes===11){setMes(0);setAnio(a=>a+1);}else setMes(m=>m+1);}}
            aria-label="Mes siguiente"
            style={navBtnStyle}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(198,169,107,0.30)"; e.currentTarget.style.background="rgba(198,169,107,0.03)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(10,31,68,0.08)"; e.currentTarget.style.background=B.white;}}>
            <IconChevronRight size={15} color={B.navy}/>
          </button>
        </div>

        {/* Leyenda discreta (sólo desktop) */}
        <div className="mf-legend" style={{display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", flex: 1, justifyContent: "center"}}>
          {TIPO_EVENTO.filter(t=>!esAsistente||!t.privado).map(t=>(
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 10.5, color: "rgba(10,31,68,0.55)", fontWeight: 500,
              whiteSpace: "nowrap",
            }}>
              <span style={{width: 6, height: 6, borderRadius: "50%", background: t.color, flexShrink: 0}}/>
              {t.label.replace(" 🔒","").replace(" ✈️","")}
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div style={{display: "flex", gap: 8, flexShrink: 0}}>
          <button
            onClick={()=>{setMes(now.getMonth()); setAnio(now.getFullYear());}}
            style={{
              padding: "0 14px", height: 36, borderRadius: 8,
              border: "1px solid rgba(10,31,68,0.08)",
              background: B.white,
              color: "rgba(10,31,68,0.85)",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 500, fontSize: 12.5,
              cursor: "pointer", whiteSpace: "nowrap",
              boxShadow: "var(--mf-shadow-xs)",
              transition: "all var(--mf-t-fast) var(--mf-ease-out)",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(198,169,107,0.30)"; e.currentTarget.style.background="rgba(198,169,107,0.03)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(10,31,68,0.08)"; e.currentTarget.style.background=B.white;}}>
            Hoy
          </button>
          <button
            onClick={()=>abrirNuevo(hoy())}
            style={{
              padding: "0 14px", height: 36, borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
              color: "#fff",
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600, fontSize: 12.5,
              cursor: "pointer", whiteSpace: "nowrap",
              display: "inline-flex", alignItems: "center", gap: 6,
              boxShadow: "0 1px 2px rgba(10,31,68,0.10)",
              transition: "all var(--mf-t-fast) var(--mf-ease-out)",
            }}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 14px rgba(10,31,68,0.20)"; e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 2px rgba(10,31,68,0.10)"; e.currentTarget.style.transform="translateY(0)";}}>
            <IconPlus size={13} color="#fff"/>Nuevo evento
          </button>
        </div>
      </div>

      {/* ═══ Calendario premium ═══ */}
      <div style={{
        background: B.white,
        borderRadius: 14,
        border: "1px solid rgba(10,31,68,0.06)",
        overflow: "hidden",
        boxShadow: "var(--mf-shadow-xs)",
      }}>
        <div className="mf-cal-hdr">
          {DIAS_MIN.map((d,i)=>(
            <div key={i} style={{
              textAlign: "center", padding: "12px 0 11px",
              fontSize: 10, fontWeight: 600,
              letterSpacing: "0.18em", textTransform: "uppercase",
              color: i >= 5 ? B.gold : "rgba(10,31,68,0.50)",
            }}>{d}</div>
          ))}
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
        <MFModal onClose={()=>{setModalDia(false);setDiaClick(null);}} width={460}>
          {/* Header editorial — día grande en serif */}
          <div style={{marginBottom:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
              <div>
                <div style={{
                  fontSize:10.5, fontWeight:500,
                  color:"rgba(10,31,68,0.45)",
                  textTransform:"uppercase", letterSpacing:"0.22em",
                  marginBottom:8,
                }}>
                  {["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"][(new Date(`${anio}-${String(mes+1).padStart(2,"0")}-${String(diaClick).padStart(2,"0")}`).getDay()+6)%7]}
                </div>
                <div style={{
                  display:"flex", alignItems:"baseline", gap:10,
                }}>
                  <div style={{
                    fontFamily:"'Cormorant Garamond', serif",
                    fontSize:52, fontWeight:500,
                    color:B.navy, lineHeight:1,
                    letterSpacing:"-0.03em",
                    fontVariantNumeric:"tabular-nums",
                  }}>{diaClick}</div>
                  <div style={{
                    fontFamily:"'Cormorant Garamond', serif",
                    fontSize:20, fontWeight:400,
                    color:"rgba(10,31,68,0.50)",
                    letterSpacing:"-0.01em",
                    lineHeight:1.1,
                  }}>{MESES[mes]} {anio}</div>
                </div>
              </div>
              <button onClick={()=>{setModalDia(false);setDiaClick(null);}}
                style={{
                  width:30, height:30, borderRadius:8,
                  background:"transparent",
                  border:"1px solid rgba(10,31,68,0.08)",
                  color:"rgba(10,31,68,0.50)",
                  cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(198,169,107,0.30)"; e.currentTarget.style.color=B.navy;}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(10,31,68,0.08)"; e.currentTarget.style.color="rgba(10,31,68,0.50)";}}>
                <IconX size={14}/>
              </button>
            </div>
            <div style={{height:1, background:"linear-gradient(90deg, transparent, rgba(10,31,68,0.08), transparent)", marginTop:18}}/>
          </div>

          {/* Empty state editorial */}
          {diasConEvs.length === 0 && (
            <div style={{textAlign:"center", padding:"32px 0 16px"}}>
              <div style={{
                width:48, height:48, borderRadius:"50%",
                background:"rgba(248,246,242,0.8)",
                border:"1px solid rgba(10,31,68,0.06)",
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 12px",
                color:"rgba(10,31,68,0.35)",
              }}>
                <IconCalendar size={20} color="rgba(10,31,68,0.35)"/>
              </div>
              <div style={{
                fontSize:13, color:"rgba(10,31,68,0.45)",
                fontStyle:"italic", letterSpacing:"0.01em",
              }}>Sin eventos este día</div>
            </div>
          )}

          {/* Lista de eventos */}
          <div style={{display:"flex", flexDirection:"column", gap:0}}>
            {diasConEvs.map((ev, idx) => (
              <div key={ev.id} style={{
                display:"flex", gap:14, padding:"14px 0",
                borderBottom: idx < diasConEvs.length - 1 ? "1px solid rgba(10,31,68,0.05)" : "none",
              }}>
                {/* Hora */}
                <div style={{width:62, flexShrink:0, paddingTop:2}}>
                  {!ev._privado && ev.horaInicio ? (
                    <>
                      <div style={{
                        fontSize:12.5, fontWeight:500, color:B.navy,
                        fontVariantNumeric:"tabular-nums",
                      }}>{ev.horaInicio}</div>
                      {ev.horaFin && (
                        <div style={{
                          fontSize:10.5, color:"rgba(10,31,68,0.40)", marginTop:1,
                          fontVariantNumeric:"tabular-nums",
                        }}>{ev.horaFin}</div>
                      )}
                    </>
                  ) : (
                    <div style={{
                      fontSize:10, color:"rgba(10,31,68,0.35)",
                      fontStyle:"italic", letterSpacing:"0.01em",
                    }}>Todo el día</div>
                  )}
                </div>

                {/* Línea de color del tipo */}
                <div style={{
                  width:2, borderRadius:1, background:tipoC(ev.tipo),
                  flexShrink:0, alignSelf:"stretch", minHeight:40, opacity:0.6,
                }}/>

                {/* Contenido */}
                <div style={{flex:1, minWidth:0}}>
                  <div style={{
                    fontSize:14, fontWeight:600,
                    color: ev._privado ? "rgba(10,31,68,0.40)" : B.navy,
                    marginBottom: ev._privado ? 0 : 5,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                    letterSpacing:"-0.005em",
                  }}>{ev.titulo}</div>
                  {!ev._privado && (
                    <>
                      <div style={{display:"flex", gap:5, flexWrap:"wrap", marginBottom: (ev.nota || ev.agendadoPor) ? 6 : 0}}>
                        <span style={{
                          display:"inline-flex", alignItems:"center", gap:5,
                          fontSize:10.5, fontWeight:500,
                          color:tipoC(ev.tipo),
                          background:tipoC(ev.tipo)+"0e",
                          border:`1px solid ${tipoC(ev.tipo)}25`,
                          padding:"2px 8px", borderRadius:6,
                          letterSpacing:"0.005em",
                        }}>
                          <span style={{width:5,height:5,borderRadius:"50%",background:tipoC(ev.tipo)}}/>
                          {tipoL(ev.tipo).replace(" 🔒","").replace(" ✈️","").trim()}
                        </span>
                        {ev.tipo === "trabajo" && ev.subtipo && (
                          <span style={{
                            fontSize:10.5, fontWeight:500,
                            color:"rgba(10,31,68,0.65)",
                            background:"rgba(10,31,68,0.04)",
                            padding:"2px 8px", borderRadius:6,
                          }}>{SUBTIPO_LABEL[ev.subtipo] || ev.subtipo}</span>
                        )}
                        {ev.repeticion && ev.repeticion !== "none" && (
                          <span style={{
                            display:"inline-flex", alignItems:"center", gap:4,
                            fontSize:10.5, fontWeight:500,
                            color:B.gold,
                            background:"rgba(198,169,107,0.08)",
                            border:"1px solid rgba(198,169,107,0.20)",
                            padding:"2px 8px", borderRadius:6,
                          }}>
                            <IconRefresh size={10} color={B.gold}/>
                            {REPETICION.find(r => r.v === ev.repeticion)?.l}
                          </span>
                        )}
                        {ev.fechaFin && ev.fechaFin !== ev.fechaInicio && (
                          <span style={{
                            display:"inline-flex", alignItems:"center", gap:4,
                            fontSize:10.5, fontWeight:500,
                            color:"#7c3aed",
                            background:"rgba(124,58,237,0.06)",
                            border:"1px solid rgba(124,58,237,0.18)",
                            padding:"2px 8px", borderRadius:6,
                          }}>
                            <IconCalendar size={10} color="#7c3aed"/>
                            Hasta {fmtF(ev.fechaFin)}
                          </span>
                        )}
                      </div>
                      {ev.agendadoPor && (
                        <div style={{
                          display:"flex", alignItems:"center", gap:6,
                          fontSize:11, color:"rgba(10,31,68,0.55)", marginBottom:4,
                        }}>
                          <span style={{
                            width:18, height:18, borderRadius:"50%",
                            background:"rgba(10,31,68,0.06)",
                            border:"1px solid rgba(10,31,68,0.10)",
                            display:"inline-flex", alignItems:"center", justifyContent:"center",
                            fontSize:8, fontWeight:600, color:B.navy, flexShrink:0,
                          }}>{initials(ev.agendadoPor)}</span>
                          <span>Agendado por <span style={{color:B.navy, fontWeight:500}}>{ev.agendadoPor}</span></span>
                        </div>
                      )}
                      {ev.nota && (
                        <div style={{
                          fontSize:11.5, color:"rgba(10,31,68,0.55)",
                          lineHeight:1.6, marginTop:2,
                        }}>{ev.nota}</div>
                      )}
                    </>
                  )}
                </div>

                {/* Acciones */}
                {!ev._privado && (!esAsistente || ev.agendadoPor === usuario?.nombre) && (
                  <div style={{display:"flex", flexDirection:"column", gap:5, flexShrink:0}}>
                    <button onClick={()=>{abrirEditar(ev); setModalDia(false);}}
                      aria-label="Editar"
                      style={{
                        width:28, height:28, borderRadius:7,
                        border:"1px solid rgba(10,31,68,0.08)",
                        background:"transparent",
                        color:"rgba(10,31,68,0.55)",
                        cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(198,169,107,0.40)"; e.currentTarget.style.background="rgba(198,169,107,0.05)"; e.currentTarget.style.color=B.navy;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(10,31,68,0.08)"; e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(10,31,68,0.55)";}}>
                      <IconEdit size={12}/>
                    </button>
                    <button onClick={()=>setConfirmEvDel(ev.id)}
                      aria-label="Eliminar"
                      style={{
                        width:28, height:28, borderRadius:7,
                        border:"1px solid rgba(10,31,68,0.08)",
                        background:"transparent",
                        color:"rgba(10,31,68,0.55)",
                        cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                      }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(220,38,38,0.25)"; e.currentTarget.style.background="rgba(220,38,38,0.04)"; e.currentTarget.style.color=B.redBright;}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(10,31,68,0.08)"; e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(10,31,68,0.55)";}}>
                      <IconTrash size={12}/>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Botón agregar evento — dashed elegante */}
          <button onClick={()=>{abrirNuevo(strD(diaClick)); setModalDia(false);}}
            style={{
              width:"100%", marginTop:18, padding:"13px",
              borderRadius:10,
              border:"1.5px dashed rgba(10,31,68,0.15)",
              background:"transparent",
              color:"rgba(10,31,68,0.65)",
              fontFamily:"'Poppins',sans-serif",
              fontWeight:500, fontSize:12.5,
              cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              transition:"all var(--mf-t-fast) var(--mf-ease-out)",
              letterSpacing:"0.005em",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(198,169,107,0.50)"; e.currentTarget.style.background="rgba(198,169,107,0.04)"; e.currentTarget.style.color=B.navy;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(10,31,68,0.15)"; e.currentTarget.style.background="transparent"; e.currentTarget.style.color="rgba(10,31,68,0.65)";}}>
            <IconPlus size={13}/> Agregar evento
          </button>
        </MFModal>
      )}
      {modalEv && (
        <MFModal onClose={()=>setModalEv(false)} width={520}>
          <MHead title={editId ? "Editar evento" : "Nuevo evento"} onClose={()=>setModalEv(false)}/>
          <div style={{display:"flex", flexDirection:"column", gap:14}}>
            <FL label="Título"><Inp value={form.titulo} onChange={v=>sf("titulo",v)} placeholder="Descripción del evento"/></FL>

            <FL label="Tipo de evento">
              <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                {TIPO_EVENTO.filter(t=>!esAsistente||!t.soloAdmin).map(t=>{
                  const active = form.tipo === t.id;
                  return (
                    <button key={t.id} onClick={()=>sf("tipo",t.id)}
                      style={{
                        display:"inline-flex", alignItems:"center", gap:6,
                        padding:"7px 13px", borderRadius:9,
                        border:`1px solid ${active ? t.color+"55" : "rgba(10,31,68,0.08)"}`,
                        background: active ? t.color+"0e" : B.white,
                        color: active ? t.color : "rgba(10,31,68,0.65)",
                        fontFamily:"'Poppins',sans-serif",
                        fontWeight: active ? 600 : 500,
                        fontSize:11.5,
                        cursor:"pointer",
                        transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                        letterSpacing:"0.005em",
                      }}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:t.color}}/>
                      {t.label.replace(" 🔒","").replace(" ✈️","").trim()}
                    </button>
                  );
                })}
              </div>
              {form.tipo === "personal" && (
                <div style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  fontSize:11, color:"rgba(10,31,68,0.55)",
                  marginTop:8, fontStyle:"italic",
                }}>
                  <IconLock size={11} color="rgba(10,31,68,0.55)"/>
                  Tus asistentes solo verán "Ocupado".
                </div>
              )}
            </FL>

            {(form.tipo === "trabajo" || form.tipo === "cita") && (
              <FL label={form.tipo === "trabajo" ? "Tipo de actividad" : "Tipo de cita"}>
                <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                  {TIPO_EVENTO.find(t=>t.id===form.tipo)?.subtipos.map(v=>{
                    const tipoColor = TIPO_EVENTO.find(t=>t.id===form.tipo)?.color;
                    const active = form.subtipo === v;
                    return (
                      <button key={v} onClick={()=>sf("subtipo",v)}
                        style={{
                          padding:"6px 13px", borderRadius:9,
                          border:`1px solid ${active ? tipoColor+"55" : "rgba(10,31,68,0.08)"}`,
                          background: active ? tipoColor+"0c" : B.white,
                          color: active ? tipoColor : "rgba(10,31,68,0.65)",
                          fontFamily:"'Poppins',sans-serif",
                          fontWeight: active ? 600 : 500, fontSize:11.5,
                          cursor:"pointer",
                          transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                        }}>
                        {SUBTIPO_LABEL[v] || v}
                      </button>
                    );
                  })}
                </div>
              </FL>
            )}

            {/* Recordatorio cotización — toggle elegante */}
            {form.tipo === "cita" && (
              <div onClick={()=>sf("recordatorioCot",!form.recordatorioCot)}
                style={{
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  padding:"13px 15px", borderRadius:11,
                  background: form.recordatorioCot ? "rgba(198,169,107,0.06)" : "rgba(248,246,242,0.6)",
                  border:`1px solid ${form.recordatorioCot ? "rgba(198,169,107,0.30)" : "rgba(10,31,68,0.06)"}`,
                  cursor:"pointer",
                  transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                }}>
                <div style={{display:"flex", alignItems:"center", gap:11}}>
                  <div style={{
                    width:32, height:32, borderRadius:8,
                    background: form.recordatorioCot ? "rgba(198,169,107,0.15)" : "rgba(10,31,68,0.05)",
                    border:`1px solid ${form.recordatorioCot ? "rgba(198,169,107,0.25)" : "rgba(10,31,68,0.08)"}`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color: form.recordatorioCot ? B.gold : "rgba(10,31,68,0.45)",
                    flexShrink:0,
                  }}>
                    <IconBell size={15}/>
                  </div>
                  <div>
                    <div style={{fontSize:12.5, fontWeight:600, color:B.navy, letterSpacing:"0.005em"}}>Recordatorio: enviar cotización</div>
                    <div style={{fontSize:10.5, color:"rgba(10,31,68,0.50)", marginTop:2}}>Aparecerá un aviso 30 min después de guardar</div>
                  </div>
                </div>
                <div style={{
                  width:38, height:22, borderRadius:11,
                  background: form.recordatorioCot ? B.gold : "rgba(10,31,68,0.15)",
                  position:"relative",
                  transition:"background var(--mf-t-fast) var(--mf-ease-out)",
                  flexShrink:0,
                }}>
                  <div style={{
                    position:"absolute", top:2,
                    left: form.recordatorioCot ? 18 : 2,
                    width:18, height:18, borderRadius:"50%",
                    background:"#fff",
                    transition:"left var(--mf-t-fast) var(--mf-ease-out)",
                    boxShadow:"0 1px 3px rgba(10,31,68,0.20)",
                  }}/>
                </div>
              </div>
            )}

            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10}}>
              <FL label="Fecha inicio"><Inp type="date" value={form.fechaInicio} onChange={v=>sf("fechaInicio",v)}/></FL>
              <FL label="Fecha fin (opcional)"><Inp type="date" value={form.fechaFin} onChange={v=>sf("fechaFin",v)}/></FL>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(130px, 1fr))", gap:10}}>
              <FL label="Hora inicio"><HoraSelect value={form.horaInicio} onChange={v=>sf("horaInicio",v)}/></FL>
              <FL label="Hora fin"><HoraSelect value={form.horaFin} onChange={v=>sf("horaFin",v)}/></FL>
            </div>
            <FL label="Repetición"><Sel value={form.repeticion} onChange={v=>sf("repeticion",v)} options={REPETICION}/></FL>

            {form.tipo === "cita" && (
              <FL label="Vincular cliente">
                <Sel value={form.leadId} onChange={v=>sf("leadId",v)}
                  options={[{v:"",l:"— Seleccionar cliente —"}, ...leads.map(l=>({v:l.id, l:`${l.nombre} · ${l.producto}`}))]}/>
                {form.leadId && leads.find(l=>l.id===form.leadId) && (
                  <div style={{
                    marginTop:8, padding:"10px 13px", borderRadius:9,
                    background:"rgba(22,101,52,0.04)",
                    border:"1px solid rgba(22,101,52,0.18)",
                    display:"flex", alignItems:"center", gap:10,
                  }}>
                    <div style={{
                      width:28, height:28, borderRadius:"50%",
                      background:"rgba(22,101,52,0.10)",
                      border:"1px solid rgba(22,101,52,0.20)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:10, fontWeight:600, color:B.green,
                      flexShrink:0,
                    }}>{initials(leads.find(l=>l.id===form.leadId)?.nombre || "")}</div>
                    <div>
                      <div style={{fontSize:12.5, fontWeight:600, color:B.green, letterSpacing:"0.005em"}}>{leads.find(l=>l.id===form.leadId)?.nombre}</div>
                      <div style={{fontSize:10.5, color:"rgba(10,31,68,0.55)", marginTop:1}}>{leads.find(l=>l.id===form.leadId)?.producto}</div>
                    </div>
                  </div>
                )}
              </FL>
            )}

            <FL label="Notas"><Inp value={form.nota} onChange={v=>sf("nota",v)} rows={2} placeholder="Detalles del evento..."/></FL>
          </div>

          {/* Footer: eliminar (si edit) + cancelar/guardar */}
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:22, gap:10, flexWrap:"wrap"}}>
            {editId ? (
              <button onClick={()=>setConfirmEvDel(editId)}
                style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"8px 13px", borderRadius:8,
                  border:`1px solid ${B.redBright}30`,
                  background:"transparent", color:B.redBright,
                  fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:12,
                  cursor:"pointer",
                  transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                }}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(220,38,38,0.05)"; e.currentTarget.style.borderColor=B.redBright+"55";}}
                onMouseLeave={e=>{e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor=B.redBright+"30";}}>
                <IconTrash size={12} color={B.redBright}/>Eliminar evento
              </button>
            ) : <div/>}
            <div style={{display:"flex", gap:8}}>
              <button onClick={()=>setModalEv(false)}
                style={{
                  padding:"8px 14px", borderRadius:8,
                  border:"1px solid rgba(10,31,68,0.08)",
                  background:B.white, color:"rgba(10,31,68,0.65)",
                  fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:12,
                  cursor:"pointer",
                }}>Cancelar</button>
              <button onClick={guardar}
                style={{
                  padding:"8px 16px", borderRadius:8, border:"none",
                  background:"linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
                  color:"#fff",
                  fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:12.5,
                  cursor:"pointer",
                  boxShadow:"0 1px 2px rgba(10,31,68,0.10)",
                  transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                }}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 14px rgba(10,31,68,0.20)"; e.currentTarget.style.transform="translateY(-1px)";}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 2px rgba(10,31,68,0.10)"; e.currentTarget.style.transform="translateY(0)";}}>
                Guardar evento
              </button>
            </div>
          </div>
        </MFModal>
      )}
      {popupCot && (
        <div style={{
          position:"fixed", inset:0, zIndex:1200,
          background:"rgba(10,31,68,0.40)",
          backdropFilter:"blur(8px)", WebkitBackdropFilter:"blur(8px)",
          display:"flex", alignItems:"center", justifyContent:"center", padding:20,
          animation:"mfFadeIn .25s var(--mf-ease-out)",
        }} onClick={(e)=>{if(e.target===e.currentTarget) setPopupCot(null);}}>
          <div style={{
            background:"#F8F6F2",
            borderRadius:20,
            padding:"32px 28px 26px",
            maxWidth:400, width:"100%",
            boxShadow:"0 24px 60px rgba(10,31,68,0.25)",
            border:"1px solid rgba(10,31,68,0.05)",
            animation:"mfFadeUp .35s var(--mf-ease-spring)",
            textAlign:"center",
            fontFamily:"'Poppins', sans-serif",
          }}>
            <div style={{
              width:56, height:56, borderRadius:"50%",
              background:"rgba(198,169,107,0.10)",
              border:"1px solid rgba(198,169,107,0.25)",
              margin:"0 auto 18px",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              <IconBell size={26} color="#C6A96B"/>
            </div>
            <h2 style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:24, fontWeight:500,
              color:"#0A1F44", letterSpacing:"-0.01em",
              margin:"0 0 8px",
            }}>Recordatorio</h2>
            <p style={{
              fontSize:13.5, color:"rgba(10,31,68,0.65)",
              lineHeight:1.55, margin:"0 0 12px",
            }}>Tienes pendiente enviar la <strong style={{color:B.navy}}>cotización</strong>.</p>
            {popupCot.leadNombre && (
              <div style={{
                display:"inline-flex", alignItems:"center", gap:7,
                fontSize:12.5, color:B.green, fontWeight:600,
                background:"rgba(22,101,52,0.06)",
                border:"1px solid rgba(22,101,52,0.18)",
                padding:"5px 11px", borderRadius:8,
                marginBottom:8,
              }}>
                <IconUser size={11} color={B.green}/>
                {popupCot.leadNombre}
              </div>
            )}
            <div style={{
              fontSize:12.5, color:"rgba(10,31,68,0.55)",
              marginBottom:22, lineHeight:1.5,
            }}>{popupCot.titulo}</div>
            <div style={{display:"flex", gap:10, flexDirection:"column"}}>
              <button onClick={()=>setPopupCot(null)}
                style={{
                  padding:"13px 18px", borderRadius:12, border:"none",
                  background:"linear-gradient(135deg, #C6A96B 0%, #d4bc89 100%)",
                  color:"#0A1F44",
                  fontFamily:"'Poppins',sans-serif",
                  fontWeight:600, fontSize:13.5,
                  cursor:"pointer",
                  boxShadow:"0 4px 14px rgba(198,169,107,0.35)",
                  transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                  display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7,
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-1px)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";}}>
                <IconCheck size={14}/> Ya lo hice
              </button>
              <button onClick={()=>setPopupCot(null)}
                style={{
                  padding:"11px 18px", borderRadius:12,
                  border:"1px solid rgba(10,31,68,0.10)",
                  background:"transparent",
                  color:"rgba(10,31,68,0.65)",
                  fontFamily:"'Poppins',sans-serif",
                  fontWeight:500, fontSize:12.5,
                  cursor:"pointer",
                  transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                }}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmEvDel&&<ConfirmModal titulo="¿Eliminar este evento?" mensaje="Esta acción no se puede deshacer." icono="🗓️" textoConfirm="Sí, eliminar" colorConfirm={B.redBright} onConfirm={()=>{elimEv(confirmEvDel);setConfirmEvDel(null);setModalEv(false);}} onCancel={()=>setConfirmEvDel(null)}/>}
    </div>
  );
}
function _AgendaPanelLateral(){return null;}

function ListaLeads({leads,setLeads,setEventos,cuentas,usuario,esAsistente}) {
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
  if(filtTemp)base=base.filter(l=>getEstadoOportunidad(l)?.v===filtTemp);
  const vis=base;
  const total=vis.length;const activos=vis.filter(l=>!l.sinSeguimiento&&!["otro","cierre"].includes(l.etapa)).length;const sinSeg=vis.filter(l=>l.sinSeguimiento).length;const calientes=vis.filter(l=>getTempLead(l)?.nivel==="caliente").length;
  const seguAnt=tab==="actual"?leadsActual.filter(l=>{const mc=l.mesCreacion||l.ultimoContacto?.slice(0,7)||mesHoy;return mc<mesHoy&&l.etapa==="seguimiento"&&!l.sinSeguimiento;}).length:0;
  function save(d){
    const adminId = getAdminId(usuario);
    const viejo = leads.find(l => l.id === d.id);
    if (!viejo) {
      registrarActividad({ adminId, autor: usuario, tipo: "lead.creado",
        entidad: "lead", entidadId: d.id, entidadNombre: d.nombre });
    } else {
      const diff = diffLead(viejo, d);
      if (diff) registrarActividad({ adminId, autor: usuario, ...diff,
        entidad: "lead", entidadId: d.id, entidadNombre: d.nombre });
    }
    setLeads(p => p.find(l => l.id === d.id) ? p.map(l => l.id === d.id ? d : l) : [...p, d]);
  }
  function del(id){
    const viejo = leads.find(l => l.id === id);
    if (viejo) registrarActividad({ adminId: getAdminId(usuario), autor: usuario,
      tipo: "lead.eliminado", entidad: "lead", entidadId: id, entidadNombre: viejo.nombre });
    setLeads(p => p.filter(l => l.id !== id));
  }

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

  const LISTA_CSS = `
    .mf-table { width: 100%; border-collapse: collapse; min-width: 620px; font-family: 'Poppins', sans-serif; }
    .mf-th {
      text-align: left; padding: 12px 14px;
      font-size: 10px; font-weight: 600;
      color: rgba(10,31,68,0.50);
      text-transform: uppercase; letter-spacing: 0.10em;
      border-bottom: 1px solid rgba(10,31,68,0.06);
      white-space: nowrap;
      background: rgba(248,246,242,0.6);
      position: sticky; top: 0; z-index: 1;
    }
    .mf-td {
      padding: 12px 14px; font-size: 13px;
      border-bottom: 1px solid rgba(10,31,68,0.04);
      vertical-align: middle;
      color: rgba(10,31,68,0.85);
    }
    .mf-tr {
      transition: background-color var(--mf-t-fast) var(--mf-ease-out);
      cursor: pointer;
    }
    .mf-tr:hover .mf-td { background: rgba(10,31,68,0.022); }
    .mf-tr.rojo .mf-td { background: rgba(220,38,38,0.025); }
    .mf-tr.seg-ant .mf-td { background: rgba(217,119,6,0.025); }
    .mf-tel-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 5px 10px; border-radius: 8px;
      border: 1px solid rgba(10,31,68,0.08);
      background: transparent;
      color: rgba(10,31,68,0.85);
      font-family: 'Poppins', sans-serif;
      font-size: 12px; font-weight: 500;
      cursor: pointer;
      transition: all var(--mf-t-fast) var(--mf-ease-out);
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }
    .mf-tel-btn:hover {
      border-color: rgba(198,169,107,0.40);
      background: rgba(198,169,107,0.05);
      color: #0A1F44;
    }
    @media (max-width: 640px) { .mf-col-hide { display: none !important; } }
  `;
  const fmtMes = m => { const [y, mo] = m.split("-"); return `${["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"][parseInt(mo)-1]} ${y}`; };
  const tempColorOf = (lead) => getEstadoOportunidad(lead)?.color || null;

  return (<div className="mf-fade-in">
    <style>{LISTA_CSS}</style>

    {/* ═══ Tabs de mes — estilo Notion/Linear ═══ */}
    <div style={{marginBottom: 18}}>
      <div style={{
        display: "flex", gap: 2,
        background: "transparent",
        padding: 0,
        overflowX: "auto",
        WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none",
        borderBottom: "1px solid rgba(10,31,68,0.06)",
      }}>
        {[
          { v: "actual", label: fmtMes(mesHoy), count: leadsActual.length },
          ...(!esAsistente ? [{ v: "sig", label: fmtMes(mesSig), count: leadsSiguiente.length }] : []),
          ...mesesDisponibles.filter(m => m !== mesHoy && m !== mesSig).map(m => ({
            v: m, label: fmtMes(m),
            count: leads.filter(l => (l.mesCreacion || l.ultimoContacto?.slice(0,7) || mesHoy) === m).length
          })),
        ].map(t => {
          const active = tab === t.v;
          return (
            <button key={t.v} onClick={()=>setTab(t.v)}
              style={{
                flexShrink: 0,
                position: "relative",
                padding: "10px 14px 11px",
                borderRadius: 0,
                border: "none",
                background: "transparent",
                color: active ? B.navy : "rgba(10,31,68,0.50)",
                fontFamily: "'Poppins', sans-serif",
                fontWeight: active ? 600 : 500,
                fontSize: 12.5,
                letterSpacing: "0.005em",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "color var(--mf-t-fast) var(--mf-ease-out)",
              }}
              onMouseEnter={e=>{if(!active) e.currentTarget.style.color = "rgba(10,31,68,0.80)";}}
              onMouseLeave={e=>{if(!active) e.currentTarget.style.color = "rgba(10,31,68,0.50)";}}>
              {t.label}
              <span style={{
                marginLeft: 7,
                padding: "1px 7px", borderRadius: 12,
                background: active ? "rgba(10,31,68,0.06)" : "rgba(10,31,68,0.04)",
                color: active ? B.navy : "rgba(10,31,68,0.45)",
                fontSize: 10, fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}>{t.count}</span>
              {active && (
                <span style={{
                  position: "absolute", left: 8, right: 8, bottom: -1, height: 2,
                  background: B.gold, borderRadius: "2px 2px 0 0",
                }}/>
              )}
            </button>
          );
        })}
      </div>

      {tab === "actual" && seguAnt > 0 && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 10,
          background: "rgba(217,119,6,0.04)",
          border: "1px solid rgba(217,119,6,0.15)",
          fontSize: 12, color: B.amber, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <IconRefresh size={14} color={B.amber}/>
          <span>{seguAnt} lead{seguAnt!==1?"s":""} de meses anteriores en <strong>Seguimiento</strong> incluido{seguAnt!==1?"s":""}.</span>
        </div>
      )}
      {tab === "sig" && !esAsistente && (
        <div style={{
          marginTop: 12, padding: "10px 14px", borderRadius: 10,
          background: "rgba(22,101,52,0.04)",
          border: "1px solid rgba(22,101,52,0.15)",
          fontSize: 12, color: B.green, fontWeight: 500,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <IconCalendar size={14} color={B.green}/>
          <span>Leads del <strong>próximo mes</strong>.</span>
        </div>
      )}
    </div>

    {/* ═══ Stats minimalistas (mismo lenguaje que Dashboard) ═══ */}
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 12, marginBottom: 18,
    }}>
      {[
        { l: "Total", v: total, dot: null },
        { l: "Activos", v: activos, dot: B.green },
        { l: "Calientes", v: calientes, dot: "#dc2626" },
        { l: "Sin seguimiento", v: sinSeg, dot: B.redBright },
      ].map((s, i) => (
        <div key={i} className={`mf-fade-up mf-stagger-${i+1}`}
          style={{
            background: B.white,
            border: "1px solid rgba(10,31,68,0.06)",
            borderRadius: 12,
            padding: "14px 16px 12px",
            boxShadow: "var(--mf-shadow-xs)",
          }}>
          <div style={{display: "flex", alignItems: "center", gap: 6, marginBottom: 6}}>
            {s.dot && <span style={{width: 6, height: 6, borderRadius: "50%", background: s.dot}}/>}
            <div style={{
              fontSize: 10, fontWeight: 500,
              color: "rgba(10,31,68,0.45)",
              textTransform: "uppercase",
              letterSpacing: "0.10em",
            }}>{s.l}</div>
          </div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 30, fontWeight: 500,
            lineHeight: 1, letterSpacing: "-0.01em",
            color: B.navy,
            fontVariantNumeric: "tabular-nums",
          }}>{s.v}</div>
        </div>
      ))}
    </div>

    {/* ═══ Toolbar: buscador + filtros + nuevo lead ═══ */}
    <div style={{display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center"}}>
      <div style={{position: "relative", flex: 1, minWidth: 200, display: "flex", alignItems: "center"}}>
        <span style={{
          position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
          color: "rgba(10,31,68,0.35)", pointerEvents: "none", display: "inline-flex",
        }}>
          <IconSearch size={15}/>
        </span>
        <input value={busq} onChange={e=>setBusq(e.target.value)}
          placeholder="Buscar por nombre, teléfono o estado…"
          style={{
            width: "100%", paddingLeft: 38, paddingRight: 14,
            paddingTop: 10, paddingBottom: 10, minHeight: 38,
            borderRadius: 10,
            border: "1px solid rgba(10,31,68,0.08)",
            background: B.white,
            color: B.navy,
            fontFamily: "'Poppins', sans-serif",
            fontSize: 14, fontWeight: 400,
            outline: "none", WebkitAppearance: "none",
            boxShadow: "var(--mf-shadow-xs)",
          }}
          onFocus={e=>{e.target.style.borderColor="rgba(198,169,107,0.55)"; e.target.style.boxShadow="0 0 0 4px rgba(198,169,107,0.10)";}}
          onBlur={e=>{e.target.style.borderColor="rgba(10,31,68,0.08)"; e.target.style.boxShadow="var(--mf-shadow-xs)";}}
        />
      </div>
      <Sel value={filtProd} onChange={setFiltProd} options={[{v:"",l:"Producto"},...PRODUCTOS_LEAD.map(p=>({v:p,l:p}))]}/>
      <Sel value={filtEtapa} onChange={setFiltEtapa} options={[{v:"",l:"Etapa"},...ETAPAS.map(e=>({v:e.id,l:e.label}))]}/>
      <Sel value={filtTemp} onChange={setFiltTemp} options={[
        {v:"",l:"Estado de oportunidad"},
        ...ESTADOS_OPORTUNIDAD.map(e => ({ v:e.v, l:e.l })),
      ]}/>
      {(busq||filtProd||filtEtapa||filtTemp) && (
        <button onClick={()=>{setBusq(""); setFiltProd(""); setFiltEtapa(""); setFiltTemp("");}}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "8px 12px", borderRadius: 8,
            border: "1px solid rgba(10,31,68,0.08)",
            background: B.white,
            color: "rgba(10,31,68,0.65)",
            fontFamily: "'Poppins', sans-serif",
            fontSize: 12, fontWeight: 500,
            cursor: "pointer",
          }}>
          <IconX size={12}/>Limpiar
        </button>
      )}
      <button onClick={()=>setNuevoM(true)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 14px", borderRadius: 8,
          border: "none",
          background: "linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
          color: "#fff",
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 600, fontSize: 12.5,
          cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
          boxShadow: "0 1px 2px rgba(10,31,68,0.10)",
        }}
        onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 14px rgba(10,31,68,0.20)"; e.currentTarget.style.transform="translateY(-1px)";}}
        onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 1px 2px rgba(10,31,68,0.10)"; e.currentTarget.style.transform="translateY(0)";}}>
        <IconPlus size={13} color="#fff"/>Nuevo lead
      </button>
    </div>

    {/* ═══ Tabla premium ═══ */}
    <div style={{
      background: B.white,
      borderRadius: 14,
      border: "1px solid rgba(10,31,68,0.06)",
      boxShadow: "var(--mf-shadow-xs)",
      overflow: "hidden",
    }}>
      <div className="mf-table-wrap">
        <table className="mf-table">
          <thead><tr>
            <th className="mf-th" style={{width: 40, textAlign: "center", padding: "12px 8px"}}>
              <input type="checkbox" checked={todosVisSeleccionados} onChange={toggleSeleccionarTodos}
                aria-label="Seleccionar todos los visibles"
                style={{width: 16, height: 16, cursor: "pointer", accentColor: B.navy}}/>
            </th>
            <th className="mf-th" style={{width: 36}}>#</th>
            <th className="mf-th">Nombre</th>
            <th className="mf-th">Contacto</th>
            <th className="mf-th mf-col-hide">Estado</th>
            <th className="mf-th mf-col-hide">Producto</th>
            <th className="mf-th">Etapa</th>
            <th className="mf-th" style={{textAlign: "center", width: 56}}>T°</th>
            <th className="mf-th mf-col-hide">Último contacto</th>
            <th className="mf-th">Checklist</th>
          </tr></thead>
          <tbody>
            {vis.length === 0 && (
              <tr><td colSpan={10} className="mf-td" style={{
                textAlign: "center", color: "rgba(10,31,68,0.30)",
                padding: "48px 16px", fontStyle: "italic", fontSize: 13,
                letterSpacing: "0.01em",
              }}>Sin leads en este período</td></tr>
            )}
            {vis.map((lead, idx) => {
              const etapa = ETAPAS.find(e => e.id === lead.etapa) || ETAPAS[0];
              const tempColor = tempColorOf(lead);
              const alerts = getAlertas(lead);
              const sinSeg2 = lead.sinSeguimiento || lead.checklist?.noInteres;
              const mc = lead.mesCreacion || lead.ultimoContacto?.slice(0,7) || mesHoy;
              const esSeguAnt = tab === "actual" && mc < mesHoy && lead.etapa === "seguimiento";
              const chkDone = Object.values(lead.checklist || {}).filter(Boolean).length;
              const chkTot = CHECKLIST_DEF.length;
              const seleccionado = seleccionados.has(lead.id);
              return (
                <tr key={lead.id}
                  className={`mf-tr${sinSeg2 ? " rojo" : esSeguAnt ? " seg-ant" : ""}`}
                  onClick={()=>setLeadAct(lead)}
                  style={seleccionado ? {background: "rgba(198,169,107,0.07)"} : {}}>
                  <td className="mf-td" style={{width: 40, textAlign: "center", padding: "12px 8px"}}
                    onClick={e=>e.stopPropagation()}>
                    <input type="checkbox" checked={seleccionado}
                      onChange={(e)=>toggleSeleccion(lead.id, e)}
                      aria-label={`Seleccionar ${lead.nombre}`}
                      style={{width: 16, height: 16, cursor: "pointer", accentColor: B.navy}}/>
                  </td>
                  <td className="mf-td" style={{color: "rgba(10,31,68,0.35)", fontSize: 11, width: 36, fontVariantNumeric: "tabular-nums"}}>{idx+1}</td>
                  <td className="mf-td">
                    <div style={{display: "flex", alignItems: "center", gap: 10}}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                        background: sinSeg2 ? "rgba(220,38,38,0.08)"
                                  : esSeguAnt ? "rgba(217,119,6,0.10)"
                                  : "rgba(10,31,68,0.06)",
                        border: `1px solid ${sinSeg2 ? "rgba(220,38,38,0.18)"
                                          : esSeguAnt ? "rgba(217,119,6,0.20)"
                                          : "rgba(10,31,68,0.10)"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 600,
                        color: sinSeg2 ? B.redBright : esSeguAnt ? B.amber : B.navy,
                        letterSpacing: "-0.005em",
                      }}>{initials(lead.nombre)}</div>
                      <div style={{minWidth: 0}}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6,
                          fontWeight: 600, fontSize: 13.5,
                          color: sinSeg2 ? B.redBright : B.navy,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          maxWidth: 200, letterSpacing: "-0.005em",
                        }}>
                          {sinSeg2 && <IconMinusCircle size={12} color={B.redBright}/>}
                          {esSeguAnt && !sinSeg2 && <IconRefresh size={12} color={B.amber}/>}
                          {lead.nombre}
                        </div>
                        <div style={{fontSize: 11, color: "rgba(10,31,68,0.45)", marginTop: 2}}>
                          {lead.edad && `${lead.edad} años`}
                          {esSeguAnt && <span style={{color: B.amber, fontWeight: 500}}> · seguimiento anterior</span>}
                        </div>
                        {alerts.slice(0,1).map((a,i)=>(
                          <div key={i} style={{
                            fontSize: 10, color: a.color, fontWeight: 500, marginTop: 2,
                            display: "inline-flex", alignItems: "center", gap: 4,
                          }}>
                            <span style={{
                              width: 4, height: 4, borderRadius: "50%", background: a.color,
                              animation: a.tipo === "riesgo" ? "mfPulseDot 1.6s var(--mf-ease-out) infinite" : "none",
                            }}/>
                            {a.msg}
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="mf-td" onClick={e=>e.stopPropagation()}>
                    <button className="mf-tel-btn" onClick={()=>setContactoL(lead)}>
                      <IconPhoneCall size={12}/>{lead.telefono || "—"}
                    </button>
                  </td>
                  <td className="mf-td mf-col-hide" style={{color: "rgba(10,31,68,0.65)", fontSize: 12}}>{lead.estado || "—"}</td>
                  <td className="mf-td mf-col-hide">
                    {lead.producto ? (
                      <span style={{
                        fontSize: 10.5, fontWeight: 500,
                        color: B.navy,
                        background: "rgba(10,31,68,0.05)",
                        padding: "3px 9px", borderRadius: 6,
                        letterSpacing: "0.005em",
                      }}>{lead.producto}</span>
                    ) : "—"}
                  </td>
                  <td className="mf-td">
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 11.5, fontWeight: 500,
                      color: etapa.color,
                      background: etapa.color + "0c",
                      border: `1px solid ${etapa.color}25`,
                      padding: "3px 9px", borderRadius: 6,
                      letterSpacing: "0.005em",
                      whiteSpace: "nowrap",
                    }}>
                      <span style={{width: 5, height: 5, borderRadius: "50%", background: etapa.color}}/>
                      {etapa.label.replace(/[¡⭐!]/g, "").trim()}
                    </span>
                  </td>
                  <td className="mf-td" style={{textAlign: "center"}}>
                    {getEstadoOportunidad(lead) ? (
                      <BadgeEstado lead={lead} size="xs"/>
                    ) : (
                      <span style={{color: "rgba(10,31,68,0.15)", fontSize: 11}}>—</span>
                    )}
                  </td>
                  <td className="mf-td mf-col-hide" style={{fontSize: 11, color: "rgba(10,31,68,0.45)", fontVariantNumeric: "tabular-nums"}}>{fmtF(lead.ultimoContacto)}</td>
                  <td className="mf-td" onClick={e=>e.stopPropagation()}>
                    <div style={{display: "flex", alignItems: "center", gap: 8}}>
                      <div style={{width: 56, height: 4, background: "rgba(10,31,68,0.06)", borderRadius: 2, overflow: "hidden"}}>
                        <div style={{
                          height: "100%", borderRadius: 2,
                          transition: "width var(--mf-t-slow) var(--mf-ease-out)",
                          width: `${Math.round(chkDone/chkTot*100)}%`,
                          background: sinSeg2 ? B.redBright
                                    : chkDone >= 5 ? B.green
                                    : chkDone >= 3 ? B.amber
                                    : B.blue,
                        }}/>
                      </div>
                      <span style={{
                        fontSize: 10.5, color: "rgba(10,31,68,0.45)", fontWeight: 500,
                        fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap",
                      }}>{chkDone}/{chkTot}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{
        padding: "12px 18px",
        borderTop: "1px solid rgba(10,31,68,0.06)",
        fontSize: 11, color: "rgba(10,31,68,0.45)", fontWeight: 500,
        letterSpacing: "0.01em",
      }}>
        {vis.length} lead{vis.length !== 1 ? "s" : ""} · {tab === "actual" ? `${fmtMes(mesHoy)} (mes actual)` : fmtMes(tab)}
      </div>
    </div>
    {contactoL&&<ContactoModal lead={contactoL} onClose={()=>setContactoL(null)}/>}
    {leadAct&&<LeadModal lead={leadAct} onClose={()=>setLeadAct(null)} onSave={save} onDelete={del} cuentas={cuentas} usuario={usuario} setEventos={setEventos}/>}
    {nuevoM&&<LeadModal lead={{...emptyL,mesCreacion:tab==="sig"?mesSig:mesHoy}} onClose={()=>setNuevoM(false)} onSave={d=>{save(d);setNuevoM(false);}} onDelete={()=>{}} cuentas={cuentas} usuario={usuario} setEventos={setEventos}/>}

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
          padding:"9px 14px", borderRadius:9, border:"none",
          background:B.redBright, color:"#fff",
          fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:12,
          cursor:"pointer", display:"inline-flex", alignItems:"center", gap:7,
          boxShadow:`0 4px 14px ${B.redBright}55`,
          transition:"all var(--mf-t-fast) var(--mf-ease-out)",
        }}>
          <IconTrash size={13} color="#fff"/>Eliminar
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
  const [datos,setDatos] = useState([]);
  const [cargando,setCargando] = useState(false);
  const [filtProd,setFiltProd] = useState("");
  const [tab,setTab] = useState("dashboard");
  const fileRef = useRef();
  const ahora = new Date();
  const mesBd = `${ahora.getFullYear()}-${String(ahora.getMonth()+1).padStart(2,"0")}`;
  const mesSig = new Date(ahora.getFullYear(),ahora.getMonth()+1,1);
  const mesSigBd = `${mesSig.getFullYear()}-${String(mesSig.getMonth()+1).padStart(2,"0")}`;

  function normFecha(v){if(!v)return null;const s=String(v).trim();if(/^\d{5}$/.test(s)){const d=new Date((Number(s)-25569)*86400000);return d.toISOString().split("T")[0];}if(/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)){const[d,m,y]=s.split("/");return `${y}-${m.padStart(2,"0")}-${d.padStart(2,"0")}`;}if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;try{const d=new Date(s);if(!isNaN(d.getTime()))return d.toISOString().split("T")[0];}catch{}return null;}

  async function cargarExcel(e){const file=e.target.files?.[0];if(!file)return;setCargando(true);try{const{default:XLSX}=await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");const ab=await file.arrayBuffer();const wb=XLSX.read(ab);const ws=wb.Sheets[wb.SheetNames[0]];const rows=XLSX.utils.sheet_to_json(ws,{defval:""});const mapped=rows.map(r=>{const poliza=String(r["Póliza"]||r["Poliza"]||r["No. Póliza"]||r["POLIZA"]||r["poliza"]||"").trim();const nombre=String(r["Nombre"]||r["Cliente"]||r["NOMBRE"]||r["nombre"]||"").trim();const producto=String(r["Producto"]||r["PRODUCTO"]||r["producto"]||r["Ramo"]||"").trim();const vencStr=r["Vencimiento"]||r["Fecha Vencimiento"]||r["FechaVencimiento"]||r["VENCIMIENTO"]||r["Renovación"]||r["Renovacion"]||"";const vencimiento=normFecha(vencStr);const diasAtraso=Number(r["Días Atraso"]||r["Dias Atraso"]||r["DiasAtraso"]||r["dias_atraso"]||0)||0;const estatus=String(r["Estatus"]||r["Status"]||r["ESTATUS"]||"Al corriente").trim();const telefono=String(r["Teléfono"]||r["Telefono"]||r["TEL"]||"").trim();return{poliza,nombre,producto,vencimiento,diasAtraso,estatus,telefono};}).filter(r=>r.nombre||r.poliza);setDatos(mapped);setTab("dashboard");}catch{alert("Error al leer el archivo.");}setCargando(false);e.target.value="";}

  async function exportarFiltrado(lista,nombre){try{const{default:XLSX}=await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");const data=lista.map(r=>({Póliza:r.poliza,Cliente:r.nombre,Producto:r.producto,"Fecha vencimiento":fmtF(r.vencimiento),"Días atraso":r.diasAtraso,Estatus:r.estatus,Teléfono:r.telefono}));const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Cobranza MarFlow");XLSX.writeFile(wb,`marflow_cobranza_${nombre}_${hoy()}.xlsx`);}catch{alert("Error al exportar.");}}

  const datosFilt = datos.filter(d=>!filtProd||d.producto.toLowerCase().includes(filtProd.toLowerCase()));
  const renovMes = datosFilt.filter(d=>d.vencimiento&&d.vencimiento.startsWith(mesBd));
  const renovSig = datosFilt.filter(d=>d.vencimiento&&d.vencimiento.startsWith(mesSigBd));
  const atraso35 = datosFilt.filter(d=>d.diasAtraso>35);
  const alCorriente = datosFilt.filter(d=>d.diasAtraso===0||d.estatus.toLowerCase().includes("corriente")||d.estatus.toLowerCase().includes("vigente"));

  // Estatus: dot color + label sin emoji
  const statusOf = (d) => {
    if (d.diasAtraso > 35) return { color: B.redBright, label: "Crítico", bg: "rgba(220,38,38,0.025)" };
    if (d.diasAtraso > 0)  return { color: B.amber,     label: "Atraso",  bg: "rgba(217,119,6,0.025)" };
    return { color: B.green, label: "Al corriente", bg: "rgba(22,101,52,0.020)" };
  };

  // Botón WhatsApp minimalista (SVG inline)
  const WAButton = ({ tel, small }) => {
    if (!tel) return <span style={{color:"rgba(10,31,68,0.30)", fontSize:11}}>—</span>;
    const size = small ? 26 : 30;
    return (
      <a href={`https://wa.me/52${tel.replace(/\D/g,"")}`} target="_blank" rel="noreferrer"
        style={{
          width: size, height: size, borderRadius: "50%",
          background: "rgba(37,211,102,0.10)",
          border: "1px solid rgba(37,211,102,0.30)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          textDecoration: "none",
          transition: "all var(--mf-t-fast) var(--mf-ease-out)",
          flexShrink: 0,
        }}
        onMouseEnter={e=>{e.currentTarget.style.background="rgba(37,211,102,0.18)"; e.currentTarget.style.transform="translateY(-1px)";}}
        onMouseLeave={e=>{e.currentTarget.style.background="rgba(37,211,102,0.10)"; e.currentTarget.style.transform="translateY(0)";}}>
        <svg width={small?11:13} height={small?11:13} viewBox="0 0 24 24" fill="#25d366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    );
  };

  // Tabla minimalista editorial
  function Tabla({ lista, cols, titulo, color, onExport }) {
    if (lista.length === 0) {
      return (
        <div style={{
          fontSize:13, color:"rgba(10,31,68,0.30)", textAlign:"center", padding:"32px 0",
          fontStyle:"italic", letterSpacing:"0.01em",
        }}>Sin registros</div>
      );
    }
    return (
      <>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14}}>
          <div>
            <div style={{
              fontFamily:"'Cormorant Garamond', serif",
              fontSize:20, fontWeight:500,
              color, letterSpacing:"-0.01em",
            }}>{titulo}</div>
            <div style={{
              fontSize:11, color:"rgba(10,31,68,0.45)", marginTop:2,
              fontVariantNumeric:"tabular-nums",
            }}>{lista.length} registro{lista.length!==1?"s":""}</div>
          </div>
          <button onClick={onExport}
            style={{
              display:"inline-flex", alignItems:"center", gap:6,
              padding:"8px 12px", borderRadius:8,
              border:"1px solid rgba(10,31,68,0.08)",
              background:B.white, color:"rgba(10,31,68,0.85)",
              fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:12,
              cursor:"pointer",
              transition:"all var(--mf-t-fast) var(--mf-ease-out)",
            }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(198,169,107,0.30)"; e.currentTarget.style.background="rgba(198,169,107,0.03)";}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(10,31,68,0.08)"; e.currentTarget.style.background=B.white;}}>
            <IconDownload size={13}/>Exportar
          </button>
        </div>
        <div style={{overflowX:"auto", WebkitOverflowScrolling:"touch"}}>
          <table style={{width:"100%", borderCollapse:"collapse", minWidth:560, fontFamily:"'Poppins',sans-serif"}}>
            <thead>
              <tr style={{background:"rgba(248,246,242,0.6)"}}>
                {cols.map(c => (
                  <th key={c} style={{
                    textAlign:"left", padding:"11px 14px",
                    fontSize:10, fontWeight:600,
                    color:"rgba(10,31,68,0.50)",
                    textTransform:"uppercase", letterSpacing:"0.10em",
                    borderBottom:"1px solid rgba(10,31,68,0.06)",
                    whiteSpace:"nowrap",
                  }}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map((r, i) => {
                const s = statusOf(r);
                return (
                  <tr key={i} style={{
                    background: s.bg,
                    borderBottom: "1px solid rgba(10,31,68,0.04)",
                    transition: "background-color var(--mf-t-fast) var(--mf-ease-out)",
                  }}>
                    <td style={{padding:"11px 14px", fontSize:12.5, fontWeight:500, color:B.navy, fontVariantNumeric:"tabular-nums"}}>{r.poliza || "—"}</td>
                    <td style={{padding:"11px 14px", fontSize:13, color:"rgba(10,31,68,0.85)", fontWeight:500}}>{r.nombre}</td>
                    <td style={{padding:"11px 14px"}}>
                      {r.producto ? (
                        <span style={{
                          fontSize:10.5, fontWeight:500, color:B.navy,
                          background:"rgba(10,31,68,0.05)",
                          padding:"3px 9px", borderRadius:6,
                          letterSpacing:"0.005em",
                        }}>{r.producto}</span>
                      ) : "—"}
                    </td>
                    <td style={{padding:"11px 14px", fontSize:12, color:"rgba(10,31,68,0.65)", fontVariantNumeric:"tabular-nums"}}>{fmtF(r.vencimiento)}</td>
                    {cols.includes("Días atraso") && (
                      <td style={{padding:"11px 14px"}}>
                        {r.diasAtraso > 0 ? (
                          <span style={{
                            fontFamily:"'Cormorant Garamond', serif",
                            fontSize:18, fontWeight:500, color:s.color,
                            fontVariantNumeric:"tabular-nums", lineHeight:1,
                          }}>{r.diasAtraso}<span style={{fontSize:11, color:"rgba(10,31,68,0.40)", marginLeft:2}}>d</span></span>
                        ) : (
                          <span style={{color:"rgba(10,31,68,0.30)", fontSize:12}}>—</span>
                        )}
                      </td>
                    )}
                    {cols.includes("Estatus") && (
                      <td style={{padding:"11px 14px"}}>
                        <span style={{
                          display:"inline-flex", alignItems:"center", gap:6,
                          fontSize:11.5, fontWeight:500,
                          color:s.color,
                          background:s.color + "0c",
                          border:`1px solid ${s.color}25`,
                          padding:"2px 9px", borderRadius:6,
                          letterSpacing:"0.005em", whiteSpace:"nowrap",
                        }}>
                          <span style={{width:5, height:5, borderRadius:"50%", background:s.color}}/>
                          {s.label}
                        </span>
                      </td>
                    )}
                    {cols.includes("Contacto") && (
                      <td style={{padding:"11px 14px"}}>
                        <WAButton tel={r.telefono} small/>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // ── Estado vacío premium ──
  if (datos.length === 0) {
    return (
      <div className="mf-fade-in" style={{
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
        padding:"60px 20px", textAlign:"center", maxWidth:480, margin:"0 auto",
      }}>
        <div style={{
          width:72, height:72, borderRadius:"50%",
          background:"rgba(198,169,107,0.08)",
          border:"1px solid rgba(198,169,107,0.20)",
          display:"flex", alignItems:"center", justifyContent:"center",
          marginBottom:24,
        }}>
          <IconDollar size={32} color="#C6A96B"/>
        </div>
        <div style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:32, fontWeight:500,
          color:B.navy, letterSpacing:"-0.02em",
          lineHeight:1.1, marginBottom:10,
        }}>Cobranza</div>
        <div style={{
          fontSize:14, color:"rgba(10,31,68,0.55)",
          maxWidth:380, lineHeight:1.6, marginBottom:32,
          fontStyle:"italic",
        }}>Sube tu archivo Excel para visualizar renovaciones, atrasos y alertas automáticas.</div>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={cargarExcel}/>
        <button onClick={()=>fileRef.current?.click()} disabled={cargando}
          style={{
            display:"inline-flex", alignItems:"center", gap:8,
            padding:"13px 24px", borderRadius:10, border:"none",
            background: "linear-gradient(135deg, #0A1F44 0%, #122550 100%)",
            color:"#fff",
            fontFamily:"'Poppins',sans-serif", fontWeight:600, fontSize:13.5,
            cursor: cargando ? "not-allowed" : "pointer",
            opacity: cargando ? 0.7 : 1,
            boxShadow:"0 4px 14px rgba(10,31,68,0.18)",
            transition:"all var(--mf-t-fast) var(--mf-ease-out)",
          }}
          onMouseEnter={e=>{if(!cargando){e.currentTarget.style.boxShadow="0 8px 24px rgba(10,31,68,0.25)"; e.currentTarget.style.transform="translateY(-1px)";}}}
          onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 4px 14px rgba(10,31,68,0.18)"; e.currentTarget.style.transform="translateY(0)";}}>
          {cargando ? <><IconLoader size={14} color="#fff"/>Procesando…</> : <><IconUpload size={14} color="#fff"/>Subir Excel</>}
        </button>
      </div>
    );
  }

  // KPIs hero estilo banca privada
  const kpis = [
    { l:"Total registros",      v:datosFilt.length, dot:B.navy      },
    { l:"Renovaciones este mes", v:renovMes.length, dot:B.amber     },
    { l:"Renovaciones próx. mes",v:renovSig.length, dot:B.blue      },
    { l:"Atraso crítico +35d",  v:atraso35.length,  dot:B.redBright },
    { l:"Al corriente",         v:alCorriente.length,dot:B.green    },
  ];

  const tabs = [
    { v:"dashboard", l:"Resumen",                             count:null },
    { v:"renovMes",  l:`Renov. ${MESES[ahora.getMonth()].slice(0,3)}.`,    count:renovMes.length },
    { v:"renovSig",  l:`Renov. ${MESES[mesSig.getMonth()].slice(0,3)}.`,   count:renovSig.length },
    { v:"atraso",    l:"Atrasos +35d",                        count:atraso35.length },
    { v:"todos",     l:"Todos",                                count:datosFilt.length },
  ];

  return (
    <div className="mf-fade-in" style={{maxWidth:1280, margin:"0 auto"}}>
      {/* ═══ Hero editorial ═══ */}
      <div style={{marginBottom:24}}>
        <div style={{
          fontSize:10.5, fontWeight:500,
          color:"rgba(10,31,68,0.45)",
          textTransform:"uppercase", letterSpacing:"0.22em",
          marginBottom:10,
        }}>Análisis · Cartera de pólizas</div>
        <h1 style={{
          fontFamily:"'Cormorant Garamond', serif",
          fontSize:"clamp(30px, 4.8vw, 42px)",
          fontWeight:500, lineHeight:1.08,
          letterSpacing:"-0.025em",
          color:B.navy,
          margin:"0 0 10px",
        }}>Cobranza</h1>
        <p style={{
          fontSize:14, color:"rgba(10,31,68,0.50)",
          margin:0, fontWeight:400, lineHeight:1.5,
          fontStyle:"italic",
        }}>Renovaciones próximas, pólizas vigentes y atrasos por atender.</p>
      </div>

      {/* ═══ Toolbar premium ═══ */}
      <div style={{display:"flex", gap:10, marginBottom:18, flexWrap:"wrap", alignItems:"center"}}>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={cargarExcel}/>
        <button onClick={()=>fileRef.current?.click()} disabled={cargando}
          style={{
            display:"inline-flex", alignItems:"center", gap:6,
            padding:"8px 12px", minHeight:36, borderRadius:8,
            border:"1px solid rgba(10,31,68,0.08)",
            background:B.white, color:"rgba(10,31,68,0.85)",
            fontFamily:"'Poppins',sans-serif", fontWeight:500, fontSize:12.5,
            cursor:"pointer",
            boxShadow:"var(--mf-shadow-xs)",
            transition:"all var(--mf-t-fast) var(--mf-ease-out)",
            opacity: cargando ? 0.7 : 1,
          }}
          onMouseEnter={e=>{if(!cargando){e.currentTarget.style.borderColor="rgba(198,169,107,0.30)"; e.currentTarget.style.background="rgba(198,169,107,0.03)";}}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(10,31,68,0.08)"; e.currentTarget.style.background=B.white;}}>
          {cargando ? <IconLoader size={13}/> : <IconUpload size={13}/>}
          {cargando ? "Procesando…" : "Actualizar Excel"}
        </button>
        <div style={{position:"relative", flex:1, minWidth:200, display:"flex", alignItems:"center"}}>
          <span style={{position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"rgba(10,31,68,0.35)", pointerEvents:"none", display:"inline-flex"}}>
            <IconSearch size={15}/>
          </span>
          <input value={filtProd} onChange={e=>setFiltProd(e.target.value)}
            placeholder="Filtrar por producto…"
            style={{
              width:"100%", paddingLeft:38, paddingRight:14,
              paddingTop:10, paddingBottom:10, minHeight:38,
              borderRadius:10,
              border:"1px solid rgba(10,31,68,0.08)",
              background:B.white, color:B.navy,
              fontFamily:"'Poppins',sans-serif", fontSize:14, fontWeight:400,
              outline:"none", WebkitAppearance:"none",
              boxShadow:"var(--mf-shadow-xs)",
            }}
            onFocus={e=>{e.target.style.borderColor="rgba(198,169,107,0.55)"; e.target.style.boxShadow="0 0 0 4px rgba(198,169,107,0.10)";}}
            onBlur={e=>{e.target.style.borderColor="rgba(10,31,68,0.08)"; e.target.style.boxShadow="var(--mf-shadow-xs)";}}
          />
        </div>
        <div style={{fontSize:11, color:"rgba(10,31,68,0.45)", fontVariantNumeric:"tabular-nums", whiteSpace:"nowrap"}}>
          {datosFilt.length} registros
        </div>
      </div>

      {/* ═══ Tabs estilo Notion/Linear ═══ */}
      <div style={{display:"flex", gap:2, marginBottom:22, borderBottom:"1px solid rgba(10,31,68,0.06)", overflowX:"auto", WebkitOverflowScrolling:"touch", scrollbarWidth:"none"}}>
        {tabs.map(t => {
          const active = tab === t.v;
          return (
            <button key={t.v} onClick={()=>setTab(t.v)}
              style={{
                flexShrink:0, position:"relative",
                padding:"10px 14px 11px",
                border:"none", background:"transparent",
                color: active ? B.navy : "rgba(10,31,68,0.50)",
                fontFamily:"'Poppins',sans-serif",
                fontWeight: active ? 600 : 500, fontSize:12.5,
                letterSpacing:"0.005em", cursor:"pointer",
                whiteSpace:"nowrap",
                transition:"color var(--mf-t-fast) var(--mf-ease-out)",
              }}
              onMouseEnter={e=>{if(!active) e.currentTarget.style.color="rgba(10,31,68,0.80)";}}
              onMouseLeave={e=>{if(!active) e.currentTarget.style.color="rgba(10,31,68,0.50)";}}>
              {t.l}
              {t.count != null && (
                <span style={{
                  marginLeft:7, padding:"1px 7px", borderRadius:12,
                  background: active ? "rgba(10,31,68,0.06)" : "rgba(10,31,68,0.04)",
                  color: active ? B.navy : "rgba(10,31,68,0.45)",
                  fontSize:10, fontWeight:600, fontVariantNumeric:"tabular-nums",
                }}>{t.count}</span>
              )}
              {active && (
                <span style={{position:"absolute", left:8, right:8, bottom:-1, height:2, background:B.gold, borderRadius:"2px 2px 0 0"}}/>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ Resumen (Dashboard tab) ═══ */}
      {tab === "dashboard" && (
        <div>
          {/* 5 KPIs hero */}
          <div style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit, minmax(170px, 1fr))",
            gap:14, marginBottom:24,
          }}>
            {kpis.map((s, i) => (
              <div key={i} className={`mf-fade-up mf-stagger-${(i%4)+1}`}
                style={{
                  background:B.white,
                  border:"1px solid rgba(10,31,68,0.06)",
                  borderRadius:14,
                  padding:"18px 18px 16px",
                  boxShadow:"var(--mf-shadow-xs)",
                  transition:"box-shadow var(--mf-t-normal) var(--mf-ease-out), transform var(--mf-t-normal) var(--mf-ease-out)",
                }}
                onMouseEnter={e=>{e.currentTarget.style.boxShadow="var(--mf-shadow-md)"; e.currentTarget.style.transform="translateY(-2px)";}}
                onMouseLeave={e=>{e.currentTarget.style.boxShadow="var(--mf-shadow-xs)"; e.currentTarget.style.transform="translateY(0)";}}>
                <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:8}}>
                  <span style={{width:6, height:6, borderRadius:"50%", background:s.dot}}/>
                  <div style={{
                    fontSize:10, fontWeight:600,
                    color:"rgba(10,31,68,0.50)",
                    textTransform:"uppercase", letterSpacing:"0.10em",
                  }}>{s.l}</div>
                </div>
                <div style={{
                  fontFamily:"'Cormorant Garamond', serif",
                  fontSize:"clamp(32px, 4vw, 40px)",
                  fontWeight:500, lineHeight:1,
                  letterSpacing:"-0.02em",
                  color:B.navy, fontVariantNumeric:"tabular-nums",
                }}>{s.v}</div>
              </div>
            ))}
          </div>

          {/* 2 cards de alertas: Críticas + Renovaciones del mes */}
          {(atraso35.length > 0 || renovMes.length > 0) && (
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fit, minmax(320px, 1fr))",
              gap:18,
            }}>
              {atraso35.length > 0 && (
                <div className="mf-fade-up mf-stagger-1" style={{
                  background:B.white,
                  border:"1px solid rgba(220,38,38,0.18)",
                  borderRadius:14,
                  padding:"20px 22px",
                  boxShadow:"var(--mf-shadow-xs)",
                }}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14}}>
                    <div style={{display:"flex", alignItems:"center", gap:8}}>
                      <IconAlertCircle size={16} color={B.redBright}/>
                      <div style={{
                        fontFamily:"'Cormorant Garamond', serif",
                        fontSize:20, fontWeight:500, color:B.redBright,
                        letterSpacing:"-0.01em",
                      }}>Cobranza crítica</div>
                    </div>
                    <div style={{
                      fontSize:10, fontWeight:500, color:"rgba(10,31,68,0.45)",
                      textTransform:"uppercase", letterSpacing:"0.15em",
                    }}>+35 días</div>
                  </div>
                  {atraso35.slice(0,5).map((r, i) => (
                    <div key={i} style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"10px 0",
                      borderBottom: i < Math.min(atraso35.length, 5) - 1 ? "1px solid rgba(10,31,68,0.05)" : "none",
                    }}>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{
                          fontSize:13, fontWeight:600, color:B.navy,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                          letterSpacing:"-0.005em",
                        }}>{r.nombre}</div>
                        <div style={{
                          display:"flex", alignItems:"center", gap:6,
                          fontSize:11, marginTop:3,
                          color:"rgba(10,31,68,0.55)",
                        }}>
                          <span style={{
                            fontFamily:"'Cormorant Garamond', serif",
                            fontSize:16, fontWeight:500, color:B.redBright,
                            lineHeight:1, fontVariantNumeric:"tabular-nums",
                          }}>{r.diasAtraso}d</span>
                          <span style={{opacity:0.4}}>·</span>
                          <span>{r.producto || "—"}</span>
                        </div>
                      </div>
                      <WAButton tel={r.telefono} small/>
                    </div>
                  ))}
                </div>
              )}
              {renovMes.length > 0 && (
                <div className="mf-fade-up mf-stagger-2" style={{
                  background:B.white,
                  border:"1px solid rgba(217,119,6,0.18)",
                  borderRadius:14,
                  padding:"20px 22px",
                  boxShadow:"var(--mf-shadow-xs)",
                }}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14}}>
                    <div style={{display:"flex", alignItems:"center", gap:8}}>
                      <IconRefresh size={16} color={B.amber}/>
                      <div style={{
                        fontFamily:"'Cormorant Garamond', serif",
                        fontSize:20, fontWeight:500, color:B.amber,
                        letterSpacing:"-0.01em",
                      }}>Renovaciones {MESES[ahora.getMonth()]}</div>
                    </div>
                    <div style={{
                      fontSize:10, fontWeight:500, color:"rgba(10,31,68,0.45)",
                      textTransform:"uppercase", letterSpacing:"0.15em",
                    }}>Este mes</div>
                  </div>
                  {renovMes.slice(0,5).map((r, i) => (
                    <div key={i} style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"10px 0",
                      borderBottom: i < Math.min(renovMes.length, 5) - 1 ? "1px solid rgba(10,31,68,0.05)" : "none",
                    }}>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{
                          fontSize:13, fontWeight:600, color:B.navy,
                          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                          letterSpacing:"-0.005em",
                        }}>{r.nombre}</div>
                        <div style={{
                          fontSize:11, marginTop:3,
                          color:"rgba(10,31,68,0.55)",
                          display:"flex", alignItems:"center", gap:6,
                        }}>
                          <span>{r.producto || "—"}</span>
                          <span style={{opacity:0.4}}>·</span>
                          <span style={{color:B.amber, fontWeight:500}}>Vence {fmtF(r.vencimiento)}</span>
                        </div>
                      </div>
                      <WAButton tel={r.telefono} small/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══ Tabs de tabla ═══ */}
      {tab === "renovMes" && (
        <div style={{background:B.white, border:"1px solid rgba(10,31,68,0.06)", borderRadius:14, padding:"22px 24px", boxShadow:"var(--mf-shadow-xs)"}}>
          <Tabla lista={renovMes} cols={["Póliza","Cliente","Producto","Vencimiento","Estatus","Contacto"]}
            titulo={`Renovaciones ${MESES[ahora.getMonth()]}`} color={B.amber}
            onExport={()=>exportarFiltrado(renovMes,"reno_mes_actual")}/>
        </div>
      )}
      {tab === "renovSig" && (
        <div style={{background:B.white, border:"1px solid rgba(10,31,68,0.06)", borderRadius:14, padding:"22px 24px", boxShadow:"var(--mf-shadow-xs)"}}>
          <Tabla lista={renovSig} cols={["Póliza","Cliente","Producto","Vencimiento","Estatus","Contacto"]}
            titulo={`Renovaciones ${MESES[mesSig.getMonth()]}`} color={B.blue}
            onExport={()=>exportarFiltrado(renovSig,"reno_mes_siguiente")}/>
        </div>
      )}
      {tab === "atraso" && (
        <div style={{background:B.white, border:"1px solid rgba(10,31,68,0.06)", borderRadius:14, padding:"22px 24px", boxShadow:"var(--mf-shadow-xs)"}}>
          <Tabla lista={atraso35} cols={["Póliza","Cliente","Producto","Vencimiento","Días atraso","Estatus","Contacto"]}
            titulo="Cobranza con más de 35 días" color={B.redBright}
            onExport={()=>exportarFiltrado(atraso35,"cobranza_critica")}/>
        </div>
      )}
      {tab === "todos" && (
        <div style={{background:B.white, border:"1px solid rgba(10,31,68,0.06)", borderRadius:14, padding:"22px 24px", boxShadow:"var(--mf-shadow-xs)"}}>
          <Tabla lista={datosFilt} cols={["Póliza","Cliente","Producto","Vencimiento","Días atraso","Estatus","Contacto"]}
            titulo="Cartera completa" color={B.navy}
            onExport={()=>exportarFiltrado(datosFilt,"todos")}/>
        </div>
      )}
    </div>
  );
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
  const [idleWarning,setIdleWarning]=useState(false);
  const [bioLocked,setBioLocked]=useState(false);
  const [idleTimeoutMin,setIdleTimeoutMin]=useState(()=>getIdleTimeoutMin());
  const [accesibilidad,setAccesibilidad]=useState(()=>{
    try { return { ...ACCESIBILIDAD_DEFAULT, ...(JSON.parse(localStorage.getItem("mf_accesibilidad")||"{}")) }; }
    catch { return ACCESIBILIDAD_DEFAULT; }
  });
  function cambiarAccesibilidad(v){
    setAccesibilidad(v);
    try { localStorage.setItem("mf_accesibilidad", JSON.stringify(v)); } catch {}
  }
  // Aplicar accesibilidad al <html> mediante data-attributes (CSS hace el resto)
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.mfFont = accesibilidad.fontSize || "normal";
    el.dataset.mfContrast = accesibilidad.highContrast ? "high" : "normal";
    el.dataset.mfMotion = accesibilidad.reduceMotion ? "reduce" : "normal";
    el.dataset.mfReading = accesibilidad.betterReading ? "wide" : "normal";
  }, [accesibilidad]);
  const [confirmingLogout,setConfirmingLogout]=useState(false);
  const [toasts,setToasts]=useState([]);
  const toastIdRef = useRef(0);

  // Helper global de toasts (estable, accesible desde cualquier callback)
  const showToast = useRef(null);
  showToast.current = (message, type = "success") => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, { id, message, type }]);
  };
  function removeToast(id) {
    setToasts(prev => prev.filter(t => t.id !== id));
  }

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
      showToast.current?.(
        `No se pudieron guardar los cambios (${errores[0].split(":")[0]})`,
        "error"
      );
    } else {
      const totalCambios = inserted.length + deleted.length + updated.length;
      if (totalCambios > 0) {
        const msg = inserted.length > 0
          ? (inserted.length === 1 ? "Lead guardado correctamente" : `${inserted.length} leads guardados correctamente`)
          : deleted.length > 0
          ? (deleted.length === 1 ? "Lead eliminado" : `${deleted.length} leads eliminados`)
          : (updated.length === 1 ? "Cambios guardados" : `${updated.length} leads actualizados`);
        showToast.current?.(msg, "success");
      }
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
      showToast.current?.(
        `No se pudo guardar el evento (${errores[0].split(":")[0]})`,
        "error"
      );
    } else {
      const totalCambios = inserted.length + deleted.length + updated.length;
      if (totalCambios > 0) {
        const msg = inserted.length > 0 ? "Evento guardado correctamente"
                  : deleted.length > 0 ? "Evento eliminado"
                  : "Evento actualizado";
        showToast.current?.(msg, "success");
      }
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

  // ── Auto-logout por inactividad (timeout configurable 5/10/15 min) ──
  // Warning aparece 1 min antes del cierre. Si el timeout es 5 min,
  // warning aparece a los 4 min con countdown de 60s.
  useEffect(() => {
    if (!usuario || bioLocked) return; // No correr el timer si está bloqueado o sin sesión

    const WARNING_MS = Math.max(0, (idleTimeoutMin - 1)) * 60 * 1000;
    const lastActivityRef = { current: Date.now() };
    let lastReset = 0;

    const resetTimer = () => {
      const now = Date.now();
      if (now - lastReset < 1000) return; // throttle 1s
      lastReset = now;
      lastActivityRef.current = now;
      if (idleWarning) setIdleWarning(false); // si vuelve, esconder el warning
    };

    const events = ["mousedown", "keydown", "scroll", "touchstart", "mousemove"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));

    const checkInterval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;
      if (idle >= WARNING_MS && !idleWarning) setIdleWarning(true);
    }, 5000);

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearInterval(checkInterval);
    };
  }, [usuario, bioLocked, idleWarning, idleTimeoutMin]);

  // ── Real-time subscription: refresca leads/eventos cuando cambian en Supabase ──
  // Útil cuando: (1) tu asistente en otro device hace cambios, (2) abres la app
  // en dos pestañas, (3) cambios desde Supabase Dashboard.
  // Para tus propios cambios local, ya tienes optimistic update; el refetch
  // simplemente confirma con la verdad del server.
  useEffect(() => {
    if (!usuario) return;
    const adminId = usuario.rol === "asistente" ? usuario.adminId : usuario.id;
    if (!adminId) return;

    const debounceRef = { leadsTimer: null, eventosTimer: null };
    const refetchLeadsSoon = () => {
      if (debounceRef.leadsTimer) clearTimeout(debounceRef.leadsTimer);
      debounceRef.leadsTimer = setTimeout(() => cargarLeadsDeDB(adminId), 400);
    };
    const refetchEventosSoon = () => {
      if (debounceRef.eventosTimer) clearTimeout(debounceRef.eventosTimer);
      debounceRef.eventosTimer = setTimeout(() => cargarEventosDeDB(adminId), 400);
    };

    const channel = supabase
      .channel(`mf-realtime-${adminId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "leads", filter: `admin_id=eq.${adminId}` },
        refetchLeadsSoon)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "seguimientos" },
        refetchLeadsSoon) // sin filter porque seguimientos no tiene admin_id directo; RLS protege visibilidad
      .on("postgres_changes",
        { event: "*", schema: "public", table: "eventos", filter: `admin_id=eq.${adminId}` },
        refetchEventosSoon)
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("Realtime subscription:", status);
        }
      });

    return () => {
      if (debounceRef.leadsTimer) clearTimeout(debounceRef.leadsTimer);
      if (debounceRef.eventosTimer) clearTimeout(debounceRef.eventosTimer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  // ── Bloqueo biométrico al cargar (si está activado y no se verificó en esta sesión) ──
  useEffect(() => {
    if (!usuario) { setBioLocked(false); return; }
    if (recoveryMode) { setBioLocked(false); return; }
    if (biometriaActiva(usuario.id) && !bioSessionDesbloqueada()) {
      setBioLocked(true);
    } else {
      setBioLocked(false);
    }
  }, [usuario, recoveryMode]);

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

  // Pantalla de bloqueo biométrico (lock screen)
  if (bioLocked) {
    return (
      <BiometricLockScreen
        onUnlocked={() => setBioLocked(false)}
        onUsePassword={async () => {
          // Salir y forzar login con contraseña
          setBioLocked(false);
          await supabase.auth.signOut();
        }}
      />
    );
  }

  const esAdmin=["admin","superadmin"].includes(usuario.rol);
  const esAsistente=usuario.rol==="asistente";
  const alertaCount=leads.filter(l=>!l.sinSeguimiento&&getAlertas(l).some(a=>["riesgo","sin_contacto"].includes(a.tipo))&&!["otro","cierre"].includes(l.etapa)).length;

  const NAV=[
    ...(esAdmin?[{id:"dashboard",icon:<IconHome size={14}/>,l:"Hoy"}]:[]),
    ...(esAdmin?[{id:"pipeline",icon:<IconLayers size={14}/>,l:"Seguimiento"}]:[]),
    {id:"lista",icon:<IconUsers size={14}/>,l:"Leads"},
    {id:"agenda",icon:<IconCalendar size={14}/>,l:"Agenda"},
    ...(esAdmin?[{id:"metricas",icon:<IconBarChart size={14}/>,l:"Métricas"}]:[]),
    ...(esAdmin?[{id:"mensajes",icon:<IconMail size={14}/>,l:"Mensajes"}]:[]),
    ...(esAdmin?[{id:"cobranza",icon:<IconDollar size={14}/>,l:"Cobranza"}]:[]),
    ...(esAdmin?[{id:"usuarios",icon:<IconUser size={14}/>,l:"Usuarios"}]:[]),
    {id:"configuracion",icon:<IconShield size={14}/>,l:"Configuración"},
  ];

  const APP_CSS=`
    html,body,*{box-sizing:border-box!important;}
    html{width:100%;max-width:100vw;overflow-x:hidden;-webkit-text-size-adjust:100%;text-size-adjust:100%;}
    body{width:100%;max-width:100vw;overflow-x:hidden;overscroll-behavior-y:contain;}
    input,select,textarea,button{font-family:'Poppins',sans-serif;-webkit-appearance:none;appearance:none;border-radius:8px;font-size:16px;}
    select{font-size:14px;}
    .mf-app{width:100%;max-width:100vw;min-height:100%;min-height:-webkit-fill-available;overflow-x:hidden;overflow-y:auto;position:relative;}
    .mf-header{position:sticky;top:0;z-index:400;width:100%;max-width:100vw;background:#0A1F44;border-bottom:1px solid rgba(198,169,107,0.15);box-shadow:0 2px 16px rgba(10,31,68,.3);}
    .mf-header{background:linear-gradient(180deg,#0A1F44 0%,#0c2249 100%)!important;border-bottom:1px solid rgba(198,169,107,0.10)!important;box-shadow:0 1px 0 rgba(10,31,68,.04)!important;}
    .mf-header-row1{display:flex;align-items:center;justify-content:space-between;padding:0 16px;height:52px;gap:10px;width:100%;}
    .mf-header-row2{display:flex;align-items:center;padding:0 12px 8px;gap:3px;width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;background:transparent;}
    .mf-header-row2::-webkit-scrollbar{display:none;}
    .mf-nav-btn{flex-shrink:0;display:inline-flex;align-items:center;gap:6px;min-height:32px;padding:6px 12px;border-radius:8px;border:none;font-family:'Poppins',sans-serif;font-weight:500;font-size:12px;letter-spacing:0.01em;cursor:pointer;transition:background-color var(--mf-t-fast) var(--mf-ease-out),color var(--mf-t-fast) var(--mf-ease-out);white-space:nowrap;-webkit-tap-highlight-color:transparent;position:relative;user-select:none;-webkit-user-select:none;}
    .mf-nav-btn.active{background:rgba(255,255,255,0.10);color:#fff;}
    .mf-nav-btn.active::after{content:"";position:absolute;left:12px;right:12px;bottom:-9px;height:2px;background:#C6A96B;border-radius:2px 2px 0 0;}
    .mf-nav-btn.inactive{background:transparent;color:rgba(255,255,255,0.55);}
    .mf-nav-btn.inactive:hover{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.85);}
    .mf-nav-btn.inactive:active{background:rgba(255,255,255,0.10);color:#fff;}
    .mf-nav-btn svg{flex-shrink:0;opacity:0.85;}
    .mf-nav-btn.active svg{opacity:1;}
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
          <MarflowWordmark height={18}/>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            <div style={{position:"relative"}}>
              <button
                onClick={()=>setNotifOpen(o=>!o)}
                aria-label={`Alertas${alertaCount?` (${alertaCount})`:""}`}
                style={{
                  width:36, height:36, borderRadius:"50%",
                  border:`1px solid ${notifOpen ? B.gold : "rgba(255,255,255,0.18)"}`,
                  background: notifOpen ? "rgba(198,169,107,0.18)" : "rgba(255,255,255,0.05)",
                  color:"#fff",
                  cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"all var(--mf-t-fast) var(--mf-ease-out)",
                  flexShrink:0, position:"relative",
                }}>
                <IconBell size={15} color={notifOpen ? B.gold : "rgba(255,255,255,0.85)"}/>
                {alertaCount>0 && (
                  <span style={{
                    position:"absolute", top:-2, right:-2,
                    minWidth:16, height:16, padding:"0 4px",
                    background:B.redBright,
                    border:"2px solid #0A1F44",
                    borderRadius:10,
                    fontSize:9, color:"#fff", fontWeight:700,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontFamily:"'Poppins', sans-serif",
                    letterSpacing:0,
                  }}>{alertaCount}</span>
                )}
              </button>

              {notifOpen && (
                <div onClick={e=>e.stopPropagation()} style={{
                  position:"absolute", top:44, right:0,
                  width:"min(340px, calc(100vw - 32px))",
                  background:"#F8F6F2",
                  borderRadius:16,
                  border:"1px solid rgba(10,31,68,0.08)",
                  boxShadow:"0 20px 50px rgba(10,31,68,0.18), 0 4px 12px rgba(10,31,68,0.06)",
                  zIndex:800,
                  animation:"mfFadeUp .22s var(--mf-ease-spring)",
                  overflow:"hidden",
                }}>
                  {/* Header */}
                  <div style={{
                    padding:"16px 18px 14px",
                    borderBottom:"1px solid rgba(10,31,68,0.06)",
                    display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10,
                  }}>
                    <div>
                      <div style={{
                        fontSize:10, fontWeight:500,
                        color:"rgba(10,31,68,0.40)",
                        textTransform:"uppercase", letterSpacing:"0.22em",
                        marginBottom:4,
                      }}>Notificaciones</div>
                      <div style={{
                        fontFamily:"'Cormorant Garamond', serif",
                        fontSize:20, fontWeight:500, color:B.navy,
                        letterSpacing:"-0.015em", lineHeight:1.1,
                      }}>Centro de alertas</div>
                    </div>
                    <button onClick={()=>setNotifOpen(false)} style={{
                      width:28, height:28, borderRadius:8,
                      border:"1px solid rgba(10,31,68,0.08)",
                      background:"#fff", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      color:"rgba(10,31,68,0.55)",
                    }}><IconX size={12} color="currentColor"/></button>
                  </div>

                  {/* Sesión actual */}
                  <div style={{
                    padding:"14px 18px",
                    borderBottom:"1px solid rgba(10,31,68,0.06)",
                  }}>
                    <div style={{
                      fontSize:10, fontWeight:500,
                      color:"rgba(10,31,68,0.45)",
                      textTransform:"uppercase", letterSpacing:"0.18em",
                      marginBottom:6,
                    }}>Sesión actual</div>
                    <div style={{
                      fontFamily:"'Cormorant Garamond', serif",
                      fontSize:26, fontWeight:500, lineHeight:1,
                      color:B.navy, letterSpacing:"-0.025em",
                      fontVariantNumeric:"tabular-nums",
                    }}>{Math.floor((Date.now()-sessionStart)/60000)} <span style={{fontFamily:"'Poppins',sans-serif", fontSize:11, color:"rgba(10,31,68,0.50)", fontWeight:500, letterSpacing:"0.05em", textTransform:"uppercase"}}>min</span></div>
                    <div style={{fontSize:11.5, color:"rgba(10,31,68,0.50)", marginTop:4}}>Desde que ingresaste hoy</div>
                  </div>

                  {/* Alertas de leads */}
                  <div style={{padding:"14px 18px"}}>
                    <div style={{
                      fontSize:10, fontWeight:500,
                      color:"rgba(10,31,68,0.45)",
                      textTransform:"uppercase", letterSpacing:"0.18em",
                      marginBottom:10,
                    }}>Leads que requieren acción</div>
                    {alertaCount===0 && (
                      <div style={{
                        fontSize:12.5, color:"rgba(10,31,68,0.55)",
                        fontStyle:"italic", padding:"4px 0",
                      }}>Todo en orden por ahora.</div>
                    )}
                    {leads.filter(l=>getAlertas(l).some(a=>a.tipo==="riesgo")).slice(0,3).map(l=>(
                      <div key={l.id} style={{display:"flex", gap:10, alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(10,31,68,0.04)"}}>
                        <span style={{width:6, height:6, borderRadius:"50%", background:B.redBright, animation:"mfPulseDot 1.6s infinite", flexShrink:0}}/>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{fontSize:12.5, fontWeight:600, color:B.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{l.nombre}</div>
                          <div style={{fontSize:10.5, color:B.redBright, marginTop:1, textTransform:"uppercase", letterSpacing:"0.10em"}}>Riesgo de pérdida</div>
                        </div>
                      </div>
                    ))}
                    {leads.filter(l=>getAlertas(l).some(a=>a.tipo==="sin_contacto")).slice(0,3).map(l=>(
                      <div key={l.id} style={{display:"flex", gap:10, alignItems:"center", padding:"8px 0", borderBottom:"1px solid rgba(10,31,68,0.04)"}}>
                        <span style={{width:6, height:6, borderRadius:"50%", background:B.gold, flexShrink:0}}/>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{fontSize:12.5, fontWeight:600, color:B.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{l.nombre}</div>
                          <div style={{fontSize:10.5, color:"rgba(10,31,68,0.55)", marginTop:1}}>{diasDesde(l.ultimoContacto)} días sin contacto</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Actividad equipo (si tiene asistentes) */}
                  {esAdmin&&(()=>{
                    const miEquipo=usuario.rol==="superadmin"?cuentas.filter(c=>c.rol==="asistente"):cuentas.filter(c=>c.rol==="asistente"&&c.adminId===usuario.id);
                    if(miEquipo.length===0)return null;
                    const actHoy=(uid)=>{const all=allLeads[cuentas.find(c=>c.id===uid)?.adminId||uid]||leads;return all.flatMap(l=>l.seguimientos||[]).filter(s=>s.autor&&s.fecha===hoy()).length;};
                    return (
                      <div style={{padding:"14px 18px", borderTop:"1px solid rgba(10,31,68,0.06)"}}>
                        <div style={{
                          fontSize:10, fontWeight:500,
                          color:"rgba(10,31,68,0.45)",
                          textTransform:"uppercase", letterSpacing:"0.18em",
                          marginBottom:10,
                        }}>{usuario.rol==="superadmin" ? "Asistentes (todos)" : "Tu equipo"}</div>
                        {miEquipo.map(c=>{
                          const act=actHoy(c.id);
                          const adminNombre=cuentas.find(a=>a.id===c.adminId)?.nombre||"";
                          return (
                            <div key={c.id} style={{display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid rgba(10,31,68,0.04)"}}>
                              <Av name={c.nombre} size={26} color={B.navy}/>
                              <div style={{flex:1, minWidth:0}}>
                                <div style={{fontSize:12.5, fontWeight:600, color:B.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.nombre}</div>
                                {usuario.rol==="superadmin"&&adminNombre && (
                                  <div style={{fontSize:10, color:"rgba(10,31,68,0.45)", letterSpacing:"0.04em"}}>Admin · {adminNombre}</div>
                                )}
                              </div>
                              <div style={{textAlign:"right", flexShrink:0}}>
                                <div style={{
                                  fontFamily:"'Cormorant Garamond', serif",
                                  fontSize:18, fontWeight:500, lineHeight:1,
                                  color: act>0 ? "#059669" : "rgba(10,31,68,0.30)",
                                  letterSpacing:"-0.02em",
                                }}>{act}</div>
                                <div style={{fontSize:9, color:"rgba(10,31,68,0.45)", marginTop:2, textTransform:"uppercase", letterSpacing:"0.10em"}}>hoy</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <Av name={usuario.nombre} size={32} color={usuario.color||B.gold}/>
            <div className="mf-user-nasme"><div style={{fontSize:12,fontWeight:700,color:"#fff",lineHeight:1.2}}>{usuario.nombre}</div><div style={{fontSize:9,color:"rgba(255,255,255,0.5)",textTransform:"capitalize",letterSpacing:".3px"}}>{usuario.rol}</div></div>
            <button
              onClick={()=>setConfirmingLogout(true)}
              style={{
                display:"inline-flex", alignItems:"center", gap:6,
                padding:"6px 12px", minHeight:34, borderRadius:8,
                border:"1px solid rgba(255,255,255,0.18)",
                background:"rgba(255,255,255,0.06)",
                color:"rgba(255,255,255,0.85)",
                fontFamily:"'Poppins',sans-serif",
                fontSize:11.5, fontWeight:500, letterSpacing:"0.005em",
                cursor:"pointer", flexShrink:0,
                transition:"all var(--mf-t-fast) var(--mf-ease-out)",
              }}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor="rgba(198,169,107,0.40)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.18)";}}>
              <IconLock size={11} color="rgba(255,255,255,0.75)"/>
              Salir
            </button>
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
        {seccion==="dashboard"&&esAdmin&&<Dashboard leads={leads} setLeads={setLeads} eventos={eventos} setEventos={setEventos} usuario={usuario} cuentas={cuentas} setFiltroNav={setFiltroNav} setSeccion={setSeccion}/>}
        {seccion==="pipeline"&&esAdmin&&<Pipeline leads={leads} setLeads={setLeads} setEventos={setEventos} filtroNav={filtroNav} esAdmin={esAdmin} cuentas={cuentas} usuario={usuario}/>}
        {seccion==="lista"&&<ListaLeads leads={leads} setLeads={setLeads} setEventos={setEventos} cuentas={cuentas} usuario={usuario} esAsistente={esAsistente}/>}
        {seccion==="agenda"&&<Agenda eventos={eventos} setEventos={setEventos} leads={leads} esAsistente={esAsistente} usuario={usuario}/>}
        {seccion==="metricas"&&esAdmin&&<Metricas leads={leads}/>}
        {seccion==="mensajes"&&esAdmin&&<Mensajes/>}
        {seccion==="cobranza"&&esAdmin&&<Cobranza/>}
        {seccion==="usuarios"&&esAdmin&&<Usuarios usuario={usuario} cuentas={cuentas} setCuentas={cs=>{setCuentas(cs);LS.set("mf_cuentas",cs);}}/>}
        {seccion==="configuracion"&&<Configuracion
          usuario={usuario}
          idleTimeoutMin={idleTimeoutMin}
          onChangeIdleTimeout={(min)=>{setIdleTimeoutMin(min); setIdleTimeoutMinLS(min);}}
          accesibilidad={accesibilidad}
          onChangeAccesibilidad={cambiarAccesibilidad}
        />}
      </main>

      <div style={{height:2,background:`linear-gradient(90deg,transparent,${B.gold}55,transparent)`,position:"fixed",bottom:0,left:0,right:0,pointerEvents:"none"}}/>

      {/* Modal de aviso de inactividad (overlay sobre la app) */}
      {idleWarning && (
        <IdleWarningModal
          countdownSeconds={60}
          onContinue={() => setIdleWarning(false)}
          onLogout={async () => {
            setIdleWarning(false);
            // Limpiar state local sensible antes de cerrar sesión
            setAllLeads({});
            setAllEventos({});
            setCuentas([]);
            await supabase.auth.signOut();
          }}
        />
      )}

      {/* Modal de confirmación al hacer click en "Salir" */}
      {confirmingLogout && (
        <LogoutConfirmModal
          usuario={usuario}
          onCancel={()=>setConfirmingLogout(false)}
          onConfirm={async () => {
            setConfirmingLogout(false);
            // Limpiar state local sensible
            setAllLeads({});
            setAllEventos({});
            setCuentas([]);
            await supabase.auth.signOut();
          }}
        />
      )}

      {/* Stack de toasts (flotante abajo derecha) */}
      {toasts.length > 0 && (
        <div
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "max(24px, calc(24px + env(safe-area-inset-bottom)))",
            right: 24,
            zIndex: 1400,
            display: "flex", flexDirection: "column", gap: 10,
            maxWidth: "calc(100vw - 48px)",
            pointerEvents: "none",
          }}
        >
          {toasts.map(t => (
            <div key={t.id} style={{ pointerEvents: "auto" }}>
              <Toast {...t} onClose={() => removeToast(t.id)}/>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
