import React,{useState,useEffect}from"react";import{AnimatePresence,motion}from"framer-motion";import{ShieldCheck,Shield,BadgeCheck,Home,FileCheck2,Layers3,BookOpen,Lightbulb,History,Plus,Search,Bell,Sun,Moon,ChevronRight,ChevronDown,ArrowRight,ArrowUpRight,Clock3,ShieldAlert,Flag,Sparkles,Check,CheckCheck,LockKeyhole,FileText,Filter,PanelRightClose,GitCompareArrows,ThumbsUp,ThumbsDown,X,Menu,Command,Activity,Settings2,Send,Gauge,MoreHorizontal,LogOut,FolderOpen,RefreshCw}from"lucide-react";import{api}from"./lib/api.js";

const redesignCss = `/* BRANDLEDGER // AURORA STUDIO redesign */
.app{--ink:#17223b;--muted:#69758e;--paper:#f4f7fc;--surface:#ffffff;--line:#e1e7f1;--blue:#5b5df0;--blue2:#7a7cff;--teal:#32cbb4;--lime:#c8f169;--danger:#e66d79;--shadow:0 16px 44px rgba(28,43,78,.08);background:radial-gradient(ellipse at 76% 0%,rgba(114,128,255,.09),transparent 34%),var(--paper)!important;color:var(--ink)!important;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important;min-height:100vh;}
.app *{box-sizing:border-box}
.app button,.app input,.app textarea{font:inherit}
.app button{transition:transform .2s ease,box-shadow .2s ease,background .2s ease,border-color .2s ease}
.app button:not(:disabled):hover{transform:translateY(-1px)}
.app button:focus-visible,.app input:focus-visible,.app textarea:focus-visible{outline:3px solid rgba(91,93,240,.25)!important;outline-offset:2px}
.app .sidebar{background:linear-gradient(175deg,#121a33 0%,#192547 55%,#111a31 100%)!important;color:#f6f8ff!important;border-right:1px solid rgba(255,255,255,.08)!important;box-shadow:12px 0 40px rgba(24,35,69,.06);padding:24px 16px!important}
.app .logo{padding:4px 7px 23px!important;margin-bottom:12px!important}
.app .logo-mark{background:linear-gradient(140deg,#c8f169,#67e0cc)!important;color:#17223b!important;border-radius:14px!important;box-shadow:0 8px 24px rgba(103,224,204,.22)!important;width:42px!important;height:42px!important}
.app .logo-type{color:#fff!important;font-size:18px!important;letter-spacing:-.7px!important;font-weight:850!important}.app .logo-type small{color:#9caed5!important;letter-spacing:1.7px!important;font-size:9px!important}
.app .workspace{background:linear-gradient(130deg,rgba(255,255,255,.10),rgba(255,255,255,.04))!important;border:1px solid rgba(255,255,255,.13)!important;border-radius:16px!important;padding:12px!important;color:#f7f9ff!important;box-shadow:inset 0 1px rgba(255,255,255,.06)!important}
.app .workspace>span small{color:#aab8d7!important}.app .nav-label{color:#8192b9!important;letter-spacing:1.7px!important;font-size:9px!important;font-weight:800!important;margin:26px 10px 9px!important}.app .nav-item{color:#bac6e1!important;border:1px solid transparent!important;border-radius:12px!important;margin:3px 0!important;padding:11px 12px!important;font-weight:650!important;gap:12px!important}.app .nav-item svg{color:#92a4d0!important}.app .nav-item:hover{background:rgba(255,255,255,.075)!important;color:#fff!important}.app .nav-item.active{background:linear-gradient(100deg,rgba(200,241,105,.16),rgba(103,224,204,.10))!important;color:#fff!important;border-color:rgba(200,241,105,.22)!important;box-shadow:inset 3px 0 #c8f169!important}.app .nav-item.active svg{color:#c8f169!important}
.app .sidebar-bottom{border-top:1px solid rgba(255,255,255,.11)!important;padding-top:16px!important}.app .secure-note{background:rgba(255,255,255,.055)!important;border:1px solid rgba(255,255,255,.07)!important;border-radius:13px!important;padding:12px!important;color:#c8f169!important}.app .secure-note b{color:#f5f7ff!important}.app .secure-note small{color:#9eadd0!important}.app .user{color:#f8faff!important;width:100%;text-align:left;border:0;background:transparent;display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px;border-radius:12px}.app .user:hover{background:rgba(255,255,255,.06)}.app .user>b,.app .avatar{background:linear-gradient(140deg,#c8f169,#67e0cc)!important;color:#16203a!important;border-radius:12px!important;font-weight:850!important}.app .user small{color:#9eadd0!important}
.app .main{background:transparent!important;min-width:0}.app .topbar{height:76px!important;padding:0 clamp(18px,3vw,42px)!important;background:rgba(255,255,255,.78)!important;backdrop-filter:blur(18px)!important;border-bottom:1px solid rgba(218,226,241,.8)!important;position:sticky!important;top:0!important;z-index:20!important}.app .crumb{color:#7d89a1!important}.app .crumb b{color:#17223b!important;font-weight:800!important}.app .top-actions{gap:10px!important}.app .search{background:#f2f5fb!important;border:1px solid #e1e7f1!important;border-radius:12px!important;color:#7c88a0!important;padding:10px 12px!important}.app .search kbd{background:#fff!important;border:1px solid #dfe5f0!important;border-radius:6px!important;color:#6c7892!important}.app .api-state{background:#eefaf6!important;color:#27856f!important;border:1px solid #d4f1e7!important;border-radius:999px!important;padding:7px 10px!important;font-size:11px!important;font-weight:750!important}.app .api-state i{background:#32cbb4!important;box-shadow:0 0 0 3px rgba(50,203,180,.13)!important}.app .icon-btn{border:1px solid #e1e7f1!important;background:#fff!important;color:#5c6984!important;border-radius:11px!important;box-shadow:0 3px 10px rgba(30,48,88,.025)!important}.app .icon-btn:hover{border-color:#c4c9ff!important;color:#5557e9!important;box-shadow:0 8px 18px rgba(91,93,240,.1)!important}
.app .content{max-width:1600px!important;margin:0 auto!important;padding:34px clamp(18px,3vw,42px) 44px!important}.app .view{animation:aurora-enter .45s cubic-bezier(.2,.8,.2,1) both}.app .page-head{margin-bottom:26px!important;align-items:flex-end!important}.app .eyebrow{color:#707d98!important;letter-spacing:1.8px!important;font-size:10px!important;font-weight:850!important}.app .eyebrow i{background:var(--teal)!important;box-shadow:0 0 0 4px rgba(50,203,180,.13)!important}.app h1{color:#17223b!important;font-size:clamp(30px,3.1vw,43px)!important;letter-spacing:-1.8px!important;line-height:1.08!important;font-weight:850!important}.app .page-head p{color:#74809a!important;font-size:14px!important;line-height:1.65!important}.app h1 em,.app .hero-copy h2 em{color:#5b5df0!important;font-style:normal!important}
.app .primary-button,.app .approve-button{background:linear-gradient(115deg,#5b5df0,#7b72ff)!important;color:white!important;border:0!important;border-radius:12px!important;padding:11px 16px!important;font-weight:800!important;box-shadow:0 8px 18px rgba(91,93,240,.23)!important}.app .primary-button:hover,.app .approve-button:hover{box-shadow:0 12px 26px rgba(91,93,240,.32)!important}.app .secondary-button,.app .reject-button{background:#fff!important;color:#495672!important;border:1px solid #e0e6f1!important;border-radius:12px!important;padding:10px 14px!important;font-weight:700!important}.app .reject-button{color:#c04e64!important;background:#fff5f6!important;border-color:#f6d7dc!important}.app .text-btn{color:#5b5df0!important;font-weight:750!important}.app .panel,.app .stat,.app .guide,.app .insight-card{background:rgba(255,255,255,.92)!important;border:1px solid #e4eaf4!important;border-radius:19px!important;box-shadow:0 5px 18px rgba(27,44,83,.035)!important;transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease!important}.app .panel:hover,.app .stat:hover,.app .guide:hover,.app .insight-card:hover{border-color:#d5d9ff!important;box-shadow:0 14px 36px rgba(42,55,102,.08)!important}.app .panel-head h3,.app .section-head h2,.app .panel h3{color:#1c2945!important;letter-spacing:-.35px!important}.app .panel-head p,.app .section-head p{color:#8490a8!important}.app .section-head{margin:29px 0 14px!important}.app .section-head button,.app .panel-head button{color:#5b5df0!important;font-weight:750!important}
.app .hero{position:relative!important;overflow:hidden!important;border:1px solid rgba(112,127,255,.22)!important;border-radius:26px!important;padding:clamp(26px,4vw,48px)!important;min-height:275px!important;background:radial-gradient(circle at 80% 40%,rgba(110,237,211,.20),transparent 24%),radial-gradient(circle at 72% 20%,rgba(155,145,255,.28),transparent 32%),linear-gradient(120deg,#192344 0%,#252d59 55%,#263b61 100%)!important;box-shadow:0 22px 50px rgba(35,47,94,.14)!important;color:#fff!important}.app .hero:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 25%,rgba(255,255,255,.05) 48%,transparent 67%);transform:translateX(-100%);animation:aurora-sweep 8s ease-in-out infinite}.app .hero-copy{position:relative;z-index:2}.app .hero-copy>span{color:#c8f169!important;letter-spacing:1.6px!important;font-size:10px!important;font-weight:850!important}.app .hero-copy h2{font-size:clamp(28px,3vw,42px)!important;line-height:1.12!important;letter-spacing:-1.6px!important;color:#fff!important}.app .hero-copy h2 em{color:#c8f169!important}.app .hero-copy p{color:#c0cbe7!important;line-height:1.7!important}.app .hero-copy button{border:1px solid rgba(200,241,105,.4)!important;background:#c8f169!important;color:#18213c!important;border-radius:11px!important;padding:11px 14px!important;font-weight:850!important;box-shadow:0 8px 22px rgba(200,241,105,.13)!important}.app .orbit-art{filter:drop-shadow(0 0 24px rgba(105,222,209,.13))}.app .orbit{border-color:rgba(196,211,255,.3)!important}.app .orbit.o1{border-color:rgba(200,241,105,.48)!important}.app .core{background:linear-gradient(140deg,#c8f169,#67e0cc)!important;color:#1b2744!important;box-shadow:0 0 0 12px rgba(200,241,105,.08),0 0 48px rgba(103,224,204,.32)!important}.app .orbit-art label{background:rgba(255,255,255,.09)!important;border:1px solid rgba(255,255,255,.13)!important;color:#e5edff!important;backdrop-filter:blur(12px)!important}
.app .stats{gap:14px!important}.app .stat{padding:20px!important;position:relative!important;overflow:hidden!important}.app .stat:before{content:"";position:absolute;top:0;left:0;width:100%;height:3px;background:linear-gradient(90deg,#5b5df0,#67e0cc,#c8f169);opacity:.85}.app .stat-label{color:#7c89a3!important;font-size:11px!important;font-weight:750!important}.app .stat-label span{background:#f0f1ff!important;color:#5b5df0!important;border-radius:10px!important;padding:8px!important}.app .stat strong{color:#1b2744!important;font-size:30px!important;letter-spacing:-1px!important}.app .stat small{color:#8a96ad!important}.app .dash-grid{gap:18px!important}.app .queue-row{border-bottom:1px solid #edf0f6!important;padding:15px 0!important}.app .queue-row:hover{background:#f8f9ff!important;border-radius:12px!important}.app .file-icon{background:#f0f1ff!important;color:#5b5df0!important;border-radius:12px!important}.app .queue-copy b{color:#25314d!important}.app .queue-copy small{color:#8994aa!important}.app .queue-footer{color:#5b5df0!important;background:#f7f7ff!important;border-radius:10px!important}.app .bar-row>span{color:#66738d!important}.app .bar-row>div{background:#edf0f7!important;border-radius:999px!important;overflow:hidden!important}.app .bar-row i{border-radius:999px!important}.app .bar-row .coral{background:linear-gradient(90deg,#ff8a97,#f16b87)!important}.app .bar-row .amber{background:linear-gradient(90deg,#ffd36d,#f2a95e)!important}.app .bar-row .violet{background:linear-gradient(90deg,#7b72ff,#b1a1ff)!important}.app .bar-row .blue{background:linear-gradient(90deg,#62b8f5,#62d8d0)!important}.app .insight-box{background:#f5f6ff!important;border:1px solid #e4e5ff!important;border-radius:13px!important;color:#5b5df0!important}.app .disclaimer{background:rgba(255,255,255,.55)!important;border:1px solid #e4eaf4!important;border-radius:12px!important;color:#8994aa!important;padding:12px 14px!important}
.app .pill{border-radius:999px!important;font-weight:750!important}.app .pill.good{background:#e8fbf4!important;color:#25856e!important}.app .pill.warn{background:#fff4df!important;color:#a96b13!important}.app .finding{border:1px solid #e3e9f3!important;border-radius:14px!important;background:#fff!important}.app .finding.active{border-color:#9b9cff!important;background:#f8f8ff!important;box-shadow:0 6px 18px rgba(91,93,240,.08)!important}.app .finding-icon{border-radius:10px!important}.app .finding-body b,.app .evidence-detail h4{color:#1c2945!important}.app .finding-body small,.app .evidence-detail p{color:#78849d!important}.app .editor,.app .evidence{border:1px solid #e2e8f3!important;border-radius:18px!important;background:#fff!important;box-shadow:0 6px 22px rgba(29,45,82,.035)!important}.app .editor-head,.app .docbar{background:#f8f9fd!important;border-bottom:1px solid #e7ecf4!important}.app .editor textarea,.app textarea,.app .decision-actions input{background:#fbfcff!important;color:#1b2744!important;border:1px solid #dfe6f1!important;border-radius:12px!important;line-height:1.7!important}.app input::placeholder,.app textarea::placeholder{color:#a0a9bb!important}.app .source-card{background:#f4fbf9!important;border:1px solid #d9f1e9!important;border-radius:13px!important;color:#27856f!important}.app .suggestion{background:#f6f6ff!important;border:1px solid #e4e4ff!important;border-radius:14px!important}.app .suggestion p{color:#4e5a78!important}.app .decision{border:1px solid #dce5f4!important;background:linear-gradient(100deg,#fff,#f8f9ff)!important;border-radius:18px!important;padding:18px!important}.app .decision-copy>span{background:#eafbf5!important;color:#279b80!important;border-radius:12px!important}.app .decision-copy b{color:#1c2945!important}.app .decision-copy small{color:#7e8aa2!important}.app .history-strip{background:#f1f3ff!important;border:1px solid #e0e2ff!important;border-radius:15px!important}.app .intro-card{background:linear-gradient(110deg,#f5f6ff,#f0fcf9)!important;border:1px solid #e2e7f6!important;border-radius:17px!important;color:#5b5df0!important}.app .intro-card b{color:#1c2945!important}.app .intro-card small{color:#7f8ba3!important}.app .table{overflow:hidden!important}.app .table-head{background:#f7f8fc!important;border-bottom:1px solid #e5eaf3!important}.app table th{color:#8b96ad!important;background:#fafbfe!important}.app table td{border-color:#edf0f6!important;color:#5d6982!important}.app table td b{color:#25314d!important}.app .guide-icon{border-radius:14px!important}.app .guide{padding:23px!important}.app .guide p,.app .insight-card p{color:#7c89a2!important;line-height:1.65!important}.app .guide small{color:#53617d!important}.app .insight-hero{background:radial-gradient(circle at 85% 20%,rgba(103,224,204,.2),transparent 25%),linear-gradient(120deg,#192344,#2b3261)!important;border:1px solid #394475!important;border-radius:24px!important;color:#fff!important;overflow:hidden!important}.app .insight-hero h2{color:#fff!important}.app .insight-hero p{color:#c2cbe5!important}.app .insight-hero>span{color:#c8f169!important}.app .big-number{color:#c8f169!important}.app .audit-row{border-bottom:1px solid #edf0f6!important}.app .audit-row>span{background:#f0f1ff!important;color:#5b5df0!important;border-radius:10px!important}.app .audit-row b{color:#25314d!important}.app .audit-row p,.app .audit-row small{color:#7f8ba2!important}.app .toast{background:#192344!important;color:#fff!important;border:1px solid #384474!important;border-radius:13px!important;box-shadow:0 16px 42px rgba(25,35,68,.24)!important}.app .modal-bg{backdrop-filter:blur(10px)!important;background:rgba(17,26,49,.42)!important}.app .command-modal{background:#fff!important;color:#1b2744!important;border:1px solid #e1e7f1!important;border-radius:20px!important;box-shadow:0 24px 80px rgba(24,37,73,.22)!important}.app .command-head{border-bottom:1px solid #e6ebf4!important}.app .command-head input{color:#17223b!important}.app .command-item{color:#52607b!important;border-radius:10px!important}.app .command-item:hover{background:#f2f3ff!important;color:#5b5df0!important}
/* Premium login screen */
.app:has(form) {background:radial-gradient(circle at 18% 18%,rgba(91,93,240,.16),transparent 30%),radial-gradient(circle at 82% 78%,rgba(50,203,180,.13),transparent 28%),#f3f6fc!important}
.app:has(form)>form{background:rgba(255,255,255,.91)!important;color:#17223b!important;border:1px solid #e1e7f1!important;border-radius:24px!important;box-shadow:0 28px 90px rgba(36,49,91,.15)!important;backdrop-filter:blur(18px)!important;padding:38px!important}
.app:has(form)>form p{color:#7c89a2!important}.app:has(form)>form label{color:#596782!important;letter-spacing:1.2px!important}.app:has(form)>form input{background:#f8faff!important;color:#17223b!important;border:1px solid #dfe6f1!important;border-radius:12px!important;padding:13px 14px!important}.app:has(form)>form button[type=submit]{background:linear-gradient(110deg,#5b5df0,#7b72ff)!important;color:#fff!important;border-radius:12px!important;box-shadow:0 9px 20px rgba(91,93,240,.22)!important}
@keyframes aurora-enter{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}@keyframes aurora-sweep{0%,35%{transform:translateX(-110%)}65%,100%{transform:translateX(110%)}}
@media(max-width:1050px){.app .api-state{display:none!important}.app .content{padding-top:25px!important}.app .stats{grid-template-columns:repeat(2,minmax(0,1fr))!important}.app .dash-grid{grid-template-columns:1fr!important}}
@media(max-width:720px){.app .topbar{height:64px!important;padding:0 15px!important}.app .search span,.app .search kbd{display:none!important}.app .content{padding:22px 14px 32px!important}.app .page-head{align-items:flex-start!important;gap:15px!important;flex-direction:column!important}.app .hero{padding:25px!important}.app .orbit-art{opacity:.45!important;right:-35px!important}.app .stats{grid-template-columns:1fr 1fr!important;gap:9px!important}.app .stat{padding:15px!important}.app .stat strong{font-size:24px!important}.app .decision-actions{flex-wrap:wrap!important}.app .decision-actions input{width:100%!important}.app .app .sidebar{z-index:50!important}}
@media(prefers-reduced-motion:reduce){.app *,.app *:before,.app *:after{animation-duration:.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:.01ms!important}}
/* Dark-first Aurora palette */
.app.theme-dark{--ink:#edf2ff;--muted:#9aa8c4;--paper:#0b1020;--surface:#121a2d;--line:#27334c;--blue:#9b9cff;--blue2:#b6a7ff;--teal:#67e0cc;--lime:#c8f169;--shadow:0 18px 46px rgba(0,0,0,.22);background:radial-gradient(ellipse at 72% 0%,rgba(100,87,230,.15),transparent 36%),radial-gradient(ellipse at 18% 45%,rgba(39,111,125,.07),transparent 35%),#0b1020!important;color:#edf2ff!important}
.app.theme-dark .main{background:transparent!important}
.app.theme-dark .topbar{background:rgba(12,17,32,.82)!important;border-bottom-color:#252e46!important}
.app.theme-dark .crumb{color:#8795b2!important}.app.theme-dark .crumb b{color:#f1f4ff!important}
.app.theme-dark .search{background:#141d32!important;border-color:#2a3651!important;color:#aab7d2!important}.app.theme-dark .search kbd{background:#0e1628!important;border-color:#2b3854!important;color:#aab7d2!important}
.app.theme-dark .api-state{background:rgba(37,184,140,.1)!important;border-color:rgba(76,211,169,.22)!important;color:#7de2b9!important}.app.theme-dark .api-state i{background:#53d6a0!important}
.app.theme-dark .icon-btn{background:#151e33!important;border-color:#2a3651!important;color:#b9c5df!important;box-shadow:none!important}.app.theme-dark .icon-btn:hover{background:#202a45!important;border-color:#6f78c8!important;color:#d7d9ff!important}
.app.theme-dark .eyebrow{color:#9ba9c6!important}.app.theme-dark h1{color:#f2f5ff!important}.app.theme-dark .page-head p{color:#9ba8c3!important}.app.theme-dark h1 em{color:#b4a6ff!important}
.app.theme-dark .panel,.app.theme-dark .stat,.app.theme-dark .guide,.app.theme-dark .insight-card{background:linear-gradient(145deg,rgba(22,31,52,.97),rgba(17,25,43,.97))!important;border-color:#293550!important;box-shadow:0 9px 28px rgba(0,0,0,.12)!important}
.app.theme-dark .panel:hover,.app.theme-dark .stat:hover,.app.theme-dark .guide:hover,.app.theme-dark .insight-card:hover{border-color:#46527c!important;box-shadow:0 16px 36px rgba(0,0,0,.22)!important}
.app.theme-dark .panel-head h3,.app.theme-dark .section-head h2,.app.theme-dark .panel h3{color:#edf2ff!important}.app.theme-dark .panel-head p,.app.theme-dark .section-head p{color:#8d9bb8!important}
.app.theme-dark .stat-label{color:#9aa8c4!important}.app.theme-dark .stat-label span{background:rgba(145,137,255,.13)!important;color:#b6a7ff!important}.app.theme-dark .stat strong{color:#f1f4ff!important}.app.theme-dark .stat small{color:#8998b7!important}
.app.theme-dark .queue-row{border-color:#27334c!important}.app.theme-dark .queue-row:hover{background:rgba(139,147,255,.06)!important}.app.theme-dark .file-icon{background:rgba(145,137,255,.14)!important;color:#b6a7ff!important}.app.theme-dark .queue-copy b{color:#eaf0ff!important}.app.theme-dark .queue-copy small{color:#8e9cba!important}.app.theme-dark .queue-footer{background:rgba(145,137,255,.08)!important;color:#b6a7ff!important}
.app.theme-dark .bar-row>span{color:#a4b0ca!important}.app.theme-dark .bar-row>div{background:#26314a!important}.app.theme-dark .insight-box{background:rgba(145,137,255,.09)!important;border-color:#343d64!important;color:#c2baff!important}.app.theme-dark .disclaimer{background:rgba(18,27,46,.7)!important;border-color:#293550!important;color:#8e9cb7!important}
.app.theme-dark .pill.good{background:rgba(42,196,145,.13)!important;color:#7ce0b6!important}.app.theme-dark .pill.warn{background:rgba(247,183,78,.12)!important;color:#f2c477!important}
.app.theme-dark .finding{background:#121b2e!important;border-color:#2a3650!important}.app.theme-dark .finding.active{background:#1a2140!important;border-color:#7d80d8!important;box-shadow:0 8px 24px rgba(100,90,230,.12)!important}.app.theme-dark .finding-body b,.app.theme-dark .evidence-detail h4{color:#edf2ff!important}.app.theme-dark .finding-body small,.app.theme-dark .evidence-detail p{color:#9ba8c3!important}
.app.theme-dark .editor,.app.theme-dark .evidence{background:#121a2d!important;border-color:#2a3650!important;box-shadow:0 8px 26px rgba(0,0,0,.12)!important}.app.theme-dark .editor-head,.app.theme-dark .docbar{background:#172138!important;border-color:#2a3650!important}.app.theme-dark .editor textarea,.app.theme-dark textarea,.app.theme-dark .decision-actions input,.app.theme-dark input{background:#0d1527!important;color:#edf2ff!important;border-color:#303d59!important}.app.theme-dark input::placeholder,.app.theme-dark textarea::placeholder{color:#6f7e9d!important}
.app.theme-dark .source-card{background:rgba(34,174,139,.09)!important;border-color:rgba(69,202,163,.22)!important;color:#7ce0b6!important}.app.theme-dark .suggestion{background:rgba(135,126,255,.08)!important;border-color:#373c69!important}.app.theme-dark .suggestion p{color:#c2cbe2!important}.app.theme-dark .decision{background:linear-gradient(100deg,#151f34,#111a2c)!important;border-color:#2c3954!important}.app.theme-dark .decision-copy>span{background:rgba(34,174,139,.12)!important;color:#7ce0b6!important}.app.theme-dark .decision-copy b{color:#edf2ff!important}.app.theme-dark .decision-copy small{color:#98a6c2!important}
.app.theme-dark .history-strip{background:#151d34!important;border-color:#343d64!important}.app.theme-dark .intro-card{background:linear-gradient(110deg,#1b2140,#142d36)!important;border-color:#343d64!important;color:#c2baff!important}.app.theme-dark .intro-card b{color:#edf2ff!important}.app.theme-dark .intro-card small{color:#9aa8c4!important}
.app.theme-dark .table-head,.app.theme-dark table th{background:#172138!important;border-color:#2a3650!important;color:#9ba8c3!important}.app.theme-dark table td{border-color:#27334c!important;color:#aab6cf!important}.app.theme-dark table td b{color:#edf2ff!important}.app.theme-dark .guide p,.app.theme-dark .insight-card p,.app.theme-dark .guide small{color:#9ba8c3!important}.app.theme-dark .audit-row{border-color:#27334c!important}.app.theme-dark .audit-row>span{background:rgba(145,137,255,.14)!important;color:#b6a7ff!important}.app.theme-dark .audit-row b{color:#edf2ff!important}.app.theme-dark .audit-row p,.app.theme-dark .audit-row small{color:#9ba8c3!important}
.app.theme-dark .command-modal{background:#121a2d!important;color:#edf2ff!important;border-color:#2a3650!important}.app.theme-dark .command-head{border-color:#2a3650!important}.app.theme-dark .command-head input{color:#edf2ff!important}.app.theme-dark .command-item{color:#aab6cf!important}.app.theme-dark .command-item:hover{background:#202945!important;color:#c2baff!important}
.app.theme-dark .primary-button,.app.theme-dark .approve-button{background:linear-gradient(115deg,#7778ff,#9a82ff)!important;color:#fff!important}.app.theme-dark .secondary-button{background:#172138!important;color:#c5d0e8!important;border-color:#33405d!important}.app.theme-dark .reject-button{background:rgba(223,88,115,.1)!important;color:#ff9cae!important;border-color:rgba(223,88,115,.25)!important}.app.theme-dark .text-btn,.app.theme-dark .section-head button,.app.theme-dark .panel-head button{color:#b6a7ff!important}
.app.theme-dark:has(form){background:radial-gradient(circle at 18% 18%,rgba(113,105,255,.18),transparent 30%),radial-gradient(circle at 82% 78%,rgba(50,203,180,.1),transparent 28%),#0b1020!important}.app.theme-dark:has(form)>form{background:rgba(18,26,45,.96)!important;color:#edf2ff!important;border-color:#2a3650!important;box-shadow:0 28px 90px rgba(0,0,0,.45)!important}.app.theme-dark:has(form)>form h1{color:#edf2ff!important}.app.theme-dark:has(form)>form p{color:#9ba8c3!important}.app.theme-dark:has(form)>form label{color:#b4bfd8!important}.app.theme-dark:has(form)>form input{background:#0d1527!important;color:#edf2ff!important;border-color:#303d59!important}.app.theme-dark:has(form)>form button[type=submit]{background:linear-gradient(110deg,#7778ff,#9a82ff)!important;color:white!important}
.app .profile-wrap{position:relative;display:flex;align-items:center}.app .profile-trigger{display:flex;align-items:center;gap:9px;padding:5px 8px 5px 5px;border:1px solid #dce3ef;background:#fff;border-radius:13px;color:#23304d;cursor:pointer}.app .profile-trigger .avatar{display:grid;place-items:center;width:34px;height:34px;border-radius:10px}.app .profile-trigger .profile-name{display:flex;flex-direction:column;text-align:left;line-height:1.2}.app .profile-trigger .profile-name strong{font-size:11px;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.app .profile-trigger .profile-name small{font-size:10px;color:#7d89a1;margin-top:3px}.app .profile-menu{position:absolute;right:0;top:calc(100% + 10px);z-index:80;width:235px;padding:10px;border:1px solid #e0e6f1;background:#fff;border-radius:15px;box-shadow:0 20px 50px rgba(0,0,0,.22);animation:aurora-enter .18s ease both}.app .profile-menu-head{display:flex;align-items:center;gap:10px;padding:9px 8px 13px;border-bottom:1px solid #e6ebf4;margin-bottom:7px}.app .profile-menu-head .avatar{display:grid;place-items:center;width:38px;height:38px;border-radius:11px}.app .profile-menu-head strong{display:block;font-size:13px}.app .profile-menu-head small{display:block;font-size:11px;color:#7d89a1;margin-top:4px}.app .profile-menu button{display:flex;align-items:center;gap:10px;width:100%;padding:10px;border:0;border-radius:9px;background:transparent;color:#52607b;text-align:left;cursor:pointer;font-size:12px}.app .profile-menu button:hover{background:#f1f3ff;color:#5557e9}.app.theme-dark .profile-trigger{background:#151e33;border-color:#2a3651;color:#edf2ff}.app.theme-dark .profile-trigger .profile-name small{color:#93a2bf}.app.theme-dark .profile-menu{background:#121a2d;border-color:#2a3650;color:#edf2ff;box-shadow:0 20px 55px rgba(0,0,0,.5)}.app.theme-dark .profile-menu-head{border-color:#2a3650}.app.theme-dark .profile-menu-head small{color:#9ba8c3}.app.theme-dark .profile-menu button{color:#bac6df}.app.theme-dark .profile-menu button:hover{background:#202945;color:#c2baff}
`;

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

