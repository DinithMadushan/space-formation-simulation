# Space Formation Simulation

A pure JavaScript and HTML5 Canvas simulation that orchestrates a collection of units into various complex geometric patterns and flight formations.

## Features

*   **HTML5 Canvas Rendering:** Lightweight and efficient rendering of simulation units.
*   **Dynamic Formations:** Units transition between different target shapes on the fly.
*   **Adjustable Spread:** Scale the size and spacing of formations dynamically via a 1–10 scale multiplier.

## Available Formations

The simulation includes several mathematically calculated target formations (see `formations.js`):

*   **Swarm:** A random cloud orbiting the center.
*   **Grid:** A structured rectangular grid.
*   **Circle / Orbit:** Concentric rings.
*   **Spiral:** An Archimedean spiral.
*   **V-Wing:** A classic V/wedge flight formation.
*   **Diamond:** A rhombus / diamond shape.
*   **Arrow:** A filled arrowhead pointing up.
*   **Helix:** A double helix (two interleaved spirals).

## Getting Started

1. Clone the repository or download the files.
2. Open your HTML file (which should include a `<canvas id="sim-canvas"></canvas>`) in any modern web browser.
3. The simulation initializes automatically when the DOM is ready.

## Architecture Overview

*   **`main.js`**: The entry point that bootstraps the `Simulation` and `UI` once the DOM is ready. It exposes `__sim` to the global window object for easy debugging.
*   **`formations.js`**: A collection of pure functions responsible for calculating the `{x, y}` target coordinates for any given number of units based on the canvas center and spread multiplier.