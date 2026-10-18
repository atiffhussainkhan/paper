extends RefCounted
class_name InkTrail

# src/sim/Trail.js — open wet polyline.
# Sampling (begin / add / clear) is in place. Swept collision is still a stub:
# InkCombat cannot mark cuts until collides_segment and older_segment_count land.

var width: float
var sample_spacing: float
var max_points: int
var points: Array[Vector2] = []


func _init(stroke_width: float, spacing: float, point_limit: int = 5000) -> void:
	width = stroke_width
	sample_spacing = spacing
	max_points = point_limit


func is_active() -> bool:
	return points.size() > 1


func clear() -> void:
	points.clear()


func begin(point: Vector2) -> void:
	points.clear()
	points.append(point)


func add(point: Vector2, force: bool = false) -> void:
	if points.is_empty():
		begin(point)
		return
	var last := points[points.size() - 1]
	var delta := point - last
	var distance := delta.length()
	if not force and distance < sample_spacing:
		return
	var samples := maxi(1, int(floor(distance / sample_spacing)))
	for step in range(1, samples + 1):
		if points.size() >= max_points:
			break
		var t := float(step) / float(samples)
		points.append(last + delta * t)
	if force and points.size() < max_points:
		var tail := points[points.size() - 1]
		if tail != point:
			points.append(point)


# TODO: port Trail.olderSegmentCount. Grace is arc length behind `head`, not a
# raw sample count. Clamp the head-to-last-sample gap to one sample_spacing.
func older_segment_count(_grace_length: float, _head: Vector2) -> int:
	return 0


func collides_point(point: Vector2, extra_radius: float = 0.0, start_segment: int = 0, end_segment: int = -1) -> bool:
	var end := end_segment
	if end < 0:
		end = points.size() - 1
	return collides_segment(point, point, extra_radius, start_segment, end)


# TODO: port Trail.collidesSegment / segmentDistanceSquared.
# Contact is a swept test of this tick's motion, radius = half stroke width + extra.
func collides_segment(_from: Vector2, _to: Vector2, _extra_radius: float = 0.0, _start_segment: int = 0, _end_segment: int = -1) -> bool:
	return false