const[theme,setTheme]=useState(()=>localStorage.getItem("bl-theme")||"dark"),[page,setPage]=useState(()=>{const saved=localStorage.getItem("bl-page");return nav.some(n=>n[0]===saved)?saved:"overview"}),[draft,setDraft]=useState(seed),[original]=useState(seed),[title,setTitle]=useState("PayNest Smart Savings — launch campaign"),[campaign,setCampaign]=useState("Q4 Savings Launch"),[findings,setFindings]=useState([]),[active,setActive]=useState(null),[resolved,setResolved]=useState([]),[status,setStatus]=useState("Not reviewed"),[busy,setBusy]=useState(false),[toast,setToast]=useState(""),[versions,setVersions]=useState([{name:"Version 1",text:seed,time:"Just now"}]),[history,setHistory]=useState(false),[comment,setComment]=useState(""),[decision,setDecision]=useState(""),[showEvidence,setShowEvidence]=useState(true),[search,setSearch]=useState(false),[mobile,setMobile]=useState(false),[workspaceOpen,setWorkspaceOpen]=useState(false),[profileOpen,setProfileOpen]=useState(false),[apiMode,setApiMode]=useState(api.configured?"API configured":"Demo mode"),[authenticated,setAuthenticated]=useState(()=>api.authenticated),[currentUsername,setCurrentUsername]=useState(()=>localStorage.getItem("bl-username")||""),[isStaff,setIsStaff]=useState(()=>localStorage.getItem("bl-is-staff")==="true"),[loginUsername,setLoginUsername]=useState(""),[loginPassword,setLoginPassword]=useState(""),[loginBusy,setLoginBusy]=useState(false),[loginError,setLoginError]=useState(""),[backendDraftId,setBackendDraftId]=useState(()=>localStorage.getItem("bl-last-draft-id")),[savedDrafts,setSavedDrafts]=useState([]),[loadingSavedDrafts,setLoadingSavedDrafts]=useState(false),[showAllSavedDrafts,setShowAllSavedDrafts]=useState(false),[savedDraftSearch,setSavedDraftSearch]=useState("");

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
  return <div className={`app theme-${theme}`} style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:"24px",background:"#0b0e14",color:"#f4f5f7"}}><style>{redesignCss}</style>
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

