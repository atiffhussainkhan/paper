extends Node

# src/main.js — boot, fixed sim step, then present.
# Physics ticks are not the sim clock. InkConfig.SIM_HZ stays in charge even
# if the editor physics FPS changes. Render interpolation alpha is passed
# through; the plane renderer does not consume it yet.

var game: InkGame
var accumulator := 0.0

@onready var steer: InkSteerInput = $SteerInput
@onready var plane: InkPlaneRenderer = $Match/Plane
@onready var hud: InkMatchHud = $Hud


func _ready() -> void:
	hud.restart_requested.connect(restart)
	restart()


func restart() -> void:
	steer.reset()
	if game == null:
		game = InkGame.new(steer)
	game.reset()
	plane.bind(game)
	hud.bind(game)
	var player := game.get_player()
	if player != null:
		plane.reset_camera(player.position, player.heading)
	accumulator = 0.0
	hud.present()


func _process(delta: float) -> void:
	if game == null:
		return
	var frame_time := minf(float(InkConfig.MAX_FRAME_TIME), maxf(0.0, delta))
	accumulator += frame_time
	var fixed_step := 1.0 / float(InkConfig.SIM_HZ)
	var steps := 0
	while accumulator >= fixed_step and steps < InkConfig.MAX_STEPS_PER_FRAME:
		game.tick(fixed_step)
		accumulator -= fixed_step
		steps += 1
	if steps == InkConfig.MAX_STEPS_PER_FRAME:
		accumulator = minf(accumulator, fixed_step)
	var alpha := 0.0
	if fixed_step > 0.0:
		alpha = accumulator / fixed_step
	plane.present(alpha, frame_time)
	steer.set_steering_origin(plane.player_screen_position())
	hud.present()
