const {useState,useEffect,useRef}=React;

/* ── MOBILE ONLY ── */
function DesktopBlock(){
  return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f7f7f5',fontFamily:'Syne,sans-serif',padding:'2rem',textAlign:'center'}}>
      <div style={{maxWidth:380}}>
        <div style={{fontSize:'3rem',marginBottom:'1rem'}}>⛳</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2rem',fontWeight:700,color:'#111',marginBottom:'.75rem'}}>Golf Warriors</h1>
        <p style={{fontSize:'1rem',color:'#555',marginBottom:'1.5rem',lineHeight:1.6}}>This app is designed for <strong>mobile phones</strong>.<br/>Please open it on your phone.</p>
        <p style={{fontSize:'.8rem',color:'#999'}}>Visit <strong style={{color:'#111'}}>{window.location.hostname}</strong> on your phone's browser.</p>
      </div>
    </div>
  );
}

/* ── SEED DATA ── */
const SEED_PLAYERS=[
  {id:'p2',name:'Jules Melanson',email:'jules_18melanson@hotmail.com',password:'golf',photo:null,role:'player'},
  {id:'p3',name:'Stef Audet',email:'stephane.france@rogers.com',password:'golf',photo:null,role:'player'},
  {id:'p4',name:'PP',email:'pierrepaul.lanteigne@gmail.com',password:'golf',photo:null,role:'player'},
  {id:'p5',name:'Dr Rhé',email:'rheal.boudreau@hotmail.com',password:'golf',photo:null,role:'player'},
  {id:'p6',name:'Dave',email:'divadocan@gmail.com',password:'golf',photo:null,role:'player'},
  {id:'p7',name:'Marc LeBlanc',email:'marc@jomaeng.com',password:'golf',photo:null,role:'player'},
  {id:'p9',name:'Roch Boucher',email:'boucher.roch@gmail.com',password:'golf',photo:null,role:'manager'},
  {id:'p10',name:'Stéphane Lagacé',email:'stephane.lagace@gmail.com',password:'golf',photo:null,role:'manager'},
  {id:'p12',name:'Alain Malenfant',email:'alain.malenfant@architects4.ca',password:'golf',photo:null,role:'player'},
  {id:'p13',name:'Louis-Philippe Boucher',email:'boucherlouisp@gmail.com',password:'golf',photo:null,role:'player'},
];
const ADMIN={id:'admin',name:'Admin',email:'admin@golfwarriors.com',password:'golf',photo:null,role:'admin'};
const SEED_TT=[];

/* ── HELPERS ── */
const AV_COLORS=['#1a7a3e','#1a5fa0','#8b2525','#5a2d8b','#b87a1a','#1a6b5a','#7a3a00','#3a4a8b'];
const avColor=s=>{let h=0;for(const c of s)h=c.charCodeAt(0)+((h<<5)-h);return AV_COLORS[Math.abs(h)%AV_COLORS.length];};
const initials=n=>{const p=(n||'').split(' ');return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():(n||'??').slice(0,2).toUpperCase();};
const fmtDate=d=>{if(!d)return'—';return new Date(d+'T12:00:00').toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric',year:'numeric'});};
const fmtTime=t=>{if(!t)return'—';const[h,m]=t.split(':').map(Number);return`${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`;};
const isUpcoming=tee=>{if(!tee.date||!tee.time)return true;try{const d=new Date(tee.date+'T'+tee.time+':00');return isNaN(d.getTime())||d>=new Date();}catch{return true;}};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);

/* ── SYNC via Supabase ── */
const SB_URL   = 'https://wzskaoaykkspkhybtsui.supabase.co';
const SB_KEY   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6c2thb2F5a2tzcGtoeWJ0c3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4Mjg2NTEsImV4cCI6MjA5NjQwNDY1MX0.RFvev6UprtyVYxkslWq1S6w-Z4MfULfydzPmTCLaKRo';
const SB_TABLE = 'golfwarriors';

function isSyncConfigured(){
  const c=getSyncConfig();
  return !!(c.url&&c.key);
}
function getSyncConfig(){
  const saved=JSON.parse(localStorage.getItem('gw_sb')||'{"url":"","key":""}');
  return {url:SB_URL||saved.url||'', key:SB_KEY||saved.key||''};
}
async function syncRead(){
  const c=getSyncConfig();if(!c.url||!c.key)return null;
  try{
    const r=await fetch(`${c.url}/rest/v1/${SB_TABLE}?id=eq.1&select=data`,{
      headers:{'apikey':c.key,'Authorization':'Bearer '+c.key}
    });
    if(!r.ok)return null;
    const rows=await r.json();
    return rows&&rows[0]?rows[0].data:null;
  }catch(e){console.warn('syncRead error:',e);return null;}
}
async function syncWrite(data){
  const c=getSyncConfig();if(!c.url||!c.key)return false;
  try{
    const r=await fetch(`${c.url}/rest/v1/${SB_TABLE}`,{
      method:'POST',
      headers:{'apikey':c.key,'Authorization':'Bearer '+c.key,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},
      body:JSON.stringify({id:1,data})
    });
    return r.ok||r.status===201||r.status===200;
  }catch(e){console.warn('syncWrite error:',e);return false;}
}
async function pushSync(tt,pl){
  if(!isSyncConfigured())return;
  try{await syncWrite({teeTimes:tt,players:pl,updated:Date.now()});}catch(e){console.warn('pushSync error:',e);}
}

/* ── STORAGE ── */
function loadPlayers(){
  const REMOVED_IDS=['p1','p8','p11']; // Chris Leger, Lagace, Jacques Bourgeois — removed from app
  const s=localStorage.getItem('gw_players');
  if(s){
    let p=JSON.parse(s);
    p=p.map(x=>x.password==='golf123'?{...x,password:'golf'}:x);
    // Remove deleted players
    p=p.filter(x=>!REMOVED_IDS.includes(x.id));
    // Add any missing seed players
    const missingIds=SEED_PLAYERS.filter(s=>!p.find(x=>x.id===s.id));
    if(missingIds.length)p=[...p,...missingIds];
    localStorage.setItem('gw_players',JSON.stringify(p));
    return p;
  }
  const all=[ADMIN,...SEED_PLAYERS];localStorage.setItem('gw_players',JSON.stringify(all));return all;
}
function savePlayers(p){localStorage.setItem('gw_players',JSON.stringify(p));}
function loadTeeTimes(){
  const SEED_IDS=['tt1','tt2','tt3','tt4']; // old seed tee times — always remove
  const s=localStorage.getItem('gw_tt');
  if(s){
    const t=JSON.parse(s);
    const cleaned=t.filter(x=>!SEED_IDS.includes(x.id));
    if(cleaned.length!==t.length)localStorage.setItem('gw_tt',JSON.stringify(cleaned));
    return cleaned;
  }
  localStorage.setItem('gw_tt',JSON.stringify([]));
  return [];
}
function saveTeeTimes(t){localStorage.setItem('gw_tt',JSON.stringify(t));}
function getEJSConfig(){return JSON.parse(localStorage.getItem('ejs_cfg')||'{"publicKey":"","serviceId":"","templateId":"","appUrl":""}');}
function isEJSConfigured(){const c=getEJSConfig();return !!(c.publicKey&&c.serviceId&&c.templateId);}
function getAppUrl(){const cfg=getEJSConfig();if(cfg.appUrl&&cfg.appUrl.trim())return cfg.appUrl.trim();const loc=window.location.href.split('?')[0].split('#')[0];return loc.startsWith('file://')?'https://your-app.github.io':loc;}
async function sendEJS(to,name,subj,msg){const c=getEJSConfig();if(!c.publicKey)throw new Error('not configured');return emailjs.send(c.serviceId,c.templateId,{to_email:to,to_name:name,subject:subj,message:msg,app_name:'Golf Warriors'},{publicKey:c.publicKey});}
function buildInviteMsg(tee,name){
  const notes=tee.notes?`\nNotes:    ${tee.notes}`:'';
  return`Hi ${name},\n\nYou've been invited to a golf round at Golf Warriors!\n\n━━━━━━━━━━━━━━━━━━━━━━\n  ${tee.course}\n━━━━━━━━━━━━━━━━━━━━━━\n  Date:  ${fmtDate(tee.date)}\n  Time:  ${fmtTime(tee.time)}${notes}\n━━━━━━━━━━━━━━━━━━━━━━\n\nLog in to the app to confirm IN or OUT:\n  https://rochbouc.github.io/Golf-Warriors?v=2\n\n— Golf Warriors`;
}

/* ── UI HELPERS ── */
function Av({player,size=28}){
  const bg=avColor(player?.name||player?.email||'x');
  return(
    <div className="av" style={{width:size,height:size,background:player?.photo?'transparent':bg,fontSize:size*.3,flexShrink:0}}>
      {player?.photo?<img src={player.photo} alt={player?.name}/>:initials(player?.name||player?.email||'?')}
    </div>
  );
}
function Toast({msg,type}){return <div className={`toast${msg?' on':''}${type?' '+type:''}`}>{msg}</div>;}

