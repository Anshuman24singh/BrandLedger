import React,{useState,useEffect,useRef}from"react";import{AnimatePresence,motion}from"framer-motion";import{ShieldCheck,Shield,BadgeCheck,Home,FileCheck2,Layers3,BookOpen,Lightbulb,History,Plus,Search,Bell,Sun,Moon,ChevronRight,ChevronDown,ArrowRight,ArrowUpRight,Clock3,ShieldAlert,Flag,Sparkles,Check,CheckCheck,LockKeyhole,FileText,Filter,PanelRightClose,GitCompareArrows,ThumbsUp,ThumbsDown,X,Menu,Command,Activity,Settings2,Send,Gauge,MoreHorizontal,LogOut,FolderOpen,RefreshCw,Trash2,Square,CheckSquare,AlertTriangle}from"lucide-react";import{api}from"./lib/api.js";

const seed="";

const nav=[["overview","Dashboard",Home],["reviews","My drafts",FileCheck2],["claims","Claims ledger",Layers3],["guidelines","Brand guidelines",BookOpen],["insights","Guideline insights",Lightbulb],["audit","Audit trail",History],["changes","Creator changes",GitCompareArrows]];

function navigationForRole(isReviewer){
  // Each role sees only the pages needed for its job; reviewer guideline access is read-only.
  const allowed = isReviewer
    ? ["overview", "reviews", "claims", "guidelines", "insights", "audit", "changes"]
    : ["overview", "reviews", "claims", "guidelines"];
  return nav.filter(([id]) => allowed.includes(id)).map(([id,label,Icon]) => [
    id,
    id === "reviews" ? (isReviewer ? "Review queue" : "My drafts") : label,
    Icon,
  ]);
}

function Btn({children,onClick,kind="secondary",disabled=false}){return <button disabled={disabled} className={`${kind}-button`} onClick={onClick}>{children}</button>}

function Pill({children,tone=""}){return <span className={`pill ${tone}`}><i/>{children}</span>}

function Stat({label,value,note,Icon,delay=0}){return <motion.div className="stat" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay}}><div className="stat-label">{label}<span><Icon size={16}/></span></div><strong>{value}</strong><small>{note}</small></motion.div>}

function draftStatusLabel(status){
  const labels = {in_review:"Awaiting review",ready_for_client_review:"Ready for client review",approved:"Approved",rejected:"Rejected",changes_requested:"Changes requested"};
  return labels[status] || (status ? status.replaceAll("_", " ").replace(/^\w/, c => c.toUpperCase()) : "Saved");
}
function latestReviewerDecision(item){
  return (Array.isArray(item?.decisions) ? item.decisions : []).filter(event => ["approved","rejected","changes_requested"].includes(event.action)).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0))[0];
}

function splitDraftByFindings(text, findings){
  const items = Array.isArray(findings) ? findings : [];
  const terms = [...new Set(items
    .map(item => typeof item?.excerpt === "string" && item.excerpt.trim()
      ? item.excerpt.trim()
      : (typeof item?.term === "string" ? item.term.trim() : ""))
    .filter(Boolean))].sort((a,b) => b.length - a.length);
  if(!terms.length) return [{text, finding:null}];
  const escaped = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(pattern).map(part => ({
    text: part,
    finding: items.find(item => {
      const term = typeof item?.excerpt === "string" && item.excerpt.trim()
        ? item.excerpt.trim()
        : (typeof item?.term === "string" ? item.term.trim() : "");
      return term && term.toLowerCase() === part.toLowerCase();
    }) || null
  }));
}

function isUsableSuggestion(value){
  if(typeof value !== "string" || !value.trim() || /^human review required$/i.test(value.trim())) return false;
  return !/^(please\s+)?(remove|delete|replace|rewrite|change|avoid|describe|explain|ask|consider|ensure|make sure|try|substantiate|verify|confirm|check)\b/i.test(value.trim())
    && !/^(this|the) (phrase|claim|text|sentence|wording)\b/i.test(value.trim());
}

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

        // Preserve the backend's evidence trace for the reviewer detail panel.
        evidenceStatus: f.evidence_status || "uncertain",
        evidenceSnapshot: f.evidence_snapshot || {},
        factId: f.fact ?? f.fact_id ?? null,
        ruleId: f.rule ?? f.rule_id ?? null,
      };
    });
}

function NotificationMenu({isStaff,open,setOpen,notifications,unreadCount,readIds,onMarkAllRead,onOpenNotification,onRefresh,rootRef}){
  return <div ref={rootRef} style={{position:"relative"}}>
    <button className="icon-btn" title="Notifications" aria-label={`Notifications${unreadCount?`, ${unreadCount} unread`:""}`} aria-expanded={open} onClick={()=>{setOpen(v=>!v);if(!open)onRefresh();}} style={{position:"relative"}}>
      <Bell size={17}/>{unreadCount>0&&<span style={{position:"absolute",right:"-3px",top:"-4px",minWidth:"16px",height:"16px",padding:"0 3px",display:"grid",placeItems:"center",borderRadius:"99px",background:"#e87989",color:"#1b1014",fontSize:"9px",fontWeight:900,border:"2px solid var(--panel, #171c27)"}}>{unreadCount>9?"9+":unreadCount}</span>}
    </button>
    {open&&<section role="dialog" aria-label="Notifications" style={{position:"absolute",right:0,top:"calc(100% + 10px)",zIndex:90,width:"min(360px, calc(100vw - 32px))",maxHeight:"min(390px, 70vh)",display:"flex",flexDirection:"column",overflow:"hidden",padding:"12px",border:"1px solid var(--border, #30394b)",borderRadius:"14px",background:"var(--panel, #171c27)",boxShadow:"0 20px 50px rgba(0,0,0,.38)",color:"inherit"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px",marginBottom:"8px",flexShrink:0}}>
          <span><strong style={{fontSize:"13px"}}>Notifications</strong><small style={{display:"block",fontSize:"10px",opacity:.65,marginTop:"3px"}}>{notifications.length} total · scroll for history</small></span>
          <button onClick={onMarkAllRead} disabled={!unreadCount} style={{border:0,background:"transparent",color:"var(--muted, #9da8bd)",fontSize:"10px",cursor:unreadCount?"pointer":"default",opacity:unreadCount?1:.5}}>Mark all read</button>
        </div>
        <div style={{overflowY:"auto",minHeight:0,maxHeight:"285px",paddingRight:"3px"}}>
        {notifications.length===0?<div style={{padding:"18px 8px",textAlign:"center",color:"var(--muted, #9da8bd)",fontSize:"12px"}}><Bell size={20}/><p style={{margin:"8px 0 0"}}>No notifications yet.</p><small>{isStaff?"Drafts waiting for review will appear here.":"Reviewer decisions will appear here."}</small></div>:notifications.map(note=><button key={note.id} onClick={()=>onOpenNotification(note)} style={{display:"block",width:"100%",textAlign:"left",padding:"10px",marginTop:"5px",border:0,borderRadius:"9px",background:readIds.includes(note.id)?"transparent":"rgba(127,152,232,.10)",color:"inherit",cursor:"pointer"}}>
          <span style={{display:"flex",alignItems:"flex-start",gap:"8px"}}><span style={{width:"7px",height:"7px",marginTop:"5px",borderRadius:"50%",background:readIds.includes(note.id)?"transparent":"#9da8ff",flexShrink:0}}/><span style={{minWidth:0,flex:1}}><strong style={{display:"block",fontSize:"12px",lineHeight:1.4}}>{note.title}</strong><span style={{display:"block",fontSize:"11px",lineHeight:1.45,opacity:.82,marginTop:"3px"}}>{note.draftTitle}</span><span style={{display:"block",fontSize:"10px",lineHeight:1.45,opacity:.68,marginTop:"4px"}}>{note.detail}</span><small style={{display:"block",fontSize:"9px",opacity:.55,marginTop:"5px"}}>{note.created_at?new Date(note.created_at).toLocaleString():"Recent"}</small></span></span>
        </button>)}
        </div>
      </section>}
  </div>;
}


function ClaimsLedgerView({isStaff, selectedBrandId}){
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [auditFact, setAuditFact] = useState(null);
  const [auditEvents, setAuditEvents] = useState([]);
  const [auditError, setAuditError] = useState("");
  const [editingFact, setEditingFact] = useState(null);
  const blankForm = {key:"",value:"",source:"Approved brand source",effective_date:""};
  const [form, setForm] = useState(blankForm);

  async function loadFacts(){
    setLoading(true); setError("");
    try { const data = await api.knowledge(selectedBrandId || null); setFacts(Array.isArray(data?.facts)?data.facts:[]); }
    catch(e){ setError(e.message || "Could not load facts."); }
    finally { setLoading(false); }
  }
  useEffect(()=>{loadFacts();},[selectedBrandId]);

  function startEdit(fact){
    setEditingFact(fact);
    setForm({key:fact.key||"",value:fact.value||"",source:fact.source||"",effective_date:fact.effective_date||""});
    setError("");
  }
  function cancelEdit(){setEditingFact(null);setForm(blankForm);setError("");}

  async function saveFact(e){
    e.preventDefault();
    if(!selectedBrandId){setError("Select a brand before adding a fact.");return;}
    setSaving(true);setError("");
    try {
      const payload={key:form.key.trim(),value:form.value.trim(),source:form.source.trim(),effective_date:form.effective_date||null};
      if(editingFact) await api.updateFact(editingFact.id,payload);
      else await api.createFact({brand:Number(selectedBrandId),...payload});
      cancelEdit();
      await loadFacts();
    } catch(e){setError(e.message||`Could not ${editingFact?"update":"save"} fact.`);}
    finally{setSaving(false);}
  }
  async function withdrawFact(fact){
    if(!window.confirm(`Withdraw “${fact.key}” (${fact.value})? It will no longer be an approved claim, and its record and audit history will be retained.`)) return;
    setSaving(true);setError("");
    try{await api.deleteFact(fact.id);if(editingFact?.id===fact.id)cancelEdit();await loadFacts();if(auditFact?.id===fact.id)await showAudit(fact);}
    catch(e){setError(e.message||"Could not withdraw fact.");}
    finally{setSaving(false);}
  }
  async function showAudit(fact){
    setAuditFact(fact);setAuditEvents([]);setAuditError("");
    try{setAuditEvents(await api.factAudit(fact.id));}
    catch(e){setAuditError(e.message||"Could not load audit history.");}
  }

  return <motion.section key="claims" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
    <div className="page-head"><div><div className="eyebrow"><i/> REFERENCE / APPROVED FACTS</div><h1>Claims ledger</h1><p>Approved and historical product facts with reviewer-controlled changes and audit history.</p></div><Btn onClick={loadFacts} disabled={loading}><RefreshCw size={14}/> Refresh facts</Btn></div>
    <div className="intro-card"><Layers3 size={24}/><span><b>Verified facts, with a history</b><small>Editing supersedes the old record. Withdrawal marks a fact as withdrawn rather than permanently deleting it. Only approved facts should be used by the review engine.</small></span><Pill>{facts.length} records</Pill></div>
    {error&&<p className="disclaimer"><AlertTriangle size={14}/>{error}</p>}
    {isStaff&&<section className="panel" style={{padding:18,marginBottom:18}}><h3 style={{marginTop:0}}>{editingFact?`Edit approved fact · ${editingFact.key}`:"Add an approved fact"}</h3><p style={{fontSize:12,opacity:.75}}>{editingFact?"Saving creates a new approved version and retains the previous record as superseded.":"Use the same fact key to replace its current approved value. Previous approved records remain in the ledger."}</p>
      <form onSubmit={saveFact}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:10}}>
        <input required maxLength={80} placeholder="Fact key (e.g. savings rate)" value={form.key} onChange={e=>setForm({...form,key:e.target.value})}/>
        <input required maxLength={250} placeholder="Approved value" value={form.value} onChange={e=>setForm({...form,value:e.target.value})}/>
        <input required maxLength={300} placeholder="Source / reference" value={form.source} onChange={e=>setForm({...form,source:e.target.value})}/>
        <input type="date" aria-label="Effective date" value={form.effective_date} onChange={e=>setForm({...form,effective_date:e.target.value})}/>
      </div><div style={{display:"flex",gap:10,alignItems:"center",marginTop:12,flexWrap:"wrap"}}><Btn kind="primary" disabled={saving||!selectedBrandId}><Check size={14}/>{saving?"Saving…":editingFact?"Save changes":"Save approved fact"}</Btn>{editingFact&&<Btn onClick={cancelEdit} disabled={saving}><X size={14}/> Cancel edit</Btn>}{!selectedBrandId&&<small>Select a brand first.</small>}</div></form>
    </section>}
    <section className="panel table"><div className="table-head"><b>Approved and historical facts</b><span>{loading?"LOADING…":"LIVE BACKEND DATA"}</span></div>
      <div className="table-scroll"><table><thead><tr><th>FACT</th><th>VALUE</th><th>STATUS</th><th>EFFECTIVE DATE</th><th>SOURCE</th><th>ACTIONS / AUDIT</th></tr></thead><tbody>
      {facts.map(f=><tr key={f.id}><td><b>{f.key}</b></td><td>{f.value}</td><td><Pill tone={f.status==="approved"?"good":f.status==="withdrawn"?"warn":""}>{f.status}</Pill></td><td>{f.effective_date||"—"}</td><td>{f.source||"—"}</td><td><div style={{display:"flex",gap:6,flexWrap:"wrap"}}><Btn onClick={()=>showAudit(f)}>History</Btn>{isStaff&&f.status==="approved"&&<><Btn onClick={()=>startEdit(f)} disabled={saving}><Check size={12}/> Edit</Btn><Btn onClick={()=>withdrawFact(f)} disabled={saving}><Trash2 size={12}/> Withdraw</Btn></>}</div></td></tr>)}
      </tbody></table></div>{!loading&&!facts.length&&<p className="table-foot">No approved claims found for this brand. Add a claim when verified source information is available.</p>}
      <p className="table-foot">{isStaff?"Only the owning Reviewer can add, edit, or withdraw facts. Withdrawn and superseded records remain available for audit.":"Read-only view. Only the owning Reviewer can change facts."}</p>
    </section>
    {auditFact&&<section className="panel" style={{padding:18,marginTop:16}}><div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"center"}}><h3 style={{margin:0}}>Audit history · {auditFact.key}</h3><Btn onClick={()=>setAuditFact(null)}><X size={14}/> Close</Btn></div>
      {auditError&&<p className="disclaimer"><AlertTriangle size={14}/>{auditError}</p>}{!auditError&&!auditEvents.length&&<p className="table-foot">No audit events are recorded for this fact.</p>}
      {auditEvents.map(event=><div key={event.id} style={{borderTop:"1px solid rgba(140,150,170,.2)",padding:"12px 0",fontSize:12}}><b>{event.action}</b> · {event.actor} · {new Date(event.created_at).toLocaleString()}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,marginTop:8}}><div><small>BEFORE</small><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(event.before,null,2)}</pre></div><div><small>AFTER</small><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{JSON.stringify(event.after,null,2)}</pre></div></div>
      </div>)}
    </section>}
  </motion.section>;
}

