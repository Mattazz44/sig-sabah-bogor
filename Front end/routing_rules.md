# Application Routing Rules

This project uses React Router for navigation. Ensure URL states and map states are synced cleanly.

## 1. Route Structures
* `/` : The main dashboard splitting the layout between Floating Bottom Sheet (list) and Fullscreen Leaflet Map.
* `/place/:slug` : A deep-linked detail page for a specific tourist attraction.
* `/for-you` (alias `/untuk-anda`) : The personalized recommendation feed ("Untuk Kamu") based on recent user activities.
* `/saved` (alias `/tersimpan`) : The saved activity and bookmark manager ("Aktivitas Tersimpan") with category folders in a 2x2 quadrant layout.

## 2. Interaction Guardrails
* **Deep Linking:** When a user visits `/place/:slug`, the app auto-fetches the coordinate of that place and initializes the map centering directly on that location on first mount.
* **Back Button Integrity:** Clicking the back button from a detail view smoothly returns the user to the main map dashboard without losing their previous category filter state.
* **Tab Synchronization:** The fixed Bottom Navigation Bar stays permanently fixed across all main views (`/`, `/for-you`, `/saved`), dynamically applying `font-bold` and active contrast to the active tab.
