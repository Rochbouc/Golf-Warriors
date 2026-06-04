const {useState,useEffect,useRef}=React;

/* ── MOBILE ONLY ── */
function DesktopBlock(){
  return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',
      background:'#f7f7f5',fontFamily:'Syne,sans-serif',padding:'2rem',textAlign:'center'}}>
      <div style={{maxWidth:380}}>
        <div style={{fontSize:'3rem',marginBottom:'1rem'}}>⛳</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:'2rem',fontWeight:700,color:'#111',marginBottom:'.75rem'}}>Golf Warriors</h1>
        <p style={{fontSize:'1rem',color:'#555',marginBottom:'1.5rem',lineHeight:1.6}}>
          This app is designed for <strong>mobile phones</strong>.<br/>Please open it on your phone.
        </p>
        <p style={{fontSize:'.8rem',color:'#999'}}>Visit <strong style={{color:'#111'}}>{window.location.hostname}</strong> on your phone's browser.</p>
      </div>
    </div>
  );
}

/* ── SEED DATA ── */
const SEED_PLAYERS=[
  {id:'p1',name:'Chris Leger',email:'legerchris83@gmail.com',password:'golf',photo:null,role:'player'},
  {id:'p2',name:'Jules Melanson',email:'jules_18melanson@hotmail.com',password:'golf',photo:null,role:'player'},
  {id:'p3',name:'Stef Audet',email:'stephane.france@rogers.com',password:'golf',photo:null,role:'player'},
  {id:'p4',name:'PP',email:'pierrepaul.lanteigne@gmail.com',password:'golf',photo:null,role:'player'},
  {id:'p5',name:'Dr Rhé',email:'rheal.boudreau@hotmail.com',password:'golf',photo:null,role:'player'},
  {id:'p6',name:'Dave',email:'divadocan@gmail.com',password:'golf',photo:null,role:'player'},
  {id:'p7',name:'Marc LeBlanc',email:'marc@jomaeng.com',password:'golf',photo:null,role:'player'},
  {id:'p8',name:'Lagace',email:'stefgolf72@gmail.com',password:'golf',photo:null,role:'player'},
  {id:'p9',name:'Roch Boucher',email:'boucher.roch@gmail.com',password:'golf',photo:null,role:'manager'},
  {id:'p10',name:'Stéphane Lagacé',email:'stephane.lagace@gmail.com',password:'golf',photo:null,role:'manager'},
];
const ADMIN={id:'admin',name:'Admin',email:'admin@golfwarriors.com',password:'golf',photo:null,role:'admin'};

const SEED_TEETIMES=[
  {id:'tt1',course:'Memramcook',date:'2026-06-06',time:'08:30',notes:'',invites:['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'],guests:[],rsvps:{p9:'yes',p2:'yes',p3:'yes'},createdBy:'p9',createdAt:new Date().toISOString()},
  {id:'tt2',course:'Memramcook',date:'2026-06-06',time:'08:48',notes:'',invites:['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'],guests:[],rsvps:{},createdBy:'p9',createdAt:new Date().toISOString()},
  {id:'tt3',course:'Memramcook',date:'2026-06-07',time:'08:30',notes:'',invites:['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'],guests:[],rsvps:{p9:'yes'},createdBy:'p9',createdAt:new Date().toISOString()},
  {id:'tt4',course:'Memramcook',date:'2026-06-07',time:'08:48',notes:'',invites:['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10'],guests:[],rsvps:{},createdBy:'p9',createdAt:new Date().toISOString()},
];

/* ── HELPERS ── */
const AV_COLORS=['#1a7a3e','#1a5fa0','#8b2525','#5a2d8b','#b87a1a','#1a6b5a','#7a3a00','#3a4a8b'];
const avColor=s=>{let h=0;for(let c of s)h=c.charCodeAt(0)+((h<<5)-h);return AV_COLORS[Math.abs(h)%AV_COLORS.length]};
const initials=n=>{const p=(n||'').split(' ');return p.length>=2?(p[0][0]+p[p.length-1][0]).toUpperCase():(n||'??').substring(0,2).toUpperCase()};
const fmtDate=d=>{if(!d)return'—';return new Date(d+'T12:00:00').toLocaleDateString('en-CA',{weekday:'short',month:'short',day:'numeric',year:'numeric'})};
const fmtTime=t=>{if(!t)return'—';const[h,m]=t.split(':').map(Number);return`${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`};
const isUpcoming=tee=>{
  if(!tee.date||!tee.time)return true;
  try{const d=new Date(tee.date+'T'+tee.time+':00');return isNaN(d.getTime())||d>=new Date();}
  catch{return true;}
};
const validEmail=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const cap=s=>s?s[0].toUpperCase()+s.slice(1):'';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);

/* ── STORAGE ── */
function loadPlayers(){
  const s=localStorage.getItem('gw_players');
  if(s){
    let p=JSON.parse(s);
    p=p.map(x=>x.password==='golf123'?{...x,password:'golf'}:x);
    if(!p.find(x=>x.id==='p9')){
      p=[...p,...SEED_PLAYERS.filter(x=>['p9','p10'].includes(x.id))];
      localStorage.setItem('gw_players',JSON.stringify(p));
    }
    return p;
  }
  const all=[ADMIN,...SEED_PLAYERS];
  localStorage.setItem('gw_players',JSON.stringify(all));
  return all;
}
function savePlayers(p){localStorage.setItem('gw_players',JSON.stringify(p));}
function loadTeeTimes(){
  const s=localStorage.getItem('gw_tt');
  if(s){const t=JSON.parse(s);if(t.length)return t;}
  localStorage.setItem('gw_tt',JSON.stringify(SEED_TEETIMES));
  return SEED_TEETIMES;
}
function saveTeeTimes(t){localStorage.setItem('gw_tt',JSON.stringify(t));}
function getEJSConfig(){return JSON.parse(localStorage.getItem('ejs_cfg')||'{"publicKey":"","serviceId":"","templateId":"","appUrl":""}');}
function isEJSConfigured(){const c=getEJSConfig();return !!(c.publicKey&&c.serviceId&&c.templateId);}
function getAppUrl(){
  const cfg=getEJSConfig();
  if(cfg.appUrl&&cfg.appUrl.trim())return cfg.appUrl.trim();
  const loc=window.location.href.split('?')[0].split('#')[0];
  return loc.startsWith('file://')?'https://your-app-url.github.io':loc;
}
async function sendEJS(to_email,to_name,subject,message){
  const cfg=getEJSConfig();
  if(!cfg.publicKey||!cfg.serviceId||!cfg.templateId)throw new Error('Not configured');
  return emailjs.send(cfg.serviceId,cfg.templateId,{to_email,to_name,subject,message,app_name:'Golf Warriors'},{publicKey:cfg.publicKey});
}
function buildInviteMsg(tee,recipientName){
  const appUrl=getAppUrl();
  const teeUrl=`${appUrl}?open=${tee.id}`;
  const notes=tee.notes?`\nNotes:    ${tee.notes}`:'';
  return`Hi ${recipientName},\n\nYou've been invited to a golf round at Golf Warriors!\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n  ${tee.course}\n━━━━━━━━━━━━━━━━━━━━━━━━\n  Date:     ${fmtDate(tee.date)}\n  Time:     ${fmtTime(tee.time)}${notes}\n━━━━━━━━━━━━━━━━━━━━━━━━\n\nLog in to confirm if you are IN or OUT:\n\n  ${teeUrl}\n\nApp: ${appUrl}\n\nSee you on the fairway!\n— Golf Warriors`;
}