export default function App(){

const[theme,setTheme]=useState(()=>localStorage.getItem("bl-theme")||"dark"),[page,setPage]=useState(()=>{const saved=sessionStorage.getItem("bl-page");return nav.some(n=>n[0]===saved)?saved:"overview"}),[draft,setDraft]=useState(""),[original]=useState(""),[title,setTitle]=useState(""),[campaign,setCampaign]=useState(""),[findings,setFindings]=useState([]),[active,setActive]=useState(null),[resolved,setResolved]=useState([]),[status,setStatus]=useState("Not reviewed"),[busy,setBusy]=useState(false),[toast,setToast]=useState(""),[versions,setVersions]=useState([]),[history,setHistory]=useState(false),[comment,setComment]=useState(""),[decision,setDecision]=useState(""),[showEvidence,setShowEvidence]=useState(true),[search,setSearch]=useState(false),[mobile,setMobile]=useState(false),[workspaceOpen,setWorkspaceOpen]=useState(false),[profileOpen,setProfileOpen]=useState(false),[authenticated,setAuthenticated]=useState(()=>api.authenticated),[currentUsername,setCurrentUsername]=useState(()=>sessionStorage.getItem("bl-username")||""),[isStaff,setIsStaff]=useState(()=>sessionStorage.getItem("bl-is-staff")==="true"),[loginUsername,setLoginUsername]=useState(""),[loginPassword,setLoginPassword]=useState(""),[loginBusy,setLoginBusy]=useState(false),[loginError,setLoginError]=useState(""),[backendDraftId,setBackendDraftId]=useState(()=>sessionStorage.getItem("bl-last-draft-id")),[savedDrafts,setSavedDrafts]=useState([]),[loadingSavedDrafts,setLoadingSavedDrafts]=useState(false),[showAllSavedDrafts,setShowAllSavedDrafts]=useState(false),[savedDraftSearch,setSavedDraftSearch]=useState(""),[selectedDraftIds,setSelectedDraftIds]=useState([]),[deletingDrafts,setDeletingDrafts]=useState(false),[notificationOpen,setNotificationOpen]=useState(false),[readNotificationIds,setReadNotificationIds]=useState(()=>{try{return JSON.parse(sessionStorage.getItem(`bl-notifications-read:${sessionStorage.getItem("bl-username")||"guest"}:${sessionStorage.getItem("bl-is-staff")==="true"?"reviewer":"creator"}`)||"[]")}catch{return []}});
const notificationRef=useRef(null),workspaceRef=useRef(null),profileRef=useRef(null),refreshInFlightRef=useRef(false);
const [knowledgeData,setKnowledgeData]=useState({facts:[],rules:[]});
const [knowledgeLoading,setKnowledgeLoading]=useState(false);
const [knowledgeError,setKnowledgeError]=useState("");
const [brands,setBrands]=useState([]);
const [selectedBrandId,setSelectedBrandId]=useState(()=>sessionStorage.getItem("bl-brand-id")||"");
const [brandNameInput,setBrandNameInput]=useState("");
const [guidelineForm,setGuidelineForm]=useState({code:"",phrase:"",replacement:"",explanation:"",source:"Brand style guide"});
const [guidelineBrandId,setGuidelineBrandId]=useState(()=>sessionStorage.getItem("bl-guideline-brand-id")||"");
const [guidelineKnowledgeData,setGuidelineKnowledgeData]=useState({facts:[],rules:[]});
const [guidelineKnowledgeLoading,setGuidelineKnowledgeLoading]=useState(false);
const [guidelineKnowledgeError,setGuidelineKnowledgeError]=useState("");
const [editingGuidelineId,setEditingGuidelineId]=useState(null);
const [changeDraftId,setChangeDraftId]=useState("");
const [draftChanges,setDraftChanges]=useState(null);
const [includedChangeIndexes,setIncludedChangeIndexes]=useState([]);
const [changesLoading,setChangesLoading]=useState(false);
const [aiReviewComplete,setAiReviewComplete]=useState(true);
useEffect(()=>{
  function closeTransientPanels(event){
    if(notificationRef.current && !notificationRef.current.contains(event.target)) setNotificationOpen(false);
    if(workspaceRef.current && !workspaceRef.current.contains(event.target)) setWorkspaceOpen(false);
    if(profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
  }
  function closeOnEscape(event){
    if(event.key==="Escape"){
      setNotificationOpen(false); setWorkspaceOpen(false); setProfileOpen(false); setSearch(false);
    }
  }
  document.addEventListener("pointerdown",closeTransientPanels);
  document.addEventListener("keydown",closeOnEscape);
  return ()=>{
    document.removeEventListener("pointerdown",closeTransientPanels);
    document.removeEventListener("keydown",closeOnEscape);
  };
},[]);

useEffect(()=>localStorage.setItem("bl-theme",theme),[theme]);
useEffect(()=>sessionStorage.setItem("bl-page",page),[page]);
useEffect(()=>{if(toast){let t=setTimeout(()=>setToast(""),3000);return()=>clearTimeout(t)}},[toast]);

async function refreshSavedDrafts(){
  if(!authenticated || refreshInFlightRef.current) return;
  refreshInFlightRef.current=true;
  setLoadingSavedDrafts(true);
  try {
    const response = await api.listDrafts();
    const items = Array.isArray(response) ? response : (response?.results || response?.drafts || []);
    setSavedDrafts(items);
  } catch(error) {
    console.error("Could not load saved drafts:", error);
  } finally {
    refreshInFlightRef.current=false;
    setLoadingSavedDrafts(false);
  }
}

useEffect(()=>{
  if(!authenticated) return;
  const refreshIfVisible=()=>{ if(document.visibilityState==="visible") refreshSavedDrafts(); };
  const timer=window.setInterval(refreshIfVisible,4000);
  window.addEventListener("focus",refreshIfVisible);
  document.addEventListener("visibilitychange",refreshIfVisible);
  return ()=>{
    window.clearInterval(timer);
    window.removeEventListener("focus",refreshIfVisible);
    document.removeEventListener("visibilitychange",refreshIfVisible);
  };
},[authenticated]);

function toggleDraftSelection(id){
  setSelectedDraftIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
}

function selectableDrafts(items=savedDrafts){
  return items.filter(item => item.status !== "approved");
}

function selectAllVisibleDrafts(items){
  const ids = selectableDrafts(items).map(item => item.id);
  setSelectedDraftIds(current => ids.every(id => current.includes(id)) && ids.length ? current.filter(id => !ids.includes(id)) : [...new Set([...current, ...ids])]);
}

async function deleteSelectedDrafts(deleteAll=false){
  if(!authenticated || deletingDrafts) return;
  const targets = deleteAll ? selectableDrafts(savedDrafts) : savedDrafts.filter(item => selectedDraftIds.includes(item.id) && item.status !== "approved");
  if(!targets.length){ setToast("Select at least one non-approved draft to delete."); return; }
  const approvedCount = savedDrafts.filter(item => item.status === "approved").length;
  const message = deleteAll
    ? `Delete all ${targets.length} non-approved draft(s)? Approved drafts (${approvedCount}) are protected. This permanently removes their versions, findings, and decision history.`
    : `Delete ${targets.length} selected draft(s)? Approved drafts are protected. This permanently removes the selected drafts and their versions, findings, and decision history.`;
  if(!window.confirm(message)) return;
  setDeletingDrafts(true);
  let deleted = 0;
  const errors = [];
  const deletedIds = new Set();
  try {
    for(const item of targets){
      try { await api.deleteDraft(item.id); deleted += 1; deletedIds.add(item.id); }
      catch(error){ errors.push(`${item.title || `Draft ${item.id}`}: ${error.message || "Delete failed"}`); }
    }
    setSelectedDraftIds(current => current.filter(id => !deletedIds.has(id)));
    if(backendDraftId != null && deletedIds.has(Number(backendDraftId))){
      setBackendDraftId(null); sessionStorage.removeItem("bl-last-draft-id");
      setDraft(""); setTitle("Untitled campaign draft"); setFindings([]); setResolved([]); setActive(null); setDecision(""); setStatus("Not reviewed");
      setPage("overview"); sessionStorage.setItem("bl-page", "overview");
    }
    await refreshSavedDrafts();
    setToast(errors.length ? `${deleted} draft(s) deleted; ${errors.length} could not be deleted.` : `${deleted} draft(s) deleted.`);
    if(errors.length) console.warn("Some drafts could not be deleted:", errors);
  } finally { setDeletingDrafts(false); }
}

useEffect(()=>{
  if(!authenticated) return;
  let cancelled = false;
  setKnowledgeLoading(true);
  setKnowledgeError("");
  api.knowledge(selectedBrandId || null)
    .then(data => { if(!cancelled) setKnowledgeData({facts:Array.isArray(data?.facts)?data.facts:[],rules:Array.isArray(data?.rules)?data.rules:[]}); })
    .catch(error => { if(!cancelled) setKnowledgeError(error.message || "Could not load brand knowledge."); })
    .finally(() => { if(!cancelled) setKnowledgeLoading(false); });
  async function loadWorkspace(){
    try {
      const response = await api.listDrafts();
      const items = Array.isArray(response) ? response : (response?.results || response?.drafts || []);
      if(!cancelled) setSavedDrafts(items);
    } catch(error) {
      console.error("Could not load saved drafts:", error);
    }

    const savedId = sessionStorage.getItem("bl-last-draft-id");
    const savedPage = sessionStorage.getItem("bl-page");
    if(savedId && savedPage === "reviews"){
      try {
        const saved = await api.getDraft(savedId);
        if(cancelled) return;
        setBackendDraftId(saved.id);
        setAiReviewComplete(saved.ai_review_complete !== false);
        setTitle(saved.title || "Untitled campaign draft");
        setDraft(saved.content || "");
        setCampaign("Saved campaign");
        const list = mapBackendFindings(saved.findings);
        setFindings(list);
        setActive(list[0]?.id || null);
        setResolved(list.filter(f => f.state === "dismissed").map(f => f.id));
        setStatus(saved.status === "approved" ? "Approved" : saved.status === "rejected" ? "Rejected" : saved.status === "changes_requested" ? "Changes requested" : saved.status === "ready_for_client_review" ? "Ready for client review" :
          list.some(f => f.state === "open" || f.state === "acknowledged") ? "Changes requested" : "Ready for review");
        setPage("reviews");
      } catch(error) {
        console.error("Could not restore the last draft:", error);
        if(!cancelled) {
          sessionStorage.removeItem("bl-last-draft-id");
          setBackendDraftId(null);
        }
      }
    }
  }
  api.listBrands().then(items=>{
    if(cancelled) return;
    const loadedBrands = Array.isArray(items) ? items : [];
    setBrands(loadedBrands);
    const selectedExists = loadedBrands.some(brand => String(brand.id) === String(selectedBrandId));
    if(!selectedExists){
      const nextBrandId = loadedBrands.length ? String(loadedBrands[0].id) : "";
      setSelectedBrandId(nextBrandId);
      if(nextBrandId) sessionStorage.setItem("bl-brand-id", nextBrandId);
      else sessionStorage.removeItem("bl-brand-id");
    }
    const guidelineExists = loadedBrands.some(brand => String(brand.id) === String(guidelineBrandId));
    if(!guidelineExists){
      const nextGuidelineBrandId = loadedBrands.length ? String(loadedBrands[0].id) : "";
      setGuidelineBrandId(nextGuidelineBrandId);
      if(nextGuidelineBrandId) sessionStorage.setItem("bl-guideline-brand-id", nextGuidelineBrandId);
      else sessionStorage.removeItem("bl-guideline-brand-id");
    }
  }).catch(error=>console.error("Could not load brands:",error));
  loadWorkspace();
  return ()=>{cancelled = true;};
},[authenticated,selectedBrandId]);

useEffect(()=>{
  if(authenticated && page==="guidelines" && guidelineBrandId){
    reloadKnowledge(guidelineBrandId);
  }
},[page,guidelineBrandId,authenticated]);

async function reloadKnowledge(brandId=guidelineBrandId){
  setGuidelineKnowledgeLoading(true);
  try { const data=await api.knowledge(brandId||null); setGuidelineKnowledgeData({facts:Array.isArray(data?.facts)?data.facts:[],rules:Array.isArray(data?.rules)?data.rules:[]}); setGuidelineKnowledgeError(""); }
  catch(error){setGuidelineKnowledgeError(error.message||"Could not load brand guidelines.");}
  finally {setGuidelineKnowledgeLoading(false);}
}
async function addBrand(){
  if(!brandNameInput.trim()) return setToast("Enter a brand name first.");
  try { const brand=await api.createBrand(brandNameInput.trim()); const next=[...brands,brand];setBrands(next);setSelectedBrandId(String(brand.id));sessionStorage.setItem("bl-brand-id",String(brand.id));setBrandNameInput("");setToast("Brand created."); }
  catch(error){setToast(error.message||"Could not create brand.");}
}
async function saveGuideline(){
  if(!guidelineBrandId) return setToast("Select a brand first.");
  try { if(editingGuidelineId) await api.updateGuideline(editingGuidelineId,guidelineForm); else await api.createGuideline({...guidelineForm,brand:Number(guidelineBrandId)}); setGuidelineForm({code:"",phrase:"",replacement:"",explanation:"",source:"Brand style guide"});setEditingGuidelineId(null);await reloadKnowledge();setToast("Guideline saved."); }
  catch(error){setToast(error.message||"Could not save guideline.");}
}
async function loadCreatorChanges(id=changeDraftId){
  if(!id) return setToast("Select a draft first.");
  setChangesLoading(true);
  try {const data=await api.getDraftChanges(id);setDraftChanges(data);setIncludedChangeIndexes((data.changes||[]).map(c=>c.index));setChangeDraftId(String(id));}
  catch(error){setToast(error.message||"Could not load creator changes.");}
  finally{setChangesLoading(false);}
}
async function applySelectedChanges(){
  if(!changeDraftId||!draftChanges) return;
  try {const result=await api.applyDraftChanges(changeDraftId,includedChangeIndexes);setSavedDrafts(items=>items.map(item=>item.id===result.id?result:item));setDraftChanges(null);setToast("Selected creator changes applied to the draft and saved as a new version.");await refreshSavedDrafts();}
  catch(error){setToast(error.message||"Could not apply selected changes.");}
}
const activeFinding=findings.find(f=>f.id===active),open=findings.filter(f=>!resolved.includes(f.id)),completion=findings.length?Math.round(resolved.length/findings.length*100):0;
const selectedBrandName=brands.find(b=>String(b.id)===String(selectedBrandId))?.name || "Select a brand";

async function login(e){
  e.preventDefault();
  setLoginBusy(true);
  setLoginError("");
  try {
    const loginData = await api.login(loginUsername.trim(), loginPassword);
    const username = loginData.username || loginUsername.trim();
    setCurrentUsername(username);
    setIsStaff(Boolean(loginData.is_staff));
    sessionStorage.setItem("bl-username", username);
    sessionStorage.setItem("bl-is-staff", String(Boolean(loginData.is_staff)));
    setAuthenticated(true);
    setLoginPassword("");

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
  sessionStorage.removeItem("bl-username");
  sessionStorage.removeItem("bl-is-staff");
  setLoginUsername("");
  setLoginPassword("");
  setLoginError("");
  setComment("");
  setPage("overview");
  sessionStorage.removeItem("bl-page");
  setBackendDraftId(null);
  setFindings([]);
  setResolved([]);
  setActive(null);
  setDecision("");
  setStatus("Not reviewed");

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
    let result;
    if(isStaff){
      if(!backendDraftId) { setToast("Choose a submitted draft before running a reviewer analysis."); return; }
      result = await api.reviewDraft(backendDraftId);
      result = {...result, findings:(result.findings||[]).map((f,index)=>({...f,id:`review-${index+1}`,state:"open"}))};
    } else {
      result = backendDraftId
        ? await api.revise(backendDraftId, draft)
        : await api.createDraft({title, content: draft, brand: selectedBrandId || null});
      if (result?.id != null) { setBackendDraftId(result.id); sessionStorage.setItem("bl-last-draft-id", String(result.id)); }
      await refreshSavedDrafts();
    }
    setAiReviewComplete(result?.ai_review_complete !== false);
    const list = mapBackendFindings(result?.findings);
    setFindings(list);
    setActive(list[0]?.id || null);
    setResolved(list.filter(f => f.state === "dismissed").map(f => f.id));
    setStatus(list.some(f => f.state === "open") ? "Changes requested" : "Ready for review");

    if(!isStaff){
      setVersions(v => [
        ...v,
        {
          name: `Version ${v.length + 1}`,
          text: draft,
          time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})
        }
      ]);
    }
    setToast(`${list.length} finding${list.length === 1 ? "" : "s"} returned by the ${isStaff?"read-only reviewer analysis":"backend review"}. The draft was not changed by review.`);
  } catch (error) {

    setToast(error.message || "Could not save the draft to the backend.");
  } finally {
    setBusy(false);
  }
}

