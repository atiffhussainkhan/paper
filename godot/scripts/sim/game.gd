extends RefCounted
class_name InkGame

# src/sim/Game.js — match state and the locked tick order from docs/ARCHITECTURE.md.
# Steps 3, 5, and 6 call stubs, so a match sits on the start disks until those land.

var input: InkSteerInput
var rng := RandomNumberGenerator.new()
var arena: InkArena
var grid: InkTerritoryGrid
var entities: Array[InkEntity] = []
var state := "playing"
var outcome := {}
var final_share := 0.0
var match_age := 0.0


func _init(steer_input: InkSteerInput) -> void:
	input = steer_input


func reset() -> void:
	rng.randomize()
	arena = InkArena.new(float(InkConfig.ARENA_RADIUS))
	grid = InkTerritoryGrid.new(
		float(InkConfig.ARENA_RADIUS),
		InkConfig.GRID_SIZE,
		InkConfig.BOT_COUNT + 1
	)
	entities.clear()
	state = "playing"
	outcome = {}
	final_share = 0.0
	match_age = 0.0

	var player := _create_entity(InkConfig.ENTITY_SPECS[0], Vector2.ZERO, -0.2)
	grid.set_disk(player.id, 0.0, 0.0, float(InkConfig.START_TERRITORY_RADIUS))
	entities.append(player)

	var spawn_r := float(InkConfig.BOT_INITIAL_SPAWN_RADIUS)
	var angles: Array[float] = [-PI * 0.72, -PI * 0.05, PI * 0.62]
	for index in InkConfig.BOT_COUNT:
		var angle := angles[index]
		var point := Vector2(cos(angle), sin(angle)) * spawn_r
		spawn_bot(InkConfig.ENTITY_SPECS[index + 1], point)


func _create_entity(spec: Dictionary, spawn_position: Vector2, spawn_heading: float) -> InkEntity:
	var move_speed := float(InkConfig.PLAYER_SPEED) if int(spec["id"]) == 1 else float(InkConfig.BOT_SPEED)
	return InkEntity.new(spec, spawn_position, spawn_heading, move_speed)


func get_player() -> InkEntity:
	for entity in entities:
		if entity.is_player:
			return entity
	return null


func get_bots() -> Array[InkEntity]:
	var bots: Array[InkEntity] = []
	for entity in entities:
		if not entity.is_player:
			bots.append(entity)
	return bots


func find_by_id(entity_id: int) -> InkEntity:
	for entity in entities:
		if entity.id == entity_id:
			return entity
	return null


# A spawn disk must be unowned and clear of live wet strokes.
# Trail.collides_point is still a stub (always false), so wet-stroke clearance
# starts working only after that TODO is filled.
func is_spawn_clear(point: Vector2) -> bool:
	if grid == null:
		return false
	if not grid.is_disk_unowned(point.x, point.y, float(InkConfig.START_TERRITORY_RADIUS)):
		return false
	var clearance := float(InkConfig.START_TERRITORY_RADIUS) + float(InkConfig.BODY_RADIUS)
	for entity in entities:
		if entity.alive and entity.trail.collides_point(point, clearance):
			return false
	return true


func find_bot_spawn() -> Variant:
	var inset := float(InkConfig.START_TERRITORY_RADIUS) + float(InkConfig.BODY_RADIUS)
	var player := get_player()
	var min_sep := float(InkConfig.BOT_MIN_PLAYER_SEPARATION)
	var min_entity_sep := float(InkConfig.START_TERRITORY_RADIUS) * 2.2
	for _attempt in InkConfig.BOT_RESPAWN_ATTEMPTS:
		var point := arena.random_point(rng, inset)
		if not is_spawn_clear(point):
			continue
		if player != null and player.alive and point.distance_to(player.position) < min_sep:
			continue
		var separated := true
		for entity in entities:
			if entity.alive and entity.position.distance_to(point) <= min_entity_sep:
				separated = false
				break
		if separated:
			return point
	return null


