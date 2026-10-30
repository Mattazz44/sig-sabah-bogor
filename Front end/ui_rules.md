# Antigravity UI & GIS Implementation Rules

You are a strict Frontend & GIS Implementation Agent. Your goal is to build a pixel-perfect Tourist GIS Application using React JS (Vite), Leaflet, and React-Leaflet. You must leverage Antigravity's Browser Agent to verify map rendering and UI overlays.

## 1. Map & Layout Discipline (Anti-AI Slop)
* **Explicit Map Dimensions:** Always define a strict, explicit height and width for the Leaflet container (e.g., `h-screen`, `h-[500px]`). Never leave it auto or responsive without a wrapper, as it causes the map to render blank (0px height).
* **Z-Index Hierarchy:** Strictly manage overlays. Ensure the Map container has a proper `z-index` (Leaflet defaults to 400). Any custom Sidebar, Floating Action Buttons (FAB), or Navbar must be explicitly layered on top of the map using proper stacking context (e.g., `z-[500]`).
* **No Creative Map Styles:** Do not use random, unrequested map tile providers. Stick strictly to the standard OpenStreetMap (OSM) tiles or the specific custom tile provider defined in the project specs.

## 2. GIS Component & Marker Constraints
* **Marker Visuals:** Use the custom design assets provided for markers/pins. Do not let the AI use raw, default blue Leaflet pins unless explicitly told to. Ensure anchor points (`iconAnchor`, `popupAnchor`) are mathematically aligned so pins don't "float" when zooming.
* **Pop-up Styling:** Tailor Leaflet Pop-ups to match the UI mockup perfectly. Override default Leaflet pop-up paddings and borders using strict CSS utility classes rather than letting the browser inject default generic styles.
* **Control UI Elements:** Disable default Leaflet controls (like zoom buttons or attribution placement) if the UI mockup shows custom zoom buttons or a clean map view.

## 3. Workflow & Self-Correction
* **Browser Map Verification:** Every time you write map features, you MUST invoke the Antigravity Browser Agent. You must verify that the map tiles actually load, markers are visible, and zooming does not break the layout framework.
* **State & Performance Guardrails:** When linking the tourist list sidebar with the map, ensure state updates do not trigger infinite map re-centers or laggy re-renders. Use standard React optimization patterns.

## 4. Execution Guardrails
* **Stop & Ask:** If the coordinate data format, marker design, or panel placement is ambiguous in the mockup, stop and ask the user for clarification instead of guessing.