async function apply(f){
  // APIs may name the replacement field differently across older responses.
  const rawSuggestion = f.suggestion ?? f.replacement ?? f.suggested_replacement ?? f.replacement_text;
  const suggestion = typeof rawSuggestion === "string" ? rawSuggestion.trim() : "";
  const target = typeof f.excerpt === "string" && f.excerpt.trim()
    ? f.excerpt.trim()
    : (typeof f.term === "string" ? f.term.trim() : "");

  if (!suggestion || /^human review required$/i.test(suggestion)) {
    setToast("This finding has no approved replacement text. No text was changed.");
    return;
  }

  const instructionLike = /^(please\s+)?(remove|delete|replace|rewrite|change|avoid|describe|explain|ask|consider|ensure|make sure|try|substantiate)\b/i.test(suggestion)
    || /^(this|the) (phrase|claim|text|sentence|wording)\b/i.test(suggestion)
    || /\bapproved wording\b/i.test(suggestion);
  if (instructionLike) {
    setToast("This finding contains reviewer instructions, not replacement copy. No text was changed.");
    return;
  }

  // Prefer exact matching. If the backend excerpt differs only in spacing or
  // capitalization, find that same excerpt without touching surrounding text.
  let start = target ? draft.indexOf(target) : -1;
  let end = start >= 0 ? start + target.length : -1;
  if (start < 0 && target) {
    const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    const match = new RegExp(escaped, "i").exec(draft);
    if (match) { start = match.index; end = start + match[0].length; }
  }
  if (start < 0 || end < start) {
    setToast("The flagged excerpt could not be matched to the current draft. Run the review again; no text was changed.");
    return;
  }

  const t = draft.slice(0, start) + suggestion + draft.slice(end);
  if (t === draft) {
    setToast("The suggested replacement is identical to the existing text. No change was made.");
    return;
  }

  setBusy(true);
  try {
    // Save first. Only update the editor after the backend accepts the revision.
    if (backendDraftId && authenticated) {
      const result = await api.revise(backendDraftId, t);
      setAiReviewComplete(result?.ai_review_complete !== false);
      const list = mapBackendFindings(result?.findings);
      setDraft(t);
      setVersions(v => [
        ...v,
        {
          name: `Version ${v.length + 1}`,
          text: t,
          time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})
        }
      ]);
      setFindings(list);
      setActive(list[0]?.id || null);
      setResolved(list.filter(x => x.state === "dismissed").map(x => x.id));
      setStatus(list.some(x => x.state === "open" || x.state === "acknowledged") ? "Changes requested" : "Ready for review");
      await refreshSavedDrafts();
      setToast("Suggestion applied. Revision saved and content reviewed again.");
      return;
    }

    // Local/demo mode: apply only the exact excerpt and retain local history.
    setDraft(t);
    setVersions(v => [
      ...v,
      {
        name: `Version ${v.length + 1}`,
        text: t,
        time: new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})
      }
    ]);
    setResolved(a => [...new Set([...a, f.id])]);
    setToast("Suggestion applied to the local draft. Run a review to verify the result.");
  } catch (error) {
    setToast(`Suggestion was not applied because saving failed: ${error.message}`);
  } finally {
    setBusy(false);
  }
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
  if (!backendDraftId || !authenticated) {
    setToast("Save and review this draft with the backend before recording a reviewer decision.");
    return;
  }
  if (d !== "approved" && !comment.trim()) {
    setToast("Add a reviewer comment before rejecting or requesting changes.");
    return;
  }
  try {
    const result = d === "approved"
      ? await api.approve(backendDraftId, comment)
      : await api.draftDecision(backendDraftId, d === "rejected" ? "rejected" : "changes_requested", comment);
    setDecision(d);
    setStatus(d === "approved" ? "Approved" : d === "rejected" ? "Rejected" : "Changes requested");
    if (result?.status) {
      setSavedDrafts(items => items.map(item => item.id === result.id ? result : item));
    }
    await refreshSavedDrafts();
    setToast(d === "approved" ? "Approval saved to the backend." : "Reviewer decision saved to the audit trail.");
  } catch (error) {
    setToast(error.message || (d === "approved" ? "Approval failed. Resolve all findings first." : "Could not save the reviewer decision."));
  }
}

async function submitCompletedReview(){
  if(isStaff || !backendDraftId || !authenticated){
    setToast("Open and save a draft before sending completed work to the Reviewer.");
    return;
  }
  if(!draft.trim()){
    setToast("Add content before submitting the completed review.");
    return;
  }
  setBusy(true);
  try {
    // Save the latest text and refresh findings before handing the corrected version back to the client.
    const reviewed = await api.revise(backendDraftId, draft);
    const submitted = await api.submitCompletedReview(backendDraftId);
    const list = mapBackendFindings(reviewed?.findings || submitted?.findings);
    setFindings(list);
    setActive(list[0]?.id || null);
    setResolved(list.filter(f => f.state === "dismissed").map(f => f.id));
    setStatus("Ready for client review");
    setDecision("");
    await refreshSavedDrafts();
    setToast("Completed review sent to the Reviewer. The client can now inspect the corrected draft.");
  } catch(error) {
    setToast(error.message || "Could not send the completed review to the Reviewer.");
  } finally {
    setBusy(false);
  }
}

