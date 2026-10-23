import React,{useState,useEffect}from"react";import{AnimatePresence,motion}from"framer-motion";import{ShieldCheck,Shield,BadgeCheck,Home,FileCheck2,Layers3,BookOpen,Lightbulb,History,Plus,Search,Bell,Sun,Moon,ChevronRight,ChevronDown,ArrowRight,ArrowUpRight,Clock3,ShieldAlert,Flag,Sparkles,Check,CheckCheck,LockKeyhole,FileText,Filter,PanelRightClose,GitCompareArrows,ThumbsUp,ThumbsDown,X,Menu,Command,Activity,Settings2,Send,Gauge,MoreHorizontal,LogOut}from"lucide-react";import{api}from"./lib/api.js";

const seed="Introducing PayNest Smart Savings. Earn 7% returns with our guaranteed, risk-free savings plan. Open your account today and start growing your money with confidence.";

const rules=[{id:"BR-01",type:"Prohibited language",title:"“guaranteed” is not approved",detail:"The rulebook prohibits guarantees about financial outcomes.",source:"Brand Voice Guide · §3.2",severity:"high",term:"guaranteed",suggestion:"Explore a savings option designed around your goals."},{id:"PF-104",type:"Fact mismatch",title:"Savings rate does not match the approved fact",detail:"The draft states 7%, but the current approved rate is 6.5% p.a.",source:"Approved Facts Ledger · PF-104",severity:"critical",term:"7% returns",suggestion:"Earn 6.5% p.a. with PayNest Smart Savings."},{id:"BR-02",type:"Prohibited language",title:"“risk-free” is prohibited",detail:"Avoid implying a financial product has no risk.",source:"Brand Voice Guide · §3.2",severity:"high",term:"risk-free",suggestion:"Remove the phrase and describe the product accurately."}];

const nav=[["overview","Overview",Home],["reviews","Content reviews",FileCheck2],["claims","Claims ledger",Layers3],["guidelines","Brand guidelines",BookOpen],["insights","Guideline insights",Lightbulb],["audit","Audit trail",History]];

function Btn({children,onClick,kind="secondary",disabled=false}){return <button disabled={disabled} className={`${kind}-button`} onClick={onClick}>{children}</button>}

function Pill({children,tone=""}){return <span className={`pill ${tone}`}><i/>{children}</span>}

function Stat({label,value,note,Icon,delay=0}){return <motion.div className="stat" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay}}><div className="stat-label">{label}<span><Icon size={16}/></span></div><strong>{value}</strong><small>{note}</small></motion.div>}

function mapBackendFindings(items){
  const labels = {
    prohibited_term: {
      type: "Prohibited language",
      title: "Potentially prohibited claim",
    },
    fact_mismatch: {
      type: "Fact mismatch",
      title: "Unverified or inconsistent fact",
    },
  };

  return (Array.isArray(items) ? items : [])
    .filter((f) => f.state !== "obsolete")
    .map((f) => {
      const label = labels[f.kind] || {
        type: "Content review",
        title: "Review finding",
      };

      return {
        id: String(f.id),
        backendId: f.id,
        kind: f.kind || "Policy rule",
        excerpt: f.excerpt || "",
        term: f.excerpt || "",
        severity: /critical|absolute|guarantee|rate|claim/i.test(
          `${f.kind || ""} ${f.reason || ""}`
        )
          ? "critical"
          : "high",
        type: label.type,
        title: label.title,
        detail: f.reason || "Review this content against the brand rules.",
        source: f.source || "Backend rulebook",
        suggestion: f.suggestion || "Review and revise this claim.",
        state: f.state || "open",
      };
    });
}

