# Map Trail Game — Lunetten Time Trial

Browser-based semi-3D driving prototype set in Utrecht's Lunetten neighborhood.

## Run

Requires Node.js 20+.

```bash
npm install
npm run dev
```

The game requests OpenStreetMap road/building geometry from the public Overpass API when loaded. Attribution: © OpenStreetMap contributors (ODbL). Public Overpass services can be rate-limited or unavailable.

## Prototype scope

This is an early driving-feel slice: stylized block buildings from real mapped footprints, keyboard driving, chase camera, lap timer and checkpoints. The route/checkpoint placement is a rough prototype, not a surveyed or exact circuit.

Controls: WASD / arrow keys; R resets the run.
