var AeroBundle=(function(I){"use strict";const x="aero-companion-root",h="aero-companion-styles",l="aero-chainlit-panel",g="aero_context_id";let b="",y=!1;function E(){if(document.getElementById(h))return;const e=document.createElement("style");e.id=h,e.textContent=`
    #aero-companion-root {
      all: initial;
      bottom: max(18px, env(safe-area-inset-bottom));
      box-sizing: border-box;
      cursor: pointer;
      display: block;
      height: 86px;
      pointer-events: auto;
      position: fixed;
      right: max(18px, env(safe-area-inset-right));
      width: 86px;
      z-index: 2147483000;
    }
    #aero-companion-root *, #aero-companion-root *::before, #aero-companion-root *::after {
      box-sizing: border-box;
    }
    #aero-chainlit-panel {
      all: initial;
      background: #121a2b;
      border: 1px solid #4b5f7a;
      border-radius: 8px;
      bottom: max(104px, calc(env(safe-area-inset-bottom) + 104px));
      box-shadow: 0 24px 60px rgba(2, 8, 23, 0.38);
      display: none;
      height: min(680px, calc(100vh - 132px));
      overflow: hidden;
      position: fixed;
      right: max(18px, env(safe-area-inset-right));
      width: min(420px, calc(100vw - 36px));
      z-index: 2147482999;
    }
    #aero-chainlit-panel[data-open="true"] {
      display: flex;
      flex-direction: column;
    }
    #aero-chainlit-panel[data-expanded="true"] {
      bottom: max(18px, env(safe-area-inset-bottom));
      height: calc(100vh - max(36px, calc(env(safe-area-inset-bottom) + env(safe-area-inset-top) + 36px)));
      right: max(18px, env(safe-area-inset-right));
      width: min(920px, calc(100vw - 36px));
    }
    #aero-chainlit-panel iframe {
      border: 0;
      display: block;
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
    }
    .aero-panel-toolbar {
      align-items: center;
      background: #121a2b;
      border-bottom: 1px solid #2d3d56;
      color: #dbe4ef;
      display: flex;
      flex: 0 0 auto;
      font: 600 13px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      gap: 8px;
      justify-content: space-between;
      min-height: 40px;
      padding: 6px 8px 6px 12px;
    }
    .aero-panel-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .aero-panel-actions {
      display: flex;
      gap: 4px;
    }
    .aero-panel-action {
      align-items: center;
      appearance: none;
      background: transparent;
      border: 1px solid transparent;
      border-radius: 6px;
      color: #f8fafc;
      cursor: pointer;
      display: inline-flex;
      height: 28px;
      justify-content: center;
      padding: 0;
      width: 28px;
    }
    .aero-panel-action:hover, .aero-panel-action:focus-visible {
      background: rgba(77, 183, 255, 0.15);
      border-color: rgba(143, 209, 255, 0.55);
      outline: none;
    }
    .aero-panel-action svg {
      display: block;
      height: 16px;
      pointer-events: none;
      width: 16px;
    }
    #aero-chainlit-panel[data-expanded="true"] .aero-panel-action[data-action="expand"] .aero-icon-expand,
    #aero-chainlit-panel:not([data-expanded="true"]) .aero-panel-action[data-action="expand"] .aero-icon-collapse {
      display: none;
    }
    .aero-companion {
      all: unset;
      align-items: center;
      animation: aero-float 3.8s ease-in-out infinite;
      cursor: pointer;
      display: flex;
      filter: drop-shadow(0 10px 14px rgba(15, 23, 42, 0.2));
      height: 86px;
      justify-content: center;
      outline: none;
      transform-origin: 50% 70%;
      transition: filter 180ms ease, transform 180ms ease;
      width: 86px;
    }
    .aero-companion:hover, .aero-companion:focus-visible {
      filter: drop-shadow(0 12px 18px rgba(14, 116, 144, 0.28));
      transform: scale(1.07);
    }
    .aero-companion:active {
      transform: scale(0.98) translateY(2px);
    }
    .aero-companion__svg {
      display: block;
      height: 86px;
      overflow: visible;
      width: 86px;
    }
    .aero-companion__body {
      animation: aero-body-breathe 2.9s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    .aero-companion__eye {
      animation: aero-blink 5.6s infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    .aero-companion__blade {
      animation: aero-blade 3.6s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: 64px 64px;
    }
    .aero-companion__hub {
      animation: aero-hub-pulse 2.9s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    .aero-companion__node {
      animation: aero-node-pulse 2.6s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    .aero-companion__sparkle {
      animation: aero-sparkle 2.6s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center;
    }
    .aero-companion__sparkle--late {
      animation-delay: 900ms;
    }
    @keyframes aero-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-7px); }
    }
    @keyframes aero-blink {
      0%, 92%, 100% { transform: scaleY(1); }
      95% { transform: scaleY(0.12); }
    }
    @keyframes aero-body-breathe {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.025); }
    }
    @keyframes aero-blade {
      0%, 100% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(3deg) scale(1.025); }
    }
    @keyframes aero-hub-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    @keyframes aero-node-pulse {
      0%, 100% { opacity: 0.85; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.12); }
    }
    @keyframes aero-sparkle {
      0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
      45%, 65% { opacity: 0.95; transform: scale(1) rotate(12deg); }
    }
    @media (max-width: 720px) {
      #aero-chainlit-panel {
        bottom: max(88px, calc(env(safe-area-inset-bottom) + 88px));
        height: min(640px, calc(100vh - 108px));
        right: max(10px, env(safe-area-inset-right));
        width: calc(100vw - 20px);
      }
      #aero-chainlit-panel[data-expanded="true"] {
        border-radius: 0;
        bottom: 0;
        height: 100vh;
        right: 0;
        width: 100vw;
      }
      #aero-companion-root {
        bottom: max(14px, env(safe-area-inset-bottom));
        height: 68px;
        right: max(14px, env(safe-area-inset-right));
        width: 68px;
      }
      .aero-companion, .aero-companion__svg {
        height: 68px;
        width: 68px;
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .aero-companion, .aero-companion__body, .aero-companion__eye, .aero-companion__blade, .aero-companion__hub, .aero-companion__node, .aero-companion__sparkle {
        animation: none;
      }
    }
  `,document.head.appendChild(e)}function S(){return window.location.pathname.split("/").filter(Boolean).map(decodeURIComponent)}function d(e){const o=new URLSearchParams(window.location.search);for(const a of e){const t=o.get(a);if(t)return t}}function r(){const e=S(),o=e.indexOf("dags"),a=e.indexOf("tasks"),t=e.findIndex(m=>m==="dagRuns"||m==="dag_runs"||m==="runs"),i=e[e.length-1]??"",s=d(["dag_id","dagId"])??(o>=0?e[o+1]:void 0),k=d(["task_id","taskId"])??(a>=0?e[a+1]:void 0),A=d(["dag_run_id","dagRunId","run_id","runId"])??(t>=0?e[t+1]:void 0);let n="other_page";return e.length===0||e.includes("home")||e.includes("dashboard")?n="main_page":e.includes("assets")?n="assets_page":e.includes("admin")?n="admin_page":k||e.includes("taskInstances")||e.includes("task_instances")?n="task_page":e.includes("logs")||i==="log"?n="logs_page":A?n="dag_run_page":s&&(e.includes("grid")||i==="grid")?n="grid_page":s&&(e.includes("graph")||i==="graph")?n="graph_page":s?n="dag_page":e.includes("dags")&&(n="dag_list_page"),{pageType:n,dagId:s,runId:A,taskId:k,path:window.location.pathname,url:window.location.href}}function c(e){const o=new URLSearchParams;return o.set("context_id",_()),o.set("loaded_at",String(Date.now())),`/aero/chainlit/?${o.toString()}`}function M(e){return JSON.stringify({pageType:e.pageType,dagId:e.dagId,runId:e.runId,taskId:e.taskId,path:e.path,url:e.url})}function _(){let e=window.localStorage.getItem(g);return e||(e=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`,window.localStorage.setItem(g,e)),document.cookie=`aero_context_id=${encodeURIComponent(e)}; path=/; SameSite=Lax`,e}async function p(e){const o=M(e);if(o===b)return;b=o;const a=_();try{await fetch(`/aero/context/${encodeURIComponent(a)}`,{body:JSON.stringify(e),credentials:"same-origin",headers:{"Content-Type":"application/json"},method:"POST"})}catch(t){console.warn("Unable to save Aero context",t)}}function C(e){const o=document.getElementById(l);if(o?.getAttribute("data-open")!=="true")return;const a=o.querySelector("iframe");a&&(a.src=c())}function v(){const e=r();p(e),C()}function w(e){const o=window.history[e];window.history[e]=function(...t){const i=o.apply(this,t);return window.dispatchEvent(new Event("aero:navigation")),i}}function L(){y||(y=!0,w("pushState"),w("replaceState"),window.addEventListener("popstate",v),window.addEventListener("aero:navigation",v),p(r()))}function O(e=r()){let o=document.getElementById(l);if(o){const a=o.querySelector("iframe");return a&&(a.src=c()),o}return o=document.createElement("div"),o.id=l,o.setAttribute("data-open","false"),o.setAttribute("data-expanded","false"),o.innerHTML=`
    <div class="aero-panel-toolbar">
      <span class="aero-panel-title">Aero assistant</span>
      <div class="aero-panel-actions">
        <button class="aero-panel-action" type="button" data-action="expand" aria-label="Expand Aero assistant" title="Expand">
          <svg class="aero-icon-expand" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg class="aero-icon-collapse" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 3v5H3M16 3v5h5M8 21v-5H3M21 16h-5v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="aero-panel-action" type="button" data-action="minimize" aria-label="Minimize Aero assistant" title="Minimize">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
    <iframe title="Aero assistant" src="${c()}"></iframe>
  `,o.querySelector('[data-action="expand"]')?.addEventListener("click",()=>{const a=o.getAttribute("data-expanded")==="true";o.setAttribute("data-expanded",String(!a));const t=o.querySelector('[data-action="expand"]');t?.setAttribute("aria-label",a?"Expand Aero assistant":"Collapse Aero assistant"),t?.setAttribute("title",a?"Expand":"Collapse")}),o.querySelector('[data-action="minimize"]')?.addEventListener("click",()=>{o.setAttribute("data-open","false")}),document.body.appendChild(o),o}async function R(){const e=r();await p(e);const o=O(e),a=o.getAttribute("data-open")==="true";o.setAttribute("data-open",String(!a))}function z(e={}){const o=document.createElement("button");return o.className="aero-companion",o.type="button",o.setAttribute("aria-label","Aero assistant"),o.setAttribute("title","Aero"),o.dataset.aeroState=e.state??"idle",o.innerHTML=`
    <svg class="aero-companion__svg" viewBox="0 0 128 128" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="aero-hub-glow" cx="38%" cy="28%" r="70%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="62%" stop-color="#f8fbff"/>
          <stop offset="100%" stop-color="#dbeafe"/>
        </linearGradient>
        <linearGradient id="aero-blue-blade" x1="28" x2="64" y1="28" y2="64">
          <stop offset="0%" stop-color="#00c7d4"/>
          <stop offset="100%" stop-color="#017cee"/>
        </linearGradient>
        <linearGradient id="aero-green-blade" x1="64" x2="100" y1="28" y2="64">
          <stop offset="0%" stop-color="#00d084"/>
          <stop offset="100%" stop-color="#20a53a"/>
        </linearGradient>
        <linearGradient id="aero-red-blade" x1="100" x2="64" y1="100" y2="64">
          <stop offset="0%" stop-color="#ff7043"/>
          <stop offset="100%" stop-color="#e43936"/>
        </linearGradient>
        <linearGradient id="aero-gold-blade" x1="28" x2="64" y1="100" y2="64">
          <stop offset="0%" stop-color="#ffd166"/>
          <stop offset="100%" stop-color="#f39c12"/>
        </linearGradient>
        <filter id="aero-soft-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.24"/>
        </filter>
      </defs>
      <ellipse cx="64" cy="111" rx="31" ry="6" fill="#017cee" opacity="0.15"/>
      <g class="aero-companion__body" filter="url(#aero-soft-shadow)">
        <g class="aero-companion__blade">
          <path d="M57 52 31 26c11-8 27-7 38 3l9 9z" fill="url(#aero-blue-blade)" stroke="#0f6fde" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M76 57 102 31c8 11 7 27-3 38l-9 9z" fill="url(#aero-green-blade)" stroke="#168c35" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M71 76 97 102c-11 8-27 7-38-3l-9-9z" fill="url(#aero-red-blade)" stroke="#c8322f" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M52 71 26 97c-8-11-7-27 3-38l9-9z" fill="url(#aero-gold-blade)" stroke="#d8890f" stroke-width="2.5" stroke-linejoin="round"/>
        </g>
        <circle class="aero-companion__node" cx="31" cy="26" r="7" fill="#00c7d4" stroke="#ffffff" stroke-width="3"/>
        <circle class="aero-companion__node" cx="102" cy="31" r="7" fill="#00d084" stroke="#ffffff" stroke-width="3"/>
        <circle class="aero-companion__node" cx="97" cy="102" r="7" fill="#ff7043" stroke="#ffffff" stroke-width="3"/>
        <circle class="aero-companion__node" cx="26" cy="97" r="7" fill="#ffd166" stroke="#ffffff" stroke-width="3"/>
        <circle class="aero-companion__hub" cx="64" cy="64" r="25" fill="url(#aero-hub-glow)" stroke="#0f2d5c" stroke-width="3.4"/>
        <circle class="aero-companion__eye" cx="55" cy="61" r="5.6" fill="#0f2d5c"/>
        <circle class="aero-companion__eye" cx="73" cy="61" r="5.6" fill="#0f2d5c"/>
        <circle cx="53.3" cy="58.6" r="1.8" fill="#ffffff"/>
        <circle cx="71.3" cy="58.6" r="1.8" fill="#ffffff"/>
        <path d="M58 72c3.5 4 8.5 4 12 0" fill="none" stroke="#0f2d5c" stroke-width="3.2" stroke-linecap="round"/>
      </g>
      <path class="aero-companion__sparkle" d="M113 19l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#00c7d4"/>
      <path class="aero-companion__sparkle aero-companion__sparkle--late" d="M17 39l1.5 3.5L22 44l-3.5 1.5L17 49l-1.5-3.5L12 44l3.5-1.5z" fill="#ffd166"/>
    </svg>
  `,o.addEventListener("click",()=>{console.log("Aero clicked",r()),R()}),o}function f(e){if(typeof document>"u")return;E(),L();let o=document.getElementById(x);o||(o=document.createElement("div"),o.id=x,document.body.appendChild(o)),o.querySelector(".aero-companion")||o.appendChild(z(e))}function u(e={}){return I.useEffect(()=>{f(e)},[e]),null}return document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>f(),{once:!0}):f(),globalThis.Aero=u,globalThis.AirflowPlugin=u,u})(React);
