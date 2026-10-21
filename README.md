# Map Trail Game — Lunetten Time Trial

Browser-based semi-3D driving prototype set in Utrecht's Lunetten neighborhood.

## Play in your browser

Once GitHub Pages is enabled, the demo will be published at:

https://lepel1704.github.io/Map-trail-game/

For the first deployment, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. The included Pages workflow will then publish the browser build after pushes to `main`.

## Prototype

- Real OSM road lines and building footprints, rendered as simplified stylized geometry.
- Arcade-style keyboard driving, follow camera, timer, checkpoint loop and reset.
- A fallback mini-course if the Overpass map endpoint is unavailable.

This is an early driving-feel slice, not a finished or surveyed track. The course gates are approximate and there are not yet collision boundaries, mobile controls, or multiplayer.

## Local development

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Controls: WASD / arrow keys; R resets the run.

## Map attribution

Map geometry is requested live from OpenStreetMap via the public Overpass API. Attribution: © OpenStreetMap contributors (ODbL). Public Overpass endpoints may be rate-limited or unavailable.