export default function App(){

const[theme,setTheme]=useState(()=>localStorage.getItem("bl-theme")||"dark"),[page,setPage]=useState(()=>{const saved=localStorage.getItem("bl-page");return nav.some(n=>n[0]===saved)?saved:"overview"}),[draft,setDraft]=useState(seed),[original]=useState(seed),[title,setTitle]=useState("PayNest Smart Savings — launch campaign"),[campaign,setCampaign]=useState("Q4 Savings Launch"),[findings,setFindings]=useState([]),[active,setActive]=useState(null),[resolved,setResolved]=useState([]),[status,setStatus]=useState("Not reviewed"),[busy,setBusy]=useState(false),[toast,setToast]=useState(""),[versions,setVersions]=useState([{name:"Version 1",text:seed,time:"Just now"}]),[history,setHistory]=useState(false),[comment,setComment]=useState(""),[decision,setDecision]=useState(""),[showEvidence,setShowEvidence]=useState(true),[search,setSearch]=useState(false),[mobile,setMobile]=useState(false),[apiMode,setApiMode]=useState(api.configured?"API configured":"Demo mode"),[authenticated,setAuthenticated]=useState(()=>api.authenticated),[currentUsername,setCurrentUsername]=useState(()=>localStorage.getItem("bl-username")||""),[isStaff,setIsStaff]=useState(()=>localStorage.getItem("bl-is-staff")==="true"),[loginUsername,setLoginUsername]=useState(""),[loginPassword,setLoginPassword]=useState(""),[loginBusy,setLoginBusy]=useState(false),[loginError,setLoginError]=useState(""),[backendDraftId,setBackendDraftId]=useState(()=>localStorage.getItem("bl-last-draft-id")),[savedDrafts,setSavedDrafts]=useState([]),[loadingSavedDrafts,setLoadingSavedDrafts]=useState(false);

useEffect(()=>localStorage.setItem("bl-theme",theme),[theme]);
useEffect(()=>localStorage.setItem("bl-page",page),[page]);
useEffect(()=>{if(toast){let t=setTimeout(()=>setToast(""),3000);return()=>clearTimeout(t)}},[toast]);

async function refreshSavedDrafts(){
  if(!authenticated) return;
  setLoadingSavedDrafts(true);
  try {
    const response = await api.listDrafts();
    const items = Array.isArray(response) ? response : (response?.results || response?.drafts || []);
    setSavedDrafts(items);
  } catch(error) {
    console.error("Could not load saved drafts:", error);
  } finally {
    setLoadingSavedDrafts(false);
  }
}

useEffect(()=>{
  if(!authenticated) return;
  let cancelled = false;
  async function loadWorkspace(){
    try {
      const response = await api.listDrafts();
      const items = Array.isArray(response) ? response : (response?.results || response?.drafts || []);
      if(!cancelled) setSavedDrafts(items);
    } catch(error) {
      console.error("Could not load saved drafts:", error);
    }

    const savedId = localStorage.getItem("bl-last-draft-id");
    const savedPage = localStorage.getItem("bl-page");
    if(savedId && savedPage === "reviews"){
      try {
        const saved = await api.getDraft(savedId);
        if(cancelled) return;
        setBackendDraftId(saved.id);
        setTitle(saved.title || "Untitled campaign draft");
        setDraft(saved.content || "");
        setCampaign("Saved campaign");
        const list = mapBackendFindings(saved.findings);
        setFindings(list);
        setActive(list[0]?.id || null);
        setResolved(list.filter(f => f.state === "dismissed").map(f => f.id));
        setStatus(saved.status === "approved" ? "Approved" :
          list.some(f => f.state === "open" || f.state === "acknowledged") ? "Changes requested" : "Ready for review");
        setPage("reviews");
      } catch(error) {
        console.error("Could not restore the last draft:", error);
        if(!cancelled) {
          localStorage.removeItem("bl-last-draft-id");
          setBackendDraftId(null);
        }
      }
    }
  }
  loadWorkspace();
  return ()=>{cancelled = true;};
},[authenticated]);

const activeFinding=findings.find(f=>f.id===active),open=findings.filter(f=>!resolved.includes(f.id)),completion=findings.length?Math.round(resolved.length/findings.length*100):0;

function check(text){let out=[];if(/guaranteed/i.test(text))out.push(rules[0]);if(/\b7\s*%/i.test(text))out.push(rules[1]);if(/risk[- ]free/i.test(text))out.push(rules[2]);if(/best in india|number one|#1/i.test(text))out.push({id:"BR-07",type:"Unsupported superlative",title:"Superlative needs evidence",detail:"Claims such as “best” or “number one” need an approved source.",source:"Claims Policy · §2.1",severity:"medium",term:text.match(/best in india|number one|#1/i)?.[0],suggestion:"Replace this with a verifiable product benefit."});return out}

async function login(e){
  e.preventDefault();
  setLoginBusy(true);
  setLoginError("");
  try {
    const loginData = await api.login(loginUsername.trim(), loginPassword);
    const username = loginData.username || loginUsername.trim();
    setCurrentUsername(username);
    setIsStaff(Boolean(loginData.is_staff));
    localStorage.setItem("bl-username", username);
    localStorage.setItem("bl-is-staff", String(Boolean(loginData.is_staff)));
    setAuthenticated(true);
    setLoginPassword("");
    setApiMode("API connected");
  } catch (error) {
    setLoginError(error.message || "Login failed. Check your username and password.");
  } finally {
    setLoginBusy(false);
  }
}


async function logout() {
  try {
    await api.logout();
  } catch (error) {
    console.error("Logout request failed:", error);
  }

  setAuthenticated(false);
  setCurrentUsername("");
  setIsStaff(false);
  localStorage.removeItem("bl-username");
  localStorage.removeItem("bl-is-staff");
  setLoginUsername("");
  setLoginPassword("");
  setLoginError("");
  setBackendDraftId(null);
  setFindings([]);
  setResolved([]);
  setActive(null);
  setDecision("");
  setStatus("Not reviewed");
  setApiMode(api.configured ? "API configured" : "Demo mode");
  setToast("");
}


async function review(){
  if(!draft.trim()){
    setToast("Add content before running a review.");
    return;
  }
  if(!authenticated){
    setToast("Please log in before reviewing content.");
    return;
  }

  setBusy(true);
  setStatus("Reviewing...");
  setResolved([]);
  setDecision("");

  try {
    const result = backendDraftId
      ? await api.revise(backendDraftId, draft)
      : await api.createDraft({title, content: draft});

    if (result?.id != null) { setBackendDraftId(result.id); localStorage.setItem("bl-last-draft-id", String(result.id)); }
    await refreshSavedDrafts();
    const list = mapBackendFindings(result?.findings);
    setFindings(list);
    setActive(list[0]?.id || null);
    setResolved(list.filter(f => f.state === "dismissed").map(f => f.id));
    setStatus(list.some(f => f.state === "open") ? "Changes requested" : "Ready for review");
    setApiMode("API connected");
    setVersions(v => [
      ...v,
      {
        name: `Version ${v.length + 1}`,
        text: draft,
        time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})
      }
    ]);
    setToast(`${list.length} finding${list.length === 1 ? "" : "s"} returned by the backend`);
  } catch (error) {
    setApiMode("API error");
    setToast(error.message || "Could not save the draft to the backend.");
  } finally {
    setBusy(false);
  }
}

async function apply(f){
  let t = draft;
  const target = f.excerpt || f.term;
  if (target && t.includes(target)) {
    t = t.replace(target, f.suggestion);
  } else if (f.id === "PF-104") {
    t = t.replace(/7\s*%\s*returns?/i, "6.5% p.a.");
  } else if (f.id === "BR-01") {
    t = t.replace(/guaranteed,?\s*/i, "");
  } else if (f.id === "BR-02") {
    t = t.replace(/risk-free,?\s*/i, "");
  }

  setDraft(t);
  setVersions(v => [
    ...v,
    {
      name: `Version ${v.length + 1}`,
      text: t,
      time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})
    }
  ]);

  if (backendDraftId && authenticated) {
    try {
      const result = await api.revise(backendDraftId, t);
      const list = mapBackendFindings(result?.findings);
      setFindings(list);
      setActive(list[0]?.id || null);
      setResolved(list.filter(x => x.state === "dismissed").map(x => x.id));
      setStatus(list.some(x => x.state === "open" || x.state === "acknowledged") ? "Changes requested" : "Ready for review");
      await refreshSavedDrafts();
      setToast("Suggestion applied and revision saved to the backend.");
      return;
    } catch (error) {
      setToast(`Suggestion applied locally, but backend save failed: ${error.message}`);
      return;
    }
  }

  setResolved(a => [...new Set([...a, f.id])]);
  setToast("Suggestion applied to the draft.");
}

