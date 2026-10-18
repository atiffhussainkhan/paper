extends RefCounted
class_name InkArena

# src/sim/Arena.js — circle bounds and non-lethal rim slide.
# contains / clamp_point / random_point match the web math.
# slide() is intentionally not integrated yet.

var radius: float


func _init(arena_radius: float = InkConfig.ARENA_RADIUS) -> void:
	radius = arena_radius


func contains(x: float, y: float, inset: float = 0.0) -> bool:
	var limit := radius - inset
	return x * x + y * y <= limit * limit


func clamp_point(point: Vector2, inset: float = 0.0) -> Vector2:
	var limit := radius - inset
	var length := point.length()
	if length <= limit or length == 0.0:
		return point
	return point * (limit / length)


# Uniform over the disk of radius (radius - inset), matching Arena.randomPoint.
func random_point(rng: RandomNumberGenerator, inset: float = 0.0) -> Vector2:
	var angle := rng.randf() * TAU
	var dist := sqrt(rng.randf()) * (radius - inset)
	return Vector2(cos(angle) * dist, sin(angle) * dist)


# TODO: port Arena.slide. A head-on hit must pick a stable tangent so an
# always-moving body cannot pin against the wall. Walls are not lethal.
# Return keys: position (Vector2), velocity (Vector2), hit_rim (bool), rim_sign (float).
func slide(position: Vector2, velocity: Vector2, _delta: float, _inset: float, rim_sign: float = 1.0) -> Dictionary:
	return {
		"position": position,
		"velocity": velocity,
		"hit_rim": false,
		"rim_sign": rim_sign,
	}
