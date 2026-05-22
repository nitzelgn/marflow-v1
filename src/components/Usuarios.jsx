import { useState } from "react";
import { B, ETAPAS, PRODUCTOS_LEAD, PRODUCTOS_COB, ESTADOS_MX, MESES,
  TIPO_EVENTO, SUBTIPO_LABEL, REPETICION, CHECKLIST_DEF, EMPTY_CHECK,
  MENSAJES_TPL, SUPERADMIN_ID, CUENTAS_INIT,
  uid, hoy, diasDesde, fmtF, initials, getDias, getPrimerDia,
  getTempLead, getAlertas, LS, mkDemo } from "./shared.js";
import { MarflowLogo, ConfirmModal, Av, Btn, Inp, Sel, FL,
  MFModal, MHead, HoraSelect, ContactoModal, GD, Tag } from "./ui.jsx";

function Usuarios({usuario,cuentas,setCuentas}) {
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({nombre:"",usuario:"",pass:"",rol:"admin",adminRef:""});
  const [err,setErr]=useState("");
  const [confirmUser,setConfirmUser]=useState(null); // {id, nombre}
  const esSA=usuario.rol==="superadmin";
  const visibles=esSA?cuentas:cuentas.filter(c=>c.id===usuario.id||c.adminId===usuario.id);
  const rolColor={superadmin:B.gold,admin:B.navy,asistente:B.purple};
  const rolLabel={superadmin:"⭐ Superadmin",admin:"👤 Admin",asistente:"🤝 Asistente"};

  function crear(){
    setErr("");
    if(!form.nombre.trim()||!form.usuario.trim()||!form.pass.trim()){setErr("Completa todos los campos");return;}
    if(cuentas.find(c=>c.usuario.toLowerCase()===form.usuario.toLowerCase())){setErr("Usuario ya existe");return;}
    let nc;
    if(esSA){
      if(form.rol==="asistente"){
        const adm=cuentas.find(c=>c.usuario.toLowerCase()===form.adminRef.toLowerCase()&&["admin","superadmin"].includes(c.rol));
        if(!adm){setErr("Admin no encontrado");return;}
        nc={id:uid(),nombre:form.nombre,usuario:form.usuario,pass:form.pass,rol:"asistente",adminId:adm.id,color:B.purple};
      }else nc={id:uid(),nombre:form.nombre,usuario:form.usuario,pass:form.pass,rol:"admin",adminId:null,color:B.navy};
    }else nc={id:uid(),nombre:form.nombre,usuario:form.usuario,pass:form.pass,rol:"asistente",adminId:usuario.id,color:B.purple};
    const nc2=[...cuentas,nc];LS.set("mf_cuentas",nc2);setCuentas(nc2);
    setModal(false);setForm({nombre:"",usuario:"",pass:"",rol:"admin",adminRef:""});
  }

  function eliminar(id){
    if(id===usuario.id||id===SUPERADMIN_ID)return;
    const c=cuentas.find(x=>x.id===id);
    setConfirmUser({id, nombre:c?.nombre||"este usuario"});
  }
  function confirmarEliminar(){
    if(!confirmUser)return;
    const nc2=cuentas.filter(c=>c.id!==confirmUser.id);
    LS.set("mf_cuentas",nc2);setCuentas(nc2);
    setConfirmUser(null);
  }

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
      <div>
        <div style={{fontSize:16,fontWeight:700,color:B.navy,marginBottom:4}}>Gestión de usuarios</div>
        <div style={{fontSize:12,color:"#6b7280"}}>{esSA?"Superadmin -- única que puede crear administradores":"Puedes crear asistentes vinculados a tu cuenta"}</div>
      </div>
      <Btn onClick={()=>{setModal(true);setErr("");}} bg={B.navy} small>+ Crear usuario</Btn>
    </div>
    {esSA&&<div style={{background:B.goldDim,border:`1.5px solid ${B.goldBorder}`,borderRadius:10,padding:"11px 16px",marginBottom:18,fontSize:12,color:B.amber,fontWeight:600}}>
      ⭐ Solo tú puedes crear administradores. Cada admin tiene su propia base de datos independiente.
    </div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:12}}>
      {visibles.map(c=>{
        const adminDe=c.adminId?cuentas.find(a=>a.id===c.adminId):null;
        return <div key={c.id} style={{background:B.white,border:`1px solid ${c.id===SUPERADMIN_ID?B.goldBorder:B.gray}`,borderRadius:12,padding:18,display:"flex",alignItems:"center",gap:13,boxShadow:B.shadow}}>
          <Av name={c.nombre} size={44} color={rolColor[c.rol]||B.navy}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,color:B.navy,fontSize:14}}>{c.nombre}</div>
            <div style={{fontSize:11,color:"#9ca3af"}}>@{c.usuario}</div>
            {adminDe&&<div style={{fontSize:10,color:"#6b7280"}}>Asistente de: {adminDe.nombre}</div>}
            <div style={{marginTop:6,display:"flex",gap:4,flexWrap:"wrap"}}>
              <Tag color={rolColor[c.rol]||B.navy} small>{rolLabel[c.rol]}</Tag>
              {c.id===usuario.id&&<Tag color={B.green} small>Tú</Tag>}
            </div>
          </div>
          {c.id!==usuario.id&&c.id!==SUPERADMIN_ID&&(esSA||(usuario.rol==="admin"&&c.adminId===usuario.id))&&(
            <button onClick={()=>eliminar(c.id)} style={{background:"none",border:"none",color:"#d1d5db",cursor:"pointer",fontSize:18}}
              onMouseEnter={e=>e.target.style.color=B.redBright} onMouseLeave={e=>e.target.style.color="#d1d5db"}>✕</button>
          )}
        </div>;
      })}
    </div>
    {modal&&<MFModal onClose={()=>setModal(false)} width={400}>
      <MHead title="Crear usuario" onClose={()=>setModal(false)}/>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <FL label="Nombre completo"><Inp value={form.nombre} onChange={v=>setForm(f=>({...f,nombre:v}))}/></FL>
        <FL label="Usuario"><Inp value={form.usuario} onChange={v=>setForm(f=>({...f,usuario:v}))}/></FL>
        <FL label="Contraseña"><Inp value={form.pass} onChange={v=>setForm(f=>({...f,pass:v}))} type="password"/></FL>
        {esSA&&<FL label="Tipo"><Sel value={form.rol} onChange={v=>setForm(f=>({...f,rol:v}))} options={[{v:"admin",l:"👤 Admin -- cuenta propia"},{v:"asistente",l:"🤝 Asistente -- vinculado a admin"}]}/></FL>}
        {esSA&&form.rol==="asistente"&&<FL label="Usuario del administrador"><Inp value={form.adminRef} onChange={v=>setForm(f=>({...f,adminRef:v}))} placeholder="Usuario del admin"/></FL>}
        {!esSA&&<div style={{background:B.blueDim,border:`1px solid ${B.blue}20`,borderRadius:8,padding:"9px 13px",fontSize:12,color:B.blue,fontWeight:500}}>Los asistentes tendrán acceso solo a tu agenda.</div>}
        {err&&<div style={{fontSize:12,color:B.redBright,background:B.redDim,padding:"9px 13px",borderRadius:8,fontWeight:500}}>{err}</div>}
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:18}}>
        <Btn onClick={()=>setModal(false)} color="#6b7280" outline small>Cancelar</Btn>
        <Btn onClick={crear} bg={B.navy} small>Crear</Btn>
      </div>
    </MFModal>}
    {confirmUser&&<ConfirmModal
      titulo="¿Eliminar usuario?"
      mensaje={`Vas a eliminar la cuenta de "${confirmUser.nombre}". Esta acción no se puede deshacer.`}
      icono="👤" textoConfirm="Sí, eliminar" colorConfirm={B.redBright}
      onConfirm={confirmarEliminar} onCancel={()=>setConfirmUser(null)}
    />}
  </div>;
}

/* ===========================================
   APP ROOT -- RESPONSIVE
=========================================== */

export default Usuarios;