/* ── LOGIN ── */
function LoginScreen({onLogin}){
  const[email,setEmail]=useState('');
  const[pass,setPass]=useState('');
  const[err,setErr]=useState('');
  const[loading,setLoading]=useState(false);
  const doLogin=async()=>{
    setErr('');setLoading(true);
    const emailTrimmed=email.toLowerCase().trim();

    // Step 1: Try cloud first
    if(isSyncConfigured()){
      try{
        const data=await syncRead();
        if(data?.players?.length){
          localStorage.setItem('gw_players',JSON.stringify(data.players));
          if(data.teeTimes?.length)localStorage.setItem('gw_tt',JSON.stringify(data.teeTimes));
          // Check right away from cloud data
          const cloudUser=data.players.find(p=>p.email.toLowerCase()===emailTrimmed);
          if(cloudUser){
            setLoading(false);
            if(cloudUser.password!==pass){setErr('Incorrect password.');return;}
            onLogin(cloudUser);return;
          }
        }
      }catch(e){console.warn('Cloud read failed:',e);}
    }

    // Step 2: Fall back to local storage
    const players=loadPlayers();
    const user=players.find(p=>p.email.toLowerCase()===emailTrimmed);
    setLoading(false);
    if(!user){setErr('Email not registered. Contact the admin.');return;}
    if(user.password!==pass){setErr('Incorrect password.');return;}
    onLogin(user);
  };
  return(
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo"><span className="ico">⛳</span><h1>Golf <span>Warriors</span></h1><p>Tee Time Planner</p></div>
        <div className="login-invited">🔒 <strong>Invite only.</strong> You must be added by the admin before you can sign in.</div>
        <div className="login-form">
          <div className="login-input-wrap"><label>Email</label><input className="login-input" type="email" placeholder="your@email.com" value={email} onChange={e=>{setEmail(e.target.value);setErr('');}} onKeyDown={e=>{if(e.key==='Enter')doLogin();}}/></div>
          <div className="login-input-wrap"><label>Password</label><input className="login-input" type="password" placeholder="••••••••" value={pass} onChange={e=>{setPass(e.target.value);setErr('');}} onKeyDown={e=>{if(e.key==='Enter')doLogin();}}/></div>
          {err&&<div className="login-err">{err}</div>}
          <button className="btn-p" style={{width:'100%',padding:'.75rem',marginTop:'.25rem'}} onClick={doLogin} disabled={loading}>{loading?'Checking…':'Sign In →'}</button>
          <div className="login-note">Default password: <strong>golf</strong><br/>Change it under your profile after login.</div>
        </div>
      </div>
    </div>
  );
}

