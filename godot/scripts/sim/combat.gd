extends RefCounted
class_name InkCombat

# src/sim/Combat.js — tick step 5. Decision pass only.
# TODO: port resolveCombat. This stub marks nobody dead.
# Rules to keep when the port is filled in (see the web file, do not re-decide):
# - Simultaneous: a body still cuts on the tick it dies. Order affects attribution only.
# - Bodies never kill bodies. Only a body crossing a wet stroke kills that stroke's owner.
# - Radius = attacker body radius + half trail width. Self-cuts use self_collision_radius_scale.
# - Grace is arc length: points * trail_sample_spacing, via Trail.older_segment_count.
# - Enemy head grace exempts the newest arc so head-on contact is not a cut.
# - A same-tick cut beats capture because this step runs first. Dead owners skip capture.
# - While match_age < bot_hunt_grace_seconds, bots cannot cut the player.
#   Self-cuts and player cuts on bots still resolve.
# - Copy is fixed: "You crossed your own line." / "Tide cut your line."


static func resolve(entities: Array, match_age: float) -> void:
	if entities.is_empty() or match_age < 0.0:
		return