async function openSavedDraft(id){
  try {
    const saved = await api.getDraft(id);
    setBackendDraftId(saved.id);
    setAiReviewComplete(saved.ai_review_complete !== false);
    sessionStorage.setItem("bl-last-draft-id", String(saved.id));
    setTitle(saved.title || "Untitled campaign draft");
    setDraft(saved.content || "");
    setCampaign("Saved campaign");
    const list = mapBackendFindings(saved.findings);
    setFindings(list);
    setActive(list[0]?.id || null);
    setResolved(list.filter(f => f.state === "dismissed").map(f => f.id));
    setStatus(saved.status === "approved" ? "Approved" : saved.status === "rejected" ? "Rejected" : saved.status === "changes_requested" ? "Changes requested" : saved.status === "ready_for_client_review" ? "Ready for client review" : saved.status === "in_review" ? "Awaiting review" :
      list.some(f => f.state === "open" || f.state === "acknowledged") ? "Changes requested" : "Ready for review");
    setDecision("");
    setPage("reviews");
    sessionStorage.setItem("bl-page", "reviews");
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
  setAiReviewComplete(true);
  sessionStorage.removeItem("bl-last-draft-id");
  setStatus("Not reviewed");
  setDecision("");
  setPage("reviews");
}

useEffect(()=>{
  if(!authenticated || isStaff || backendDraftId==null) return;
  const current=savedDrafts.find(item=>String(item.id)===String(backendDraftId));
  if(!current) return;
  setStatus(current.status === "approved" ? "Approved" : current.status === "rejected" ? "Rejected" : current.status === "changes_requested" ? "Changes requested" : current.status === "in_review" ? "Awaiting review" : "Not reviewed");
  const latest=latestReviewerDecision(current);
  if(latest) setDecision(latest.action);
},[savedDrafts,authenticated,isStaff,backendDraftId]);

const allFindings = savedDrafts.flatMap(item => Array.isArray(item.findings) ? item.findings : []).filter(item => item.state !== "obsolete");
const allDecisions = savedDrafts.flatMap(item => Array.isArray(item.decisions) ? item.decisions.map(decisionItem => ({...decisionItem,draftTitle:item.title,draftId:item.id})) : []);
const findingCounts = allFindings.reduce((counts,item) => { const key=item.kind || "other"; counts[key]=(counts[key]||0)+1; return counts; },{});
const topFindingPatterns = Object.entries(findingCounts).sort((a,b)=>b[1]-a[1]).slice(0,3);
const auditEvents = savedDrafts.flatMap(item => [
  ...(Array.isArray(item.decisions)?item.decisions.map(event=>({...event,draftTitle:item.title,draftId:item.id,eventType:"decision"})):[]),
  ...(Array.isArray(item.versions)?item.versions.map(event=>({id:`version-${item.id}-${event.version}`,action:`version_${event.version}`,comment:`Version ${event.version ?? "unknown"} saved`,actor_name:event.editor_name,created_at:event.created_at,draftTitle:item.title,draftId:item.id,eventType:"version"})):[]),
]).sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
const notifications = (isStaff
  ? savedDrafts.filter(item => item.status === "in_review").map(item => ({
      id: `review-${item.id}-${item.updated_at || item.created_at || "new"}`,
      draftId: item.id,
      draftTitle: item.title || `Draft ${item.id}`,
      title: "Draft awaiting review",
      detail: `Submitted by ${item.author_name || "a creator"}. Open to review the content and findings.`,
      created_at: item.updated_at || item.created_at,
    }))
  : savedDrafts.flatMap(item => (Array.isArray(item.decisions) ? item.decisions : [])
      .filter(event => ["approved", "rejected", "changes_requested"].includes(event.action))
      .map(event => ({
        id: `decision-${item.id}-${event.id}`,
        draftId: item.id,
        draftTitle: item.title || `Draft ${item.id}`,
        title: event.action === "approved" ? "Draft approved" : event.action === "rejected" ? "Draft rejected" : "Changes requested",
        detail: event.comment || (event.action === "approved" ? "The reviewer approved this draft." : event.action === "rejected" ? "The reviewer rejected this draft." : "The reviewer asked you to revise this draft."),
        created_at: event.created_at,
      }))))
  .sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
const unreadNotifications = notifications.filter(note => !readNotificationIds.includes(note.id));
const notificationStorageKey = `bl-notifications-read:${currentUsername || "guest"}:${isStaff ? "reviewer" : "creator"}`;
function markNotificationRead(id) {
  setReadNotificationIds(current => {
    const next = current.includes(id) ? current : [...current, id];
    sessionStorage.setItem(notificationStorageKey, JSON.stringify(next));
    return next;
  });
}
function markAllNotificationsRead() {
  const next = notifications.map(note => note.id);
  sessionStorage.setItem(notificationStorageKey, JSON.stringify(next));
  setReadNotificationIds(next);
}
function openNotification(note) {
  markNotificationRead(note.id);
  setNotificationOpen(false);
  openSavedDraft(note.draftId);
}
useEffect(() => {
  const key = `bl-notifications-read:${currentUsername || "guest"}:${isStaff ? "reviewer" : "creator"}`;
  try { setReadNotificationIds(JSON.parse(sessionStorage.getItem(key) || "[]")); }
  catch { setReadNotificationIds([]); }
}, [currentUsername, isStaff]);

useEffect(()=>{
  if(!authenticated || !isStaff || page!=="reviews" || backendDraftId==null) return;
  let cancelled=false;
  let detailRequest=false;
  async function refreshOpenReview(){
    if(detailRequest || document.visibilityState!=="visible") return;
    detailRequest=true;
    try{
      const saved=await api.getDraft(backendDraftId);
      if(cancelled) return;
      setAiReviewComplete(saved.ai_review_complete !== false);
      setTitle(saved.title || "Untitled campaign draft");
      setDraft(saved.content || "");
      const list=mapBackendFindings(saved.findings);
      setFindings(list);
      setActive(current=>list.some(item=>item.id===current)?current:(list[0]?.id||null));
      setResolved(list.filter(item=>item.state==="dismissed").map(item=>item.id));
      setStatus(saved.status === "approved" ? "Approved" : saved.status === "rejected" ? "Rejected" : saved.status === "changes_requested" ? "Changes requested" : saved.status === "ready_for_client_review" ? "Ready for client review" : saved.status === "in_review" ? "Awaiting review" : list.some(item=>item.state==="open"||item.state==="acknowledged") ? "Changes requested" : "Ready for review");
      const latest=latestReviewerDecision(saved);
      if(latest) setDecision(latest.action);
    }catch(error){ console.error("Could not refresh the open review:",error); }
    finally{ detailRequest=false; }
  }
  refreshOpenReview();
  const timer=window.setInterval(refreshOpenReview,4000);
  window.addEventListener("focus",refreshOpenReview);
  return ()=>{cancelled=true;window.clearInterval(timer);window.removeEventListener("focus",refreshOpenReview);};
},[authenticated,isStaff,page,backendDraftId]);

const visibleNav = navigationForRole(isStaff);
const titlePage=visibleNav.find(n=>n[0]===page)?.[1]||"Overview";

useEffect(()=>{
  const allowed = navigationForRole(isStaff).some(([id]) => id === page);
  if (!allowed) {
    setPage("overview");
    sessionStorage.setItem("bl-page", "overview");
  }
}, [isStaff, page]);

if (!authenticated) {
  return <div className={`app theme-${theme}`} style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"24px",background:"#0b0e14",color:"#f4f5f7"}}>
    <form onSubmit={login} style={{width:"min(460px,100%)",boxSizing:"border-box",padding:"32px",borderRadius:"18px",background:"#151923",border:"1px solid #2b3140",boxShadow:"0 24px 80px rgba(0,0,0,.35)"}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px",marginBottom:"24px"}}>
        <span style={{display:"grid",placeItems:"center",width:"44px",height:"44px",borderRadius:"12px",background:"#242b3b",color:"#b6c8ff"}}><ShieldCheck size={24}/></span>
        <span><strong style={{display:"block",fontSize:"22px"}}>BrandLedger</strong><small style={{color:"#9ba4b8",letterSpacing:"1.4px"}}>BRAND GOVERNANCE</small></span>
      </div>
      <h1 style={{fontSize:"26px",margin:"0 0 8px"}}>Sign in to your workspace</h1>
      <p style={{color:"#a7afc0",lineHeight:1.5,margin:"0 0 18px"}}>Use your Django account to review and save campaign drafts.</p>
      <section aria-label="Judge demo accounts" style={{padding:"14px",marginBottom:"22px",borderRadius:"12px",border:"1px solid #394258",background:"#10141d"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"10px",marginBottom:"12px"}}>
          <strong style={{fontSize:"13px",color:"#f4f5f7"}}>Judge demo accounts</strong>
          <span style={{fontSize:"10px",letterSpacing:".8px",color:"#9ba4b8"}}>DEMO ACCESS</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:"10px"}}>
          <div style={{padding:"11px",borderRadius:"9px",border:"1px solid #2d3546",background:"#171c27"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px",marginBottom:"7px"}}>
              <strong style={{fontSize:"12px",color:"#b6c8ff"}}>Content Creator</strong>
              <button type="button" onClick={()=>{setLoginUsername("creator");setLoginPassword("creat@12345#");setLoginError("")}} style={{border:"1px solid #46516a",borderRadius:"7px",padding:"5px 9px",background:"#242b3b",color:"#f4f5f7",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>Use creator login</button>
            </div>
            <div style={{fontSize:"12px",lineHeight:1.8,color:"#c3c9d6"}}>Username: <code style={{color:"#fff"}}>creator</code><br/>Password: <code style={{color:"#fff",overflowWrap:"anywhere"}}>creat@12345#</code></div>
          </div>
          <div style={{padding:"11px",borderRadius:"9px",border:"1px solid #2d3546",background:"#171c27"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px",marginBottom:"7px"}}>
              <strong style={{fontSize:"12px",color:"#b6c8ff"}}>Brand Reviewer</strong>
              <button type="button" onClick={()=>{setLoginUsername("reviewer");setLoginPassword("review@12345#");setLoginError("")}} style={{border:"1px solid #46516a",borderRadius:"7px",padding:"5px 9px",background:"#242b3b",color:"#f4f5f7",fontSize:"11px",fontWeight:700,cursor:"pointer"}}>Use reviewer login</button>
            </div>
            <div style={{fontSize:"12px",lineHeight:1.8,color:"#c3c9d6"}}>Username: <code style={{color:"#fff"}}>reviewer</code><br/>Password: <code style={{color:"#fff",overflowWrap:"anywhere"}}>review@12345#</code></div>
          </div>
        </div>
        <p style={{fontSize:"10px",lineHeight:1.5,color:"#8992a5",margin:"10px 0 0"}}>Shared demonstration credentials for judges. Select a role to fill the sign-in form.</p>
      </section>
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

<aside className={`sidebar ${mobile?"mobile":""}`}><div className="logo" role="button" tabIndex={0} aria-label="Go to BrandLedger overview" onClick={()=>{setPage("overview");setMobile(false);setWorkspaceOpen(false)}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setPage("overview");setMobile(false);setWorkspaceOpen(false)}}} style={{cursor:"pointer"}}>
  <span className="logo-mark"><ShieldCheck size={21}/></span>
  <span className="logo-type">BrandLedger<small>BRAND GOVERNANCE</small></span>
  <button className="close-mobile" onClick={e=>{e.stopPropagation();setMobile(false)}}><X size={17}/></button>
</div>
<div ref={workspaceRef} style={{position:"relative",marginBottom:"4px"}}>
  <button className="workspace" aria-expanded={workspaceOpen} onClick={()=>{setWorkspaceOpen(v=>!v);setProfileOpen(false);setNotificationOpen(false)}} style={{width:"100%"}}>
    <b style={{display:"grid",placeItems:"center",fontSize:"16px",fontWeight:800,background:"linear-gradient(145deg,#b6c8ff,#7f98e8)",color:"#111827",boxShadow:"0 3px 10px rgba(127,152,232,.25)"}}>{selectedBrandName !== "Select a brand" ? selectedBrandName.charAt(0).toUpperCase() : "B"}</b>
    <span style={{minWidth:0,flex:1,textAlign:"left"}}><strong>{selectedBrandName}</strong><small>Selected workspace</small></span>
    <span style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"10px",fontWeight:700,color:"#8ee0b1",whiteSpace:"nowrap"}}><i style={{width:"6px",height:"6px",borderRadius:"50%",background:"#5bd49a",display:"inline-block"}}/> {selectedBrandName !== "Select a brand" ? "ACTIVE" : "SELECT BRAND"}</span>
    <ChevronDown size={15} style={{transform:workspaceOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .18s"}}/>
  </button>
  {workspaceOpen&&<div role="dialog" aria-label="Brand workspace panel" style={{position:"absolute",zIndex:40,top:"calc(100% + 8px)",left:0,right:0,minWidth:"245px",padding:"14px",borderRadius:"14px",border:"1px solid #343a49",background:"linear-gradient(155deg,#1a2030,#11151e)",boxShadow:"0 18px 42px rgba(0,0,0,.42)"}}>
    <div style={{display:"flex",alignItems:"center",gap:"10px",paddingBottom:"12px",borderBottom:"1px solid #303748"}}>
      <span style={{display:"grid",placeItems:"center",width:"42px",height:"42px",borderRadius:"12px",background:"linear-gradient(145deg,#b6c8ff,#7f98e8)",color:"#111827",fontWeight:900,fontSize:"20px"}}>{selectedBrandName !== "Select a brand" ? selectedBrandName.charAt(0).toUpperCase() : "B"}</span>
      <span style={{flex:1,minWidth:0}}><strong style={{display:"block",fontSize:"14px"}}>{selectedBrandName}</strong><small style={{display:"block",marginTop:"3px",color:"#9da8bd"}}>Brand governance workspace</small></span>
      <span title="Selected workspace" style={{width:"8px",height:"8px",borderRadius:"50%",background:"#5bd49a",boxShadow:"0 0 0 4px rgba(91,212,154,.12)"}}/>
    </div>
    <div style={{display:"flex",gap:"8px",margin:"12px 0"}}><div style={{flex:1,padding:"9px",borderRadius:"9px",background:"rgba(255,255,255,.045)"}}><small style={{display:"block",fontSize:"10px",color:"#9da8bd"}}>WORKSPACE</small><b style={{display:"block",fontSize:"12px",marginTop:"4px"}}>Brand governance</b></div></div>
    <small style={{display:"block",fontSize:"10px",fontWeight:800,letterSpacing:"1px",color:"#8d98ae",margin:"2px 0 6px"}}>WORKSPACE SHORTCUTS</small>
    {[
      ["Claims ledger",Layers3,"claims","Review approved product facts"],
      ["Brand guidelines",BookOpen,"guidelines","View rules and voice"],
      ["Guideline insights",Lightbulb,"insights","Explore recurring patterns"]
    ].filter(([label])=>isStaff || label==="Brand guidelines").map(([label,Icon,target,desc])=><button key={target} role="menuitem" onClick={()=>{setPage(target);setWorkspaceOpen(false);setMobile(false)}} style={{display:"flex",alignItems:"center",gap:"9px",width:"100%",textAlign:"left",padding:"9px 8px",border:0,borderRadius:"8px",background:"transparent",color:"inherit",cursor:"pointer"}}>
      <span style={{display:"grid",placeItems:"center",width:"30px",height:"30px",borderRadius:"8px",background:"rgba(182,200,255,.09)",color:"#b6c8ff"}}><Icon size={15}/></span>
      <span style={{flex:1,minWidth:0}}><b style={{display:"block",fontSize:"12px"}}>{label}</b><small style={{display:"block",fontSize:"10px",marginTop:"2px",color:"#9da8bd"}}>{desc}</small></span>
      <ChevronDown size={13} style={{transform:"rotate(-90deg)",color:"#8792a9"}}/>
    </button>)}
<div style={{ marginTop: 12 }}>
  <label
    htmlFor="workspace-brand-selector"
    style={{
      display: "block",
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: "1px",
      color: "#8d98ae",
      marginBottom: 7,
    }}
  >
    SWITCH WORKSPACE
  </label>

  <select
    id="workspace-brand-selector"
    value={selectedBrandId}
    onChange={(e) => {
      const brandId = e.target.value;

      setSelectedBrandId(brandId);
      sessionStorage.setItem("bl-brand-id", brandId);

      // Keep the Brand Guidelines page aligned with the workspace.
      setGuidelineBrandId(brandId);
      sessionStorage.setItem("bl-guideline-brand-id", brandId);

      setWorkspaceOpen(false);
      setToast(
        `Workspace switched to ${
          brands.find((brand) => String(brand.id) === brandId)?.name
          || "selected brand"
        }.`
      );
    }}
    style={{
      width: "100%",
      padding: 10,
      border: "1px solid #3b4356",
      borderRadius: 9,
      background: "#171c27",
      color: "#dce3f3",
      fontSize: 12,
    }}
  >
    <option value="">Select a workspace</option>

    {brands.map((brand) => (
      <option key={brand.id} value={String(brand.id)}>
        {brand.name}
      </option>
    ))}
  </select>

  <small
    style={{
      display: "block",
      marginTop: 7,
      color: "#9da8bd",
      fontSize: 10,
    }}
  >
    Select a brand to update your workspace.
  </small>
</div>
  </div>}
</div><div className="nav-label">WORKSPACE</div>{visibleNav.filter(([id])=>["overview","reviews"].includes(id)).map(([id,label,Icon])=><button key={id} className={`nav-item ${page===id?"active":""}`} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={17}/>{label}</button>)}{visibleNav.some(([id])=>!["overview","reviews"].includes(id))&&<><div className="nav-label spaced">{isStaff?"GOVERNANCE":"REFERENCE"}</div>{visibleNav.filter(([id])=>!["overview","reviews"].includes(id)).map(([id,label,Icon])=><button key={id} className={`nav-item ${page===id?"active":""}`} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={17}/>{label}</button>)}</>}<div className="sidebar-bottom"><div className="secure-note"><LockKeyhole size={15}/><span><b>Human-led review</b><small>Nothing publishes automatically.</small></span></div></div></aside>

{mobile&&<button className="scrim" onClick={()=>setMobile(false)} aria-label="Close navigation"/>}

<main className="main"><header className="topbar"><div className="crumb"><button className="mobile-menu" onClick={()=>setMobile(true)}><Menu size={18}/></button><span>BrandLedger</span><ChevronRight size={13}/><b>{titlePage}</b></div><div className="top-actions"><button className="search" onClick={()=>setSearch(true)}><Search size={15}/><span>Search anything</span><kbd><Command size={10}/> K</kbd></button><button className="icon-btn" title="Toggle theme" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}>{theme==="dark"?<Sun size={17}/>:<Moon size={17}/>}</button><NotificationMenu rootRef={notificationRef} isStaff={isStaff} open={notificationOpen} setOpen={(next)=>{setNotificationOpen(typeof next==="function"?next(notificationOpen):next);setWorkspaceOpen(false);setProfileOpen(false)}} notifications={notifications} unreadCount={unreadNotifications.length} readIds={readNotificationIds} onMarkAllRead={markAllNotificationsRead} onOpenNotification={openNotification} onRefresh={refreshSavedDrafts}/><div ref={profileRef} style={{position:"relative",display:"flex",alignItems:"center"}}><button type="button" aria-haspopup="menu" aria-expanded={profileOpen} onClick={()=>{setProfileOpen(v=>!v);setWorkspaceOpen(false);setNotificationOpen(false)}} style={{display:"flex",alignItems:"center",gap:"9px",padding:"5px 9px 5px 5px",border:"1px solid var(--border, #30394b)",background:"var(--panel, #171c27)",borderRadius:"12px",color:"inherit",cursor:"pointer",minHeight:"42px"}}><span className="avatar">{(currentUsername||"BL").slice(0,2).toUpperCase()}</span><span style={{display:"flex",flexDirection:"column",textAlign:"left",lineHeight:1.2}}><strong style={{fontSize:"11px",maxWidth:"100px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUsername||"Signed-in user"}</strong><small style={{fontSize:"10px",opacity:.7,marginTop:"3px"}}>{isStaff?"Brand reviewer":"Content creator"}</small></span><ChevronDown size={14}/></button>{profileOpen&&<><div role="menu" style={{position:"absolute",right:0,top:"calc(100% + 9px)",zIndex:80,width:"230px",padding:"10px",border:"1px solid var(--border, #30394b)",background:"var(--panel, #171c27)",borderRadius:"14px",boxShadow:"0 20px 50px rgba(0,0,0,.35)",color:"inherit"}}><div style={{display:"flex",alignItems:"center",gap:"10px",padding:"8px 7px 12px",borderBottom:"1px solid var(--border, #30394b)",marginBottom:"7px"}}><span className="avatar">{(currentUsername||"BL").slice(0,2).toUpperCase()}</span><span style={{minWidth:0}}><strong style={{display:"block",fontSize:"12px",overflowWrap:"anywhere"}}>{currentUsername||"Signed-in user"}</strong><small style={{display:"block",fontSize:"10px",opacity:.7,marginTop:"4px"}}>{isStaff?"Brand reviewer":"Content creator"}</small></span></div><button role="menuitem" onClick={()=>{setProfileOpen(false);setToast("You're signed in as "+(currentUsername||"user")+".")}} style={{display:"flex",alignItems:"center",gap:"9px",width:"100%",padding:"10px",border:0,borderRadius:"8px",background:"transparent",color:"inherit",textAlign:"left",cursor:"pointer",fontSize:"12px"}}><ShieldCheck size={15}/> Account information</button><button role="menuitem" onClick={()=>{setProfileOpen(false);logout()}} style={{display:"flex",alignItems:"center",gap:"9px",width:"100%",padding:"10px",border:0,borderRadius:"8px",background:"transparent",color:"#e87989",textAlign:"left",cursor:"pointer",fontSize:"12px"}}><LogOut size={15}/> Log out</button></div></>}</div></div></header>

<div className="content"><AnimatePresence mode="wait">

{page==="overview"&&<motion.section key="overview" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"> <i/> {new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"}).toUpperCase()}</div><h1>Good morning, {currentUsername||"there"} <em>✳</em></h1><p>{isStaff ? "Review submissions, resolve findings, and keep brand decisions traceable." : "Create content, check it against approved guidance, and track your own submissions."}</p></div><Btn kind="primary" onClick={()=>isStaff?setPage("reviews"):newDraft()}>{isStaff?<><FileCheck2 size={16}/> Open review queue</>:<><Plus size={16}/> Create draft</>}</Btn></div>

<div className="hero"><div className="hero-copy"><span><Sparkles size={14}/> BRAND INTELLIGENCE</span><h2>Consistency isn't a coincidence.<br/><em>It's a system.</em></h2><p>Every claim checked. Every decision traceable. Every voice on-brand.</p><button onClick={()=>setPage("reviews")}>{isStaff?"Open review queue":"Open my drafts"} <ArrowRight size={15}/></button></div><div className="orbit-art"><div className="orbit o1"/><div className="orbit o2"/><div className="orbit o3"/><div className="core"><ShieldCheck size={36}/></div><label>✓ VERIFIED FACTS</label><label>⌑ HUMAN REVIEW</label><label>↗ LIVE TRACE</label></div></div>
{isStaff&&<section className="panel" style={{padding:18,marginTop:18}}><div className="panel-head"><div><h3>Brand workspaces</h3><p>Create and manage the brands you own. Creators can prepare drafts for your brands.</p></div><Pill>{brands.length} brands</Pill></div><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}><select value={selectedBrandId} onChange={e=>{setSelectedBrandId(e.target.value);sessionStorage.setItem("bl-brand-id",e.target.value);}} style={{minWidth:200,padding:10,borderRadius:8}}><option value="">Select workspace</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select><input value={brandNameInput} onChange={e=>setBrandNameInput(e.target.value)} placeholder="New brand name" style={{padding:10,borderRadius:8,flex:1,minWidth:180}}/><Btn kind="primary" onClick={addBrand}><Plus size={14}/> Add brand</Btn></div></section>}

<div className="section-head"><div><h2>{isStaff ? "Review workspace at a glance" : "Your content workspace"}</h2><p>{isStaff ? "Review activity and governance signals." : "Start a draft or open your saved submissions to continue working."}</p></div><div>{isStaff&&<button onClick={()=>setPage("audit")}>View activity <ArrowRight size={14}/></button>}</div></div>{isStaff?<div className="stats"><Stat label="Saved drafts" value={savedDrafts.length} note="Accessible backend records" Icon={FileCheck2} delay={.03}/><Stat label="Active findings" value={allFindings.length} note="Excludes obsolete versions" Icon={ShieldAlert} delay={.08}/><Stat label="Awaiting decision" value={savedDrafts.filter(item=>["in_review","changes_requested"].includes(item.status)).length} note="Not yet approved or rejected" Icon={Clock3} delay={.13}/><Stat label="Approval rate" value={savedDrafts.length?Math.round(savedDrafts.filter(item=>item.status==="approved").length/savedDrafts.length*100)+"%":"—"} note="Approved drafts / all accessible drafts" Icon={Gauge} delay={.18}/></div>:<section className="panel" style={{padding:"20px",marginBottom:"18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"16px",flexWrap:"wrap"}}><div><b style={{display:"block",fontSize:"15px"}}>Your saved submissions</b><p style={{margin:"6px 0 0",fontSize:"12px",opacity:.72}}>Drafts available in your workspace: {savedDrafts.length}</p></div>{isStaff?<Btn kind="primary" onClick={()=>setPage("reviews")}><FileCheck2 size={14}/> Open review queue</Btn>:<Btn kind="primary" onClick={newDraft}><Plus size={14}/> Create a draft</Btn>}</section>}

{isStaff&&<div className="dash-grid"><section className="panel queue"><div className="panel-head"><div><h3>Needs your attention</h3><p>Saved drafts that have not been approved or rejected</p></div><button onClick={()=>setPage("reviews")}>View workspace <ArrowRight size={14}/></button></div>{savedDrafts.filter(item=>item.status!=="approved"&&item.status!=="rejected").slice(0,3).map(item=>{const unresolved=(item.findings||[]).filter(f=>f.state==="open"||f.state==="acknowledged");return <button className="queue-row" key={item.id} onClick={()=>openSavedDraft(item.id)}><span className="file-icon"><FileText size={17}/></span><span className="queue-copy"><b>{item.title||`Draft ${item.id}`}</b><small>{item.author_name||"Unknown author"} · {item.updated_at?new Date(item.updated_at).toLocaleString():"Date unavailable"}</small><em className={unresolved.length?"red":"green"}>{unresolved.length} unresolved finding{unresolved.length===1?"":"s"}</em></span><span className="queue-status"><Pill tone={unresolved.length?"warn":"good"}>{item.status||"In review"}</Pill><ChevronRight size={15}/></span></button>})}{!savedDrafts.some(item=>item.status!=="approved"&&item.status!=="rejected")&&<div className="empty"><b>No drafts waiting for review</b><p>Newly saved drafts will appear here.</p></div>}<button className="queue-footer" onClick={()=>setPage("reviews")}>Open review workspace <ArrowRight size={14}/></button></section>

<section className="panel issues"><div className="panel-head"><div><h3>Common issue types</h3><p>Saved finding records, excluding obsolete versions</p></div><Activity size={16}/></div>{topFindingPatterns.map(([kind,count],i)=>{const max=Math.max(1,...topFindingPatterns.map(([,n])=>n));return <div className="bar-row" key={kind}><span>{kind.replaceAll("_"," ")}<b>{count}</b></span><div><motion.i className={["coral","amber","violet"][i%3]} initial={{width:0}} animate={{width:Math.round(count/max*100)+"%"}} transition={{duration:.7,delay:i*.08}}/></div></div>})}{!topFindingPatterns.length&&<p className="table-foot">No saved findings yet. Run a review to populate this section.</p>}<button className="insight-box" onClick={()=>setPage("insights")}><Lightbulb size={17}/><span><b>Explore review patterns</b><small>{allDecisions.filter(item=>item.action==="dismissed").length} finding dismissals have been recorded in the backend.</small></span><ChevronRight size={15}/></button></section></div>}<div className="disclaimer"><Shield size={14}/> BrandLedger is a review aid, not a guarantee of compliance. Human approval is always required.</div></motion.section>}

{page==="reviews"&&<motion.section key="reviews" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"><i/> CONTENT GOVERNANCE / REVIEW STUDIO</div><h1>{isStaff?"Review queue":"My drafts"}</h1><p>{isStaff?"Read submitted content, review findings, and record a decision. Draft text is read-only for reviewers.":"Create drafts, run brand checks, apply suitable suggestions, and revise your own content."}</p></div><div className="head-buttons">{!isStaff&&<Btn onClick={()=>setHistory(v=>!v)}><History size={15}/> Version history</Btn>}<Btn onClick={refreshSavedDrafts} disabled={loadingSavedDrafts}><RefreshCw size={14}/> Refresh</Btn>{!isStaff&&<Btn kind="primary" onClick={newDraft}><Plus size={15}/> New draft</Btn>}</div></div>

{!isStaff&&history&&<motion.div className="history-strip" initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}><b><GitCompareArrows size={15}/> Saved versions <small>{versions.length} versions</small></b><div>{versions.map((v,i)=><button key={i} onClick={()=>{setDraft(v.text);setToast(v.name+" restored")}}><strong>{v.name}</strong><small>{v.time}</small></button>)}</div></motion.div>}

<section className="panel" style={{padding:"13px 16px",marginBottom:"14px"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px",flexWrap:"wrap"}}>
    <div style={{display:"flex",alignItems:"center",gap:"10px",minWidth:0}}>
      <span style={{width:"34px",height:"34px",borderRadius:"10px",display:"grid",placeItems:"center",background:"rgba(117,132,255,.12)",color:"#9da8ff",flexShrink:0}}><FolderOpen size={17}/></span>
      <div style={{minWidth:0}}><b style={{fontSize:"14px"}}>{isStaff?"Submitted drafts":"My saved drafts"} <span style={{fontSize:"11px",fontWeight:600,opacity:.7,marginLeft:"5px"}}>{savedDrafts.length}</span></b><div style={{fontSize:"12px",opacity:.68,marginTop:"3px"}}>{isStaff?"Open a submission to inspect it and record a reviewer decision.":"Your drafts are saved here so you can reopen and revise them."}</div></div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:"7px",flexWrap:"wrap",flexShrink:0}}>
      <button className="icon-btn" title="Refresh saved drafts" onClick={refreshSavedDrafts} disabled={loadingSavedDrafts || deletingDrafts} style={{width:"32px",height:"32px"}}>{loadingSavedDrafts?<span className="spinner"/>:<RefreshCw size={14}/>}</button>
      {!isStaff&&savedDrafts.length>0&&<Btn onClick={()=>{setShowAllSavedDrafts(v=>!v);setSelectedDraftIds([])}}>{showAllSavedDrafts?"Show recent":"Manage my drafts"} <ChevronDown size={14}/></Btn>}
    </div>
  </div>
  {savedDrafts.length===0
    ? <div style={{marginTop:"12px",padding:"12px",borderRadius:"10px",border:"1px dashed var(--border, #343a49)",fontSize:"12px",opacity:.75}}>{loadingSavedDrafts?"Loading saved drafts…":authenticated?(isStaff?"No submissions are available to review yet.":"No saved drafts yet. Create a draft and run a brand review to save it."):"Sign in to load drafts."}</div>
    : <>
      {!isStaff&&showAllSavedDrafts&&<>
        <input aria-label="Search saved drafts" value={savedDraftSearch} onChange={e=>setSavedDraftSearch(e.target.value)} placeholder="Search drafts by title or status…" style={{width:"100%",marginTop:"12px",padding:"9px 11px",borderRadius:"9px",border:"1px solid var(--border, #343a49)",background:"transparent",color:"inherit",fontSize:"12px",boxSizing:"border-box"}}/>
        <div style={{display:"flex",alignItems:"center",gap:"8px",flexWrap:"wrap",marginTop:"10px"}}>
          <button type="button" onClick={()=>selectAllVisibleDrafts(savedDrafts.filter(item=>`${item.title||""} ${item.status||""} ${item.id}`.toLowerCase().includes(savedDraftSearch.toLowerCase())))} style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"7px 9px",border:"1px solid var(--border, #343a49)",borderRadius:"8px",background:"transparent",color:"inherit",fontSize:"11px",cursor:"pointer"}}><CheckSquare size={13}/> Select all eligible</button>
          <span style={{fontSize:"11px",opacity:.72}}>{selectedDraftIds.filter(id=>savedDrafts.some(item=>item.id===id && item.status!=="approved")).length} selected · approved drafts are protected</span>
          <span style={{flex:1}}/>
          <Btn disabled={deletingDrafts || selectedDraftIds.length===0} onClick={()=>deleteSelectedDrafts(false)}><Trash2 size={13}/> {deletingDrafts?"Deleting…":"Delete selected"}</Btn>
          <button type="button" disabled={deletingDrafts || selectableDrafts(savedDrafts).length===0} onClick={()=>deleteSelectedDrafts(true)} style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"8px 10px",border:"1px solid rgba(232,121,137,.4)",borderRadius:"9px",background:"rgba(232,121,137,.08)",color:"#e87989",fontSize:"11px",fontWeight:700,cursor:deletingDrafts?"wait":"pointer",opacity:deletingDrafts?0.6:1}}><Trash2 size={13}/> Delete all eligible</button>
        </div>
      </>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:"8px",marginTop:"12px"}}>
        {savedDrafts.filter(item=>!showAllSavedDrafts||`${item.title||""} ${item.status||""} ${item.id}`.toLowerCase().includes(savedDraftSearch.toLowerCase())).slice(0,showAllSavedDrafts?savedDrafts.length:3).map(item=><div key={item.id} style={{display:"flex",alignItems:"center",gap:"8px",textAlign:"left",padding:"8px",borderRadius:"10px",border:"1px solid var(--border, #343a49)",background:"rgba(255,255,255,.018)",minWidth:0,transition:"border-color .18s, background .18s"}}>
          {!isStaff&&showAllSavedDrafts&&<input type="checkbox" aria-label={`Select ${item.title||`draft ${item.id}`}`} checked={selectedDraftIds.includes(item.id)} disabled={item.status==="approved"||deletingDrafts} onChange={()=>toggleDraftSelection(item.id)} title={item.status==="approved"?"Approved drafts are protected from deletion":"Select draft"} style={{accentColor:"#9da8ff",flexShrink:0}}/>}
          <button type="button" onClick={()=>openSavedDraft(item.id)} style={{display:"flex",alignItems:"center",gap:"9px",textAlign:"left",padding:"3px",border:0,background:"transparent",color:"inherit",cursor:"pointer",minWidth:0,flex:1}}>
            <span style={{width:"30px",height:"30px",borderRadius:"8px",display:"grid",placeItems:"center",background:"rgba(255,255,255,.045)",flexShrink:0}}><FileText size={15}/></span>
            <span style={{display:"block",minWidth:0,flex:1}}><b style={{display:"block",fontSize:"12px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title || `Draft ${item.id}`}</b><small style={{display:"block",opacity:.78,marginTop:"4px",fontSize:"10px"}}>#{item.id} · {draftStatusLabel(item.status)}{item.status==="approved"?" · protected":""}</small>{!isStaff&&latestReviewerDecision(item)&&<small style={{display:"block",opacity:.72,marginTop:"4px",fontSize:"10px",lineHeight:1.4}}>{latestReviewerDecision(item).comment || (latestReviewerDecision(item).action==="approved"?"Approved by reviewer.":latestReviewerDecision(item).action==="rejected"?"Rejected by reviewer.":"Changes requested by reviewer.")}</small>}</span><ChevronRight size={14} style={{opacity:.6,flexShrink:0}}/>
          </button>
        </div>)}
      </div>
      {showAllSavedDrafts&&savedDrafts.filter(item=>`${item.title||""} ${item.status||""} ${item.id}`.toLowerCase().includes(savedDraftSearch.toLowerCase())).length===0&&<small style={{display:"block",marginTop:"10px",opacity:.7}}>No drafts match that search.</small>}
    </>}
</section>
{!isStaff&&backendDraftId&&status==="Ready for client review"&&<section className="panel" style={{padding:"12px 15px",marginBottom:"14px",border:"1px solid var(--border, #343a49)",borderLeft:"3px solid #5bd49a"}}><b style={{fontSize:"13px"}}>Completed review sent to Reviewer</b><p style={{fontSize:"12px",lineHeight:1.5,opacity:.8,margin:"5px 0 0"}}>The client can now review the corrected draft and approve it or request further changes.</p></section>}
{!isStaff&&backendDraftId&&["Approved","Rejected","Changes requested"].includes(status)&&<section className="panel" style={{padding:"12px 15px",marginBottom:"14px",border:"1px solid var(--border, #343a49)",borderLeft:`3px solid ${status==="Approved"?"#5bd49a":status==="Rejected"?"#e87989":"#e8b45b"}`}}><b style={{fontSize:"13px"}}>Reviewer outcome: {status}</b><p style={{fontSize:"12px",lineHeight:1.5,opacity:.8,margin:"5px 0 0"}}>{latestReviewerDecision(savedDrafts.find(item=>String(item.id)===String(backendDraftId)))?.comment || (status==="Approved"?"The reviewer approved this draft.":status==="Rejected"?"The reviewer rejected this draft.":"Please revise this draft based on the reviewer feedback.")}</p></section>}
{(!isStaff||backendDraftId)&&<div className="docbar"><span className="file-icon"><FileText size={17}/></span><span className="docname"><b>{title}</b><small>{campaign} · Last edited just now</small></span>{!isStaff&&<button className="icon-btn" title="Rename draft" onClick={()=>{let t=prompt("Rename draft",title);if(t?.trim())setTitle(t.trim())}}><Settings2 size={15}/></button>}<Pill tone={status==="Approved"?"good":status==="Not reviewed"?"": "warn"}>{status}</Pill></div>}
{backendDraftId!=null&&!aiReviewComplete&&<div role="alert" className="disclaimer" style={{marginBottom:"14px",border:"1px solid rgba(232,180,91,.45)",background:"rgba(232,180,91,.08)",padding:"12px 14px",borderRadius:"10px",color:"inherit"}}><AlertTriangle size={15}/><span><b>AI review incomplete.</b> The draft was saved, but the AI provider did not finish reviewing it. Approval is blocked until a successful AI-reviewed revision completes.</span></div>}

<div className={`review-grid ${!showEvidence?"wide":""}`}>{!isStaff ? <section className="panel editor"><div className="editor-head"><span><i/> CONTENT DRAFT <small>· Plain text</small></span><button onClick={()=>setShowEvidence(v=>!v)}><PanelRightClose size={15}/></button></div><div className="fields"><label>CONTENT TITLE<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>CAMPAIGN<input value={campaign} onChange={e=>setCampaign(e.target.value)}/></label></div><label className="draft-label">Draft content <small>· {draft.trim()?draft.trim().split(/\s+/).length:0} words</small></label><textarea className="draft" value={draft} onChange={e=>{setDraft(e.target.value);if(status==="Ready for client review")setStatus("In progress");}} placeholder="Paste campaign copy here…" spellCheck/><div className="editor-foot"><span><LockKeyhole size={13}/> Original stays unchanged until you apply a suggestion.</span><span>{draft.length} chars</span></div>{findings.length>0&&<div className="highlight-preview"><div> <Sparkles size={13}/> FLAGGED CONTENT PREVIEW <small>Click a phrase to inspect it</small></div><p>{splitDraftByFindings(draft, findings).map((part,i)=>part.finding?<mark key={i} className={`${part.finding.severity} ${active===part.finding.id?"chosen":""}`} onClick={()=>setActive(part.finding.id)}>{part.text}</mark>:<React.Fragment key={i}>{part.text}</React.Fragment>)}</p></div>}<div className="editor-actions"><Btn onClick={()=>{setFindings([]);setResolved([]);setStatus("Not reviewed");setToast("Findings cleared")}}><X size={14}/> Clear findings</Btn><Btn kind="primary" disabled={busy} onClick={review}>{busy?<><span className="spinner"/> Checking content…</>:<><Sparkles size={15}/> Run brand review <ArrowRight size={15}/></>}</Btn>{backendDraftId&&<Btn kind="approve" disabled={busy||status==="Ready for client review"||status==="Approved"} onClick={submitCompletedReview}>{busy?<><span className="spinner"/> Sending…</>:<><CheckCheck size={15}/> Send completed review to Reviewer <ArrowRight size={15}/></>}</Btn>}</div><div className="method-note"><ShieldCheck size={14}/> Deterministic checks run first. AI interpretation is handled by the backend when enabled.</div></section> : <section className="panel editor"><div className="editor-head"><span><i/> SUBMITTED CONTENT <small>· Read-only for reviewers</small></span><span><LockKeyhole size={13}/> Creator edits this draft</span></div><div className="fields"><label>CONTENT TITLE<input value={title} readOnly/></label><label>CAMPAIGN<input value={campaign} readOnly/></label></div><label className="draft-label">Submitted draft</label><div className="draft" style={{whiteSpace:"pre-wrap",minHeight:"260px",cursor:"default"}}>{backendDraftId ? (draft || "This submission has no text content.") : "Choose a submission from the list below to inspect its content and findings."}</div><div className="editor-actions"><Btn kind="primary" disabled={busy||!backendDraftId} onClick={review}>{busy?<><span className="spinner"/> Running review…</>:<><Sparkles size={15}/> Run brand review <ArrowRight size={15}/></>}</Btn></div><div className="method-note"><ShieldCheck size={14}/> Reviewer analysis is read-only. You can request changes, but only the Creator can edit the draft.</div></section>}

{showEvidence&&<aside className="panel evidence"><div className="panel-head"><div><h3>Review findings <span className="count">{open.length}</span></h3><p>{findings.length?`${resolved.length} of ${findings.length} addressed`:"Run a review to see evidence-backed findings."}</p></div><button title="Reverse finding order" aria-label="Reverse finding order" onClick={()=>setFindings(f=>[...f].reverse())}><Filter size={15}/></button></div>{findings.length>0&&<div className="progress"><span>Resolution progress <b>{completion}%</b></span><div><i style={{width:completion+"%"}}/></div></div>}{!findings.length?<div className="empty"><span><ShieldCheck size={29}/><Sparkles size={13}/></span><b>{isStaff?(backendDraftId?"No findings returned for this draft":"Choose a submission to begin") : "Your evidence panel is ready"}</b><p>{isStaff?(backendDraftId?"No findings were returned for this saved submission.":"Open a submitted draft above to inspect its findings."):"Run a review to see each issue, the source rule, and a suggested next step."}</p><small>✓ Approved facts　 ✓ Prohibited phrases　 ✓ Claim evidence</small></div>:<div className="finding-list">{findings.map((f,i)=><motion.button key={f.id} className={`finding ${active===f.id?"selected":""} ${resolved.includes(f.id)?"resolved":""}`} onClick={()=>setActive(f.id)} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*.06}}><span className={`finding-icon ${f.severity}`}>{f.severity==="critical"?<ShieldAlert size={16}/>:<Flag size={16}/>}</span><span className="finding-body"><small>{f.type}<b className={f.severity}>{resolved.includes(f.id)?"RESOLVED":f.severity.toUpperCase()}</b></small><strong>{f.title}</strong><em>{f.detail}</em><label><BookOpen size={12}/>{f.source}</label></span><ChevronRight size={14}/></motion.button>)}</div>}


{activeFinding&&<AnimatePresence mode="wait"><motion.div key={activeFinding.id} className="evidence-detail" initial={{opacity:0,y:7}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="detail-kicker"><BookOpen size={13}/> EVIDENCE & EXPLANATION <b className={activeFinding.severity}>{activeFinding.severity.toUpperCase()}</b></div><h4>{activeFinding.title}</h4><p>{activeFinding.detail}</p><div className="source-card">
  <BadgeCheck size={16}/>
  <span>
    <small>TRACEABLE SOURCE</small>
    <b>{activeFinding.source}</b>
    <em>
      {activeFinding.evidenceStatus === "supported"
        ? "The backend marked this evidence as supported."
        : "Evidence is uncertain or has not been verified. Treat this finding as requiring human review."}
    </em>
    {activeFinding.factId != null && <em>Linked fact record ID: {activeFinding.factId}</em>}
    {activeFinding.ruleId != null && <em>Linked rule record ID: {activeFinding.ruleId}</em>}
    {activeFinding.factId == null && activeFinding.ruleId == null && (
      <em>No exact fact or rule record is linked to this finding.</em>
    )}
    {activeFinding.evidenceSnapshot &&
      Object.keys(activeFinding.evidenceSnapshot).length > 0 && (
        <pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",fontSize:11,lineHeight:1.5,margin:"8px 0 0",padding:10,borderRadius:8,background:"rgba(127,152,232,.08)"}}>
          {JSON.stringify(activeFinding.evidenceSnapshot, null, 2)}
        </pre>
      )}
  </span>
</div><div className="suggestion"><small><Sparkles size={13}/> SUGGESTED NEXT STEP</small><p>{activeFinding.suggestion}</p>{!isStaff&&isUsableSuggestion(activeFinding.suggestion)&&activeFinding.source!=="Human review required"&&<div><Btn kind="primary" disabled={busy || resolved.includes(activeFinding.id)} onClick={()=>apply(activeFinding)}><Check size={14}/> Apply suggestion</Btn></div>}{!isStaff&&(!isUsableSuggestion(activeFinding.suggestion)||activeFinding.source==="Human review required")&&<p style={{fontSize:12,opacity:.8,marginTop:8}}>No safe, evidence-backed replacement is available. Human review is required; this text cannot be applied automatically.</p>}</div></motion.div></AnimatePresence>}<div className="evidence-foot"><LockKeyhole size={12}/> Suggestions never publish automatically</div></aside>}</div>

{isStaff&&backendDraftId&&<section className="panel decision"><div className="decision-copy"><span><ShieldCheck size={19}/></span><div><b>Reviewer decision</b><small>Leave a clear comment, then approve, reject, or request changes. The creator owns the text edits.</small></div></div><div className="decision-actions"><input value={comment} onChange={e=>setComment(e.target.value)} placeholder="Reviewer comment (required for reject or request changes)…"/><Btn kind="reject" disabled={status==="Approved"} onClick={()=>decide("rejected")}><ThumbsDown size={14}/> Reject</Btn><Btn disabled={status==="Approved"} onClick={()=>decide("changes-requested")}><ArrowRight size={14}/> Request changes</Btn><Btn kind="approve" disabled={status==="Approved"} onClick={()=>decide("approved")}><ThumbsUp size={14}/> Approve draft</Btn></div>{decision&&<p className="decision-note"><CheckCheck size={14}/> Reviewer decision saved to the backend: <b>{decision.replaceAll("-"," ")}</b>.</p>}</section>}</motion.section>}