async function markReviewed(f){
  if (!backendDraftId || !f.backendId) {
    setResolved(r => [...new Set([...r, f.id])]);
    setToast("Marked reviewed in this session.");
    return;
  }
  try {
    await api.decide(backendDraftId, f.backendId, "dismissed", comment);
    setResolved(r => [...new Set([...r, f.id])]);
    setFindings(items => items.map(x => x.id === f.id ? {...x, state:"dismissed"} : x));
    await refreshSavedDrafts();
    setToast("Finding dismissed and saved to the backend.");
  } catch (error) {
    setToast(error.message || "Could not save this finding decision.");
  }
}

async function decide(d){
  if (d === "approved") {
    if (!backendDraftId) {
      setToast("Run a backend review before approving this draft.");
      return;
    }
    try {
      const result = await api.approve(backendDraftId, comment);
      setDecision("approved");
      setStatus("Approved");
      await refreshSavedDrafts();
       setToast(result?.message || "Draft approval saved to the backend.");
    } catch (error) {
      setToast(error.message || "Approval failed. Resolve all findings first.");
    }
    return;
  }

  setDecision(d);
  setStatus(d === "rejected" ? "Rejected" : "Changes requested");
  setToast("This backend currently supports approval and finding decisions; whole-draft rejection and request-changes are not implemented yet.");
}

async function openSavedDraft(id){
  try {
    const saved = await api.getDraft(id);
    setBackendDraftId(saved.id);
    localStorage.setItem("bl-last-draft-id", String(saved.id));
    setTitle(saved.title || "Untitled campaign draft");
    setDraft(saved.content || "");
    setCampaign("Saved campaign");
    const list = mapBackendFindings(saved.findings);
    setFindings(list);
    setActive(list[0]?.id || null);
    setResolved(list.filter(f => f.state === "dismissed").map(f => f.id));
    setStatus(saved.status === "approved" ? "Approved" :
      list.some(f => f.state === "open" || f.state === "acknowledged") ? "Changes requested" : "Ready for review");
    setDecision("");
    setPage("reviews");
    localStorage.setItem("bl-page", "reviews");
    setToast("Saved draft loaded.");
  } catch(error) {
    setToast(error.message || "Could not open the saved draft.");
  }
}

function newDraft(){
  setTitle("Untitled campaign draft");
  setCampaign("New campaign");
  setDraft("");
  setFindings([]);
  setActive(null);
  setResolved([]);
  setBackendDraftId(null);
  localStorage.removeItem("bl-last-draft-id");
  setStatus("Not reviewed");
  setDecision("");
  setPage("reviews");
}

const titlePage=nav.find(n=>n[0]===page)?.[1]||"Overview";

