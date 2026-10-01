var AeroBundle=(function(S){"use strict";const g="aero-companion-root",h="aero-companion-styles",c="aero-chainlit-panel",x="aero_context_id";let _="",y=!1;function A(){if(document.getElementById(h))return;const e=document.createElement("style");e.id=h,e.textContent=`
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
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.18);
      border-radius: 8px;
      bottom: max(104px, calc(env(safe-area-inset-bottom) + 104px));
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.26);
      display: none;
      height: min(680px, calc(100vh - 132px));
      overflow: hidden;
      position: fixed;
      right: max(18px, env(safe-area-inset-right));
      width: min(420px, calc(100vw - 36px));
      z-index: 2147482999;
    }
    #aero-chainlit-panel[data-open="true"] {
      display: block;
    }
    #aero-chainlit-panel iframe {
      border: 0;
      display: block;
      height: 100%;
      width: 100%;
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
    .aero-companion__wing {
      animation: aero-wing 1.45s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: center center;
    }
    .aero-companion__wing--right {
      animation-delay: 110ms;
    }
    .aero-companion__curl {
      animation: aero-curl 2.4s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: 50% 70%;
    }
    .aero-companion__wisp {
      animation: aero-wisp 2.8s ease-in-out infinite;
    }
    .aero-companion__wisp--late {
      animation-delay: 650ms;
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
    @keyframes aero-wing {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      50% { transform: rotate(-8deg) translateY(-2px); }
    }
    @keyframes aero-curl {
      0%, 100% { transform: rotate(0deg) translateY(0); }
      50% { transform: rotate(7deg) translateY(-1px); }
    }
    @keyframes aero-wisp {
      0%, 100% { opacity: 0.5; transform: translateX(0) scale(1); }
      50% { opacity: 0.95; transform: translateX(3px) scale(1.04); }
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
      .aero-companion, .aero-companion__body, .aero-companion__eye, .aero-companion__wing, .aero-companion__curl, .aero-companion__wisp, .aero-companion__sparkle {
        animation: none;
      }
    }
  `,document.head.appendChild(e)}function E(){return window.location.pathname.split("/").filter(Boolean).map(decodeURIComponent)}function l(e){const o=new URLSearchParams(window.location.search);for(const t of e){const n=o.get(t);if(n)return n}}function r(){const e=E(),o=e.indexOf("dags"),t=e.indexOf("tasks"),n=e.findIndex(u=>u==="dagRuns"||u==="dag_runs"||u==="runs"),i=e[e.length-1]??"",s=l(["dag_id","dagId"])??(o>=0?e[o+1]:void 0),v=l(["task_id","taskId"])??(t>=0?e[t+1]:void 0),I=l(["dag_run_id","dagRunId","run_id","runId"])??(n>=0?e[n+1]:void 0);let a="other_page";return e.length===0||e.includes("home")||e.includes("dashboard")?a="main_page":e.includes("assets")?a="assets_page":e.includes("admin")?a="admin_page":v||e.includes("taskInstances")||e.includes("task_instances")?a="task_page":e.includes("logs")||i==="log"?a="logs_page":I?a="dag_run_page":s&&(e.includes("grid")||i==="grid")?a="grid_page":s&&(e.includes("graph")||i==="graph")?a="graph_page":s?a="dag_page":e.includes("dags")&&(a="dag_list_page"),{pageType:a,dagId:s,runId:I,taskId:v,path:window.location.pathname,url:window.location.href}}function d(e){const o=new URLSearchParams;return o.set("context_id",w()),o.set("loaded_at",String(Date.now())),`/aero/chainlit/?${o.toString()}`}function C(e){return JSON.stringify({pageType:e.pageType,dagId:e.dagId,runId:e.runId,taskId:e.taskId,path:e.path,url:e.url})}function w(){let e=window.localStorage.getItem(x);return e||(e=crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(16).slice(2)}`,window.localStorage.setItem(x,e)),document.cookie=`aero_context_id=${encodeURIComponent(e)}; path=/; SameSite=Lax`,e}async function f(e){const o=C(e);if(o===_)return;_=o;const t=w();try{await fetch(`/aero/context/${encodeURIComponent(t)}`,{body:JSON.stringify(e),credentials:"same-origin",headers:{"Content-Type":"application/json"},method:"POST"})}catch(n){console.warn("Unable to save Aero context",n)}}function O(e){const o=document.getElementById(c);if(o?.getAttribute("data-open")!=="true")return;const t=o.querySelector("iframe");t&&(t.src=d())}function b(){const e=r();f(e),O()}function k(e){const o=window.history[e];window.history[e]=function(...n){const i=o.apply(this,n);return window.dispatchEvent(new Event("aero:navigation")),i}}function R(){y||(y=!0,k("pushState"),k("replaceState"),window.addEventListener("popstate",b),window.addEventListener("aero:navigation",b),f(r()))}function L(e=r()){let o=document.getElementById(c);if(o){const t=o.querySelector("iframe");return t&&(t.src=d()),o}return o=document.createElement("div"),o.id=c,o.setAttribute("data-open","false"),o.innerHTML=`<iframe title="Aero assistant" src="${d()}"></iframe>`,document.body.appendChild(o),o}async function M(){const e=r();await f(e);const o=L(e),t=o.getAttribute("data-open")==="true";o.setAttribute("data-open",String(!t))}function T(e={}){const o=document.createElement("button");return o.className="aero-companion",o.type="button",o.setAttribute("aria-label","Aero assistant"),o.setAttribute("title","Aero"),o.dataset.aeroState=e.state??"idle",o.innerHTML=`
    <svg class="aero-companion__svg" viewBox="0 0 128 128" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="aero-body-glow" cx="38%" cy="26%" r="72%">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="52%" stop-color="#f4fbff"/>
          <stop offset="100%" stop-color="#9bdcff"/>
        </radialGradient>
        <linearGradient id="aero-sky-wing" x1="20" x2="106" y1="100" y2="26">
          <stop offset="0%" stop-color="#7dd3fc"/>
          <stop offset="54%" stop-color="#60a5fa"/>
          <stop offset="100%" stop-color="#dff6ff"/>
        </linearGradient>
        <linearGradient id="aero-tail" x1="82" x2="126" y1="92" y2="54">
          <stop offset="0%" stop-color="#bfecff" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.82"/>
        </linearGradient>
        <filter id="aero-soft-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="#0284c7" flood-opacity="0.22"/>
        </filter>
      </defs>
      <ellipse cx="63" cy="111" rx="30" ry="6" fill="#38bdf8" opacity="0.16"/>
      <path class="aero-companion__wisp" d="M100 88c19-2 29-13 22-23-5-8-16-4-18 4" fill="none" stroke="url(#aero-tail)" stroke-width="7" stroke-linecap="round"/>
      <path class="aero-companion__wisp aero-companion__wisp--late" d="M20 79c-10 2-16-3-15-9 1-8 12-12 22-8" fill="none" stroke="#7dd3fc" stroke-width="6" stroke-linecap="round" opacity="0.9"/>
      <path class="aero-companion__wing" d="M40 48C26 39 21 25 22 13c14 6 24 18 26 34z" fill="url(#aero-sky-wing)" stroke="#60a5fa" stroke-width="2.6" stroke-linejoin="round"/>
      <path class="aero-companion__wing aero-companion__wing--right" d="M90 54c15-8 25-7 32-1-8 13-20 20-34 18z" fill="url(#aero-sky-wing)" stroke="#60a5fa" stroke-width="2.6" stroke-linejoin="round"/>
      <g class="aero-companion__body" filter="url(#aero-soft-shadow)">
        <path d="M40 91c-16 0-29-10-29-24 0-12 10-22 24-24 5-15 18-25 35-25 20 0 35 14 38 33 8 4 13 11 13 20 0 13-12 23-29 23H40z" fill="url(#aero-body-glow)" stroke="#60a5fa" stroke-width="3.4" stroke-linejoin="round"/>
        <path d="M47 88c11 9 34 9 48 0-6 12-16 18-29 18-10 0-17-6-19-18z" fill="#7dd3fc" opacity="0.34"/>
        <path class="aero-companion__curl" d="M65 26c12-17 36 0 18 19-7 7-17 5-19-3 7 3 17-1 16-9-1-6-9-9-15-7z" fill="#e8f8ff" stroke="#93c5fd" stroke-width="2.5" stroke-linejoin="round"/>
        <circle class="aero-companion__eye" cx="51" cy="64" r="7.2" fill="#0f2d5c"/>
        <circle class="aero-companion__eye" cx="79" cy="64" r="7.2" fill="#0f2d5c"/>
        <circle cx="48.5" cy="60.5" r="2.2" fill="#ffffff"/>
        <circle cx="76.5" cy="60.5" r="2.2" fill="#ffffff"/>
        <circle cx="36" cy="73" r="4.6" fill="#fda4af" opacity="0.76"/>
        <circle cx="94" cy="73" r="4.6" fill="#fda4af" opacity="0.76"/>
        <path d="M60 76c4 5 10 5 14 0" fill="none" stroke="#0f2d5c" stroke-width="3.4" stroke-linecap="round"/>
      </g>
      <path class="aero-companion__sparkle" d="M112 26l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#7dd3fc"/>
      <path class="aero-companion__sparkle aero-companion__sparkle--late" d="M25 31l1.5 3.5L30 36l-3.5 1.5L25 41l-1.5-3.5L20 36l3.5-1.5z" fill="#bae6fd"/>
    </svg>
  `,o.addEventListener("click",()=>{console.log("Aero clicked",r()),M()}),o}function p(e){if(typeof document>"u")return;A(),R();let o=document.getElementById(g);o||(o=document.createElement("div"),o.id=g,document.body.appendChild(o)),o.querySelector(".aero-companion")||o.appendChild(T(e))}function m(e={}){return S.useEffect(()=>{p(e)},[e]),null}return document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>p(),{once:!0}):p(),globalThis.Aero=m,globalThis.AirflowPlugin=m,m})(React);
