"use client";

import { useEffect, useRef } from "react";

const useTradingViewWidget = (
  scriptUrl: string,
  config: Record<string, unknown>,
  height = 600,
) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (container.dataset.loaded) return;

    const widgetRoot = container.querySelector<HTMLDivElement>(
      ".tradingview-widget-container__widget",
    );

    if (!widgetRoot) return;

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.innerHTML = JSON.stringify(config);

    container.appendChild(script);
    container.dataset.loaded = "true";

    return () => {
      script.remove();
      widgetRoot.replaceChildren();
      delete container.dataset.loaded;
    };
  }, [scriptUrl, config, height]);

  return containerRef;
};

export default useTradingViewWidget;
