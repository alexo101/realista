---
name: Google Maps drawing compatibility
description: The current Google Maps JavaScript API no longer supports DrawingManager.
---

Do not load or instantiate Google Maps `DrawingManager`; the current API removes that functionality and throws when it is constructed. Use native map mouse/click events with `Polygon` and `Circle` overlays for zone drawing.

**Why:** A map route crashed at runtime when the API version reached the removal point, even though the drawing namespace was present.

**How to apply:** Keep the Maps script limited to supported libraries such as `places` and `geometry`, and implement drawing interactions in application code.