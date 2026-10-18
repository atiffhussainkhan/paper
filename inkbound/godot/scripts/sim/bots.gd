extends RefCounted
class_name InkBots

# src/sim/Bots.js — three brains. Re-read that file when filling this in.
# Track B may still change aggression and grace; do not freeze a heading
# policy in this scaffold.
# Roles, by entity id: Tide edge-farmer, Ochre small-looper, Moss opportunistic-cutter.
# update_headings writes desired_heading only. It does not move or cut.


static func attach_brain(entity: InkEntity, _arena: InkArena) -> void:
	if entity == null:
		return
	entity.brain = {
		"role": entity.role,
		"out_time": 0.0,
	}


static func update_headings(bots: Array, _arena: InkArena, _delta: float, _game) -> void:
	# TODO: port updateBotHeadings(bots, arena, config, dt, game).
	if bots.is_empty():
		return