if (!authenticated) {
  return <div className={`app theme-${theme}`} style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"24px",background:"#0b0e14",color:"#f4f5f7"}}>
    <form onSubmit={login} style={{width:"min(420px,100%)",boxSizing:"border-box",padding:"32px",borderRadius:"18px",background:"#151923",border:"1px solid #2b3140",boxShadow:"0 24px 80px rgba(0,0,0,.35)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
        <span style={{display:"grid",placeItems:"center",width:"44px",height:"44px",borderRadius:"12px",background:"#242b3b",color:"#b6c8ff"}}><ShieldCheck size={24}/></span>
        <span><strong style={{display:"block",fontSize:"22px"}}>BrandLedger</strong><small style={{color:"#9ba4b8",letterSpacing:"1.4px"}}>BRAND GOVERNANCE</small></span>
      </div>
      <h1 style={{fontSize:"26px",margin:"0 0 8px"}}>Sign in to your workspace</h1>
      <p style={{color:"#a7afc0",lineHeight:1.5,margin:"0 0 24px"}}>Use your Django account to review and save campaign drafts.</p>
      <label style={{display:"block",fontSize:"12px",fontWeight:700,letterSpacing:"1px",marginBottom:"8px"}}>USERNAME</label>
      <input value={loginUsername} onChange={e=>setLoginUsername(e.target.value)} autoComplete="username" required style={{boxSizing:"border-box",width:"100%",padding:"12px 14px",marginBottom:"18px",borderRadius:"9px",border:"1px solid #3a4152",background:"#0e121b",color:"#fff",fontSize:"15px"}}/>
      <label style={{display:"block",fontSize:"12px",fontWeight:700,letterSpacing:"1px",marginBottom:"8px"}}>PASSWORD</label>
      <input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} autoComplete="current-password" required style={{boxSizing:"border-box",width:"100%",padding:"12px 14px",marginBottom:"16px",borderRadius:"9px",border:"1px solid #3a4152",background:"#0e121b",color:"#fff",fontSize:"15px"}}/>
      {loginError&&<p role="alert" style={{color:"#ff9c9c",fontSize:"13px",margin:"0 0 14px"}}>{loginError}</p>}
      <button type="submit" disabled={loginBusy} style={{width:"100%",padding:"13px 16px",border:0,borderRadius:"9px",background:"#b6c8ff",color:"#141927",fontWeight:700,fontSize:"15px",cursor:loginBusy?"wait":"pointer"}}>{loginBusy?"Signing in...":"Sign in"}</button>
      <p style={{color:"#8992a5",fontSize:"12px",lineHeight:1.5,margin:"18px 0 0"}}>Your password is sent to your local backend for authentication and is not stored by this page.</p>
    </form>
  </div>;
}

return <div className={`app theme-${theme}`}>

<aside className={`sidebar ${mobile?"mobile":""}`}><div className="logo"><span className="logo-mark"><ShieldCheck size={21}/></span><span className="logo-type">BrandLedger<small>BRAND GOVERNANCE</small></span><button className="close-mobile" onClick={()=>setMobile(false)}><X size={17}/></button></div><button className="workspace"><b>P</b><span><strong>PayNest</strong><small>Demo workspace</small></span><ChevronDown size={15}/></button><div className="nav-label">WORKSPACE</div>{nav.slice(0,2).map(([id,label,Icon])=><button key={id} className={`nav-item ${page===id?"active":""}`} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={17}/>{label}{id==="reviews"&&<small>04</small>}</button>)}<div className="nav-label spaced">GOVERNANCE</div>{nav.slice(2).map(([id,label,Icon])=><button key={id} className={`nav-item ${page===id?"active":""}`} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={17}/>{label}</button>)}<div className="sidebar-bottom"><div className="secure-note"><LockKeyhole size={15}/><span><b>Human-led review</b><small>Nothing publishes automatically.</small></span></div><div className="user"><b>{(currentUsername||"BL").slice(0,2).toUpperCase()}</b><span><strong>{currentUsername||"Signed-in user"}</strong><small>{isStaff?"Brand reviewer":"Content creator"}</small></span><MoreHorizontal size={18}/></div></div></aside>

{mobile&&<button className="scrim" onClick={()=>setMobile(false)} aria-label="Close navigation"/>}

<main className="main"><header className="topbar"><div className="crumb"><button className="mobile-menu" onClick={()=>setMobile(true)}><Menu size={18}/></button><span>PayNest</span><ChevronRight size={13}/><b>{titlePage}</b></div><div className="top-actions"><button className="search" onClick={()=>setSearch(true)}><Search size={15}/><span>Search anything</span><kbd><Command size={10}/> K</kbd></button><span className="api-state"><i/>{apiMode}</span><button className="icon-btn" title="Toggle theme" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}>{theme==="dark"?<Sun size={17}/>:<Moon size={17}/>}</button><button className="icon-btn" title="Notifications" onClick={()=>setToast("You're all caught up.")}><Bell size={17}/></button><button className="icon-btn" title="Log out" aria-label="Log out" onClick={logout}><LogOut size={17}/></button><b className="avatar">{(currentUsername||"BL").slice(0,2).toUpperCase()}</b></div></header>

<div className="content"><AnimatePresence mode="wait">

