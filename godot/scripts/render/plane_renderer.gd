extends Node2D
class_name InkPlaneRenderer

# src/render/Renderer.js — presentation only. The sim does not call this.
# Scaffold draw: the circular plane, wet polylines, and ink beads.
# Not ported yet: territory ImageTexture blit (web offscreen canvas, invalidate
# on grid.version), camera exp-follow, look-ahead blend, cut flash, interpolation
# from previous_position using the accumulator alpha.
# Do not enable Camera2D position smoothing. Port cameraFollow yourself so the
# feel matches the web numbers in InkConfig.

var game: InkGame


func bind(next_game: InkGame) -> void:
	game = next_game
	queue_redraw()


func _ready() -> void:
	_apply_zoom()


func _camera() -> Camera2D:
	var cam := get_parent().get_node_or_null("Camera2D") as Camera2D
	return cam


func _apply_zoom() -> void:
	var cam := _camera()
	if cam == null:
		return
	var height := get_viewport_rect().size.y
	if height <= 1.0:
		height = 720.0
	var zoom_value := height / float(InkConfig.CAMERA_VIEW_HEIGHT)
	cam.zoom = Vector2(zoom_value, zoom_value)
	cam.position_smoothing_enabled = false


func reset_camera(focus: Vector2, heading: float) -> void:
	var cam := _camera()
	if cam == null:
		return
	_apply_zoom()
	var ahead := Vector2(cos(heading), sin(heading)) * float(InkConfig.CAMERA_LOOK_AHEAD)
	cam.position = focus + ahead
	cam.make_current()


func present(_alpha: float, _frame_time: float) -> void:
	# TODO: exp-blend camera toward the player + look-ahead using frame_time,
	# and draw entities at previous + (position - previous) * alpha.
	queue_redraw()


func player_screen_position() -> Vector2:
	# TODO: port Renderer.worldToScreen. Until the camera follow exists, the
	# steering origin is the viewport center (the web fallback before the first
	# player projection).
	return get_viewport_rect().size * 0.5


func _draw() -> void:
	var arena_radius := float(InkConfig.ARENA_RADIUS)
	draw_circle(Vector2.ZERO, arena_radius, InkConfig.color("--sumi-900"))
	draw_arc(Vector2.ZERO, arena_radius, 0.0, TAU, 128, InkConfig.color("--sumi-600"), 3.0, true)
	if game == null:
		return
	for entity in game.entities:
		if entity.trail.points.size() >= 2:
			draw_polyline(PackedVector2Array(entity.trail.points), entity.wet_color, float(InkConfig.TRAIL_WIDTH), true)
		if entity.alive:
			draw_circle(entity.position, entity.radius, entity.color)
