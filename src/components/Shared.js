import { useState, useRef } from "react";

/* ===========================================
   BRANDING OFICIAL MARFLOW
=========================================== */
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

/* ===========================================
   CONSTANTES
=========================================== */
const SUPERADMIN_ID = "mariana_root";
const CUENTAS_INIT = [{id:SUPERADMIN_ID,nombre:"Mariana",usuario:"mariana",pass:"Mariana2024",rol:"superadmin",color:B.gold,adminId:null}];

const ETAPAS = [
  {id:"nuevo",        label:"Nuevo Lead",           color:"#475569", icon:"+",  sinSeg:false},
  {id:"cita",         label:"Cita agendada",         color:"#7c3aed", icon:"📅", sinSeg:false}, // lila
  {id:"asesorado",    label:"Asesorado",             color:"#b45309", icon:"📋", sinSeg:false}, // amarillo dorado
  {id:"seguimiento",  label:"En seguimiento",        color:"#1e40af", icon:"⟳",  sinSeg:false}, // azul
  {id:"no_localiz",   label:"No localizable",        color:"#dc2626", icon:"📵", sinSeg:false}, // rojo
  {id:"cierre",       label:"¡Cierre! ⭐",           color:"#166534", icon:"⭐", sinSeg:false}, // verde + estrella
  {id:"otro",         label:"Sin interés",           color:"#dc2626", icon:"🚫", sinSeg:true},  // rojo + auto sinSeg
];

const PRODUCTOS_LEAD = ["Vida","GMM","Auto","Hogar","Patrimonial","Ahorro","Educación","Otro"];
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
  // Trabajo
  curso_allianz: "Curso Allianz",
  junta_camara:  "Junta cámara prendida",
  junta:         "Junta",
  // Cita cliente
  info1:         "1ra información",
  seguimiento:   "Seguimiento",
  cierre:        "Cierre",
  presencial:    "Presencial 🤝",
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
    {titulo:"Presentación cálida",body:"Hola [Nombre], soy [Tu nombre], especialista en gestión de ventas.\n\nMe gustaría compartirte opciones de [Producto] muy valiosas para ti y tu familia. ¿Tienes 10 minutos esta semana? 🙏"},
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

/* ===========================================
   UTILS
=========================================== */
const uid = () => Math.random().toString(36).slice(2,9) + Date.now().toString(36);
const hoy = () => new Date().toISOString().split("T")[0];
const diasDesde = f => f ? Math.floor((Date.now()-new Date(f).getTime())/86400000) : 999;
const fmtF = f => { if(!f) return "--"; const [y,m,d]=f.split("-"); return `${d}/${m}/${y}`; };
const initials = n => (n||"").trim().split(/\s+/).slice(0,2).map(w=>w[0]||"").join("").toUpperCase();
const getDias = (y,m) => new Date(y,m+1,0).getDate();
const getPrimerDia = (y,m) => { const d=new Date(y,m,1).getDay(); return d===0?6:d-1; };

function getTempLead(lead) {
  if(lead.sinSeguimiento) return null;
  const dias = diasDesde(lead.ultimoContacto);
  const chk = lead.checklist||{};
  const interact = [chk.wa1,chk.wa2,chk.call1,chk.call2,chk.email].filter(Boolean).length;
  const etapasCalientes = ["cita","seguimiento","cierre"];
  if(dias<=2 && (interact>=2 || etapasCalientes.includes(lead.etapa))) return {nivel:"caliente",icon:"🔥",color:"#dc2626",label:"Caliente"};
  if(dias<=7 && interact>=1) return {nivel:"tibio",icon:"🟡",color:"#d97706",label:"Tibio"};
  return {nivel:"frio",icon:"❄️",color:"#3b82f6",label:"Frío"};
}