{page==="overview"&&<motion.section key="overview" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"> <i/> TUESDAY, OCTOBER 22, 2026</div><h1>Good morning, {currentUsername||"there"} <em>✳</em></h1><p>Your brand's first line of defence starts here.</p></div><Btn kind="primary" onClick={newDraft}><Plus size={16}/> New content review</Btn></div>

<div className="hero"><div className="hero-copy"><span><Sparkles size={14}/> BRAND INTELLIGENCE</span><h2>Consistency isn't a coincidence.<br/><em>It's a system.</em></h2><p>Every claim checked. Every decision traceable. Every voice on-brand.</p><button onClick={()=>setPage("reviews")}>Open review studio <ArrowRight size={15}/></button></div><div className="orbit-art"><div className="orbit o1"/><div className="orbit o2"/><div className="orbit o3"/><div className="core"><ShieldCheck size={36}/></div><label>✓ VERIFIED FACTS</label><label>⌑ HUMAN REVIEW</label><label>↗ LIVE TRACE</label></div></div>

<div className="section-head"><div><h2>Workspace at a glance</h2><p>Here's what's happening across your brand.</p></div><button onClick={()=>setPage("audit")}>View activity <ArrowRight size={14}/></button></div><div className="stats"><Stat label="Reviews this month" value="128" note="+12.8% vs last month" Icon={FileCheck2} delay={.03}/><Stat label="Issues caught" value="346" note="Across 128 reviews" Icon={ShieldAlert} delay={.08}/><Stat label="Awaiting approval" value="04" note="2 need your attention" Icon={Clock3} delay={.13}/><Stat label="Brand consistency" value="94.2%" note="+3.4% this month" Icon={Gauge} delay={.18}/></div>

<div className="dash-grid"><section className="panel queue"><div className="panel-head"><div><h3>Needs your attention</h3><p>Content waiting for a decision</p></div><button onClick={()=>setPage("reviews")}>View queue <ArrowRight size={14}/></button></div>{[{title:"Smart Savings launch copy",meta:"Paid social · Jaiveer Singh · 18 min ago",tag:"3 findings",tone:"red"},{title:"Rewards email campaign",meta:"Email · Ananya Rao · 42 min ago",tag:"1 finding",tone:"amber"},{title:"App onboarding message",meta:"In-app · Rohan Mehta · 1 hr ago",tag:"No critical findings",tone:"green"}].map((x,i)=><button className="queue-row" key={x.title} onClick={()=>{setTitle(x.title);setDraft(i===0?seed:i===1?"Get the best rewards in India with PayNest. Sign up today and enjoy simple payments.":"Welcome to PayNest. Open your account in minutes with a simple, secure setup.");setBackendDraftId(null);setFindings([]);setResolved([]);setPage("reviews")}}><span className="file-icon"><FileText size={17}/></span><span className="queue-copy"><b>{x.title}</b><small>{x.meta}</small><em className={x.tone}>{x.tag}</em></span><span className="queue-status"><Pill tone={i===2?"good":"warn"}>{i===2?"Ready to approve":"Review needed"}</Pill><ChevronRight size={15}/></span></button>)}<button className="queue-footer" onClick={()=>setPage("reviews")}>Open full review queue <ArrowRight size={14}/></button></section>

<section className="panel issues"><div className="panel-head"><div><h3>Common issue types</h3><p>Findings across the last 30 days</p></div><Activity size={16}/></div>{[{name:"Unsupported claims",n:48,w:78,c:"coral"},{name:"Outdated facts",n:36,w:58,c:"amber"},{name:"Off-brand language",n:27,w:44,c:"violet"},{name:"Accessibility",n:14,w:23,c:"blue"}].map((x,i)=><div className="bar-row" key={x.name}><span>{x.name}<b>{x.n}</b></span><div><motion.i className={x.c} initial={{width:0}} animate={{width:x.w+"%"}} transition={{duration:.7,delay:i*.08}}/></div></div>)}<button className="insight-box" onClick={()=>setPage("insights")}><Lightbulb size={17}/><span><b>One guideline may need clarification</b><small>“Promotional claims” has 8 reviewer overrides this month.</small></span><ChevronRight size={15}/></button></section></div><div className="disclaimer"><Shield size={14}/> BrandLedger is a review aid, not a guarantee of compliance. Human approval is always required.</div></motion.section>}

{page==="reviews"&&<motion.section key="reviews" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"><i/> CONTENT GOVERNANCE / REVIEW STUDIO</div><h1>Review workspace</h1><p>Inspect every finding. Understand the evidence. Keep the final call.</p></div><div className="head-buttons"><Btn onClick={()=>setHistory(v=>!v)}><History size={15}/> Version history</Btn><Btn kind="primary" onClick={newDraft}><Plus size={15}/> New draft</Btn></div></div>

{history&&<motion.div className="history-strip" initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}><b><GitCompareArrows size={15}/> Saved versions <small>{versions.length} versions</small></b><div>{versions.map((v,i)=><button key={i} onClick={()=>{setDraft(v.text);setToast(v.name+" restored")}}><strong>{v.name}</strong><small>{v.time}</small></button>)}</div></motion.div>}

