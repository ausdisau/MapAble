/**
 * MapAble embeddable floor-plan viewer (Iteration 14).
 * Usage:
 * <script src="https://mapable.com.au/embed/mapable-viewer.js" data-venue-id="..." data-view="floor-plan"></script>
 */
(function () {
  const script = document.currentScript;
  if (!script) return;

  const venueId = script.getAttribute("data-venue-id");
  const view = script.getAttribute("data-view") || "floor-plan";
  const height = script.getAttribute("data-height") || "640";

  if (!venueId) {
    console.error("[MapAble embed] data-venue-id is required");
    return;
  }

  const container = document.createElement("div");
  container.setAttribute("role", "region");
  container.setAttribute("aria-label", "MapAble accessibility viewer");
  container.style.width = "100%";
  container.style.maxWidth = "100%";

  const iframe = document.createElement("iframe");
  const origin = script.getAttribute("data-origin") || "https://mapable.com.au";
  iframe.src = `${origin}/accessibility-map?embed=1&venue=${encodeURIComponent(venueId)}&view=${encodeURIComponent(view)}`;
  iframe.title = "MapAble floor plan viewer";
  iframe.style.width = "100%";
  iframe.style.height = `${height}px`;
  iframe.style.border = "0";
  iframe.setAttribute("loading", "lazy");
  iframe.setAttribute(
    "sandbox",
    "allow-scripts allow-same-origin allow-popups allow-forms",
  );

  const attribution = document.createElement("p");
  attribution.style.fontSize = "12px";
  attribution.style.marginTop = "4px";
  attribution.style.color = "#475569";
  attribution.textContent = "Accessibility data by MapAble · © OpenStreetMap contributors";

  script.parentNode?.insertBefore(container, script.nextSibling);
  container.appendChild(iframe);
  container.appendChild(attribution);
})();
