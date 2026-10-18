extends RefCounted
class_name InkMovement

# src/sim/Movement.js — always move, 360° steer, then rim slide.
# turn_toward is pure and matches the web helper.
# move_entity does not integrate yet: InkArena.slide() still returns the
# current position, and calling it would look like motion that never happens.


static func wrap_angle(angle: float) -> float:
	return atan2(sin(angle), cos(angle))


static func turn_toward(current: float, target: float, max_turn: float) -> float:
	var difference := wrap_angle(target - current)
	return wrap_angle(current + clampf(difference, -max_turn, max_turn))


static func move_entity(entity: InkEntity, _arena: InkArena, _delta: float, _steer_rate: float) -> void:
	# TODO: port moveEntity once Arena.slide is real. Intended order:
	# 1. previous_position = position
	# 2. heading = turn_toward(heading, desired_heading, steer_rate * delta)
	# 3. velocity = heading vector * speed
	# 4. result = arena.slide(position, velocity, delta, radius, rim_sign)
	# 5. position = result.position; rim_sign = result.rim_sign
	# 6. if hit_rim and slid speed > 0.01: heading = atan2(slid velocity)
	if entity == null or not entity.alive:
		return