function getAlertas(lead) {
  if(lead.sinSeguimiento) return [];
  const dias = diasDesde(lead.ultimoContacto);
  const a = [];
  if(!["otro","cierre"].includes(lead.etapa)) {
    if(dias>=15) a.push({tipo:"reactivar", msg:`♻️ ${dias}d -- Reactivar`, color:B.purple});
    else if(dias>=2) a.push({tipo:"sin_contacto", msg:`${dias}d sin contacto`, color:B.amber});
  }
  if(lead.etapa==="seguimiento" && dias>=5) a.push({tipo:"riesgo", msg:"⚠ Riesgo de pérdida", color:B.redBright});
  if(lead.etapa==="cita" && dias>=1) a.push({tipo:"cot", msg:"💡 Confirmar cita", color:B.blue});
  return a;
}

const LS = {
  get:(k,d)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}},
  set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}},
};

const mkDemo = () => [
  {id:uid(),nombre:"Fernanda Reyes",telefono:"3312345678",correo:"fernanda@email.com",edad:"38",producto:"Vida",estado:"Jalisco",etapa:"cita",ultimoContacto:new Date(Date.now()-3*86400000).toISOString().split("T")[0],notas:"Familia con 2 hijos. Muy interesada.",objeciones:"El precio le parece alto",intereses:"Proteger a sus hijos",motivador:"Seguridad familiar",checklist:{...EMPTY_CHECK,wa1:true,call1:true,email:true},seguimientos:[{id:uid(),fecha:hoy(),texto:"Llamada muy positiva, pide cotización",tipo:"llamada"}],sinSeguimiento:false,asignadoA:null,mesCreacion:hoy().slice(0,7)},
  {id:uid(),nombre:"Roberto Mendoza",telefono:"5598765432",correo:"roberto@email.com",edad:"45",producto:"GMM",estado:"Ciudad de México",etapa:"seguimiento",ultimoContacto:new Date(Date.now()-6*86400000).toISOString().split("T")[0],notas:"Comparando con otra aseguradora",objeciones:"Ya tiene otro seguro",intereses:"Mejor cobertura",motivador:"Salud familiar",checklist:{...EMPTY_CHECK,wa1:true,wa2:true,call1:true,sigues:true},seguimientos:[],sinSeguimiento:false,asignadoA:null,mesCreacion:hoy().slice(0,7)},
  {id:uid(),nombre:"Sofía Villanueva",telefono:"8112223344",correo:"sofia@email.com",edad:"31",producto:"Patrimonial",estado:"Nuevo León",etapa:"asesorado",ultimoContacto:new Date(Date.now()-1*86400000).toISOString().split("T")[0],notas:"Referida por Carlos R.",objeciones:"",intereses:"Inversión a largo plazo",motivador:"Patrimonio para sus hijos",checklist:{...EMPTY_CHECK,wa1:true},seguimientos:[],sinSeguimiento:false,asignadoA:null,mesCreacion:hoy().slice(0,7)},
  {id:uid(),nombre:"Daniela Castro",telefono:"4421234567",correo:"daniela@email.com",edad:"29",producto:"Auto",estado:"Querétaro",etapa:"cierre",ultimoContacto:hoy(),notas:"Lista para firmar ✅",objeciones:"",intereses:"Seguro completo",motivador:"Auto nuevo",checklist:{...EMPTY_CHECK,wa1:true,wa2:true,call1:true,call2:true,email:true,sigues:true},seguimientos:[],sinSeguimiento:false,asignadoA:null,mesCreacion:hoy().slice(0,7)},
  {id:uid(),nombre:"Pedro Sánchez",telefono:"6641234567",correo:"pedro@email.com",edad:"40",producto:"Hogar",estado:"Baja California",etapa:"otro",ultimoContacto:new Date(Date.now()-18*86400000).toISOString().split("T")[0],notas:"Sin presupuesto",objeciones:"Sin presupuesto",intereses:"",motivador:"",checklist:{...EMPTY_CHECK,wa1:true,wa2:true,noInteres:true},seguimientos:[],sinSeguimiento:true,asignadoA:null,mesCreacion:hoy().slice(0,7)},
];

/* ===========================================
   CSS BASE
=========================================== */

export { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES, TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK, MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT, uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia, getTempLead, getAlertas, LS, mkDemo };
