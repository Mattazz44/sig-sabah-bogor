# Application Routing Rules

This project uses React Router for navigation. Ensure URL states and map states are synced cleanly.

## 1. Route Structures
* `/` : The main dashboard splitting the layout between Sidebar (list) and Map.
* `/place/:slug` : A deep-linked detail page for a specific tourist attraction.

## 2. Interaction Guardrails
* **Deep Linking:** When a user visits `/place/:slug`, the app must auto-fetch the coordinate of that place and initialize the map centering directly on that location on first mount.
* **Back Button Integrity:** Ensure clicking the back button from a detail view smoothly returns the user to the main map dashboard without losing their previous category filter state.
