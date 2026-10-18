extends Node
class_name InkSteerInput

# src/input/Input.js — pointer / WASD to a heading.
# This node records keys and pointer position. heading_for() still returns null
# until the blend in Input.headingFor is ported (pointer, WASD bias, weights
# 0.42 pointer + 0.88 keys, 8px deadzone, touch-drag fallback, one-tick latch).
# Future InputMap actions, when promoted out of raw keycodes:
# steer_up, steer_down, steer_left, steer_right.

var keys := {}
var pointer_position := Vector2.ZERO
var pointer_active := false
var pointer_down := false
var pointer_kind := "mouse"
var pointer_msec := 0
var steering_origin := Vector2.ZERO
var latched_heading: Variant = null


func reset() -> void:
	keys.clear()
	pointer_active = false
	pointer_down = false
	latched_heading = null


func set_steering_origin(origin: Vector2) -> void:
	steering_origin = origin


func heading_for(_current_heading: float) -> Variant:
	# TODO: port Input.headingFor. Return null when the player should keep
	# their current desired heading.
	return null


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey:
		var code: Key = event.physical_keycode if event.physical_keycode != KEY_NONE else event.keycode
		var dir := _direction_for_key(code)
		if dir == "":
			return
		if event.pressed and not event.echo:
			keys[dir] = true
		elif not event.pressed:
			keys.erase(dir)
		return
	if event is InputEventMouseMotion:
		_set_pointer(event.position, pointer_down or pointer_active, pointer_down, "mouse")
	elif event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		_set_pointer(event.position, true, event.pressed, "mouse")
	elif event is InputEventScreenTouch:
		_set_pointer(event.position, event.pressed, event.pressed, "touch")
	elif event is InputEventScreenDrag:
		_set_pointer(event.position, true, true, "touch")


func _direction_for_key(keycode: Key) -> String:
	match keycode:
		KEY_W, KEY_UP:
			return "up"
		KEY_S, KEY_DOWN:
			return "down"
		KEY_A, KEY_LEFT:
			return "left"
		KEY_D, KEY_RIGHT:
			return "right"
		_:
			return ""


func _set_pointer(position: Vector2, active: bool, down: bool, kind: String) -> void:
	pointer_position = position
	pointer_active = active
	pointer_down = down
	pointer_kind = kind
	pointer_msec = Time.get_ticks_msec()
