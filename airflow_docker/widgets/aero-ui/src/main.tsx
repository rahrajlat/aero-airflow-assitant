import React, { useEffect } from "react";

const AERO_ROOT_ID = "aero-companion-root";
const AERO_STYLE_ID = "aero-companion-styles";
const AERO_PANEL_ID = "aero-chainlit-panel";
const AERO_CONTEXT_STORAGE_KEY = "aero_context_id";
let lastSavedContextKey = "";
let routeObserverStarted = false;

type AeroContext = {
  pageType?: string;
  dagId?: string;
  taskId?: string;
  runId?: string;
  path?: string;
  url?: string;
  state?: "idle" | "success" | "failed" | "thinking";
};

declare global {
  interface Window {
    Aero?: typeof AeroPluginRoot;
    AirflowPlugin?: typeof AeroPluginRoot;
  }
}

function ensureStyles() {
  if (document.getElementById(AERO_STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = AERO_STYLE_ID;
  style.textContent = `
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
  `;

  document.head.appendChild(style);
}

function getPathParts() {
  return window.location.pathname.split("/").filter(Boolean).map(decodeURIComponent);
}

function getQueryValue(names: string[]) {
  const params = new URLSearchParams(window.location.search);
  for (const name of names) {
    const value = params.get(name);
    if (value) {
      return value;
    }
  }
  return undefined;
}

function detectPageContext(): AeroContext {
  const parts = getPathParts();
  const dagIndex = parts.indexOf("dags");
  const taskIndex = parts.indexOf("tasks");
  const runIndex = parts.findIndex((part) => part === "dagRuns" || part === "dag_runs" || part === "runs");
  const pageLeaf = parts[parts.length - 1] ?? "";

  const dagId = getQueryValue(["dag_id", "dagId"]) ?? (dagIndex >= 0 ? parts[dagIndex + 1] : undefined);
  const taskId = getQueryValue(["task_id", "taskId"]) ?? (taskIndex >= 0 ? parts[taskIndex + 1] : undefined);
  const runId = getQueryValue(["dag_run_id", "dagRunId", "run_id", "runId"]) ?? (runIndex >= 0 ? parts[runIndex + 1] : undefined);

  let pageType = "other_page";
  if (parts.length === 0 || parts.includes("home") || parts.includes("dashboard")) {
    pageType = "main_page";
  } else if (parts.includes("assets")) {
    pageType = "assets_page";
  } else if (parts.includes("admin")) {
    pageType = "admin_page";
  } else if (taskId || parts.includes("taskInstances") || parts.includes("task_instances")) {
    pageType = "task_page";
  } else if (parts.includes("logs") || pageLeaf === "log") {
    pageType = "logs_page";
  } else if (runId) {
    pageType = "dag_run_page";
  } else if (dagId && (parts.includes("grid") || pageLeaf === "grid")) {
    pageType = "grid_page";
  } else if (dagId && (parts.includes("graph") || pageLeaf === "graph")) {
    pageType = "graph_page";
  } else if (dagId) {
    pageType = "dag_page";
  } else if (parts.includes("dags")) {
    pageType = "dag_list_page";
  }

  return {
    pageType,
    dagId,
    runId,
    taskId,
    path: window.location.pathname,
    url: window.location.href
  };
}

function buildChainlitUrl(context: AeroContext) {
  const params = new URLSearchParams();
  params.set("context_id", getAeroContextId());
  params.set("loaded_at", String(Date.now()));
  return `/aero/chainlit/?${params.toString()}`;
}

function contextKey(context: AeroContext) {
  return JSON.stringify({
    pageType: context.pageType,
    dagId: context.dagId,
    runId: context.runId,
    taskId: context.taskId,
    path: context.path,
    url: context.url
  });
}

function getAeroContextId() {
  let contextId = window.localStorage.getItem(AERO_CONTEXT_STORAGE_KEY);
  if (!contextId) {
    contextId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(AERO_CONTEXT_STORAGE_KEY, contextId);
  }
  document.cookie = `aero_context_id=${encodeURIComponent(contextId)}; path=/; SameSite=Lax`;
  return contextId;
}

async function saveAeroContext(context: AeroContext) {
  const key = contextKey(context);
  if (key === lastSavedContextKey) {
    return;
  }
  lastSavedContextKey = key;
  const contextId = getAeroContextId();
  try {
    await fetch(`/aero/context/${encodeURIComponent(contextId)}`, {
      body: JSON.stringify(context),
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
  } catch (error) {
    console.warn("Unable to save Aero context", error);
  }
}

function refreshOpenPanel(context: AeroContext) {
  const panel = document.getElementById(AERO_PANEL_ID);
  if (panel?.getAttribute("data-open") !== "true") {
    return;
  }

  const iframe = panel.querySelector("iframe");
  if (iframe) {
    iframe.src = buildChainlitUrl(context);
  }
}

function handleRouteChange() {
  const context = detectPageContext();
  void saveAeroContext(context);
  refreshOpenPanel(context);
}

function patchHistoryMethod(name: "pushState" | "replaceState") {
  const original = window.history[name];
  window.history[name] = function patchedHistoryMethod(...args) {
    const result = original.apply(this, args);
    window.dispatchEvent(new Event("aero:navigation"));
    return result;
  };
}

function startRouteObserver() {
  if (routeObserverStarted) {
    return;
  }
  routeObserverStarted = true;
  patchHistoryMethod("pushState");
  patchHistoryMethod("replaceState");
  window.addEventListener("popstate", handleRouteChange);
  window.addEventListener("aero:navigation", handleRouteChange);
  void saveAeroContext(detectPageContext());
}

function ensurePanel(context: AeroContext = detectPageContext()) {
  let panel = document.getElementById(AERO_PANEL_ID);
  if (panel) {
    const iframe = panel.querySelector("iframe");
    if (iframe) {
      iframe.src = buildChainlitUrl(context);
    }
    return panel;
  }

  panel = document.createElement("div");
  panel.id = AERO_PANEL_ID;
  panel.setAttribute("data-open", "false");
  panel.innerHTML = `<iframe title="Aero assistant" src="${buildChainlitUrl(context)}"></iframe>`;
  document.body.appendChild(panel);
  return panel;
}

async function togglePanel() {
  const context = detectPageContext();
  await saveAeroContext(context);
  const panel = ensurePanel(context);
  const isOpen = panel.getAttribute("data-open") === "true";
  panel.setAttribute("data-open", String(!isOpen));
}

function buildAeroElement(context: AeroContext = {}) {
  const button = document.createElement("button");
  button.className = "aero-companion";
  button.type = "button";
  button.setAttribute("aria-label", "Aero assistant");
  button.setAttribute("title", "Aero");
  button.dataset.aeroState = context.state ?? "idle";
  button.innerHTML = `
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
  `;

  button.addEventListener("click", () => {
    console.log("Aero clicked", detectPageContext());
    void togglePanel();
  });

  return button;
}

function mountAero(context?: AeroContext) {
  if (typeof document === "undefined") {
    return;
  }

  ensureStyles();
  startRouteObserver();

  let root = document.getElementById(AERO_ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = AERO_ROOT_ID;
    document.body.appendChild(root);
  }

  if (!root.querySelector(".aero-companion")) {
    root.appendChild(buildAeroElement(context));
  }
}

function AeroPluginRoot(props: AeroContext = {}) {
  useEffect(() => {
    mountAero(props);
  }, [props]);

  return null;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => mountAero(), { once: true });
} else {
  mountAero();
}

globalThis.Aero = AeroPluginRoot;
globalThis.AirflowPlugin = AeroPluginRoot;

export default AeroPluginRoot;
