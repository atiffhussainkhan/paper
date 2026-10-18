extends CanvasLayer
class_name InkMatchHud

# src/render/Hud.js — percent, leaderboard, hint, death/win card, Restart.
# Copy matches the web HUD. This scaffold does not add skins, stages, or juice.

signal restart_requested

var game: InkGame

@onready var percent_label: Label = %Percent
@onready var board_label: Label = %Board
@onready var blocker: ColorRect = %Blocker
@onready var overlay: ColorRect = %Overlay
@onready var title_label: Label = %Title
@onready var stats_label: Label = %Stats
@onready var restart_button: Button = %Restart


func _ready() -> void:
	restart_button.pressed.connect(_on_restart_pressed)


func bind(next_game: InkGame) -> void:
	game = next_game
	present()


func present() -> void:
	if game == null or game.grid == null:
		return
	var player := game.get_player()
	var share := game.grid.share(player.id) if player != null else 0.0
	percent_label.text = "%.1f%%" % (share * 100.0)
	var lines: PackedStringArray = []
	for entity in game.entities:
		var row := "%s  %.1f%%" % [entity.ink_name, game.grid.share(entity.id) * 100.0]
		if not entity.alive:
			row += "  —"
		lines.append(row)
	board_label.text = "\n".join(lines)
	var over := game.state == "over"
	blocker.visible = over
	overlay.visible = over
	restart_button.visible = over
	if over:
		title_label.text = str(game.outcome.get("title", ""))
		stats_label.text = "%.1f%% of the plane." % (maxf(0.0, game.final_share) * 100.0)


func _on_restart_pressed() -> void:
	restart_requested.emit()
