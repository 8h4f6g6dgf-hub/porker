# SVG-cards / Poker Academy card faces

Source: https://github.com/htdebeer/SVG-cards
Upstream commit: 6d88bf9c594997b82bc5668ab0877a4e9b717665 (4.0.2)
Copyright © 2005 David Bellot; © 2016–2017 Huub de Beer.
Additional contributors are listed in AUTHORS.

License: GNU LGPL 2.1 (upstream package license; complete text in LICENSE).
Commercial use, modification and redistribution are permitted under this license;
this includes Web delivery and inclusion in a public GitHub repository.
Retain copyright/license notices, supply editable source and the license, and
license modified artwork under the LGPL. No purchase or external API is involved.
The application code is separate from this artwork library.

The unchanged upstream editable SVG source is in source/svg-cards.svg.
Poker Academy extracts each face with only its referenced definitions using
scripts/extract-card-faces.py, changes the output viewport to 512×720 to match
existing card geometry, and retains all original pip/court/index artwork.
These extracted SVG derivatives remain LGPL-2.1. No artwork is flattened or hidden.
The source, notices and extracted faces are distributed together on GitHub Pages.
You may replace the individual SVG files with compatible card faces.

Runtime loads only requested faces and rasterizes each at 512×720. Font-based
indices use the upstream serif design with the browser's serif fallback where
DejaVu Serif is unavailable. The 3D geometry and animation are unchanged.

Poker Academy additionally removes only the base white card path’s black stroke
(`stroke:#000000` → `stroke:none`). Its fill, rounded path, artwork and indices
are unchanged. The upstream source remains unmodified.
