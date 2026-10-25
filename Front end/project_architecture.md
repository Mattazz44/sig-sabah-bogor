# React + Leaflet Project Architecture

You must strictly organize the source code according to the component-driven development architecture below. Do not clutter `App.jsx`.

## 1. Folder Structure
```text
src/
├── components/
│   ├── map/
│   │   ├── MapContainer.jsx    # Main Leaflet setup
│   │   ├── MapMarker.jsx       # Custom Leaflet markers
│   │   └── MapPopup.jsx        # Pop-up design for tourist spots
│   ├── sidebar/
│   │   ├── SidebarContainer.jsx # Sidebar wrapper
│   │   ├── TouristList.jsx     # List of places
│   │   └── TouristCard.jsx     # Individual card item
│   └── ui/                     # Generic buttons, badges, modals
├── data/
│   └── tourists.json           # Mock tourist data based on spec
├── hooks/
│   └── useMapControls.js       # Custom hooks for map flying/filtering
├── App.jsx
└── main.jsx
```

## 2. Component Coupling Rules
* **Lifting State Up:** Keep the active/selected tourist spot state in `App.jsx` or a shared context so both the Sidebar and the Map can access it simultaneously.
* **Leaflet Isolation:** Never import raw Leaflet libraries inside sidebar components. Keep all GIS logic strictly enclosed inside the `components/map/` directory.