return <div className={`app theme-${theme}`}><style>{redesignCss}</style>

<aside className={`sidebar ${mobile?"mobile":""}`}><div className="logo" role="button" tabIndex={0} aria-label="Go to BrandLedger overview" onClick={()=>{setPage("overview");setMobile(false);setWorkspaceOpen(false)}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setPage("overview");setMobile(false);setWorkspaceOpen(false)}}} style={{cursor:"pointer"}}>
  <span className="logo-mark"><ShieldCheck size={21}/></span>
  <span className="logo-type">BrandLedger<small>BRAND GOVERNANCE</small></span>
  <button className="close-mobile" onClick={e=>{e.stopPropagation();setMobile(false)}}><X size={17}/></button>
</div>
<div style={{position:"relative",marginBottom:"4px"}}>
  <button className="workspace" aria-expanded={workspaceOpen} onClick={()=>setWorkspaceOpen(v=>!v)} style={{width:"100%"}}>
    <b style={{display:"grid",placeItems:"center",fontSize:"16px",fontWeight:800,background:"linear-gradient(145deg,#b6c8ff,#7f98e8)",color:"#111827",boxShadow:"0 3px 10px rgba(127,152,232,.25)"}}>P</b>
    <span style={{minWidth:0,flex:1,textAlign:"left"}}><strong>PayNest</strong><small>Selected workspace</small></span>
    <span style={{display:"flex",alignItems:"center",gap:"5px",fontSize:"10px",fontWeight:700,color:"#8ee0b1",whiteSpace:"nowrap"}}><i style={{width:"6px",height:"6px",borderRadius:"50%",background:"#5bd49a",display:"inline-block"}}/> ACTIVE</span>
    <ChevronDown size={15} style={{transform:workspaceOpen?"rotate(180deg)":"rotate(0deg)",transition:"transform .18s"}}/>
  </button>
  {workspaceOpen&&<div role="dialog" aria-label="PayNest workspace panel" style={{position:"absolute",zIndex:40,top:"calc(100% + 8px)",left:0,right:0,minWidth:"245px",padding:"14px",borderRadius:"14px",border:"1px solid #343a49",background:"linear-gradient(155deg,#1a2030,#11151e)",boxShadow:"0 18px 42px rgba(0,0,0,.42)"}}>
    <div style={{display:"flex",alignItems:"center",gap:"10px",paddingBottom:"12px",borderBottom:"1px solid #303748"}}>
      <span style={{display:"grid",placeItems:"center",width:"42px",height:"42px",borderRadius:"12px",background:"linear-gradient(145deg,#b6c8ff,#7f98e8)",color:"#111827",fontWeight:900,fontSize:"20px"}}>P</span>
      <span style={{flex:1,minWidth:0}}><strong style={{display:"block",fontSize:"14px"}}>PayNest</strong><small style={{display:"block",marginTop:"3px",color:"#9da8bd"}}>Brand governance workspace</small></span>
      <span title="Selected workspace" style={{width:"8px",height:"8px",borderRadius:"50%",background:"#5bd49a",boxShadow:"0 0 0 4px rgba(91,212,154,.12)"}}/>
    </div>
    <div style={{display:"flex",gap:"8px",margin:"12px 0"}}>
      <div style={{flex:1,padding:"9px",borderRadius:"9px",background:"rgba(255,255,255,.045)"}}><small style={{display:"block",fontSize:"10px",color:"#9da8bd"}}>WORKSPACE</small><b style={{display:"block",fontSize:"12px",marginTop:"4px"}}>Demo environment</b></div>
      <div style={{flex:1,padding:"9px",borderRadius:"9px",background:"rgba(91,212,154,.07)"}}><small style={{display:"block",fontSize:"10px",color:"#9da8bd"}}>CONNECTION</small><b style={{display:"block",fontSize:"12px",marginTop:"4px",color:"#8ee0b1"}}>{apiMode==="API connected"?"API connected":apiMode}</b></div>
    </div>
    <small style={{display:"block",fontSize:"10px",fontWeight:800,letterSpacing:"1px",color:"#8d98ae",margin:"2px 0 6px"}}>WORKSPACE SHORTCUTS</small>
    {[
      ["Claims ledger",Layers3,"claims","Review approved product facts"],
      ["Brand guidelines",BookOpen,"guidelines","View rules and voice"],
      ["Guideline insights",Lightbulb,"insights","Explore recurring patterns"]
    ].map(([label,Icon,target,desc])=><button key={target} role="menuitem" onClick={()=>{setPage(target);setWorkspaceOpen(false);setMobile(false)}} style={{display:"flex",alignItems:"center",gap:"9px",width:"100%",textAlign:"left",padding:"9px 8px",border:0,borderRadius:"8px",background:"transparent",color:"inherit",cursor:"pointer"}}>
      <span style={{display:"grid",placeItems:"center",width:"30px",height:"30px",borderRadius:"8px",background:"rgba(182,200,255,.09)",color:"#b6c8ff"}}><Icon size={15}/></span>
      <span style={{flex:1,minWidth:0}}><b style={{display:"block",fontSize:"12px"}}>{label}</b><small style={{display:"block",fontSize:"10px",marginTop:"2px",color:"#9da8bd"}}>{desc}</small></span>
      <ChevronDown size={13} style={{transform:"rotate(-90deg)",color:"#8792a9"}}/>
    </button>)}
    <button onClick={()=>{setWorkspaceOpen(false);setToast("PayNest is the only workspace configured in this local demo. Multi-workspace switching can be added when separate workspaces are supported.")}} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:"7px",width:"100%",marginTop:"8px",padding:"10px",border:"1px solid #3b4356",borderRadius:"9px",background:"rgba(255,255,255,.025)",color:"#dce3f3",fontSize:"12px",fontWeight:700,cursor:"pointer"}}><Settings2 size={14}/> Workspace details <ArrowUpRight size={13}/></button>
  </div>}
