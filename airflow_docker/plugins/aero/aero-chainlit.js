(() => {
  const href = "/aero/static/aero-favicon.svg?v=20261001-airflow-mark";
  const setIcon = () => {
    const existing = document.querySelector("link[rel='icon']");
    const icon = existing || document.createElement("link");
    icon.rel = "icon";
    icon.type = "image/svg+xml";
    icon.href = href;
    if (!existing) document.head.appendChild(icon);
    document.title = "Aero";
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setIcon, { once: true });
  } else {
    setIcon();
  }
})();