{page==="claims"&&<ClaimsLedgerView isStaff={isStaff} selectedBrandId={selectedBrandId}/>}

{page==="guidelines"&&<motion.section key="guidelines" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"><i/> GOVERNANCE / RULEBOOK</div><h1>Brand guidelines</h1><p>{isStaff?"Manage the guidelines for your brands. Creators see these as read-only instructions.":"View the guidelines supplied by the brand owner. Guideline editing is reserved for Reviewers."}</p></div><Btn onClick={()=>reloadKnowledge()} disabled={guidelineKnowledgeLoading}><RefreshCw size={14}/> Refresh rules</Btn></div>
<div className="panel" style={{padding:18,marginBottom:18}}><div style={{display:"flex",gap:10,flexWrap:"wrap",alignItems:"center"}}><label style={{fontWeight:700}}>Selected brand</label><select value={guidelineBrandId} onChange={e=>{setGuidelineBrandId(e.target.value);sessionStorage.setItem("bl-guideline-brand-id",e.target.value);reloadKnowledge(e.target.value);setEditingGuidelineId(null);}} style={{minWidth:180,padding:10,borderRadius:8}}><option value="">Select a brand</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></div></div>
{isStaff&&guidelineBrandId&&<section className="panel" style={{padding:18,marginBottom:18}}><h3 style={{marginTop:0}}>{editingGuidelineId?"Edit guideline":"Add guideline"}</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:10}}><input placeholder="Code (e.g. R-14)" value={guidelineForm.code} onChange={e=>setGuidelineForm(f=>({...f,code:e.target.value}))}/><input placeholder="Prohibited phrase" value={guidelineForm.phrase} onChange={e=>setGuidelineForm(f=>({...f,phrase:e.target.value}))}/><input placeholder="Safe replacement (optional)" value={guidelineForm.replacement} onChange={e=>setGuidelineForm(f=>({...f,replacement:e.target.value}))}/><input placeholder="Source" value={guidelineForm.source} onChange={e=>setGuidelineForm(f=>({...f,source:e.target.value}))}/></div><textarea placeholder="Explain the guideline and why it matters" value={guidelineForm.explanation} onChange={e=>setGuidelineForm(f=>({...f,explanation:e.target.value}))} rows={3} style={{width:"100%",boxSizing:"border-box",marginTop:10}}/><div style={{display:"flex",gap:8,marginTop:10}}><Btn kind="primary" onClick={saveGuideline}><Check size={14}/> {editingGuidelineId?"Update guideline":"Add guideline"}</Btn>{editingGuidelineId&&<Btn onClick={()=>{setEditingGuidelineId(null);setGuidelineForm({code:"",phrase:"",replacement:"",explanation:"",source:"Brand style guide"});}}>Cancel</Btn>}</div></section>}
{guidelineKnowledgeError&&<p className="disclaimer"><AlertTriangle size={14}/>{guidelineKnowledgeError}</p>}<div className="guides">{guidelineKnowledgeData.rules.map(rule=><section className="panel guide" key={rule.id}><span className="guide-icon red"><ShieldAlert size={19}/></span><h3>{rule.code}: {rule.phrase}</h3><p>{rule.explanation}</p><small><BookOpen size={12}/>{rule.source||"Brand style guide"}</small><small><Check size={12}/>{rule.replacement?`Suggested replacement: ${rule.replacement}`:"Human review required; no automatic replacement is configured."}</small>{isStaff&&<div style={{display:"flex",gap:8,marginTop:12}}><Btn onClick={()=>{setEditingGuidelineId(rule.id);setGuidelineForm({code:rule.code||"",phrase:rule.phrase||"",replacement:rule.replacement||"",explanation:rule.explanation||"",source:rule.source||"Brand style guide"});window.scrollTo({top:0,behavior:"smooth"});}}>Edit</Btn><Btn kind="reject" onClick={async()=>{if(!confirm(`Delete guideline ${rule.code}?`))return;try{await api.deleteGuideline(rule.id);await reloadKnowledge();setToast("Guideline deleted.");}catch(error){setToast(error.message||"Could not delete guideline.");}}}><Trash2 size={13}/> Delete</Btn></div>}</section>)}</div>{!guidelineKnowledgeLoading&&!guidelineKnowledgeData.rules.length&&<section className="panel empty"><b>No guidelines for this brand yet</b><p>{isStaff?"Add the first guideline for this brand.":"The reviewer has not added guidelines to this brand."}</p></section>}<p className="disclaimer"><Shield size={14}/>{isStaff?"You own this brand's guidelines. Creator accounts can view them but cannot modify them.":"Guidelines are read-only for Creators. Only the owning Reviewer can modify them."}</p></motion.section>}