</div><div className="nav-label">WORKSPACE</div>{nav.slice(0,2).map(([id,label,Icon])=><button key={id} className={`nav-item ${page===id?"active":""}`} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={17}/>{label}</button>)}<div className="nav-label spaced">GOVERNANCE</div>{nav.slice(2).map(([id,label,Icon])=><button key={id} className={`nav-item ${page===id?"active":""}`} onClick={()=>{setPage(id);setMobile(false)}}><Icon size={17}/>{label}</button>)}<div className="sidebar-bottom"><div className="secure-note"><LockKeyhole size={15}/><span><b>Human-led review</b><small>Nothing publishes automatically.</small></span></div><button className="user" onClick={()=>{setProfileOpen(v=>!v);setToast("Open your profile menu from the top-right profile button.")}} aria-label="User profile"><b>{(currentUsername||"BL").slice(0,2).toUpperCase()}</b><span><strong>{currentUsername||"Signed-in user"}</strong><small>{isStaff?"Brand reviewer":"Content creator"}</small></span><MoreHorizontal size={18}/></button></div></aside>

{mobile&&<button className="scrim" onClick={()=>setMobile(false)} aria-label="Close navigation"/>}

<main className="main"><header className="topbar"><div className="crumb"><button className="mobile-menu" onClick={()=>setMobile(true)}><Menu size={18}/></button><span>PayNest</span><ChevronRight size={13}/><b>{titlePage}</b></div><div className="top-actions"><button className="search" onClick={()=>setSearch(true)}><Search size={15}/><span>Search anything</span><kbd><Command size={10}/> K</kbd></button><span className="api-state"><i/>{apiMode}</span><button className="icon-btn" title="Toggle theme" onClick={()=>setTheme(t=>t==="dark"?"light":"dark")}>{theme==="dark"?<Sun size={17}/>:<Moon size={17}/>}</button><button className="icon-btn" title="Notifications" onClick={()=>setToast("You're all caught up.")}><Bell size={17}/></button><div className="profile-wrap"><button className="profile-trigger" aria-haspopup="menu" aria-expanded={profileOpen} onClick={()=>setProfileOpen(v=>!v)}><span className="avatar">{(currentUsername||"BL").slice(0,2).toUpperCase()}</span><span className="profile-name"><strong>{currentUsername||"Signed-in user"}</strong><small>{isStaff?"Brand reviewer":"Content creator"}</small></span><ChevronDown size={14}/></button>{profileOpen&&<><button aria-label="Close profile menu" onClick={()=>setProfileOpen(false)} style={{position:"fixed",inset:0,zIndex:70,border:0,background:"transparent",cursor:"default"}}/><div className="profile-menu" role="menu"><div className="profile-menu-head"><span className="avatar">{(currentUsername||"BL").slice(0,2).toUpperCase()}</span><span><strong>{currentUsername||"Signed-in user"}</strong><small>{isStaff?"Brand reviewer":"Content creator"}</small></span></div><button role="menuitem" onClick={()=>{setProfileOpen(false);setToast("You're signed in as "+(currentUsername||"user")+".")}}><ShieldCheck size={15}/> Account information</button><button role="menuitem" onClick={()=>{setProfileOpen(false);logout()}} style={{color:"#e06b7b"}}><LogOut size={15}/> Log out</button></div></>}</div></div></header>

