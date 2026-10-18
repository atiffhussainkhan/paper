extends RefCounted
class_name InkEntity

# src/sim/Entity.js — avatar state. Not a Node. The renderer reads these fields.
# `ink_name` is the web `name` (You, Tide, Ochre, Moss). death_share < 0 means unset.

var id: int
var ink_name: String
var is_player: bool
var role: String
var color: Color
var wet_color: Color
var position: Vector2
var previous_position: Vector2
var heading: float
var desired_heading: float
var speed: float
var radius: float
var rim_sign: float
var trail: InkTrail
var alive: bool
var outside_own_territory: bool
var capture_pending: bool
var death_reason: String
var killed_by: InkEntity
var death_share: float
var death_applied: bool
var brain: Dictionary


func _init(spec: Dictionary, spawn_position: Vector2, spawn_heading: float, move_speed: float) -> void:
	id = int(spec["id"])
	ink_name = str(spec["name"])
	is_player = id == 1
	role = str(spec.get("role", ""))
	color = InkConfig.color(str(spec["dry_token"]))
	wet_color = InkConfig.color(str(spec["wet_token"]))
	position = spawn_position
	previous_position = spawn_position
	heading = spawn_heading
	desired_heading = spawn_heading
	speed = move_speed
	radius = float(InkConfig.BODY_RADIUS)
	rim_sign = 1.0 if (id % 2) != 0 else -1.0
	trail = InkTrail.new(
		float(InkConfig.TRAIL_WIDTH),
		float(InkConfig.TRAIL_SAMPLE_SPACING),
		InkConfig.MAX_TRAIL_POINTS
	)
	alive = true
	outside_own_territory = false
	capture_pending = false
	death_reason = ""
	killed_by = null
	death_share = -1.0
	death_applied = false
	brain = {}


func mark_dead(reason: String, killer: InkEntity = null) -> void:
	if not alive:
		return
	alive = false
	death_reason = reason
	killed_by = killer
