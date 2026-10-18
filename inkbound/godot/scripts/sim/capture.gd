extends RefCounted
class_name InkCapture

# src/sim/Capture.js — loop close to flood fill.
# TODO: port captureLoop. Do not invent a second fill rule.
# Contract from the web module:
# - No active trail returns 0.
# - Owned cells plus the rasterized wet stroke are a barrier.
# - The largest remaining component is the exterior; every smaller component
#   inside the arena is enclosed and becomes owner_id.
# - Return the number of cells whose owner changed.
# Swallow (a living rival left with zero cells) is decided by InkGame after
# every capture has landed, not inside this function.


static func capture_loop(grid: InkTerritoryGrid, owner_id: int, trail: InkTrail) -> int:
	if grid == null or trail == null or owner_id <= 0 or not trail.is_active():
		return 0
	return 0