<div className="content"><AnimatePresence mode="wait">

{page==="overview"&&<motion.section key="overview" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"> <i/> TUESDAY, OCTOBER 22, 2026</div><h1>Good morning, {currentUsername||"there"} <em>✳</em></h1><p>Your brand's first line of defence starts here.</p></div><Btn kind="primary" onClick={newDraft}><Plus size={16}/> New content review</Btn></div>

<div className="hero"><div className="hero-copy"><span><Sparkles size={14}/> BRAND INTELLIGENCE</span><h2>Consistency isn't a coincidence.<br/><em>It's a system.</em></h2><p>Every claim checked. Every decision traceable. Every voice on-brand.</p><button onClick={()=>setPage("reviews")}>Open review studio <ArrowRight size={15}/></button></div><div className="orbit-art"><div className="orbit o1"/><div className="orbit o2"/><div className="orbit o3"/><div className="core"><ShieldCheck size={36}/></div><label>✓ VERIFIED FACTS</label><label>⌑ HUMAN REVIEW</label><label>↗ LIVE TRACE</label></div></div>

<div className="section-head"><div><h2>Workspace at a glance</h2><p>Here's what's happening across your brand.</p></div><button onClick={()=>setPage("audit")}>View activity <ArrowRight size={14}/></button></div><div className="stats"><Stat label="Reviews this month" value="128" note="+12.8% vs last month" Icon={FileCheck2} delay={.03}/><Stat label="Issues caught" value="346" note="Across 128 reviews" Icon={ShieldAlert} delay={.08}/><Stat label="Awaiting approval" value="04" note="2 need your attention" Icon={Clock3} delay={.13}/><Stat label="Brand consistency" value="94.2%" note="+3.4% this month" Icon={Gauge} delay={.18}/></div>

<div className="dash-grid"><section className="panel queue"><div className="panel-head"><div><h3>Needs your attention</h3><p>Content waiting for a decision</p></div><button onClick={()=>setPage("reviews")}>View queue <ArrowRight size={14}/></button></div>{[{title:"Smart Savings launch copy",meta:"Paid social · Jaiveer Singh · 18 min ago",tag:"3 findings",tone:"red"},{title:"Rewards email campaign",meta:"Email · Ananya Rao · 42 min ago",tag:"1 finding",tone:"amber"},{title:"App onboarding message",meta:"In-app · Rohan Mehta · 1 hr ago",tag:"No critical findings",tone:"green"}].map((x,i)=><button className="queue-row" key={x.title} onClick={()=>{setTitle(x.title);setDraft(i===0?seed:i===1?"Get the best rewards in India with PayNest. Sign up today and enjoy simple payments.":"Welcome to PayNest. Open your account in minutes with a simple, secure setup.");setBackendDraftId(null);setFindings([]);setResolved([]);setPage("reviews")}}><span className="file-icon"><FileText size={17}/></span><span className="queue-copy"><b>{x.title}</b><small>{x.meta}</small><em className={x.tone}>{x.tag}</em></span><span className="queue-status"><Pill tone={i===2?"good":"warn"}>{i===2?"Ready to approve":"Review needed"}</Pill><ChevronRight size={15}/></span></button>)}<button className="queue-footer" onClick={()=>setPage("reviews")}>Open full review queue <ArrowRight size={14}/></button></section>

<section className="panel issues"><div className="panel-head"><div><h3>Common issue types</h3><p>Findings across the last 30 days</p></div><Activity size={16}/></div>{[{name:"Unsupported claims",n:48,w:78,c:"coral"},{name:"Outdated facts",n:36,w:58,c:"amber"},{name:"Off-brand language",n:27,w:44,c:"violet"},{name:"Accessibility",n:14,w:23,c:"blue"}].map((x,i)=><div className="bar-row" key={x.name}><span>{x.name}<b>{x.n}</b></span><div><motion.i className={x.c} initial={{width:0}} animate={{width:x.w+"%"}} transition={{duration:.7,delay:i*.08}}/></div></div>)}<button className="insight-box" onClick={()=>setPage("insights")}><Lightbulb size={17}/><span><b>One guideline may need clarification</b><small>“Promotional claims” has 8 reviewer overrides this month.</small></span><ChevronRight size={15}/></button></section></div><div className="disclaimer"><Shield size={14}/> BrandLedger is a review aid, not a guarantee of compliance. Human approval is always required.</div></motion.section>}