{isStaff&&page==="insights"&&<motion.section key="insights" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"><i/> GOVERNANCE / CONTINUOUS IMPROVEMENT</div><h1>Guideline insights</h1><p>Patterns calculated from persisted findings and reviewer decisions across accessible drafts.</p></div><Btn onClick={refreshSavedDrafts} disabled={loadingSavedDrafts}><RefreshCw size={14}/> Refresh metrics</Btn></div><div className="insight-hero"><span><Activity size={15}/> LIVE WORKSPACE METRICS</span><h2>{allFindings.length ? "Review patterns, grounded in real activity." : "Your review data will appear here."}</h2><p>{allFindings.length ? `${allFindings.length} finding records across ${savedDrafts.length} accessible drafts. ${allDecisions.filter(item=>item.action==="dismissed").length} findings have been dismissed by a reviewer.` : "Run a backend review and record reviewer decisions to populate these metrics. No illustrative counts are shown."}</p><div className="big-number">{allFindings.filter(item=>item.state==="open"||item.state==="acknowledged").length}<small>open / acknowledged</small></div></div><div className="section-head"><div><h2>Most frequent finding types</h2><p>Counts exclude obsolete findings from older versions.</p></div><Pill>{allFindings.length} findings</Pill></div><div className="insight-cards">{topFindingPatterns.map(([kind,count],i)=><section className="panel insight-card" key={kind}><code>{String(i+1).padStart(2,"0")}</code><small>{count} occurrence{count===1?"":"s"}</small><h3>{kind.replaceAll("_"," ")}</h3><p>{allFindings.filter(item=>item.kind===kind&&(item.state==="open"||item.state==="acknowledged")).length} currently unresolved; {allFindings.filter(item=>item.kind===kind&&item.state==="dismissed").length} dismissed by reviewers.</p></section>)}</div>{!topFindingPatterns.length&&<section className="panel empty"><b>No findings recorded yet</b><p>Once drafts have been reviewed, recurring issues will be calculated from the saved records.</p></section>}<div className="section-head"><div><h2>Review outcomes</h2><p>Persisted reviewer decisions, not browser-session events.</p></div></div><div className="stats">{[{label:"Approved",count:allDecisions.filter(item=>item.action==="approved").length},{label:"Changes requested",count:allDecisions.filter(item=>item.action==="changes_requested").length},{label:"Rejected",count:allDecisions.filter(item=>item.action==="rejected").length},{label:"Dismissed findings",count:allDecisions.filter(item=>item.action==="dismissed").length}].map(metric=><div className="stat" key={metric.label}><div className="stat-label">{metric.label}</div><strong>{metric.count}</strong><small>Recorded in backend</small></div>)}</div><p className="disclaimer"><Lightbulb size={14}/> These metrics describe the drafts available to your account; they are not a complete organization-wide report unless the reviewer account can access all relevant drafts.</p></motion.section>}

{isStaff&&page==="audit"&&<motion.section key="audit" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"><i/> GOVERNANCE / ACCOUNTABILITY</div><h1>Audit trail</h1><p>Persisted version and decision events returned by Django.</p></div><Btn onClick={()=>setPage("changes")}><GitCompareArrows size={14}/> Review creator changes</Btn><Btn onClick={refreshSavedDrafts} disabled={loadingSavedDrafts}><RefreshCw size={14}/> Refresh history</Btn></div><div className="intro-card"><History size={24}/><span><b>Traceable by design</b><small>Events below come from stored draft versions and reviewer decisions.</small></span><Pill>{auditEvents.length} events</Pill></div><section className="panel audit"><div className="panel-head"><div><h3>Recent activity</h3><p>Newest persisted events first</p></div><Pill>Backend history</Pill></div>{auditEvents.slice(0,100).map((event,index)=><div className="audit-row" key={`${event.eventType}-${event.id}-${event.created_at||index}`}><span><History size={15}/></span><div><b>{event.eventType==="version"?`Version ${event.version} saved`:event.action.replaceAll("_"," ")}</b><p>{event.draftTitle||`Draft ${event.draftId}`} · {event.comment||"No reviewer comment recorded."}</p><small>{event.actor_name||"Unknown actor"} · {event.created_at?new Date(event.created_at).toLocaleString():"Time unavailable"}</small></div><code>{event.eventType==="version"?"VERSION":"DECISION"}</code></div>)}{!auditEvents.length&&<div className="empty"><span><History size={29}/></span><b>No audit events yet</b><p>Save a draft revision or record a reviewer decision to create persistent history.</p></div>}</section></motion.section>}

{isStaff&&page==="changes"&&<motion.section key="changes" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"><i/> GOVERNANCE / CHANGE REVIEW</div><h1>Creator changes</h1><p>Compare the latest creator revision with the previous version. Include or exclude individual changes, then apply the selected changes to the draft.</p></div><Btn onClick={()=>loadCreatorChanges()} disabled={changesLoading}><RefreshCw size={14}/> Refresh comparison</Btn></div><section className="panel" style={{padding:18,marginBottom:16}}><label style={{display:"block",fontWeight:700,marginBottom:8}}>Draft to compare</label><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><select value={changeDraftId} onChange={e=>{setChangeDraftId(e.target.value);setDraftChanges(null);}} style={{padding:10,minWidth:260,flex:1}}><option value="">Choose a draft</option>{savedDrafts.map(item=><option key={item.id} value={item.id}>{item.title} · {item.status}</option>)}</select><Btn kind="primary" onClick={()=>loadCreatorChanges()} disabled={!changeDraftId||changesLoading}>View changes</Btn></div></section>{draftChanges&&<><div className="intro-card"><GitCompareArrows size={22}/><span><b>Version {draftChanges.from_version||"—"} → Version {draftChanges.to_version||"—"}</b><small>Select the changes you want to retain in the resulting draft. Excluded changes revert to the previous version's text.</small></span><Pill>{draftChanges.changes?.length||0} changes</Pill></div>{draftChanges.changes?.length>0&&<div style={{display:"flex",gap:8,flexWrap:"wrap",margin:"14px 0"}}><Btn onClick={()=>setIncludedChangeIndexes((draftChanges.changes||[]).map(c=>c.index))}><CheckCheck size={14}/> Include all</Btn><Btn onClick={()=>setIncludedChangeIndexes([])}><X size={14}/> Exclude all</Btn><Btn kind="primary" onClick={applySelectedChanges} disabled={changesLoading}><Check size={14}/> Apply selected changes to draft</Btn></div>}<div style={{display:"grid",gap:12}}>{(draftChanges.changes||[]).map(change=><section className="panel" key={change.index} style={{padding:16,border:includedChangeIndexes.includes(change.index)?"1px solid var(--accent, #7f98e8)":"1px solid var(--border, #333)"}}><label style={{display:"flex",alignItems:"center",gap:10,fontWeight:700,marginBottom:12}}><input type="checkbox" checked={includedChangeIndexes.includes(change.index)} onChange={e=>setIncludedChangeIndexes(list=>e.target.checked?[...list,change.index]:list.filter(i=>i!==change.index))}/> Change {change.index+1} · {change.kind} {includedChangeIndexes.includes(change.index)?"(included)":"(excluded)"}</label>{change.related_findings?.length>0&&<div style={{marginBottom:10,padding:10,borderRadius:8,background:"rgba(232,180,91,.08)"}}><small style={{display:"block",fontWeight:800,marginBottom:6}}>RELATED FINDINGS</small>{change.related_findings.map(f=><div key={f.id} style={{fontSize:12,marginBottom:6}}><b>{f.kind.replaceAll("_"," ")}</b> — {f.reason}<div style={{opacity:.8}}>Flagged excerpt: “{f.excerpt}”</div></div>)}</div>}{(!change.related_findings||!change.related_findings.length)&&<small style={{display:"block",marginBottom:10,opacity:.7}}>No finding could be matched automatically; review this text change manually.</small>}<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12}}><div><small style={{display:"block",marginBottom:6,color:"var(--muted)"}}>PREVIOUS TEXT</small><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",padding:12,borderRadius:8,background:"rgba(220,80,80,.08)",minHeight:45}}>{change.before||"(no text)"}</pre></div><div><small style={{display:"block",marginBottom:6,color:"var(--muted)"}}>CREATOR'S UPDATED TEXT</small><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere",padding:12,borderRadius:8,background:"rgba(70,180,130,.08)",minHeight:45}}>{change.after||"(removed)"}</pre></div></div></section>)}</div>{!draftChanges.changes?.length&&<section className="panel empty"><b>No differences found</b><p>This draft has no line-level changes between its latest two versions.</p></section>}</>}</motion.section>}

</AnimatePresence></div></main>

<AnimatePresence>{toast&&<motion.div className="toast" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}}><Check size={14}/>{toast}<button onClick={()=>setToast("")}><X size={14}/></button></motion.div>}</AnimatePresence>

<AnimatePresence>{search&&<motion.div className="modal-bg" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={()=>setSearch(false)}><motion.div className="command-modal" initial={{y:-10,opacity:0}} animate={{y:0,opacity:1}} onClick={e=>e.stopPropagation()}><div className="command-head"><Search size={17}/><input autoFocus placeholder="Jump to a workspace page…"/><button onClick={()=>setSearch(false)}><X size={15}/></button></div><p>NAVIGATION</p>{visibleNav.map(([id,label,Icon])=><button className="command-item" key={id} onClick={()=>{setPage(id);setSearch(false)}}><Icon size={16}/>{label}<ArrowRight size={14}/></button>)}<small>BrandLedger command menu</small></motion.div></motion.div>}</AnimatePresence>

</div>}