func spawn_bot(spec: Dictionary, preferred: Variant = null) -> InkEntity:
	var point: Variant = preferred
	if point == null or not is_spawn_clear(point):
		point = find_bot_spawn()
	if point == null:
		return null
	var spawn_point: Vector2 = point
	var heading := spawn_point.angle()
	var bot := _create_entity(spec, spawn_point, heading)
	grid.set_disk(bot.id, spawn_point.x, spawn_point.y, float(InkConfig.START_TERRITORY_RADIUS))
	InkBots.attach_brain(bot, arena)
	var existing := -1
	for index in entities.size():
		if entities[index].id == bot.id:
			existing = index
			break
	if existing >= 0:
		entities[existing] = bot
	else:
		entities.append(bot)
	return bot


func _snapshot_death_shares() -> void:
	for entity in entities:
		if not entity.alive and entity.death_share < 0.0:
			entity.death_share = grid.share(entity.id)


func tick(delta: float) -> void:
	if state != "playing":
		return
	var player := get_player()
	match_age += delta

	# 1. Read input and update the player's target heading.
	if player != null and player.alive:
		var input_heading: Variant = input.heading_for(player.heading)
		if input_heading != null:
			player.desired_heading = float(input_heading)

	# 2. Update bot target headings.
	InkBots.update_headings(get_bots(), arena, delta, self)

	# 3. Move every living entity, including rim sliding.
	for entity in entities:
		InkMovement.move_entity(entity, arena, delta, float(InkConfig.STEER_RATE))

	# 4. Emit wet trail samples only while outside one's own fill.
	for entity in entities:
		if not entity.alive:
			continue
		var inside := grid.is_owned_by(entity.id, entity.position.x, entity.position.y)
		entity.capture_pending = false
		if not inside:
			if not entity.outside_own_territory:
				entity.trail.begin(entity.previous_position)
			entity.trail.add(entity.position)
			entity.outside_own_territory = true
		elif entity.outside_own_territory and entity.trail.is_active():
			entity.trail.add(entity.position, true)
			entity.capture_pending = true
			entity.outside_own_territory = false

	# 5. Resolve cuts. Combat only marks deaths; cleanup is step 7.
	InkCombat.resolve(entities, match_age)
	_snapshot_death_shares()

	# 6. Survivors seal loops when they re-enter their own dry ink.
	# A capture that leaves another living entity with no ink swallows it,
	# checked once every capture has landed so order does not matter.
	var swallowed: Array[Dictionary] = []
	for entity in entities:
		if not entity.alive or not entity.capture_pending:
			continue
		var changed := InkCapture.capture_loop(grid, entity.id, entity.trail)
		entity.trail.clear()
		entity.capture_pending = false
		if changed <= 0:
			continue
		for other in entities:
			if other != entity and other.alive and grid.count_for(other.id) == 0:
				swallowed.append({"victim": other, "captor": entity})
	for pair in swallowed:
		var victim: InkEntity = pair["victim"]
		var captor: InkEntity = pair["captor"]
		if grid.count_for(victim.id) != 0:
			continue
		var reason := "%s swallowed %s's ink." % [captor.ink_name, victim.ink_name]
		if victim.is_player:
			reason = "%s swallowed your ink." % captor.ink_name
		victim.mark_dead(reason, captor)
	_snapshot_death_shares()

	# 7. Apply deaths by erasing both wet and dry ink. Once per entity.
	for entity in entities:
		if entity.alive or entity.death_applied:
			continue
		if entity.is_player:
			final_share = entity.death_share if entity.death_share >= 0.0 else grid.share(entity.id)
			state = "over"
			outcome = {"type": "death", "title": entity.death_reason}
		entity.trail.clear()
		entity.outside_own_territory = false
		entity.capture_pending = false
		grid.clear_owner(entity.id)
		entity.death_applied = true

	# 8. Replace dead inks on wholly unowned ground to keep three bots.
	var bot_specs: Array = InkConfig.ENTITY_SPECS.slice(1, InkConfig.BOT_COUNT + 1)
	for spec in bot_specs:
		var bot := find_by_id(int(spec["id"]))
		if bot == null or not bot.alive:
			spawn_bot(spec)

	# 9. A complete plane ends the match.
	if player != null and player.alive and grid.share(player.id) >= float(InkConfig.WIN_SHARE):
		final_share = grid.share(player.id)
		state = "over"
		outcome = {"type": "win", "title": "The plane is yours."}