/* ── AVATAR ── */
function Av({player,size=28}){
  const bg=avColor(player?.name||player?.email||'x');
  const ini=initials(player?.name||player?.email||'?');
  return(
    <div className="av" style={{width:size,height:size,background:player?.photo?'transparent':bg,fontSize:size*.3}}>
      {player?.photo?<img src={player.photo} alt={player?.name}/>:ini}
    </div>
  );
}

/* ── TOAST ── */
function Toast({msg,type}){return<div className={`toast${msg?' on':''}${type?' '+type:''}`}>{msg}</div>;}

/* ── LOGIN ── */
function LoginScreen({onLogin}){
  const[email,setEmail]=useState('');
  const[pass,setPass]=useState('');
  const[err,setErr]=useState('');
  const doLogin=()=>{
    setErr('');
    const players=loadPlayers();
    const user=players.find(p=>p.email.toLowerCase()===email.toLowerCase().trim());
    if(!user){setErr('This email is not registered. Contact the admin.');return;}
    if(user.password!==pass){setErr('Incorrect password.');return;}
    onLogin(user);
  };
  return(
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <span className="ico">⛳</span>
          <h1>Golf <span>Warriors</span></h1>
          <p>Tee Time Planner</p>
        </div>
        <div className="login-invited">🔒 <strong>Invite only.</strong> You must be added by the admin before you can sign in.</div>
        <div className="login-form">
          <div className="login-input-wrap">
            <label>Email</label>
            <input className="login-input" type="email" placeholder="your@email.com" value={email}
              onChange={e=>{setEmail(e.target.value);setErr('')}}
              onKeyDown={e=>{if(e.key==='Enter')doLogin()}}/>
          </div>
          <div className="login-input-wrap">
            <label>Password</label>
            <input className="login-input" type="password" placeholder="••••••••" value={pass}
              onChange={e=>{setPass(e.target.value);setErr('')}}
              onKeyDown={e=>{if(e.key==='Enter')doLogin()}}/>
          </div>
          {err&&<div className="login-err">{err}</div>}
          <button className="btn-p" style={{width:'100%',padding:'.75rem',marginTop:'.25rem'}} onClick={doLogin}>Sign In →</button>
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
    reader.onload=ev=>{
      const players=loadPlayers();
      const updated=players.map(p=>p.id===currentUser.id?{...p,photo:ev.target.result}:p);
      savePlayers(updated);onUpdate({...currentUser,photo:ev.target.result});
      toast('Profile photo updated! 📸');
    };
    reader.readAsDataURL(file);
  };
  const save=()=>{
    if(!name.trim()||!email.trim()){toast('Name and email are required.','err');return;}
    if(pass&&pass!==pass2){toast('Passwords do not match.','err');return;}
    const players=loadPlayers();
    const other=players.find(p=>p.email.toLowerCase()===email.toLowerCase()&&p.id!==currentUser.id);
    if(other){toast('Email already in use.','err');return;}
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
            {currentUser.photo
              ?<img src={currentUser.photo} alt={currentUser.name}/>
              :<span style={{color:'#fff',fontSize:'2rem',fontWeight:700,background:avColor(currentUser.name||currentUser.email),width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',borderRadius:'50%'}}>{initials(currentUser.name||currentUser.email)}</span>}
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
          <div className="fg"><label>Full Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div>
          <div className="fg"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com"/></div>
          <div className="fg"><label>New Password</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Leave blank to keep current"/></div>
          <div className="fg"><label>Confirm Password</label><input type="password" value={pass2} onChange={e=>setPass2(e.target.value)} placeholder="Re-enter new password"/></div>
        </div>
        <div className="factions" style={{justifyContent:'space-between'}}>
          <button onClick={onLogout} style={{background:'transparent',border:'1px solid #ef9a9a',color:'var(--red)',padding:'.62rem 1.2rem',borderRadius:'var(--r-sm)',fontFamily:'Syne,sans-serif',fontSize:'.78rem',fontWeight:600,cursor:'pointer',transition:'all .15s'}} onMouseEnter={e=>e.target.style.background='var(--red-dim)'} onMouseLeave={e=>e.target.style.background='transparent'}>Sign Out</button>
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
  return(
    <div className="stats">
      {[{lbl:'Upcoming',val:upcoming,sub:'rounds'},{lbl:'Total',val:teeTimes.length,sub:'all time'},
        {lbl:'Players',val:players.filter(p=>p.role!=='admin').length,sub:'in network'},{lbl:'Confirmed',val:confirmed,sub:'RSVPs'}]
        .map(s=>(
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
function TeeCard({tee,players,currentUser,onOpen,onDelete,isAdmin}){
  const rsvps=tee.rsvps||{};
  const yesReg=Object.values(rsvps).filter(r=>r==='yes').length;
  const yesGuest=(tee.guests||[]).filter(g=>g.rsvp==='yes').length;
  const yes=yesReg+yesGuest;
  const no=Object.values(rsvps).filter(r=>r==='no').length+(tee.guests||[]).filter(g=>g.rsvp==='no').length;
  const pend=Math.max(0,(tee.invites||[]).length-yesReg-Object.values(rsvps).filter(r=>r==='no').length+(tee.guests||[]).filter(g=>!g.rsvp).length);
  const invitedPlayers=(tee.invites||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean);
  const myStatus=rsvps[currentUser?.id];
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
            {invitedPlayers.slice(0,5).map(p=><Av key={p.id} player={p}/>)}
            {invitedPlayers.length>5&&<div className="av av-more">+{invitedPlayers.length-5}</div>}
            {!invitedPlayers.length&&<span style={{fontSize:'.7rem',color:'var(--text3)'}}>No invites</span>}
          </div>
          <button onClick={e=>{e.stopPropagation();onOpen(tee);}}
            style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.2rem',
              background:myStatus==='yes'?'#edf7ee':myStatus==='no'?'#fce8e6':'var(--bg2)',
              border:`1.5px solid ${myStatus==='yes'?'#a5d6a7':myStatus==='no'?'#ef9a9a':'var(--border2)'}`,
              borderRadius:8,padding:'.35rem .65rem',cursor:'pointer',fontFamily:'inherit',transition:'all .15s'}}
            title="Tap to update status">
            <div style={{display:'flex',gap:'.35rem',fontSize:'.72rem',fontWeight:700}}>
              {yes>=4?<span style={{color:'#c62828',fontWeight:800,fontSize:'.68rem'}}>⛳ FULL 4/4</span>
                :<><span className="ty">✓{yes}</span><span className="tn">✗{no}</span><span className="tp">?{pend}</span></>}
            </div>
            <span style={{fontSize:'.6rem',fontWeight:700,color:myStatus==='yes'?'#276228':myStatus==='no'?'#c62828':'var(--text3)'}}>
              {myStatus==='yes'?'YOU: IN ✓':myStatus==='no'?'YOU: OUT ✗':yes>=4?'TEE FULL':'TAP TO RSVP'}
            </span>
          </button>
        </div>
      </div>
      <div className="tc-actions" onClick={e=>e.stopPropagation()}>
        <button className="ac-btn grn" onClick={()=>onOpen(tee)}>👥 View Players</button>
        {(isAdmin||tee.createdBy===currentUser?.id)&&<button className="ac-btn del" onClick={()=>onDelete(tee.id)}>🗑 Delete</button>}
      </div>
    </div>
  );
}

/* ── TEE DETAIL MODAL ── */
function TeeDetailModal({tee,teeTimes,players,currentUser,onClose,onRsvp,onGuestRsvp,onEdit,isAdmin,canManagePlayers}){
  if(!tee)return null;
  const live=teeTimes.find(t=>t.id===tee.id)||tee;
  const rsvps=live.rsvps||{};
  const invitedPlayers=(live.invites||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean);
  const myStatus=rsvps[currentUser.id];
  const canManage=isAdmin||canManagePlayers||live.createdBy===currentUser.id;
  const yesCount=Object.values(rsvps).filter(r=>r==='yes').length+(live.guests||[]).filter(g=>g.rsvp==='yes').length;
  const noCount=Object.values(rsvps).filter(r=>r==='no').length+(live.guests||[]).filter(g=>g.rsvp==='no').length;
  const pendCount=invitedPlayers.filter(p=>!rsvps[p.id]).length+(live.guests||[]).filter(g=>!g.rsvp).length;
  const isFull=yesCount>=4;
  const alreadyIn=myStatus==='yes';
  return(
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal">
        <div className="modal-head">
          <h2>⛳ {live.course}</h2>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{display:'flex',gap:'1.5rem',flexWrap:'wrap',marginBottom:'1.1rem',fontSize:'.82rem',color:'var(--text2)'}}>
            <span>📅 {fmtDate(live.date)}</span>
            <span>⏰ {fmtTime(live.time)}</span>
          </div>
          {live.notes&&<div style={{fontSize:'.78rem',color:'var(--text3)',marginBottom:'1rem',padding:'.5rem .75rem',background:'var(--bg2)',borderRadius:'var(--r-sm)',borderLeft:'2px solid var(--border2)'}}>{live.notes}</div>}

          {/* My RSVP */}
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
                style={{flex:1,padding:'.65rem .5rem',border:`2px solid ${myStatus==='yes'?'#276228':'#e0e0e0'}`,borderRadius:'var(--r-sm)',background:myStatus==='yes'?'#edf7ee':isFull&&!alreadyIn?'#f5f5f5':'#fff',color:myStatus==='yes'?'#276228':isFull&&!alreadyIn?'#bbb':'#555',fontFamily:'Syne,sans-serif',fontSize:'.85rem',fontWeight:700,cursor:isFull&&!alreadyIn?'not-allowed':'pointer',transition:'all .2s',opacity:isFull&&!alreadyIn?.6:1}}>
                ✅ I'm In
              </button>
              <button onClick={()=>onRsvp(live.id,currentUser.id,'no')}
                style={{flex:1,padding:'.65rem .5rem',border:`2px solid ${myStatus==='no'?'#c62828':'#e0e0e0'}`,borderRadius:'var(--r-sm)',background:myStatus==='no'?'#fce8e6':'#fff',color:myStatus==='no'?'#c62828':'#555',fontFamily:'Syne,sans-serif',fontSize:'.85rem',fontWeight:700,cursor:'pointer',transition:'all .2s'}}>
                ❌ Can't Make It
              </button>
            </div>
            {myStatus&&<div style={{fontSize:'.7rem',color:'#888',textAlign:'center',marginTop:'.5rem'}}>Tap again to change your response</div>}
          </div>

          {/* Player list */}
          <div style={{fontSize:'.7rem',fontWeight:700,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'.5rem',display:'flex',alignItems:'center',gap:'.75rem'}}>
            <span>Players ({invitedPlayers.length+(live.guests||[]).length})</span>
            <span style={{color:'#276228',fontWeight:700}}>✓{yesCount} In</span>
            <span style={{color:'#c62828',fontWeight:700}}>✗{noCount} Out</span>
            <span style={{color:'var(--text3)',fontWeight:700}}>?{pendCount} Pending</span>
          </div>
          <div className="rsvp-list">
            {invitedPlayers.length===0&&(live.guests||[]).length===0
              ?<p style={{fontSize:'.8rem',color:'var(--text3)'}}>No players invited yet.</p>
              :<>
                {invitedPlayers.map(p=>{
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
                  const totalYes=Object.values(rsvps).filter(r=>r==='yes').length+(live.guests||[]).filter(x=>x.rsvp==='yes').length;
                  const gFull=totalYes>=4;
                  return(
                    <div className="rsvp-row" key={g.id} style={{background:'#fffdf0',borderColor:'#ffd166'}}>
                      <div className="rsvp-av" style={{background:'#f0ad00',flexShrink:0}}>{g.name.trim().split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}</div>
                      <div className="rsvp-info">
                        <div className="rsvp-name">{g.name} <span style={{fontSize:'.6rem',background:'#fff3cd',color:'#856404',padding:'1px 6px',borderRadius:10,fontWeight:700,border:'1px solid #ffd166'}}>GUEST</span></div>
                        <div className="rsvp-email">Temporary player</div>
                      </div>
                      <div style={{display:'flex',gap:'.3rem',flexShrink:0}}>
                        <button onClick={()=>onGuestRsvp(live.id,g.id,'yes')} disabled={gFull&&g.rsvp!=='yes'} style={{padding:'.25rem .5rem',border:`1.5px solid ${g.rsvp==='yes'?'#276228':'#ddd'}`,borderRadius:6,background:g.rsvp==='yes'?'#edf7ee':'#fff',color:g.rsvp==='yes'?'#276228':'#555',fontSize:'.72rem',fontWeight:700,cursor:gFull&&g.rsvp!=='yes'?'not-allowed':'pointer',opacity:gFull&&g.rsvp!=='yes'?.5:1}}>✅ In</button>
                        <button onClick={()=>onGuestRsvp(live.id,g.id,'no')} style={{padding:'.25rem .5rem',border:`1.5px solid ${g.rsvp==='no'?'#c62828':'#ddd'}`,borderRadius:6,background:g.rsvp==='no'?'#fce8e6':'#fff',color:g.rsvp==='no'?'#c62828':'#555',fontSize:'.72rem',fontWeight:700,cursor:'pointer'}}>❌ Out</button>
                      </div>
                    </div>
                  );
                })}
              </>}
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

/* ── BOOK / EDIT TEE TIME ── */
function BookTeeTime({tee,players,currentUser,canManagePlayers,onSave,onCancel,toast,isEdit,defaultDate}){
  const today=new Date().toISOString().split('T')[0];
  const[course,setCourse]=useState(tee?.course||'');
  const[date,setDate]=useState(tee?.date||defaultDate||'');
  const[time,setTime]=useState(tee?.time||'');
  const[notes,setNotes]=useState(tee?.notes||'');
  const allPlayers=players.filter(p=>p.role!=='admin');
  const[selected,setSelected]=useState(new Set(isEdit?(tee?.invites||allPlayers.map(p=>p.id)):allPlayers.map(p=>p.id)));
  const[guests,setGuests]=useState(tee?.guests||[]);
  const[guestName,setGuestName]=useState('');
  const[sending,setSending]=useState(false);
  const toggle=id=>setSelected(prev=>{const n=new Set(prev);n.has(id)?n.delete(id):n.add(id);return n});
  const addGuest=()=>{
    const name=guestName.trim();
    if(!name){toast('Enter a guest name.','err');return;}
    setGuests(prev=>[...prev,{id:'guest_'+uid(),name,rsvp:null}]);
    setGuestName('');
  };
  const submit=async()=>{
    if(!course||!date||!time){toast('Please fill in course, date & time.','err');return;}
    const invites=[...selected];
    const newTee={id:tee?.id||uid(),course,date,time,notes,invites,guests,rsvps:tee?.rsvps||{},createdBy:tee?.createdBy||currentUser.id,createdAt:tee?.createdAt||new Date().toISOString()};
    setSending(true);
    if(!isEdit&&isEJSConfigured()){
      const subject=`⛳ Tee Time — ${course} on ${fmtDate(date)}`;
      for(const p of players.filter(p=>selected.has(p.id))){
        try{await sendEJS(p.email,p.name,subject,buildInviteMsg(newTee,p.name));}catch{}
      }
    }
    setSending(false);
    onSave(newTee,invites);
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
              <button onClick={()=>setSelected(new Set(allPlayers.map(p=>p.id)))} style={{background:'none',border:'none',fontSize:'.72rem',color:'var(--text2)',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600,textDecoration:'underline'}}>All</button>
              <button onClick={()=>setSelected(new Set())} style={{background:'none',border:'none',fontSize:'.72rem',color:'var(--text2)',cursor:'pointer',fontFamily:'Syne,sans-serif',fontWeight:600,textDecoration:'underline'}}>None</button>
            </div>
          </div>
          <p className="hint">{!isEJSConfigured()&&<span style={{color:'#7c5c00'}}>⚠️ Configure EmailJS in ⚙️ Settings to send emails.</span>}</p>
          <div className="player-select-list">
            {allPlayers.map(p=>{
              const sel=selected.has(p.id);
              return(
                <div key={p.id} className={`ps-item${sel?' selected':''}`} onClick={()=>toggle(p.id)}>
                  <div className="ps-radio"><div className="ps-radio-dot"/></div>
                  <div className="ps-av" style={{background:p.photo?'transparent':avColor(p.name)}}>{p.photo?<img src={p.photo} alt={p.name}/>:initials(p.name)}</div>
                  <div className="ps-info"><div className="ps-name">{p.name}</div><div className="ps-email">{p.email}</div></div>
                </div>
              );
            })}
          </div>
          <div style={{fontSize:'.72rem',color:'var(--text2)',marginTop:'.5rem',fontWeight:600}}>✓ {selected.size} of {allPlayers.length} players selected</div>
        </div>
        {canManagePlayers&&(
          <div className="isec">
            <h3>Guest Players <span style={{fontSize:'.72rem',fontWeight:500,color:'var(--text3)',fontFamily:'Syne,sans-serif'}}>— no account needed</span></h3>
            <p className="hint">Add temporary guests by name only.</p>
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
              <input type="text" placeholder="Guest name (e.g. John Smith)" value={guestName} onChange={e=>setGuestName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')addGuest();}} style={{flex:1,padding:'.6rem .85rem',border:'1px solid var(--border)',borderRadius:'var(--r-sm)',fontFamily:'Syne,sans-serif',fontSize:'.86rem',color:'var(--text)',background:'var(--surface)',outline:'none'}}/>
              <button className="btn-s" onClick={addGuest}>+ Add</button>
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
function PlayersTab({players,teeTimes,onAddPlayer,onUpdatePlayer,onDeletePlayer,toast}){
  const[showForm,setShowForm]=useState(false);
  const[editPlayer,setEditPlayer]=useState(null);
  const[name,setName]=useState('');const[email,setEmail]=useState('');const[pass,setPass]=useState('');
  const add=()=>{
    if(!name||!email||!pass){toast('Fill all fields.','err');return;}
    if(players.find(p=>p.email.toLowerCase()===email.toLowerCase())){toast('Email already exists.','err');return;}
    const p={id:uid(),name:name.trim(),email:email.trim().toLowerCase(),password:pass,photo:null,role:'player'};
    onAddPlayer(p);setName('');setEmail('');setPass('');setShowForm(false);toast(`${p.name} added! ✅`);
  };
  return(
    <div className="page">
      <div className="ph"><div className="ph-left"><div className="ph-eyebrow">Management</div><h2>Players</h2></div>
        <button className="btn-p" onClick={()=>setShowForm(s=>!s)}>{showForm?'Cancel':'+ Add Player'}</button>
      </div>
      {showForm&&(
        <div className="fcard" style={{marginBottom:'1.5rem'}}>
          <div className="fgrid">
            <div className="fg"><label>Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Full name"/></div>
            <div className="fg"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@example.com"/></div>
            <div className="fg"><label>Password</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Temp password"/></div>
          </div>
          <div className="factions"><button className="btn-p" onClick={add}>Add Player</button></div>
        </div>
      )}
      <div className="sec-label">All Players — tap to edit</div>
      <div className="pgrid">
        {players.filter(p=>p.role!=='admin').map(p=>{
          const rounds=teeTimes.filter(t=>(t.invites||[]).includes(p.id)).length;
          const yes=teeTimes.reduce((a,t)=>a+((t.rsvps||{})[p.id]==='yes'?1:0),0);
          return(
            <div className="pc" key={p.id} onClick={()=>setEditPlayer(p)} style={{cursor:'pointer'}}>
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
      {editPlayer&&(
        <PlayerEditModal player={editPlayer} players={players}
          onSave={updated=>{onUpdatePlayer(updated);setEditPlayer(null);toast(`${updated.name} updated! ✅`);}}
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
  const handlePhoto=e=>{
    const file=e.target.files[0];if(!file)return;
    if(file.size>2*1024*1024){toast('Image too large (max 2MB).','err');return;}
    const reader=new FileReader();
    reader.onload=ev=>setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };
  const save=()=>{
    if(!name.trim()||!email.trim()){toast('Name and email are required.','err');return;}
    const conflict=players.find(p=>p.email.toLowerCase()===email.toLowerCase().trim()&&p.id!==player.id);
    if(conflict){toast('Email already used.','err');return;}
    onSave({...player,name:name.trim(),email:email.trim().toLowerCase(),photo,...(pass?{password:pass}:{})});
  };
  return(
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div className="modal" style={{maxWidth:420}}>
        <div className="modal-head"><h2>Edit Player</h2><button className="modal-x" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'.6rem',marginBottom:'1.5rem'}}>
            <div onClick={()=>fileRef.current.click()} style={{width:80,height:80,borderRadius:'50%',overflow:'hidden',border:'2px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',background:photo?'transparent':avColor(player.name),cursor:'pointer',position:'relative'}}>
              {photo?<img src={photo} alt={name} style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{color:'#fff',fontSize:'1.5rem',fontWeight:700}}>{initials(name||player.name)}</span>}
              <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.4)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.1rem'}} className="photo-hover-overlay">📷</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handlePhoto}/>
            <div style={{fontSize:'.72rem',color:'var(--text3)'}}>Tap photo to change</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'.9rem'}}>
            <div className="fg"><label>Full Name</label><input type="text" value={name} onChange={e=>setName(e.target.value)}/></div>
            <div className="fg"><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
            <div className="fg"><label>New Password</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Leave blank to keep current"/></div>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'1.5rem',paddingTop:'1.25rem',borderTop:'1px solid var(--border)'}}>
            <button onClick={()=>{if(confirm(`Remove ${player.name}?`))onDelete();}} style={{background:'transparent',border:'1px solid #ef9a9a',color:'var(--red)',padding:'.5rem 1rem',borderRadius:'var(--r-sm)',fontFamily:'Syne,sans-serif',fontSize:'.75rem',fontWeight:600,cursor:'pointer'}}>🗑 Remove</button>
            <div style={{display:'flex',gap:'.5rem'}}>
              <button className="btn-s" onClick={onClose}>Cancel</button>
              <button className="btn-p" onClick={save}>Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── CALENDAR VIEW ── */
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
  teeTimes.forEach(t=>{
    if(!t.date)return;
    const d=new Date(t.date+'T12:00:00');
    if(d.getFullYear()===year&&d.getMonth()===month){
      const k=d.getDate();if(!teesByDay[k])teesByDay[k]=[];teesByDay[k].push(t);
    }
  });
  const cells=[];
  for(let i=0;i<firstDay;i++)cells.push(null);
  for(let d=1;d<=daysInMonth;d++)cells.push(d);
  const todayDay=now.getFullYear()===year&&now.getMonth()===month?now.getDate():null;
  const selectedTees=selected?teesByDay[selected]||[]:[];
  const selectedDateStr=selected?`${year}-${String(month+1).padStart(2,'0')}-${String(selected).padStart(2,'0')}`:null;
  return(
    <div className="page">
      <div className="ph"><div className="ph-left"><div className="ph-eyebrow">Schedule</div><h1>Calendar</h1></div></div>
      <div className="cal-wrap">
        <div className="cal-card">
          <div className="cal-nav">
            <button className="cal-arr" onClick={()=>{if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1);setSelected(null);}}>‹</button>
            <div className="cal-month">{MONTHS[month]} <span style={{color:'var(--text3)',fontFamily:'Syne,sans-serif',fontSize:'1rem',fontWeight:600}}>{year}</span></div>
            <button className="cal-arr" onClick={()=>{if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1);setSelected(null);}}>›</button>
          </div>
          <div className="cal-grid">
            {DAYS.map(d=><div className="cal-dh" key={d}>{d}</div>)}
            {cells.map((day,i)=>{
              if(!day)return<div key={'e'+i} className="cal-empty"/>;
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
          <div style={{fontSize:'.68rem',color:'var(--text3)',marginTop:'.75rem',textAlign:'center'}}>
            {canManagePlayers?'Tap a day to view or book':'Tap a day to view tee times'}
          </div>
        </div>
        <div className="cal-side">
          {selected?(
            <>
              <div className="cal-side-hd">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <div>
                    <div className="ph-eyebrow">{MONTHS[month]} {selected}</div>
                    <div style={{fontSize:'1rem',fontWeight:600,color:'var(--text)',marginTop:'.2rem'}}>
                      {selectedTees.length>0?`${selectedTees.length} Tee Time${selectedTees.length>1?'s':''}`:' No tee times'}
                    </div>
                  </div>
                  {canManagePlayers&&(
                    <button className="btn-p" style={{padding:'.4rem .85rem',fontSize:'.72rem'}} onClick={()=>onNew(selectedDateStr)}>+ Book</button>
                  )}
                </div>
              </div>
              {selectedTees.length===0
                ?<div style={{textAlign:'center',padding:'1.5rem 1rem',color:'var(--text3)',fontSize:'.82rem',lineHeight:1.6}}>
                  No rounds on this day.
                  {canManagePlayers&&<><br/><span style={{color:'var(--text2)'}}>Tap <strong>+ Book</strong> to add one.</span></>}
                </div>
                :selectedTees.map(t=>{
                  const invPl=(t.invites||[]).map(id=>players.find(p=>p.id===id)).filter(Boolean);
                  const canEdit=canManagePlayers||t.createdBy===currentUser.id;
                  return(
                    <div className="cal-event" key={t.id} onClick={()=>onOpen(t)}>
                      <div className="cal-ev-top">
                        <span className="cal-ev-course">{t.course}</span>
                        <span className="cal-ev-time">{fmtTime(t.time)}</span>
                      </div>
                      {t.notes&&<div className="cal-ev-note">{t.notes}</div>}
                      <div className="cal-ev-players">
                        <div style={{display:'flex',marginLeft:5}}>{invPl.slice(0,4).map(p=><Av key={p.id} player={p} size={22}/>)}{invPl.length===0&&<span style={{fontSize:'.68rem',color:'var(--text3)'}}>No invites</span>}</div>
                        <div style={{display:'flex',gap:'.3rem'}}>{canEdit&&<button className="ac-btn" style={{padding:'.28rem .55rem',fontSize:'.65rem'}} onClick={e=>{e.stopPropagation();onEdit(t);}}>✏️ Edit</button>}</div>
                      </div>
                    </div>
                  );
                })}
            </>
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
function Dashboard({teeTimes,players,currentUser,onOpen,onDelete,onNew,isAdmin}){
  const upcoming=teeTimes.filter(isUpcoming);
  return(
    <div className="page">
      <div className="ph">
        <div className="ph-left"><div className="ph-eyebrow">Golf Tee Time Planner</div><h1>Upcoming Rounds</h1></div>
        <button className="btn-p" onClick={onNew}>+ Book Tee Time</button>
      </div>
      <Stats teeTimes={teeTimes} players={players}/>
      <div className="sec-label">Active Tee Times</div>
      {upcoming.length===0
        ?<div className="empty">
          <div className="empty-ico">🏌️</div>
          <h2>No upcoming rounds</h2>
          <p>Be the first to book a tee time!</p>
          <button className="btn-p" onClick={onNew}>Book a Tee Time</button>
        </div>
        :<div className="tgrid">{upcoming.map(t=><TeeCard key={t.id} tee={t} players={players} currentUser={currentUser} onOpen={onOpen} onDelete={onDelete} isAdmin={isAdmin}/>)}</div>}
    </div>
  );
}

/* ── HISTORY ── */
function History({teeTimes,players,currentUser,onOpen}){
  const past=teeTimes.filter(t=>!isUpcoming(t));
  return(
    <div className="page">
      <div className="ph"><div className="ph-left"><div className="ph-eyebrow">Past Rounds</div><h1>History</h1></div></div>
      {past.length===0
        ?<div className="empty"><div className="empty-ico">📋</div><h2>No past rounds</h2><p>Completed tee times appear here.</p></div>
        :<div className="tgrid">{past.map(t=><TeeCard key={t.id} tee={t} players={players} currentUser={currentUser} onOpen={onOpen} onDelete={()=>{}} isAdmin={false}/>)}</div>}
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
  const[status,setStatus]=useState('idle');
  const[statusMsg,setStatusMsg]=useState('');
  const save=()=>{
    localStorage.setItem('ejs_cfg',JSON.stringify({publicKey:pk.trim(),serviceId:sid.trim(),templateId:tid.trim(),appUrl:appUrl.trim()}));
    onClose(true);
  };
  const test=async()=>{
    if(!pk||!sid||!tid){setStatus('bad');setStatusMsg('Fill all three EmailJS fields first.');return;}
    setStatus('testing');setStatusMsg('Sending test…');
    try{
      await emailjs.send(sid.trim(),tid.trim(),{to_email:'test@example.com',to_name:'Test Player',subject:'⛳ Golf Warriors — Test Email',message:'Hi Test Player,\n\nThis is a test email from Golf Warriors.\n\nEmailJS is configured correctly!\n\n— Golf Warriors',app_name:'Golf Warriors'},{publicKey:pk.trim()});
      setStatus('ok');setStatusMsg('Connected! Test email sent. ✅');
    }catch(e){setStatus('bad');setStatusMsg('Failed: '+(e?.text||e?.message||'Check your credentials.'));}
  };
  return(
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose(false);}}>
      <div className="modal" style={{maxWidth:500}}>
        <div className="modal-head"><h2>⚙️ Settings</h2><button className="modal-x" onClick={()=>onClose(false)}>✕</button></div>
        <div className="modal-body">
          <div style={{marginBottom:'1.5rem',paddingBottom:'1.5rem',borderBottom:'1px solid var(--border)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'.5rem',marginBottom:'.5rem'}}>
              <div className="settings-label" style={{margin:0}}>🌐 App / Website URL</div>
              {appUrl&&<span style={{fontSize:'.65rem',fontWeight:700,background:'#edf7ee',color:'#276228',padding:'2px 8px',borderRadius:20}}>✓ Set</span>}
            </div>
            <input className="settings-input" type="url" placeholder="https://yourusername.github.io/golf-warriors" value={appUrl} onChange={e=>setAppUrl(e.target.value)}/>
            <div className="settings-hint" style={{marginTop:'.4rem'}}>The public URL of your app. Included in invitation emails.</div>
            {!appUrl&&<div style={{marginTop:'.6rem',background:'#fff8e1',border:'1px solid #ffe082',borderRadius:6,padding:'.5rem .75rem',fontSize:'.74rem',color:'#7c5c00'}}>⚠️ No URL set — invitation emails will not contain a working link.</div>}
          </div>
          <div style={{marginBottom:'.75rem'}}>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'.78rem',color:'var(--text)',marginBottom:'.6rem'}}>EmailJS Configuration</div>
            <p className="hint" style={{marginBottom:'1rem'}}>
              Sign up at <a href="https://www.emailjs.com" target="_blank" style={{color:'var(--text)',textDecoration:'underline'}}>emailjs.com</a> (free).
              Create a template with <strong>To</strong>: <code style={{background:'var(--bg2)',padding:'1px 5px',borderRadius:4,fontSize:'.72rem'}}>{'{{to_email}}'}</code>, <strong>Subject</strong>: <code style={{background:'var(--bg2)',padding:'1px 5px',borderRadius:4,fontSize:'.72rem'}}>{'{{subject}}'}</code>, <strong>Body</strong>: <code style={{background:'var(--bg2)',padding:'1px 5px',borderRadius:4,fontSize:'.72rem'}}>{'{{message}}'}</code> (plain text, no HTML mode).
            </p>
          </div>
          <div className="settings-row">
            <div><div className="settings-label">Public Key</div><input className="settings-input" type="text" placeholder="abc123XYZ..." value={pk} onChange={e=>setPk(e.target.value)}/><div className="settings-hint">Account → API Keys</div></div>
            <div><div className="settings-label">Service ID</div><input className="settings-input" type="text" placeholder="service_xxxxxxx" value={sid} onChange={e=>setSid(e.target.value)}/><div className="settings-hint">Email Services</div></div>
            <div><div className="settings-label">Template ID</div><input className="settings-input" type="text" placeholder="template_xxxxxxx" value={tid} onChange={e=>setTid(e.target.value)}/><div className="settings-hint">Email Templates</div></div>
          </div>
          {status!=='idle'&&<div className={`settings-status ${status==='testing'?'idle':status}`}>{status==='testing'?'⏳':status==='ok'?'✅':'❌'} {statusMsg}</div>}
          <div style={{display:'flex',gap:'.6rem',justifyContent:'flex-end',marginTop:'1.25rem',paddingTop:'1.1rem',borderTop:'1px solid var(--border)'}}>
            <button className="btn-s" onClick={test} disabled={status==='testing'}>Send Test Email</button>
            <button className="btn-p" onClick={save}>Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── APP ── */
function App(){
  const[currentUser,setCurrentUser]=useState(()=>{const s=localStorage.getItem('gw_session');return s?JSON.parse(s):null;});
  const[tab,setTab]=useState('dashboard');
  const[teeTimes,setTeeTimes]=useState(loadTeeTimes);
  const[players,setPlayers]=useState(loadPlayers);
  const[detailTee,setDetailTee]=useState(null);
  const[editTee,setEditTee]=useState(null);
  const[bookDate,setBookDate]=useState(null);
  const[showSettings,setShowSettings]=useState(false);
  const[toastMsg,setToastMsg]=useState('');
  const[toastType,setToastType]=useState('');
  const tmr=useRef(null);
  const isAdmin=currentUser?.role==='admin';
  const canManagePlayers=isAdmin||currentUser?.role==='manager';

  useEffect(()=>{saveTeeTimes(teeTimes);},[teeTimes]);
  useEffect(()=>{if(currentUser)localStorage.setItem('gw_session',JSON.stringify(currentUser));else localStorage.removeItem('gw_session');},[currentUser]);

  // Handle ?open=TEEID from email link
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const openTeeId=params.get('open');
    if(openTeeId){
      window.history.replaceState({},'',window.location.pathname);
      const tee=loadTeeTimes().find(t=>t.id===openTeeId);
      if(tee)setDetailTee(tee);
    }
  },[]);

  // Auto-delete past tee times (4-hour grace)
  useEffect(()=>{
    const GRACE=4*60*60*1000;
    const check=()=>setTeeTimes(prev=>{
      const now=Date.now();
      const kept=prev.filter(t=>{if(!t.date||!t.time)return true;try{const d=new Date(t.date+'T'+t.time+':00').getTime();return isNaN(d)||now<d+GRACE;}catch{return true;}});
      if(kept.length<prev.length)toast(`${prev.length-kept.length} past tee time${prev.length-kept.length>1?'s':''} removed.`);
      return kept;
    });
    check();const iv=setInterval(check,60000);return()=>clearInterval(iv);
  },[]);

  const toast=(msg,type='ok')=>{setToastMsg(msg);setToastType(type);clearTimeout(tmr.current);tmr.current=setTimeout(()=>setToastMsg(''),3000);};
  const handleLogin=user=>{setCurrentUser(user);setTab('dashboard');};
  const handleLogout=()=>{setCurrentUser(null);localStorage.removeItem('gw_session');};

  const handleSaveTee=tee=>{
    setTeeTimes(prev=>{const idx=prev.findIndex(t=>t.id===tee.id);return idx>=0?prev.map(t=>t.id===tee.id?tee:t):[...prev,tee];});
    toast(editTee?'Tee time updated! ✅':'Tee time booked! ⛳');
    setEditTee(null);setBookDate(null);setTab('dashboard');
  };

  const MAX_PLAYERS=4;
  const handleRsvp=(teeId,playerId,answer)=>{
    const tee=teeTimes.find(t=>t.id===teeId);if(!tee)return;
    const currentRsvps=tee.rsvps||{};
    const guestYes=(tee.guests||[]).filter(g=>g.rsvp==='yes').length;
    const yesCount=Object.values(currentRsvps).filter(r=>r==='yes').length+guestYes;
    const alreadyIn=currentRsvps[playerId]==='yes';
    if(answer==='yes'&&!alreadyIn&&yesCount>=MAX_PLAYERS){toast(`⛳ Tee time is full (${MAX_PLAYERS}/${MAX_PLAYERS})! Check the next tee time.`,'err');return;}
    setTeeTimes(prev=>prev.map(t=>t.id===teeId?{...t,rsvps:{...t.rsvps,[playerId]:answer}}:t));
    toast(answer==='yes'?"You're IN! ⛳":'Marked as out ❌');
  };

  const handleGuestRsvp=(teeId,guestId,answer)=>{
    const tee=teeTimes.find(t=>t.id===teeId);if(!tee)return;
    const rsvpYes=Object.values(tee.rsvps||{}).filter(r=>r==='yes').length;
    const guestYes=(tee.guests||[]).filter(g=>g.rsvp==='yes').length;
    const guest=(tee.guests||[]).find(g=>g.id===guestId);
    if(answer==='yes'&&guest?.rsvp!=='yes'&&rsvpYes+guestYes>=MAX_PLAYERS){toast(`⛳ Tee time is full (${MAX_PLAYERS}/${MAX_PLAYERS})!`,'err');return;}
    setTeeTimes(prev=>prev.map(t=>t.id!==teeId?t:{...t,guests:(t.guests||[]).map(g=>g.id===guestId?{...g,rsvp:answer}:g)}));
    toast(answer==='yes'?`${guest?.name} is IN! ⛳`:`${guest?.name} is OUT ❌`);
  };

  const handleDelete=id=>{if(!confirm('Delete this tee time?'))return;setTeeTimes(p=>p.filter(t=>t.id!==id));toast('Tee time deleted.');};
  const handleAddPlayer=p=>{const u=[...players,p];setPlayers(u);savePlayers(u);};
  const handleUpdatePlayer=u=>{const p=players.map(x=>x.id===u.id?u:x);setPlayers(p);savePlayers(p);if(currentUser.id===u.id)setCurrentUser(u);};
  const handleDeletePlayer=id=>{const p=players.filter(x=>x.id!==id);setPlayers(p);savePlayers(p);};
  const handleUpdateUser=u=>{setCurrentUser(u);setPlayers(prev=>{const p=prev.map(x=>x.id===u.id?u:x);savePlayers(p);return p;});};

  if(!currentUser)return<LoginScreen onLogin={handleLogin}/>;

  const TABS=[
    {id:'dashboard',label:'Dashboard'},
    {id:'new-tee',label:'Book'},
    {id:'calendar',label:'Calendar'},
    ...(canManagePlayers?[{id:'players',label:'Players'}]:[]),
    {id:'history',label:'History'},
  ];
  const TAB_ICONS={dashboard:'🏠',['new-tee']:'📅',calendar:'📆',players:'👥',history:'📋'};

  return(
    <>
      <nav className="nav">
        <div className="nav-brand" onClick={()=>setTab('dashboard')}>
          <span className="nav-logo">⛳</span>
          <span className="nav-name">Golf <span>Warriors</span></span>
        </div>
        <div className="nav-tabs">
          {TABS.map(t=><button key={t.id} className={`ntab${tab===t.id?' on':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
        </div>
        <div className="nav-right">
          <div className="nav-dot"/>
          {canManagePlayers&&<button className="nav-gear" onClick={()=>setShowSettings(true)} title="Settings">⚙️</button>}
          <div className="nav-avatar-btn" onClick={()=>setTab('profile')}>
            {currentUser.photo?<img src={currentUser.photo} alt={currentUser.name}/>
              :<div className="av-letter" style={{background:avColor(currentUser.name||''),width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.68rem',fontWeight:700,color:'#fff',borderRadius:'50%'}}>{initials(currentUser.name||currentUser.email)}</div>}
          </div>
          <button onClick={handleLogout} style={{background:'transparent',border:'1px solid #d0d0ce',color:'#999',padding:'.35rem .8rem',borderRadius:20,fontFamily:'Syne,sans-serif',fontSize:'.68rem',fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',transition:'all .15s'}} onMouseEnter={e=>{e.currentTarget.style.color='#d93025';e.currentTarget.style.borderColor='#ef9a9a';}} onMouseLeave={e=>{e.currentTarget.style.color='#999';e.currentTarget.style.borderColor='#d0d0ce';}}>Sign Out</button>
        </div>
      </nav>

      {/* Bottom nav for mobile */}
      <nav className="bottom-nav">
        {TABS.map(t=>(
          <button key={t.id} className={`bnav-item${tab===t.id?' on':''}`} onClick={()=>setTab(t.id)}>
            <span className="bnav-icon">{TAB_ICONS[t.id]||'📄'}</span>
            <span>{t.label}</span>
            <div className="bnav-dot"/>
          </button>
        ))}
        <button className={`bnav-item${tab==='profile'?' on':''}`} onClick={()=>setTab('profile')}>
          <span className="bnav-icon">{currentUser.photo?<img src={currentUser.photo} alt="" style={{width:22,height:22,borderRadius:'50%',objectFit:'cover',border:'1.5px solid #d0d0ce'}}/>:<span style={{fontSize:'1.1rem'}}>{initials(currentUser.name||'').slice(0,2)}</span>}</span>
          <span>Profile</span>
          <div className="bnav-dot"/>
        </button>
        <button className="bnav-item" onClick={handleLogout} style={{color:'#d93025'}}>
          <span className="bnav-icon">🚪</span>
          <span>Sign Out</span>
          <div className="bnav-dot" style={{background:'#d93025'}}/>
        </button>
      </nav>

      {tab==='dashboard'&&<Dashboard teeTimes={teeTimes} players={players} currentUser={currentUser} onOpen={setDetailTee} onDelete={handleDelete} onNew={()=>{setEditTee(null);setBookDate(null);setTab('new-tee');}} isAdmin={isAdmin}/>}
      {tab==='new-tee'&&!editTee&&<BookTeeTime players={players} currentUser={currentUser} canManagePlayers={canManagePlayers} onSave={handleSaveTee} onCancel={()=>{setBookDate(null);setTab('dashboard');}} toast={toast} isEdit={false} defaultDate={bookDate}/>}
      {tab==='calendar'&&<CalendarView teeTimes={teeTimes} players={players} currentUser={currentUser} onOpen={setDetailTee} onEdit={t=>{setEditTee(t);setTab('new-tee');}} onNew={date=>{setEditTee(null);setBookDate(date);setTab('new-tee');}} canManagePlayers={canManagePlayers}/>}
      {tab==='players'&&canManagePlayers&&<PlayersTab players={players} teeTimes={teeTimes} onAddPlayer={handleAddPlayer} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} toast={toast}/>}
      {tab==='history'&&<History teeTimes={teeTimes} players={players} currentUser={currentUser} onOpen={setDetailTee}/>}
      {tab==='profile'&&<ProfilePage currentUser={currentUser} onUpdate={handleUpdateUser} onLogout={handleLogout} toast={toast}/>}

      {editTee&&tab==='new-tee'&&<BookTeeTime tee={editTee} players={players} currentUser={currentUser} canManagePlayers={canManagePlayers} onSave={handleSaveTee} onCancel={()=>{setEditTee(null);setBookDate(null);setTab('dashboard');}} toast={toast} isEdit={true}/>}

      {detailTee&&<TeeDetailModal tee={detailTee} teeTimes={teeTimes} players={players} currentUser={currentUser}
        onClose={()=>setDetailTee(null)} onRsvp={handleRsvp} onGuestRsvp={handleGuestRsvp}
        onEdit={t=>{setDetailTee(null);setEditTee(t);setTab('new-tee');}}
        isAdmin={isAdmin} canManagePlayers={canManagePlayers}/>}
      {showSettings&&<SettingsModal onClose={saved=>{setShowSettings(false);if(saved)toast('Settings saved! ✅');}}/>}

      <Toast msg={toastMsg} type={toastType}/>
    </>
  );
}

/* ── ROOT ── */
function Root(){
  const[isMobile,setIsMobile]=useState(window.innerWidth<=768);
  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<=768);
    window.addEventListener('resize',h);return()=>window.removeEventListener('resize',h);
  },[]);
  if(!isMobile)return<DesktopBlock/>;
  return<App/>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