{page==="reviews"&&<motion.section key="reviews" className="view" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}><div className="page-head"><div><div className="eyebrow"><i/> CONTENT GOVERNANCE / REVIEW STUDIO</div><h1>Review workspace</h1><p>Inspect every finding. Understand the evidence. Keep the final call.</p></div><div className="head-buttons"><Btn onClick={()=>setHistory(v=>!v)}><History size={15}/> Version history</Btn><Btn kind="primary" onClick={newDraft}><Plus size={15}/> New draft</Btn></div></div>

{history&&<motion.div className="history-strip" initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}><b><GitCompareArrows size={15}/> Saved versions <small>{versions.length} versions</small></b><div>{versions.map((v,i)=><button key={i} onClick={()=>{setDraft(v.text);setToast(v.name+" restored")}}><strong>{v.name}</strong><small>{v.time}</small></button>)}</div></motion.div>}

<section className="panel" style={{padding:"13px 16px",marginBottom:"14px"}}>
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"12px"}}>
    <div style={{display:"flex",alignItems:"center",gap:"10px",minWidth:0}}>
      <span style={{width:"34px",height:"34px",borderRadius:"10px",display:"grid",placeItems:"center",background:"rgba(117,132,255,.12)",color:"#9da8ff",flexShrink:0}}><FolderOpen size={17}/></span>
      <div style={{minWidth:0}}><b style={{fontSize:"14px"}}>Saved drafts <span style={{fontSize:"11px",fontWeight:600,opacity:.7,marginLeft:"5px"}}>{savedDrafts.length}</span></b><div style={{fontSize:"12px",opacity:.68,marginTop:"3px"}}>Your drafts, saved in the backend.</div></div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:"7px",flexShrink:0}}>
      <button className="icon-btn" title="Refresh saved drafts" onClick={refreshSavedDrafts} disabled={loadingSavedDrafts} style={{width:"32px",height:"32px"}}>{loadingSavedDrafts?<span className="spinner"/>:<RefreshCw size={14}/>}</button>
      {savedDrafts.length>3&&<Btn onClick={()=>setShowAllSavedDrafts(v=>!v)}>{showAllSavedDrafts?"Show recent":"View all drafts"} <ChevronDown size={14}/></Btn>}
    </div>
  </div>
  {savedDrafts.length===0
    ? <div style={{marginTop:"12px",padding:"12px",borderRadius:"10px",border:"1px dashed var(--border, #343a49)",fontSize:"12px",opacity:.75}}>{loadingSavedDrafts?"Loading saved drafts…":authenticated?"No saved drafts yet. Run a review to save your first draft.":"Sign in to load saved drafts."}</div>
    : <>
      {showAllSavedDrafts&&<input aria-label="Search saved drafts" value={savedDraftSearch} onChange={e=>setSavedDraftSearch(e.target.value)} placeholder="Search drafts by title or status…" style={{width:"100%",marginTop:"12px",padding:"9px 11px",borderRadius:"9px",border:"1px solid var(--border, #343a49)",background:"transparent",color:"inherit",fontSize:"12px",boxSizing:"border-box"}}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:"8px",marginTop:"12px"}}>
        {savedDrafts.filter(item=>!showAllSavedDrafts||`${item.title||""} ${item.status||""} ${item.id}`.toLowerCase().includes(savedDraftSearch.toLowerCase())).slice(0,showAllSavedDrafts?savedDrafts.length:3).map(item=><button key={item.id} onClick={()=>openSavedDraft(item.id)} style={{display:"flex",alignItems:"center",gap:"10px",textAlign:"left",padding:"10px 11px",borderRadius:"10px",border:"1px solid var(--border, #343a49)",background:"rgba(255,255,255,.018)",color:"inherit",cursor:"pointer",minWidth:0,transition:"border-color .18s, background .18s"}}>
          <span style={{width:"30px",height:"30px",borderRadius:"8px",display:"grid",placeItems:"center",background:"rgba(255,255,255,.045)",flexShrink:0}}><FileText size={15}/></span>
          <span style={{display:"block",minWidth:0,flex:1}}><b style={{display:"block",fontSize:"12px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.title || `Draft ${item.id}`}</b><small style={{display:"block",opacity:.68,marginTop:"4px",fontSize:"10px"}}>#{item.id} · {item.status || "saved"}</small></span><ChevronRight size={14} style={{opacity:.6,flexShrink:0}}/>
        </button>)}
      </div>
      {showAllSavedDrafts&&savedDrafts.filter(item=>`${item.title||""} ${item.status||""} ${item.id}`.toLowerCase().includes(savedDraftSearch.toLowerCase())).length===0&&<small style={{display:"block",marginTop:"10px",opacity:.7}}>No drafts match that search.</small>}
    </>}
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