<section className="panel" style={{padding:"14px 16px",marginBottom:"14px"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",marginBottom:"10px"}}>
    <div><b style={{fontSize:"14px"}}>Saved drafts</b><div style={{fontSize:"12px",opacity:.7,marginTop:"3px"}}>Open a draft saved in your backend database.</div></div>
    <Btn onClick={refreshSavedDrafts} disabled={loadingSavedDrafts}>{loadingSavedDrafts?"Refreshing…":"Refresh list"}</Btn>
  </div>
  {savedDrafts.length===0
    ? <small style={{opacity:.7}}>{loadingSavedDrafts?"Loading saved drafts…":"No saved drafts returned yet. Run a review to save a draft here."}</small>
    : <div style={{display:"flex",flexWrap:"wrap",gap:"8px"}}>
        {savedDrafts.map(item=><button key={item.id} onClick={()=>openSavedDraft(item.id)} style={{textAlign:"left",padding:"8px 10px",borderRadius:"8px",border:"1px solid var(--border, #343a49)",background:"transparent",color:"inherit",cursor:"pointer",maxWidth:"100%"}}>
          <b style={{display:"block",fontSize:"12px"}}>{item.title || `Draft ${item.id}`}</b>
          <small style={{display:"block",opacity:.7,marginTop:"3px"}}>#{item.id} · {item.status || "saved"}</small>
        </button>)}
      </div>}
</section>
<div className="docbar"><span className="file-icon"><FileText size={17}/></span><span className="docname"><b>{title}</b><small>{campaign} · Last edited just now</small></span><button className="icon-btn" title="Rename draft" onClick={()=>{let t=prompt("Rename draft",title);if(t?.trim())setTitle(t.trim())}}><Settings2 size={15}/></button><Pill tone={status==="Approved"?"good":status==="Not reviewed"?"": "warn"}>{status}</Pill></div>

<div className={`review-grid ${!showEvidence?"wide":""}`}><section className="panel editor"><div className="editor-head"><span><i/> CONTENT DRAFT <small>· Plain text</small></span><button onClick={()=>setShowEvidence(v=>!v)}><PanelRightClose size={15}/></button></div><div className="fields"><label>CONTENT TITLE<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>CAMPAIGN<input value={campaign} onChange={e=>setCampaign(e.target.value)}/></label></div><label className="draft-label">Draft content <small>· {draft.trim()?draft.trim().split(/\s+/).length:0} words</small></label><textarea className="draft" value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Paste campaign copy here…" spellCheck/><div className="editor-foot"><span><LockKeyhole size={13}/> Original stays unchanged until you apply a suggestion.</span><span>{draft.length} chars</span></div>{findings.length>0&&<div className="highlight-preview"><div> <Sparkles size={13}/> FLAGGED CONTENT PREVIEW <small>Click a phrase to inspect it</small></div><p>{draft.split(/(guaranteed|7% returns|risk-free)/gi).map((part,i)=>{let f=findings.find(x=>x.term?.toLowerCase()===part.toLowerCase());return f?<mark key={i} className={`${f.severity} ${active===f.id?"chosen":""}`} onClick={()=>setActive(f.id)}>{part}</mark>:<React.Fragment key={i}>{part}</React.Fragment>})}</p></div>}<div className="editor-actions"><Btn onClick={()=>{setFindings([]);setResolved([]);setStatus("Not reviewed");setToast("Findings cleared")}}><X size={14}/> Clear findings</Btn><Btn kind="primary" disabled={busy} onClick={review}>{busy?<><span className="spinner"/> Checking content…</>:<><Sparkles size={15}/> Run brand review <ArrowRight size={15}/></>}</Btn></div><div className="method-note"><ShieldCheck size={14}/> Deterministic checks run first. AI interpretation is handled by the backend when enabled.</div></section>

{showEvidence&&<aside className="panel evidence"><div className="panel-head"><div><h3>Review findings <span className="count">{open.length}</span></h3><p>{findings.length?`${resolved.length} of ${findings.length} addressed`:"Run a review to see evidence-backed findings."}</p></div><button title="Cycle finding filter" onClick={()=>setFindings(f=>[...f].reverse())}><Filter size={15}/></button></div>{findings.length>0&&<div className="progress"><span>Resolution progress <b>{completion}%</b></span><div><i style={{width:completion+"%"}}/></div></div>}{!findings.length?<div className="empty"><span><ShieldCheck size={29}/><Sparkles size={13}/></span><b>Your evidence panel is ready</b><p>Run a review to see each issue, the source rule, and a suggested next step.</p><small>✓ Approved facts　 ✓ Prohibited phrases　 ✓ Claim evidence</small></div>:<div className="finding-list">{findings.map((f,i)=><motion.button key={f.id} className={`finding ${active===f.id?"selected":""} ${resolved.includes(f.id)?"resolved":""}`} onClick={()=>setActive(f.id)} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}><span className={`finding-icon ${f.severity}`}>{f.severity==="critical"?<ShieldAlert size={16}/>:<Flag size={16}/>}</span><span className="finding-body"><small>{f.type}<b className={f.severity}>{resolved.includes(f.id)?"RESOLVED":f.severity.toUpperCase()}</b></small><strong>{f.title}</strong><em>{f.detail}</em><label><BookOpen size={12}/>{f.source}</label></span><ChevronRight size={14}/></motion.button>)}</div>}

{activeFinding&&<AnimatePresence mode="wait"><motion.div key={activeFinding.id} className="evidence-detail" initial={{opacity:0,y:7}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="detail-kicker"><BookOpen size={13}/> EVIDENCE & EXPLANATION <b className={activeFinding.severity}>{activeFinding.severity.toUpperCase()}</b></div><h4>{activeFinding.title}</h4><p>{activeFinding.detail}</p><div className="source-card"><BadgeCheck size={16}/><span><small>TRACEABLE SOURCE</small><b>{activeFinding.source}</b><em>{activeFinding.id==="PF-104"?"PayNest Smart Savings rate: 6.5% p.a. · Approved fact PF-104":"Rule verified in the fictional PayNest demo rulebook."}</em></span></div><div className="suggestion"><small><Sparkles size={13}/> SUGGESTED NEXT STEP</small><p>{activeFinding.suggestion}</p><div><Btn kind="primary" disabled={resolved.includes(activeFinding.id)} onClick={()=>apply(activeFinding)}><Check size={14}/> Apply suggestion</Btn><button className="text-btn" disabled={resolved.includes(activeFinding.id)} onClick={()=>markReviewed(activeFinding)}>Mark reviewed</button></div></div></motion.div></AnimatePresence>}<div className="evidence-foot"><LockKeyhole size={12}/> Suggestions never publish automatically</div></aside>}</div>

<section className="panel decision"><div className="decision-copy"><span><ShieldCheck size={19}/></span><div><b>Human decision required</b><small>Resolve findings, then record a decision. This never publishes content.</small></div></div><div className="decision-actions"><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Optional reviewer note…"/><Btn kind="reject" onClick={()=>decide("rejected")}><ThumbsDown size={14}/> Reject</Btn><Btn onClick={()=>decide("changes-requested")}><ArrowRight size={14}/> Request changes</Btn><Btn kind="approve" onClick={()=>decide("approved")}><ThumbsUp size={14}/> Approve draft</Btn></div>{decision&&<p className="decision-note"><CheckCheck size={14}/> {decision==="approved"?"Approval saved to the backend:":"Decision recorded in this browser session:"} <b>{decision}</b>.</p>}</section></motion.section>}

{page==="claims"&&<motion.section key="claims" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"><i/> GOVERNANCE / FACT MANAGEMENT</div><h1>Claims ledger</h1><p>One source of truth for claims your brand is allowed to make.</p></div><Btn kind="primary" onClick={()=>setToast("Connect the backend facts endpoint to add facts.")}><Plus size={15}/> Add approved fact</Btn></div><div className="intro-card"><Layers3 size={24}/><span><b>Verified facts, with a history</b><small>Superseded facts stay visible so outdated claims can be identified.</small></span><Pill>3 facts</Pill></div><section className="panel table"><div className="table-head"><b>Approved and historical facts</b><span>FICTIONAL PAYNEST DATA</span></div><div className="table-scroll"><table><thead><tr><th>FACT ID</th><th>FACT / CLAIM</th><th>APPROVED VALUE</th><th>STATUS</th><th>UPDATED</th></tr></thead><tbody>{[["PF-104","Smart Savings interest rate","6.5% p.a.","Approved","01 Oct 2026"],["PF-098","Previous savings rate","6.0% p.a.","Superseded","15 Jun 2026"],["PF-021","Account opening fee","₹0","Approved","12 Aug 2026"]].map(r=><tr key={r[0]}>{r.map((c,i)=><td key={i}>{i===0?<code>{c}</code>:i===1?<b>{c}</b>:i===3?<Pill tone={c==="Approved"?"good":""}>{c}</Pill>:c}</td>)}</tr>)}</tbody></table></div><p className="table-foot">Only approved facts are current references. Historical facts remain visible for traceability.</p></section></motion.section>}

{page==="guidelines"&&<motion.section key="guidelines" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"><i/> GOVERNANCE / RULEBOOK</div><h1>Brand guidelines</h1><p>Versioned rules that explain what good looks like.</p></div><Btn kind="primary" onClick={()=>setToast("Guideline editing needs the Django rules endpoint.")}><Plus size={15}/> Add guideline</Btn></div><div className="guides">{[{icon:ShieldAlert,title:"Prohibited claims",desc:"Avoid absolute promises or misleading financial outcomes.",items:["guaranteed","risk-free","100% safe"],tone:"red"},{icon:BookOpen,title:"Verified product facts",desc:"Use current facts and check effective dates.",items:["Interest rate: 6.5% p.a.","Account opening fee: ₹0","Check superseded facts"],tone:"green"},{icon:Sparkles,title:"Brand voice",desc:"Clear, supportive, transparent, and never misleading.",items:["Plain language","No pressure tactics","Explain product limits"],tone:"purple"},{icon:CheckCheck,title:"Accessibility & clarity",desc:"Make content readable, inclusive, and easy to understand.",items:["Clear headings","Meaningful link text","Readable contrast"],tone:"blue"}].map(g=><section className="panel guide" key={g.title}><span className={`guide-icon ${g.tone}`}><g.icon size={19}/></span><h3>{g.title}</h3><p>{g.desc}</p>{g.items.map(i=><small key={i}><Check size={12}/>{i}</small>)}<button className="text-btn" onClick={()=>setToast(`${g.title}: demo guideline details opened.`)}>View guideline <ArrowRight size={13}/></button></section>)}</div><p className="disclaimer"><Shield size={14}/> Fictional demo rules. Confirm policies with the actual brand owner before use.</p></motion.section>}

{page==="insights"&&<motion.section key="insights" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"><i/> GOVERNANCE / CONTINUOUS IMPROVEMENT</div><h1>Guideline insights</h1><p>Recurring overrides may reveal where a rule needs more clarity.</p></div><Btn onClick={()=>setToast("Illustrative insight report prepared.")}><Activity size={15}/> Export insights</Btn></div><div className="insight-hero"><span><Lightbulb size={15}/> GUIDELINE GAP DETECTED</span><h2>Good guidelines should reduce<br/>repeat questions.</h2><p>Eight reviewer overrides mention promotional claims this month. That may signal ambiguity in the rule—not just creator error.</p><Btn kind="primary" onClick={()=>setToast("Guideline review flagged in this demo session.")}>Flag for guideline review <ArrowRight size={14}/></Btn><div className="big-number">8<small>overrides</small></div></div><div className="section-head"><div><h2>Patterns worth a closer look</h2><p>Illustrative data from the fictional PayNest workspace.</p></div><Pill>Last 30 days</Pill></div><div className="insight-cards">{[{n:"01",title:"Promotional claims",count:"8 overrides",desc:"Reviewers frequently allow wording the current guidance appears to prohibit."},{n:"02",title:"Outdated product rates",count:"6 findings",desc:"Older rate references still appear in campaign drafts."},{n:"03",title:"Risk language",count:"4 repeated flags",desc:"Approved alternatives could help reviewers and creators."}].map(x=><section className="panel insight-card" key={x.n}><code>{x.n}</code><small>{x.count}</small><h3>{x.title}</h3><p>{x.desc}</p><button className="text-btn" onClick={()=>setToast("Insight added to demo follow-up.")}>Investigate pattern <ArrowRight size={13}/></button></section>)}</div><p className="disclaimer"><Lightbulb size={14}/> Production insights must be calculated from recorded findings and reviewer overrides.</p></motion.section>}

{page==="audit"&&<motion.section key="audit" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"><i/> GOVERNANCE / ACCOUNTABILITY</div><h1>Audit trail</h1><p>A readable timeline of what changed, who reviewed it, and why.</p></div><Btn onClick={()=>setToast("Audit export requires a connected backend.")}><History size={15}/> Export history</Btn></div><div className="intro-card"><History size={24}/><span><b>Traceable by design</b><small>Backend audit events should be append-only. This view shows local session activity.</small></span><Pill tone="warn">Demo session</Pill></div><section className="panel audit"><div className="panel-head"><div><h3>Recent activity</h3><p>Latest actions in this browser session</p></div><Pill>Local demo</Pill></div>{[{name:"Workspace opened",desc:"PayNest demo workspace loaded.",time:"Just now · System"},...versions.slice(1).reverse().map(v=>({name:v.name+" saved",desc:"Draft version saved in local session history.",time:v.time+" · Jaiveer Singh"})),...(decision?[{name:"Draft "+decision,desc:comment||"No reviewer comment added.",time:"Current session · Jaiveer Singh"}]:[])].map((x,i)=><div className="audit-row" key={i}><span><History size={15}/></span><div><b>{x.name}</b><p>{x.desc}</p><small>{x.time}</small></div><code>{i===0?"SESSION":x.name.includes("saved")?"VERSION":"DECISION"}</code></div>)}</section></motion.section>}

</AnimatePresence></div></main>

<AnimatePresence>{toast&&<motion.div className="toast" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}><Check size={14}/>{toast}<button onClick={()=>setToast("")}><X size={14}/></button></motion.div>}</AnimatePresence>

<AnimatePresence>{search&&<motion.div className="modal-bg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSearch(false)}><motion.div className="command-modal" initial={{y:-10,opacity:0}} animate={{y:0,opacity:1}} onClick={e=>e.stopPropagation()}><div className="command-head"><Search size={17}/><input autoFocus placeholder="Jump to a workspace page…"/><button onClick={()=>setSearch(false)}><X size={15}/></button></div><p>NAVIGATION</p>{nav.map(([id,label,Icon])=><button className="command-item" key={id} onClick={()=>{setPage(id);setSearch(false)}}><Icon size={16}/>{label}<ArrowRight size={14}/></button>)}<small>BrandLedger command menu · DEMO WORKSPACE</small></motion.div></motion.div>}</AnimatePresence>

</div>}