/* ── PROFILE ── */
function ProfilePage({currentUser,onUpdate,onLogout,toast}){
  const[name,setName]=useState(currentUser.name||'');
  const[email,setEmail]=useState(currentUser.email||'');
  const[pass,setPass]=useState('');
  const[pass2,setPass2]=useState('');
  const fileRef=useRef();
  const handlePhoto=e=>{
    const file=e.target.files[0];if(!file)return;
    if(file.size>2*1024*1024){toast('Image too large (max 2MB).','err');return;}
    const reader=new FileReader();
    reader.onload=ev=>{const players=loadPlayers();savePlayers(players.map(p=>p.id===currentUser.id?{...p,photo:ev.target.result}:p));onUpdate({...currentUser,photo:ev.target.result});toast('Photo updated! 📸');};
    reader.readAsDataURL(file);
  };
  const save=()=>{
    if(!name.trim()||!email.trim()){toast('Name and email required.','err');return;}
    if(pass&&pass!==pass2){toast('Passwords do not match.','err');return;}
    const players=loadPlayers();
    if(players.find(p=>p.email.toLowerCase()===email.toLowerCase()&&p.id!==currentUser.id)){toast('Email already in use.','err');return;}
    const u={...currentUser,name:name.trim(),email:email.trim().toLowerCase(),...(pass?{password:pass}:{})};
    savePlayers(players.map(p=>p.id===currentUser.id?u:p));
    onUpdate(u);setPass('');setPass2('');toast('Profile updated! ✅');
  };
  return(
    <div className="page">
      <div className="ph"><div className="ph-left"><div className="ph-eyebrow">Account</div><h1>My Profile</h1></div></div>
      <div className="profile-card">
        <div className="profile-pic-wrap">
          <div className="profile-pic" onClick={()=>fileRef.current.click()}>
            {currentUser.photo?<img src={currentUser.photo} alt={currentUser.name}/>:<span style={{color:'#fff',fontSize:'2rem',fontWeight:700,background:avColor(currentUser.name||currentUser.email),width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%'}}>{initials(currentUser.name||currentUser.email)}</span>}
            <div className="profile-pic-overlay">📷</div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhoto}/>
          <div style={{textAlign:'center'}}>
            <div className="profile-name">{currentUser.name}</div>
            <div className="profile-role">{currentUser.role==='admin'?'⚙️ Admin':currentUser.role==='manager'?'🏅 Manager':'🏌️ Player'}</div>
            <div style={{fontSize:'.72rem',color:'var(--text3)',marginTop:'.2rem'}}>Tap photo to change</div>
          </div>
        </div>
        <div className="fgrid">
          <div className="fg"><label>Full Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)}/></div>
          <div className="fg"><label>Email</label><input type="email" value={email} readOnly style={{background:'var(--bg2)',color:'var(--text3)',cursor:'not-allowed'}}/></div>
          <div className="fg"><label>New Password</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Leave blank to keep current"/></div>
          <div className="fg"><label>Confirm Password</label><input type="password" value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Re-enter new password"/></div>
        </div>
        <div className="factions" style={{justifyContent:'space-between'}}>
          <button onClick={onLogout} style={{background:'transparent',border:'1px solid #ef9a9a',color:'#c62828',padding:'.62rem 1.2rem',borderRadius:'var(--r-sm)',fontFamily:'Syne,sans-serif',fontSize:'.78rem',fontWeight:600,cursor:'pointer'}}>Sign Out</button>
          <button className="btn-p" onClick={save}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

/* ── STATS ── */
function Stats({teeTimes,players}){
  const upcoming=teeTimes.filter(isUpcoming).length;
  const confirmed=teeTimes.reduce((a,t)=>a+Object.values(t.rsvps||{}).filter(r=>r==='yes').length+(t.guests||[]).filter(g=>g.rsvp==='yes').length,0);
  const stats=[{lbl:'Upcoming',val:upcoming,sub:'rounds'},{lbl:'Total',val:teeTimes.length,sub:'all time'},{lbl:'Players',val:players.filter(p=>p.role!=='admin').length,sub:'in network'},{lbl:'Confirmed',val:confirmed,sub:'RSVPs'}];
  return(
    <div className="stats">
      {stats.map(s=>(
        <div className="sc" key={s.lbl}>
          <div className="sc-accent"/>
          <div className="sc-lbl">{s.lbl}</div>
          <div className="sc-val">{s.val}</div>
          <div className="sc-sub">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}

/* ── TEE CARD ── */
function TeeCard({tee,players,currentUser,onOpen,onDelete,canManagePlayers}){
  const rsvps=tee.rsvps||{};
  const gYes=(tee.guests||[]).filter(g=>g.rsvp==='yes').length;
  const gNo=(tee.guests||[]).filter(g=>g.rsvp==='no').length;
  const gPend=(tee.guests||[]).filter(g=>!g.rsvp).length;
  const yes=Object.values(rsvps).filter(r=>r==='yes').length+gYes;
  const no=Object.values(rsvps).filter(r=>r==='no').length+gNo;
  const pend=Math.max(0,(tee.invites||[]).length-Object.values(rsvps).filter(r=>r==='yes').length-Object.values(rsvps).filter(r=>r==='no').length+gPend);
  const invPl=(tee.invites||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean);
  const myStatus=rsvps[currentUser?.id];
  const canDel=canManagePlayers||tee.createdBy===currentUser?.id;
  return(
    <div className="tc" onClick={()=>onOpen(tee)}>
      <div className="tc-head">
        <span className="tc-course">{tee.course}</span>
        {myStatus==='yes'&&<span style={{fontSize:'.65rem',fontWeight:700,background:'#edf7ee',color:'#276228',padding:'2px 8px',borderRadius:20}}>✓ You're In</span>}
        {myStatus==='no'&&<span style={{fontSize:'.65rem',fontWeight:700,background:'#fce8e6',color:'#c62828',padding:'2px 8px',borderRadius:20}}>✗ You're Out</span>}
        {!myStatus&&(tee.invites||[]).includes(currentUser?.id)&&<span style={{fontSize:'.65rem',fontWeight:700,background:'#f5f5f5',color:'#888',padding:'2px 8px',borderRadius:20}}>? Pending</span>}
      </div>
      <div className="tc-body">
        <div className="tc-meta">
          <div className="tc-row"><span className="tc-icon">📅</span><span className="tc-val">{fmtDate(tee.date)}</span></div>
          <div className="tc-row"><span className="tc-icon">⏰</span><span className="tc-val">{fmtTime(tee.time)}</span></div>
          {tee.notes&&<div className="tc-note">{tee.notes}</div>}
        </div>
        <div className="tc-foot">
          <div className="avatars" style={{marginLeft:6}}>
            {invPl.slice(0,5).map(p=><Av key={p.id} player={p}/>)}
            {invPl.length>5&&<div className="av av-more">+{invPl.length-5}</div>}
            {!invPl.length&&<span style={{fontSize:'.7rem',color:'var(--text3)'}}>No invites</span>}
          </div>
          <button onClick={e=>{e.stopPropagation();onOpen(tee);}}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.2rem',background:myStatus==='yes'?'#edf7ee':myStatus==='no'?'#fce8e6':'var(--bg2)',border:`1.5px solid ${myStatus==='yes'?'#a5d6a7':myStatus==='no'?'#ef9a9a':'var(--border2)'}`,borderRadius:8,padding:'.35rem .65rem',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}>
            <div style={{display:'flex',gap:'.35rem',fontSize:'.72rem',fontWeight:700}}>
              {yes>=4?<span style={{color:'#c62828',fontWeight:800,fontSize:'.68rem'}}>⛳ FULL 4/4</span>:<><span className="ty">✓{yes}</span><span className="tn">✗{no}</span><span className="tp">?{pend}</span></>}
            </div>
            <span style={{fontSize:'.6rem',fontWeight:700,color:myStatus==='yes'?'#276228':myStatus==='no'?'#c62828':'var(--text3)'}}>
              {myStatus==='yes'?'YOU: IN ✓':myStatus==='no'?'YOU: OUT ✗':yes>=4?'TEE FULL':'TAP TO RSVP'}
            </span>
          </button>
        </div>
      </div>
      <div className="tc-actions" onClick={e=>e.stopPropagation()}>
        <button className="ac-btn grn" onClick={()=>onOpen(tee)}>👥 View Players</button>
        {canDel&&<button className="ac-btn del" onClick={()=>onDelete(tee.id)}>🗑 Delete</button>}
      </div>
    </div>
  );
}

/* ── TEE DETAIL MODAL ── */
function TeeDetailModal({tee,teeTimes,currentUser,onClose,onRsvp,onGuestRsvp,onEdit,canManagePlayers}){
  if(!tee)return null;
  const live=teeTimes.find(t=>t.id===tee.id)||tee;
  const rsvps=live.rsvps||{};
  const freshPl=loadPlayers();
  const invPl=(live.invites||[]).map(id=>freshPl.find(p=>p.id===id)).filter(Boolean);
  const myStatus=rsvps[currentUser.id];
  const canManage=canManagePlayers||live.createdBy===currentUser.id;
  const gYes=(live.guests||[]).filter(g=>g.rsvp==='yes').length;
  const gNo=(live.guests||[]).filter(g=>g.rsvp==='no').length;
  const yesCount=Object.values(rsvps).filter(r=>r==='yes').length+gYes;
  const noCount=Object.values(rsvps).filter(r=>r==='no').length+gNo;
  const pendCount=invPl.filter(p=>!rsvps[p.id]).length+(live.guests||[]).filter(g=>!g.rsvp).length;
  const isFull=yesCount>=4;
  const alreadyIn=myStatus==='yes';
  return(
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal">
        <div className="modal-head"><h2>⛳ {live.course}</h2><button className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',marginBottom:'1.1rem',fontSize:'.82rem',color:'var(--text2)'}}>
            <span>📅 {fmtDate(live.date)}</span>
            <span>⏰ {fmtTime(live.time)}</span>
          </div>
          {live.notes&&<div style={{fontSize:'.78rem',color:'var(--text3)',marginBottom:'1rem',padding:'.5rem .75rem',background:'var(--bg2)',borderRadius:'var(--r-sm)',borderLeft:'2px solid var(--border2)'}}>{live.notes}</div>}

          <div style={{background:'var(--bg2)',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',padding:'.9rem 1rem',marginBottom:'1rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.6rem'}}>
              <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em'}}>My Response</div>
              <div style={{fontSize:'.7rem',fontWeight:700,color:isFull?'#c62828':'#276228'}}>{yesCount}/4 spots filled</div>
            </div>
            {isFull&&!alreadyIn&&(
              <div style={{background:'#fce8e6',border:'1px solid #ef9a9a',borderRadius:'var(--r-sm)',padding:'.6rem .85rem',marginBottom:'.75rem',fontSize:'.82rem',color:'#c62828',fontWeight:600,lineHeight:1.5,textAlign:'center'}}>
                ⛳ This tee time is full! (4/4)<br/>
                <span style={{fontWeight:400,fontSize:'.78rem'}}>Please check the next available tee time.</span>
              </div>
            )}
            <div style={{display:'flex',gap:'.5rem'}}>
              <button onClick={()=>onRsvp(live.id,currentUser.id,'yes')} disabled={isFull&&!alreadyIn}
                style={{flex:1,padding:'.65rem .5rem',border:`2px solid ${myStatus==='yes'?'#276228':'#e0e0e0'}`,borderRadius:'var(--r-sm)',background:myStatus==='yes'?'#edf7ee':isFull&&!alreadyIn?'#f5f5f5':'#fff',color:myStatus==='yes'?'#276228':isFull&&!alreadyIn?'#bbb':'#555',fontFamily:'Syne,sans-serif',fontSize:'.85rem',fontWeight:700,cursor:isFull&&!alreadyIn?'not-allowed':'pointer',opacity:isFull&&!alreadyIn?.6:1}}>
                ✅ I'm In
              </button>
              <button onClick={()=>onRsvp(live.id,currentUser.id,'no')}
                style={{flex:1,padding:'.65rem .5rem',border:`2px solid ${myStatus==='no'?'#c62828':'#e0e0e0'}`,borderRadius:'var(--r-sm)',background:myStatus==='no'?'#fce8e6':'#fff',color:myStatus==='no'?'#c62828':'#555',fontFamily:'Syne,sans-serif',fontSize:'.85rem',fontWeight:700,cursor:'pointer'}}>
                ❌ Can't Make It
              </button>
            </div>
            {myStatus&&<div style={{fontSize:'.7rem',color:'#888',textAlign:'center',marginTop:'.5rem'}}>Tap again to change your response</div>}
          </div>

          <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'.5rem',display:'flex',alignItems:'center',gap:'.75rem',flexWrap:'wrap'}}>
            <span>Players ({invPl.length+(live.guests||[]).length})</span>
            <span style={{color:'#276228'}}>✓{yesCount} In</span>
            <span style={{color:'#c62828'}}>✗{noCount} Out</span>
            <span style={{color:'var(--text3)'}}>?{pendCount} Pending</span>
          </div>

          <div className="rsvp-list">
            {invPl.map(p=>{
              const s=rsvps[p.id];
              const isMe=p.id===currentUser.id;
              const canChange=isMe||canManage;
              return(
                <div className="rsvp-row" key={p.id} style={{background:isMe?'#f0f9f1':'',borderColor:isMe?'#a5d6a7':''}}>
                  <div className="rsvp-av" style={{background:p.photo?'transparent':avColor(p.name)}}>{p.photo?<img src={p.photo} alt={p.name}/>:initials(p.name)}</div>
                  <div className="rsvp-info">
                    <div className="rsvp-name">{p.name}{isMe&&<span style={{fontSize:'.6rem',color:'#276228',marginLeft:'.4rem',fontWeight:700}}>YOU</span>}</div>
                    <div className="rsvp-email">{p.email}</div>
                  </div>
                  {canChange
                    ?<div style={{display:'flex',gap:'.3rem',flexShrink:0}}>
                      <button onClick={()=>onRsvp(live.id,p.id,'yes')} style={{padding:'.25rem .5rem',border:`1.5px solid ${s==='yes'?'#276228':'#ddd'}`,borderRadius:6,background:s==='yes'?'#edf7ee':'#fff',color:s==='yes'?'#276228':'#555',fontSize:'.72rem',fontWeight:700,cursor:'pointer'}}>✅ In</button>
                      <button onClick={()=>onRsvp(live.id,p.id,'no')} style={{padding:'.25rem .5rem',border:`1.5px solid ${s==='no'?'#c62828':'#ddd'}`,borderRadius:6,background:s==='no'?'#fce8e6':'#fff',color:s==='no'?'#c62828':'#555',fontSize:'.72rem',fontWeight:700,cursor:'pointer'}}>❌ Out</button>
                    </div>
                    :<span className={`badge ${s||'pending'}`}>{s==='yes'?'✅ In':s==='no'?'❌ Out':'⏳ Pending'}</span>}
                </div>
              );
            })}
            {(live.guests||[]).map(g=>{
              const ttlYes=Object.values(rsvps).filter(r=>r==='yes').length+(live.guests||[]).filter(x=>x.rsvp==='yes').length;
              const gFull=ttlYes>=4;
              const canChangeGuest=canManagePlayers||g.createdBy===currentUser.id;
              return(
                <div className="rsvp-row" key={g.id} style={{background:'#fffdf0',borderColor:'#ffd166'}}>
                  <div className="rsvp-av" style={{background:'#f0ad00'}}>{g.name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</div>
                  <div className="rsvp-info">
                    <div className="rsvp-name">{g.name} <span style={{fontSize:'.6rem',background:'#fff3cd',color:'#856404',padding:'1px 6px',borderRadius:10,fontWeight:700,border:'1px solid #ffd166'}}>GUEST</span></div>
                    <div className="rsvp-email">Temporary player</div>
                  </div>
                  {canChangeGuest
                    ?<div style={{display:'flex',gap:'.3rem',flexShrink:0}}>
                      <button onClick={()=>onGuestRsvp(live.id,g.id,'yes')} disabled={gFull&&g.rsvp!=='yes'} style={{padding:'.25rem .5rem',border:`1.5px solid ${g.rsvp==='yes'?'#276228':'#ddd'}`,borderRadius:6,background:g.rsvp==='yes'?'#edf7ee':'#fff',color:g.rsvp==='yes'?'#276228':'#555',fontSize:'.72rem',fontWeight:700,cursor:gFull&&g.rsvp!=='yes'?'not-allowed':'pointer',opacity:gFull&&g.rsvp!=='yes'?.5:1}}>✅ In</button>
                      <button onClick={()=>onGuestRsvp(live.id,g.id,'no')} style={{padding:'.25rem .5rem',border:`1.5px solid ${g.rsvp==='no'?'#c62828':'#ddd'}`,borderRadius:6,background:g.rsvp==='no'?'#fce8e6':'#fff',color:g.rsvp==='no'?'#c62828':'#555',fontSize:'.72rem',fontWeight:700,cursor:'pointer'}}>❌ Out</button>
                    </div>
                    :<span className={`badge ${g.rsvp||'pending'}`}>{g.rsvp==='yes'?'✅ In':g.rsvp==='no'?'❌ Out':'⏳ Pending'}</span>
                  }
                </div>
              );
            })}
            {invPl.length===0&&(live.guests||[]).length===0&&<p style={{fontSize:'.8rem',color:'var(--text3)'}}>No players invited yet.</p>}
          </div>

          {canManage&&(
            <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--border)',display:'flex',justifyContent:'flex-end'}}>
              <button className="btn-s" onClick={()=>onEdit(live)}>✏️ Edit Tee Time</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── BOOK TEE TIME ── */
function BookTeeTime({tee,players,currentUser,canManagePlayers,onSave,onCancel,toast,isEdit,defaultDate}){
  const today=new Date().toISOString().split('T')[0];
  const[course,setCourse]=useState(tee?.course||'');
  const[date,setDate]=useState(tee?.date||defaultDate||'');
  const[time,setTime]=useState(tee?.time||'');
  const[notes,setNotes]=useState(tee?.notes||'');
  const allPl=players.filter(p=>p.role!=='admin');
  const[selected,setSelected]=useState(new Set(isEdit?(tee?.invites||allPl.map(p=>p.id)):allPl.map(p=>p.id)));
  const[guests,setGuests]=useState(tee?.guests||[]);
  const[guestName,setGuestName]=useState('');
  const[sending,setSending]=useState(false);

  useEffect(()=>{
    if(!isEdit){
      const fresh=loadPlayers().filter(p=>p.role!=='admin');
      setSelected(prev=>{const n=new Set(prev);fresh.forEach(p=>n.add(p.id));return n;});
    }
  },[players.length]);

  const submit=async()=>{
    if(!course||!date||!time){toast('Please fill in course, date & time.','err');return;}
    const invites=[...selected];
    const newTee={id:tee?.id||uid(),course,date,time,notes,invites,guests,rsvps:tee?.rsvps||{},createdBy:tee?.createdBy||currentUser.id,createdAt:tee?.createdAt||new Date().toISOString()};
    setSending(true);
    if(isEJSConfigured()){
      const subj=`⛳ Tee Time — ${course} on ${fmtDate(date)}`;
      const freshPl=loadPlayers();
      const prevInvites=new Set(tee?.invites||[]);
      const toEmail=isEdit?freshPl.filter(p=>selected.has(p.id)&&!prevInvites.has(p.id)):freshPl.filter(p=>selected.has(p.id));
      let ok=0,fail=0;
      for(const p of toEmail){try{await sendEJS(p.email,p.name,subj,buildInviteMsg(newTee,p.name));ok++;}catch{fail++;}}
      setSending(false);onSave(newTee,invites);
      if(toEmail.length===0)toast(isEdit?'Updated! ✅':'Booked! ⛳');
      else if(fail===0)toast(`${isEdit?'Updated':'Booked'}! ${ok} invite${ok!==1?'s':''} sent ✉️`);
      else toast(`${isEdit?'Updated':'Booked'}! Sent ${ok}, failed ${fail}.`,'err');
    } else {
      setSending(false);onSave(newTee,invites);
      toast(!isEdit?'Booked! ⚠️ Configure EmailJS in ⚙️ to send invites.':'Updated! ✅');
    }
  };

  return(
    <div className="page">
      <div className="ph"><div className="ph-left"><div className="ph-eyebrow">{isEdit?'Edit Booking':'New Booking'}</div><h1>{isEdit?'Edit Tee Time':'Book a Tee Time'}</h1></div></div>
      <div className="fcard">
        <div className="fgrid">
          <div className="fg"><label>Course Name</label><input type="text" placeholder="e.g. Royal Moncton Golf Club" value={course} onChange={e=>setCourse(e.target.value)}/></div>
          <div className="fg"><label>Date</label><input type="date" min={isEdit?undefined:today} value={date} onChange={e=>setDate(e.target.value)}/></div>
          <div className="fg"><label>Tee Time</label><input type="time" value={time} onChange={e=>setTime(e.target.value)}/></div>
          <div className="fg wide"><label>Notes</label><textarea placeholder="Dress code, parking info..." value={notes} onChange={e=>setNotes(e.target.value)}/></div>
        </div>
        <div className="isec">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'.35rem'}}>
            <h3>Invite Players</h3>
            <div style={{display:'flex',gap:'.5rem'}}>
              <button onClick={()=>setSelected(new Set(allPl.map(p=>p.id)))} style={{background:'none',border:'none',fontSize:'.72rem',color:'var(--text2)',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600,textDecoration:'underline'}}>All</button>
              <button onClick={()=>setSelected(new Set())} style={{background:'none',border:'none',fontSize:'.72rem',color:'var(--text2)',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600,textDecoration:'underline'}}>None</button>
            </div>
          </div>
          <div className="player-select-list">
            {allPl.map(p=>{
              const sel=selected.has(p.id);
              return(
                <div key={p.id} className={`ps-item${sel?' selected':''}`} onClick={()=>setSelected(prev=>{const n=new Set(prev);n.has(p.id)?n.delete(p.id):n.add(p.id);return n;})}>
                  <div className="ps-radio"><div className="ps-radio-dot"/></div>
                  <div className="ps-av" style={{background:p.photo?'transparent':avColor(p.name)}}>{p.photo?<img src={p.photo} alt={p.name}/>:initials(p.name)}</div>
                  <div className="ps-info"><div className="ps-name">{p.name}</div><div className="ps-email">{p.email}</div></div>
                </div>
              );
            })}
          </div>
          <div style={{fontSize:'.72rem',color:'var(--text2)',marginTop:'.5rem',fontWeight:600}}>✓ {selected.size} of {allPl.length} players selected</div>
        </div>
        {canManagePlayers&&(
          <div className="isec">
            <h3>Guest Players <span style={{fontSize:'.72rem',fontWeight:500,color:'var(--text3)',fontFamily:'Syne,sans-serif'}}>— no account needed</span></h3>
            {guests.length>0&&(
              <div className="guest-list" style={{marginBottom:'.75rem'}}>
                {guests.map(g=>(
                  <div className="guest-item" key={g.id}>
                    <div style={{width:32,height:32,borderRadius:'50%',background:'#f0ad00',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.7rem',fontWeight:700,color:'#fff',flexShrink:0}}>{g.name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</div>
                    <span className="guest-name">{g.name}</span>
                    <span className="guest-badge">Guest</span>
                    <button className="guest-remove" onClick={()=>setGuests(prev=>prev.filter(x=>x.id!==g.id))}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:'flex',gap:'.5rem'}}>
              <input type="text" placeholder="Guest name" value={guestName} onChange={e=>setGuestName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&guestName.trim()){setGuests(prev=>[...prev,{id:'guest_'+uid(),name:guestName.trim(),rsvp:null,createdBy:currentUser.id}]);setGuestName('');}}} style={{flex:1,padding:'.6rem .85rem',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',fontFamily:'Syne,sans-serif',fontSize:'.86rem',background:'var(--surface)',outline:'none'}}/>
              <button className="btn-s" onClick={()=>{if(guestName.trim()){setGuests(prev=>[...prev,{id:'guest_'+uid(),name:guestName.trim(),rsvp:null,createdBy:currentUser.id}]);setGuestName('');}}}>+ Add</button>
            </div>
          </div>
        )}
        <div className="factions">
          <button className="btn-s" onClick={onCancel}>Cancel</button>
          <button className="btn-p" onClick={submit} disabled={sending}>{sending?'⏳ Saving…':isEdit?'Save Changes':'Book & Invite ✉️'}</button>
        </div>
      </div>
    </div>
  );
}

/* ── PLAYERS TAB ── */
function PlayersTab({players,teeTimes,onUpdatePlayer,onDeletePlayer,toast,canManagePlayers}){
  const[editPlayer,setEditPlayer]=useState(null);
  return(
    <div className="page">
      <div className="ph">
        <div className="ph-left"><div className="ph-eyebrow">Management</div><h2>Players</h2></div>
      </div>
      <div className="sec-label">All Players{canManagePlayers?' — tap to edit':''}</div>
      <div className="pgrid">
        {players.filter(p=>p.role!=='admin').map(p=>{
          const rounds=teeTimes.filter(t=>(t.invites||[]).includes(p.id)).length;
          const yes=teeTimes.reduce((a,t)=>a+((t.rsvps||{})[p.id]==='yes'?1:0),0);
          return(
            <div className="pc" key={p.id} onClick={()=>canManagePlayers&&setEditPlayer(p)} style={{cursor:canManagePlayers?'pointer':'default'}}>
              <div className="pav" style={{background:p.photo?'transparent':avColor(p.name)}}>{p.photo?<img src={p.photo} alt={p.name}/>:initials(p.name)}</div>
              <div className="pinfo">
                <div className="pname">{p.name}</div>
                <div className="pemail">{p.email}</div>
                <div className="pcount">{rounds} invite{rounds!==1?'s':''} · {yes} confirmed</div>
              </div>
            </div>
          );
        })}
      </div>
      {canManagePlayers&&editPlayer&&(
        <PlayerEditModal player={editPlayer} players={players}
          onSave={u=>{onUpdatePlayer(u);setEditPlayer(null);toast(`${u.name} updated! ✅`);}}
          onDelete={()=>{onDeletePlayer(editPlayer.id);setEditPlayer(null);toast(`${editPlayer.name} removed.`);}}
          onClose={()=>setEditPlayer(null)} toast={toast}/>
      )}
    </div>
  );
}

/* ── PLAYER EDIT MODAL ── */
function PlayerEditModal({player,players,onSave,onDelete,onClose,toast}){
  const[name,setName]=useState(player.name||'');
  const[email,setEmail]=useState(player.email||'');
  const[pass,setPass]=useState('');
  const[photo,setPhoto]=useState(player.photo||null);
  const fileRef=useRef();
  const handlePhoto=e=>{const file=e.target.files[0];if(!file)return;if(file.size>2*1024*1024){toast('Image too large.','err');return;}const r=new FileReader();r.onload=ev=>setPhoto(ev.target.result);r.readAsDataURL(file);};
  const save=()=>{
    if(!name.trim()||!email.trim()){toast('Name and email required.','err');return;}
    if(players.find(p=>p.email.toLowerCase()===email.toLowerCase().trim()&&p.id!==player.id)){toast('Email already used.','err');return;}
    onSave({...player,name:name.trim(),email:email.trim().toLowerCase(),photo,...(pass?{password:pass}:{})});
  };
  return(
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="modal-head"><h2>Edit Player</h2><button className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.6rem',marginBottom:'1.5rem'}}>
            <div onClick={()=>fileRef.current.click()} style={{width:80,height:80,borderRadius:'50%',overflow:'hidden',border:'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',background:photo?'transparent':avColor(player.name),cursor:'pointer'}}>
              {photo?<img src={photo} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{color:'#fff',fontSize:'1.5rem',fontWeight:700}}>{initials(name||player.name)}</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhoto}/>
            <div style={{fontSize:'.72rem',color:'var(--text3)'}}>Tap photo to change</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'.9rem'}}>
            <div className="fg"><label>Full Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)}/></div>
            <div className="fg"><label>Email</label><input type="email" value={email} readOnly style={{background:'var(--bg2)',color:'var(--text3)',cursor:'not-allowed'}}/></div>
            <div className="fg"><label>New Password</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Leave blank to keep current"/></div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'1.5rem',paddingTop:'1.25rem',borderTop:'1px solid var(--border)'}}>
            <button onClick={()=>{if(confirm(`Remove ${player.name}?`))onDelete();}} style={{background:'transparent',border:'1px solid #ef9a9a',color:'#c62828',padding:'.5rem 1rem',borderRadius:'var(--r-sm)',fontFamily:'Syne,sans-serif',fontSize:'.75rem',fontWeight:600,cursor:'pointer'}}>🗑 Remove</button>
            <div style={{display:'flex',gap:'.5rem'}}>
              <button className="btn-s" onClick={onClose}>Cancel</button>
              <button className="btn-p" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── CALENDAR ── */
function CalendarView({teeTimes,players,currentUser,onOpen,onEdit,onNew,canManagePlayers}){
  const now=new Date();
  const[year,setYear]=useState(now.getFullYear());
  const[month,setMonth]=useState(now.getMonth());
  const[selected,setSelected]=useState(null);
  const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const firstDay=new Date(year,month,1).getDay();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const teesByDay={};
  teeTimes.filter(isUpcoming).forEach(t=>{if(!t.date)return;const d=new Date(t.date+'T12:00:00');if(d.getFullYear()===year&&d.getMonth()===month){const k=d.getDate();if(!teesByDay[k])teesByDay[k]=[];teesByDay[k].push(t);}});
  const cells=[];
  for(let i=0;i<firstDay;i++)cells.push(null);
  for(let d=1;d<=daysInMonth;d++)cells.push(d);
  const todayDay=now.getFullYear()===year&&now.getMonth()===month?now.getDate():null;
  const selTees=selected?teesByDay[selected]||[]:[];
  const selDateStr=selected?`${year}-${String(month+1).padStart(2,'0')}-${String(selected).padStart(2,'0')}`:null;
  return(
    <div className="page">
      <div className="ph"><div className="ph-left"><div className="ph-eyebrow">Schedule</div><h1>Calendar</h1></div></div>
      <div className="cal-wrap">
        <div className="cal-card">
          <div className="cal-nav">
            <button className="cal-arr" onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);setSelected(null);}}>‹</button>
            <div className="cal-month">{MONTHS[month]} <span style={{color:'var(--text3)',fontFamily:'Syne,sans-serif',fontSize:'1rem',fontWeight:600}}>{year}</span></div>
            <button className="cal-arr" onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);setSelected(null);}}>›</button>
          </div>
          <div className="cal-grid">
            {DAYS.map(d=><div className="cal-dh" key={d}>{d}</div>)}
            {cells.map((day,i)=>{
              if(!day)return <div key={'e'+i} className="cal-empty"/>;
              const tees=teesByDay[day]||[];
              const isToday=day===todayDay,isSel=day===selected;
              return(
                <div key={day} className={`cal-cell${isToday?' today':''}${isSel?' sel':''}${tees.length?' has-tee':''}`} onClick={()=>setSelected(isSel?null:day)}>
                  <span className="cal-num">{day}</span>
                  {tees.length>0&&<div className="cal-dots">{tees.slice(0,3).map(t=><div className="cal-dot" key={t.id}/>)}</div>}
                </div>
              );
            })}
          </div>
          <div style={{fontSize:'.68rem',color:'var(--text3)',marginTop:'.75rem',textAlign:'center'}}>{canManagePlayers?'Tap a day to view or book':'Tap a day to view tee times'}</div>
        </div>
        <div className="cal-side">
          {selected?(
            <div>
              <div className="cal-side-hd">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div className="ph-eyebrow">{MONTHS[month]} {selected}</div>
                    <div style={{fontSize:'1rem',fontWeight:600,color:'var(--text)',marginTop:'.2rem'}}>{selTees.length>0?`${selTees.length} Tee Time${selTees.length>1?'s':''}`:' No tee times'}</div>
                  </div>
                  {canManagePlayers&&<button className="btn-p" style={{padding:'.4rem .85rem',fontSize:'.72rem'}} onClick={()=>onNew(selDateStr)}>+ Book</button>}
                </div>
              </div>
              {selTees.length===0
                ?<div style={{textAlign:'center',padding:'1.5rem 1rem',color:'var(--text3)',fontSize:'.82rem',lineHeight:1.6}}>No rounds on this day.{canManagePlayers&&<><br/><span style={{color:'var(--text2)'}}>Tap <strong>+ Book</strong> to add one.</span></>}</div>
                :selTees.map(t=>{
                  const invPl=(t.invites||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean);
                  const canEdit=canManagePlayers||t.createdBy===currentUser.id;
                  return(
                    <div className="cal-event" key={t.id} onClick={()=>onOpen(t)}>
                      <div className="cal-ev-top"><span className="cal-ev-course">{t.course}</span><span className="cal-ev-time">{fmtTime(t.time)}</span></div>
                      {t.notes&&<div className="cal-ev-note">{t.notes}</div>}
                      <div className="cal-ev-players">
                        <div style={{display:'flex',marginLeft:5}}>{invPl.slice(0,4).map(p=><Av key={p.id} player={p} size={22}/>)}{invPl.length===0&&<span style={{fontSize:'.68rem',color:'var(--text3)'}}>No invites</span>}</div>
                        <div style={{display:'flex',gap:'.3rem'}}>{canEdit&&<button className="ac-btn" style={{padding:'.28rem .55rem',fontSize:'.65rem'}} onClick={e=>{e.stopPropagation();onEdit(t);}}>✏️ Edit</button>}</div>
                      </div>
                    </div>
                  );
                })
              }
            </div>
          ):(
            <div style={{textAlign:'center',padding:'3rem 1rem',color:'var(--text3)'}}>
              <div style={{fontSize:'1.8rem',marginBottom:'.6rem'}}>📅</div>
              <div style={{fontSize:'.82rem',lineHeight:1.6}}>Tap a day to see tee times.{canManagePlayers&&<><br/>Then tap <strong>+ Book</strong> to add one.</>}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── DASHBOARD ── */
function Dashboard({teeTimes,players,currentUser,onOpen,onDelete,onNew,canManagePlayers}){
  const upcoming=teeTimes.filter(isUpcoming);
  return(
    <div className="page">
      <div className="ph">
        <div className="ph-left"><div className="ph-eyebrow">Golf Tee Time Planner</div><h1>Upcoming Rounds</h1></div>
        <button className="btn-p" onClick={onNew}>+ Book Tee Time</button>
      </div>
      <Stats teeTimes={teeTimes} players={players}/>

      {/* One-time sync push — only shown once until pushed */}
      {canManagePlayers&&isSyncConfigured()&&!localStorage.getItem('gw_pushed')&&(
        <div style={{background:'#fff8e1',border:'1px solid #ffe082',borderRadius:'var(--r-sm)',padding:'.75rem 1rem',marginBottom:'1rem',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem',flexWrap:'wrap'}}>
          <div style={{fontSize:'.8rem',color:'#7c5c00',lineHeight:1.5}}>
            ☁️ <strong>First time setup:</strong> Push your data to the cloud so all phones sync.
          </div>
          <button onClick={async()=>{
            const ok=await syncWrite({teeTimes,players,updated:Date.now()});
            if(ok){localStorage.setItem('gw_pushed','1');alert('✅ Done! All phones will now sync automatically.');}
            else alert('❌ Push failed. Check your internet connection.');
          }} style={{background:'#f57f17',color:'#fff',border:'none',padding:'.4rem .9rem',borderRadius:'var(--r-sm)',fontFamily:'Syne,sans-serif',fontSize:'.75rem',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
            Push Now
          </button>
        </div>
      )}

      <div className="sec-label">Active Tee Times</div>
      {upcoming.length===0
        ?<div className="empty"><div className="empty-ico">🏌️</div><h2>No upcoming rounds</h2><p>Be the first to book a tee time!</p><button className="btn-p" onClick={onNew}>Book a Tee Time</button></div>
        :<div className="tgrid">{upcoming.map(t=><TeeCard key={t.id} tee={t} players={players} currentUser={currentUser} onOpen={onOpen} onDelete={onDelete} canManagePlayers={canManagePlayers}/>)}</div>}
    </div>
  );
}

/* ── HISTORY ── */
function History({teeTimes,players,currentUser,onOpen,onDelete,canManagePlayers}){
  const past=teeTimes.filter(t=>!isUpcoming(t));
  return(
    <div className="page">
      <div className="ph"><div className="ph-left"><div className="ph-eyebrow">Past Rounds</div><h1>History</h1></div></div>
      {past.length===0
        ?<div className="empty"><div className="empty-ico">📋</div><h2>No past rounds</h2><p>Completed tee times appear here.</p></div>
        :<div className="tgrid">{past.map(t=><TeeCard key={t.id} tee={t} players={players} currentUser={currentUser} onOpen={onOpen} onDelete={onDelete} canManagePlayers={canManagePlayers}/>)}</div>}
    </div>
  );
}

/* ── SETTINGS MODAL ── */
function SettingsModal({onClose}){
  const saved=getEJSConfig();
  const[pk,setPk]=useState(saved.publicKey||'');
  const[sid,setSid]=useState(saved.serviceId||'');
  const[tid,setTid]=useState(saved.templateId||'');
  const[appUrl,setAppUrl]=useState(saved.appUrl||'');
  const savedSB=getSyncConfig();
  const[sbUrl,setSbUrl]=useState(savedSB.url||'');
  const[sbKey,setSbKey]=useState(savedSB.key||'');
  const[syncStatus,setSyncStatus]=useState('idle');
  const[syncMsg,setSyncMsg]=useState('');
  const[ejsStatus,setEjsStatus]=useState('idle');
  const[ejsMsg,setEjsMsg]=useState('');
  const save=()=>{
    localStorage.setItem('ejs_cfg',JSON.stringify({publicKey:pk.trim(),serviceId:sid.trim(),templateId:tid.trim(),appUrl:appUrl.trim()}));
    onClose(true);
  };
  const testSync=async()=>{
    const url=sbUrl.trim();const key=sbKey.trim();
    if(!url||!key){setSyncStatus('bad');setSyncMsg('Enter URL and Key first.');return;}
    setSyncStatus('testing');setSyncMsg('Testing…');
    try{
      const r=await fetch(`${url}/rest/v1/${SB_TABLE}?id=eq.1&select=data`,{
        headers:{'apikey':key,'Authorization':'Bearer '+key}
      });
      if(!r.ok){setSyncStatus('bad');setSyncMsg('❌ Failed ('+r.status+'). Check URL and key.');return;}
      // Test write
      const w=await fetch(`${url}/rest/v1/${SB_TABLE}`,{
        method:'POST',
        headers:{'apikey':key,'Authorization':'Bearer '+key,'Content-Type':'application/json','Prefer':'resolution=merge-duplicates'},
        body:JSON.stringify({id:1,data:{test:true}})
      });
      if(!w.ok){setSyncStatus('bad');setSyncMsg('❌ Write failed ('+w.status+')');return;}
      setSyncStatus('ok');setSyncMsg('✅ Connected! Sync is working.');
    }catch(e){setSyncStatus('bad');setSyncMsg('❌ Error: '+e.message);}
  };
  const testEJS=async()=>{
    if(!pk||!sid||!tid){setEjsStatus('bad');setEjsMsg('Fill all three fields first.');return;}
    setEjsStatus('testing');setEjsMsg('Sending test…');
    try{await emailjs.send(sid.trim(),tid.trim(),{to_email:'test@example.com',to_name:'Test',subject:'⛳ Golf Warriors Test',message:'EmailJS is working!',app_name:'Golf Warriors'},{publicKey:pk.trim()});setEjsStatus('ok');setEjsMsg('Connected! ✅');}
    catch(e){setEjsStatus('bad');setEjsMsg('Failed: '+(e?.text||e?.message||'Check credentials.'));}
  };
  return(
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose(false);}}>
      <div className="modal" style={{maxWidth:500}}>
        <div className="modal-head"><h2>⚙️ Settings</h2><button className="modal-x" onClick={()=>onClose(false)}>✕</button></div>
        <div className="modal-body">

          {/* Cloud Sync */}
          <div style={{marginBottom:'1.5rem',paddingBottom:'1.5rem',borderBottom:'1px solid var(--border)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.5rem'}}>
              <div className="settings-label" style={{margin:0}}>☁️ Cloud Sync</div>
              {syncStatus==='ok'?<span style={{fontSize:'.65rem',fontWeight:700,background:'#edf7ee',color:'#276228',padding:'2px 8px',borderRadius:20}}>✓ Working</span>:syncStatus==='bad'?<span style={{fontSize:'.65rem',fontWeight:700,background:'#fce8e6',color:'#c62828',padding:'2px 8px',borderRadius:20}}>✗ Error</span>:<span style={{fontSize:'.65rem',fontWeight:700,background:'#edf7ee',color:'#276228',padding:'2px 8px',borderRadius:20}}>✓ Configured</span>}
            </div>
            <p className="hint" style={{marginBottom:'.75rem'}}>Free at <a href="https://supabase.com" target="_blank" style={{color:'var(--text)',fontWeight:600,textDecoration:'underline'}}>supabase.com</a> — sign up, create a project, then get the URL and anon key from Project Settings → API.</p>
            <div style={{display:'flex',flexDirection:'column',gap:'.6rem',marginBottom:'.75rem'}}>
              <div><div className="settings-label">Project URL</div><input className="settings-input" type="url" placeholder="https://xxxx.supabase.co" value={sbUrl} onChange={e=>setSbUrl(e.target.value)}/></div>
              <div><div className="settings-label">Anon/Public Key</div><input className="settings-input" type="text" placeholder="eyJ..." value={sbKey} onChange={e=>setSbKey(e.target.value)}/></div>
            </div>
            {syncStatus!=='idle'&&<div className={`settings-status ${syncStatus==='testing'?'idle':syncStatus}`} style={{marginBottom:'.5rem'}}>{syncStatus==='testing'?'⏳':''} {syncMsg}</div>}
            <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
              <button className="btn-s" style={{fontSize:'.75rem'}} onClick={testSync} disabled={syncStatus==='testing'}>Test Sync Connection</button>
              <button className="btn-p" style={{fontSize:'.75rem'}} onClick={async()=>{
                const tt=JSON.parse(localStorage.getItem('gw_tt')||'[]');
                const pl=JSON.parse(localStorage.getItem('gw_players')||'[]');
                setSyncStatus('testing');setSyncMsg('Pushing data…');
                const ok=await syncWrite({teeTimes:tt,players:pl,updated:Date.now()});
                if(ok){setSyncStatus('ok');setSyncMsg('✅ Pushed '+pl.length+' players & '+tt.length+' tee times!');}
                else{setSyncStatus('bad');setSyncMsg('❌ Push failed.');}
              }}>Push Data to Cloud ☁️</button>
            </div>
          </div>

          <div style={{marginBottom:'1.5rem',paddingBottom:'1.5rem',borderBottom:'1px solid var(--border)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.5rem'}}>
              <div className="settings-label" style={{margin:0}}>🌐 App URL</div>
              {appUrl&&<span style={{fontSize:'.65rem',fontWeight:700,background:'#edf7ee',color:'#276228',padding:'2px 8px',borderRadius:20}}>✓ Set</span>}
            </div>
            <input className="settings-input" type="url" placeholder="https://yourusername.github.io/golf-warriors" value={appUrl} onChange={e=>setAppUrl(e.target.value)}/>
            <div className="settings-hint" style={{marginTop:'.4rem'}}>Your app's public URL — included in invitation emails.</div>
          </div>

          <div>
            <div className="settings-label" style={{marginBottom:'.6rem'}}>EmailJS Configuration</div>
            <p className="hint" style={{marginBottom:'.75rem'}}>
              <a href="https://www.emailjs.com" target="_blank" style={{color:'var(--text)',textDecoration:'underline'}}>emailjs.com</a> — free 200 emails/month. Template needs: To=<code style={{background:'var(--bg2)',padding:'1px 4px',borderRadius:3,fontSize:'.72rem'}}>{'{{to_email}}'}</code>, Subject=<code style={{background:'var(--bg2)',padding:'1px 4px',borderRadius:3,fontSize:'.72rem'}}>{'{{subject}}'}</code>, Body=<code style={{background:'var(--bg2)',padding:'1px 4px',borderRadius:3,fontSize:'.72rem'}}>{'{{message}}'}</code> (plain text).
            </p>
            <div className="settings-row">
              <div><div className="settings-label">Public Key</div><input className="settings-input" type="text" placeholder="abc123..." value={pk} onChange={e=>setPk(e.target.value)}/><div className="settings-hint">Account → API Keys</div></div>
              <div><div className="settings-label">Service ID</div><input className="settings-input" type="text" placeholder="service_xxx" value={sid} onChange={e=>setSid(e.target.value)}/><div className="settings-hint">Email Services</div></div>
              <div><div className="settings-label">Template ID</div><input className="settings-input" type="text" placeholder="template_xxx" value={tid} onChange={e=>setTid(e.target.value)}/><div className="settings-hint">Email Templates</div></div>
            </div>
            {ejsStatus!=='idle'&&<div className={`settings-status ${ejsStatus==='testing'?'idle':ejsStatus==='ok'?'ok':'bad'}`}>{ejsStatus==='testing'?'⏳':ejsStatus==='ok'?'✅':'❌'} {ejsMsg}</div>}
          </div>

          <div style={{display:'flex',gap:'.6rem',justifyContent:'flex-end',marginTop:'1.25rem',paddingTop:'1.1rem',borderTop:'1px solid var(--border)'}}>
            <button className="btn-s" onClick={testEJS} disabled={ejsStatus==='testing'}>Send Test Email</button>
            <button className="btn-p" onClick={save}>Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── APP ── */
function App(){
  const[currentUser,setCurrentUser]=useState(null);
  const[tab,setTab]=useState('dashboard');
  const[teeTimes,setTeeTimes]=useState(loadTeeTimes);
  const[players,setPlayers]=useState(loadPlayers);
  const[detailTee,setDetailTee]=useState(null);
  const[editTee,setEditTee]=useState(null);
  const[bookDate,setBookDate]=useState(null);
  const[showSettings,setShowSettings]=useState(false);
  const[toastMsg,setToastMsg]=useState('');
  const[toastType,setToastType]=useState('');
  const[syncing,setSyncing]=useState(false);
  const tmr=useRef(null);
  const touchStartY=useRef(0);
  const isAdmin=currentUser?.role==='admin';
  const canManagePlayers=isAdmin||currentUser?.role==='manager';

  // Pull-to-refresh handler
  const doRefresh=async()=>{
    if(syncing||!isSyncConfigured())return;
    setSyncing(true);
    try{
      const data=await syncRead();
      if(data){
        if(data.teeTimes&&Array.isArray(data.teeTimes)){localStorage.setItem('gw_tt',JSON.stringify(data.teeTimes));setTeeTimes(data.teeTimes);}
        if(data.players&&Array.isArray(data.players)){localStorage.setItem('gw_players',JSON.stringify(data.players));setPlayers(data.players);}
      }
    }catch{}
    setSyncing(false);
  };

  // Touch events for pull-to-refresh
  useEffect(()=>{
    const onTouchStart=e=>{touchStartY.current=e.touches[0].clientY;};
    const onTouchEnd=e=>{
      const diff=e.changedTouches[0].clientY-touchStartY.current;
      if(diff>80&&window.scrollY===0)doRefresh();
    };
    document.addEventListener('touchstart',onTouchStart,{passive:true});
    document.addEventListener('touchend',onTouchEnd,{passive:true});
    return()=>{document.removeEventListener('touchstart',onTouchStart);document.removeEventListener('touchend',onTouchEnd);};
  },[syncing]);

  useEffect(()=>{saveTeeTimes(teeTimes);},[teeTimes]);
  useEffect(()=>{if(!currentUser)localStorage.removeItem('gw_session');},[currentUser]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const openId=params.get('open');
    if(openId){window.history.replaceState({},'',window.location.pathname);const t=loadTeeTimes().find(t=>t.id===openId);if(t)setDetailTee(t);}
    // Pull fresh data from cloud on app load
    if(isSyncConfigured()){
      syncRead().then(data=>{
        if(!data)return;
        if(data.teeTimes&&Array.isArray(data.teeTimes)){localStorage.setItem('gw_tt',JSON.stringify(data.teeTimes));setTeeTimes(data.teeTimes);}
        if(data.players&&Array.isArray(data.players)){localStorage.setItem('gw_players',JSON.stringify(data.players));setPlayers(data.players);}
      }).catch(()=>{});
    }
    // Also pull when user returns to the app (tab visibility)
    const onVisible=()=>{
      if(document.visibilityState==='visible'&&isSyncConfigured()){
        syncRead().then(data=>{
          if(!data)return;
          if(data.teeTimes&&Array.isArray(data.teeTimes)){localStorage.setItem('gw_tt',JSON.stringify(data.teeTimes));setTeeTimes(data.teeTimes);}
          if(data.players&&Array.isArray(data.players)){localStorage.setItem('gw_players',JSON.stringify(data.players));setPlayers(data.players);}
        }).catch(()=>{});
      }
    };
    document.addEventListener('visibilitychange',onVisible);
    return()=>document.removeEventListener('visibilitychange',onVisible);
  },[]);

  useEffect(()=>{
    const GRACE=4*60*60*1000;
    const check=()=>setTeeTimes(prev=>{const now=Date.now();return prev.filter(t=>{if(!t.date||!t.time)return true;try{const d=new Date(t.date+'T'+t.time+':00').getTime();return isNaN(d)||now<d+GRACE;}catch{return true;}});});
    check();const iv=setInterval(check,60000);return()=>clearInterval(iv);
  },[]);

  const toast=(msg,type='ok')=>{setToastMsg(msg);setToastType(type);clearTimeout(tmr.current);tmr.current=setTimeout(()=>setToastMsg(''),3500);};
  const handleLogin=async user=>{
    setCurrentUser(user);
    setTab('loading');
    // Pull latest data from cloud with 5-second timeout
    if(isSyncConfigured()){
      try{
        const timeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error('timeout')),5000));
        const data=await Promise.race([syncRead(),timeout]);
        if(data){
          if(data.teeTimes&&Array.isArray(data.teeTimes)){localStorage.setItem('gw_tt',JSON.stringify(data.teeTimes));setTeeTimes(data.teeTimes);}
          if(data.players&&Array.isArray(data.players)){localStorage.setItem('gw_players',JSON.stringify(data.players));setPlayers(data.players);}
        }
      }catch{}
    }
    setTab('dashboard');
  };
  const handleLogout=()=>{setCurrentUser(null);localStorage.removeItem('gw_session');};
  const handleSaveTee=async tee=>{
    let next;
    setTeeTimes(prev=>{
      const idx=prev.findIndex(t=>t.id===tee.id);
      next=idx>=0?prev.map(t=>t.id===tee.id?tee:t):[...prev,tee];
      return next;
    });
    if(next)await pushSync(next,players);
    setEditTee(null);setBookDate(null);setTab('dashboard');
  };
  const MAX=4;
  const handleRsvp=async(teeId,playerId,answer)=>{
    // Always pull fresh data first to prevent race conditions
    let currentTees=teeTimes;
    if(isSyncConfigured()){
      try{
        const data=await syncRead();
        if(data?.teeTimes){
          currentTees=data.teeTimes;
          setTeeTimes(data.teeTimes);
          localStorage.setItem('gw_tt',JSON.stringify(data.teeTimes));
        }
      }catch{}
    }
    const tee=currentTees.find(t=>t.id===teeId);
    if(!tee)return;
    const gYes=(tee.guests||[]).filter(g=>g.rsvp==='yes').length;
    const yesCount=Object.values(tee.rsvps||{}).filter(r=>r==='yes').length+gYes;
    const alreadyIn=(tee.rsvps||{})[playerId]==='yes';
    if(answer==='yes'&&!alreadyIn&&yesCount>=MAX){
      toast('⛳ Tee time is full (4/4)! Check the next tee time.','err');return;
    }
    const next=currentTees.map(t=>t.id===teeId?{...t,rsvps:{...t.rsvps,[playerId]:answer}}:t);
    setTeeTimes(next);
    await pushSync(next,players);
    toast(answer==='yes'?"You're IN! ⛳":'Marked as out ❌');
  };

  const handleGuestRsvp=async(teeId,guestId,answer)=>{
    let currentTees=teeTimes;
    if(isSyncConfigured()){
      try{
        const data=await syncRead();
        if(data?.teeTimes){
          currentTees=data.teeTimes;
          setTeeTimes(data.teeTimes);
          localStorage.setItem('gw_tt',JSON.stringify(data.teeTimes));
        }
      }catch{}
    }
    const tee=currentTees.find(t=>t.id===teeId);
    if(!tee)return;
    const rYes=Object.values(tee.rsvps||{}).filter(r=>r==='yes').length;
    const gYes=(tee.guests||[]).filter(g=>g.rsvp==='yes').length;
    const guest=(tee.guests||[]).find(g=>g.id===guestId);
    if(answer==='yes'&&guest?.rsvp!=='yes'&&rYes+gYes>=MAX){
      toast('⛳ Tee time is full (4/4)!','err');return;
    }
    const next=currentTees.map(t=>t.id!==teeId?t:{...t,guests:(t.guests||[]).map(g=>g.id===guestId?{...g,rsvp:answer}:g)});
    setTeeTimes(next);
    await pushSync(next,players);
    toast(answer==='yes'?`${guest?.name} is IN! ⛳`:`${guest?.name} is OUT ❌`);
  };
  const handleDelete=id=>{if(!confirm('Delete this tee time?'))return;setTeeTimes(prev=>{const next=prev.filter(t=>t.id!==id);pushSync(next,players);return next;});toast('Deleted.');};
  const handleAddPlayer=p=>{const u=[...players,p];setPlayers(u);savePlayers(u);pushSync(teeTimes,u);toast(`${p.name} added!`);};
  const handleUpdatePlayer=u=>{const p=players.map(x=>x.id===u.id?u:x);setPlayers(p);savePlayers(p);pushSync(teeTimes,p);if(currentUser.id===u.id)setCurrentUser(u);};
  const handleDeletePlayer=id=>{const p=players.filter(x=>x.id!==id);setPlayers(p);savePlayers(p);pushSync(teeTimes,p);};
  const handleUpdateUser=u=>{setCurrentUser(u);setPlayers(prev=>{const p=prev.map(x=>x.id===u.id?u:x);savePlayers(p);return p;});};

  if(!currentUser)return <LoginScreen onLogin={handleLogin}/>;

  const TABS=[{id:'dashboard',label:'Dashboard'},{id:'new-tee',label:'Book'},{id:'calendar',label:'Calendar'},...(canManagePlayers?[{id:'players',label:'Players'}]:[]),{id:'history',label:'History'}];
  const ICONS={dashboard:'🏠','new-tee':'📅',calendar:'📆',players:'👥',history:'📋'};

  return(
    <>
      <nav className="nav">
        <div className="nav-brand" onClick={()=>setTab('dashboard')}><span className="nav-logo">⛳</span><span className="nav-name">Golf <span>Warriors</span></span></div>
        <div className="nav-tabs">{TABS.map(t=><button key={t.id} className={`ntab${tab===t.id?' on':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}</div>
        <div className="nav-right">
          <div className="nav-dot"/>
          {syncing&&<span style={{fontSize:'.7rem',color:'var(--text3)',fontFamily:'Syne,sans-serif'}}>⏳</span>}
          {canManagePlayers&&<button className="nav-gear" onClick={()=>setShowSettings(true)}>⚙️</button>}
          <div className="nav-avatar-btn" onClick={()=>setTab('profile')}>{currentUser.photo?<img src={currentUser.photo} alt={currentUser.name}/>:<div className="av-letter" style={{background:avColor(currentUser.name||''),width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.68rem',fontWeight:700,color:'#fff',borderRadius:'50%'}}>{initials(currentUser.name||currentUser.email)}</div>}</div>
          <button onClick={handleLogout} style={{background:'transparent',border:'1px solid #d0d0ce',color:'#999',padding:'.35rem .8rem',borderRadius:20,fontFamily:'Syne,sans-serif',fontSize:'.68rem',fontWeight:600,cursor:'pointer',whiteSpace:'nowrap'}} onMouseEnter={e=>{e.currentTarget.style.color='#d93025';e.currentTarget.style.borderColor='#ef9a9a';}} onMouseLeave={e=>{e.currentTarget.style.color='#999';e.currentTarget.style.borderColor='#d0d0ce';}}>Sign Out</button>
        </div>
      </nav>

      <nav className="bottom-nav">
        {TABS.map(t=>(
          <button key={t.id} className={`bnav-item${tab===t.id?' on':''}`} onClick={()=>setTab(t.id)}>
            <span className="bnav-icon">{ICONS[t.id]}</span>
            <span>{t.label}</span>
            <div className="bnav-dot"/>
          </button>
        ))}
        <button className={`bnav-item${tab==='profile'?' on':''}`} onClick={()=>setTab('profile')}>
          <span className="bnav-icon">{currentUser.photo?<img src={currentUser.photo} alt="" style={{width:22,height:22,borderRadius:'50%',objectFit:'cover'}}/>:<span>{initials(currentUser.name||'')}</span>}</span>
          <span>Profile</span>
          <div className="bnav-dot"/>
        </button>
        <button className="bnav-item" onClick={handleLogout} style={{color:'#d93025'}}>
          <span className="bnav-icon">🚪</span>
          <span>Sign Out</span>
          <div className="bnav-dot" style={{background:'#d93025'}}/>
        </button>
      </nav>

      {tab==='loading'&&<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:'1rem'}}><div style={{fontSize:'2rem'}}>⛳</div><div style={{fontFamily:'Syne,sans-serif',fontSize:'.9rem',color:'var(--text3)'}}>Loading…</div></div>}
      {tab==='dashboard'&&<Dashboard teeTimes={teeTimes} players={players} currentUser={currentUser} onOpen={setDetailTee} onDelete={handleDelete} onNew={()=>{setEditTee(null);setBookDate(null);setTab('new-tee');}} canManagePlayers={canManagePlayers}/>}
      {tab==='new-tee'&&!editTee&&<BookTeeTime players={players} currentUser={currentUser} canManagePlayers={canManagePlayers} onSave={handleSaveTee} onCancel={()=>{setBookDate(null);setTab('dashboard');}} toast={toast} isEdit={false} defaultDate={bookDate}/>}
      {tab==='calendar'&&<CalendarView teeTimes={teeTimes} players={players} currentUser={currentUser} onOpen={setDetailTee} onEdit={t=>{setEditTee(t);setTab('new-tee');}} onNew={d=>{setEditTee(null);setBookDate(d);setTab('new-tee');}} canManagePlayers={canManagePlayers}/>}
      {tab==='players'&&canManagePlayers&&<PlayersTab players={players} teeTimes={teeTimes} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} toast={toast} canManagePlayers={canManagePlayers}/>}
      {tab==='history'&&<History teeTimes={teeTimes} players={players} currentUser={currentUser} onOpen={setDetailTee} onDelete={handleDelete} canManagePlayers={canManagePlayers}/>}
      {tab==='profile'&&<ProfilePage currentUser={currentUser} onUpdate={handleUpdateUser} onLogout={handleLogout} toast={toast}/>}
      {editTee&&tab==='new-tee'&&<BookTeeTime tee={editTee} players={players} currentUser={currentUser} canManagePlayers={canManagePlayers} onSave={handleSaveTee} onCancel={()=>{setEditTee(null);setBookDate(null);setTab('dashboard');}} toast={toast} isEdit={true}/>}
      {detailTee&&<TeeDetailModal tee={detailTee} teeTimes={teeTimes} currentUser={currentUser} onClose={()=>setDetailTee(null)} onRsvp={handleRsvp} onGuestRsvp={handleGuestRsvp} onEdit={t=>{setDetailTee(null);setEditTee(t);setTab('new-tee');}} canManagePlayers={canManagePlayers}/>}
      {showSettings&&<SettingsModal onClose={s=>{setShowSettings(false);if(s)toast('Settings saved! ✅');}}/>}
      <Toast msg={toastMsg} type={toastType}/>
    </>
  );
}

/* ── ROOT ── */
function Root(){
  const[isMobile,setIsMobile]=useState(window.innerWidth<=768);
  useEffect(()=>{const h=()=>setIsMobile(window.innerWidth<=768);window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);},[]);
  if(!isMobile)return <DesktopBlock/>;
  return <App/>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
