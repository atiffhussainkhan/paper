extends RefCounted
class_name InkTerritoryGrid

# src/sim/TerritoryGrid.js — flat ownership grid, not a TileMap.
# Cells outside the circle are -1 and never count toward share.
# Owner 0 is unclaimed. Entity ids are 1..4. PackedInt32 stands in for Int16.

var radius: float
var size: int
var cell_size: float
var cells: PackedInt32Array
var counts: PackedInt32Array
var inside_count: int
var version: int


func _init(arena_radius: float, grid_size: int, max_owners: int = 4) -> void:
	radius = arena_radius
	size = grid_size
	cell_size = (arena_radius * 2.0) / float(grid_size)
	var total := grid_size * grid_size
	cells = PackedInt32Array()
	cells.resize(total)
	counts = PackedInt32Array()
	counts.resize(max_owners + 1)
	inside_count = 0
	version = 1
	for row in grid_size:
		for col in grid_size:
			var center := cell_center(col, row)
			var cell_index := index_of(col, row)
			if center.length_squared() <= arena_radius * arena_radius:
				cells[cell_index] = 0
				inside_count += 1
				counts[0] = counts[0] + 1
			else:
				cells[cell_index] = -1


func index_of(col: int, row: int) -> int:
	return row * size + col


func coords_of(cell_index: int) -> Vector2i:
	return Vector2i(cell_index % size, int(floor(float(cell_index) / float(size))))


func cell_center(col: int, row: int) -> Vector2:
	return Vector2(
		-radius + (float(col) + 0.5) * cell_size,
		-radius + (float(row) + 0.5) * cell_size
	)


# Empty dictionary means the point is outside the grid, matching web null.
func world_to_cell(x: float, y: float) -> Dictionary:
	var col := int(floor((x + radius) / cell_size))
	var row := int(floor((y + radius) / cell_size))
	if col < 0 or row < 0 or col >= size or row >= size:
		return {}
	return {"col": col, "row": row, "index": index_of(col, row)}


func owner_at(x: float, y: float) -> int:
	var cell := world_to_cell(x, y)
	if cell.is_empty():
		return -1
	return cells[int(cell["index"])]


func is_owned_by(owner_id: int, x: float, y: float) -> bool:
	return owner_at(x, y) == owner_id


func count_for(owner_id: int) -> int:
	if owner_id < 0 or owner_id >= counts.size():
		return 0
	return counts[owner_id]


func set_owner_at_index(cell_index: int, owner_id: int) -> bool:
	var previous := int(cells[cell_index])
	if previous < 0 or previous == owner_id:
		return false
	counts[previous] = counts[previous] - 1
	counts[owner_id] = counts[owner_id] + 1
	cells[cell_index] = owner_id
	return true


func set_disk(owner_id: int, x: float, y: float, disk_radius: float) -> int:
	var min_cell := world_to_cell(x - disk_radius, y - disk_radius)
	var max_cell := world_to_cell(x + disk_radius, y + disk_radius)
	if min_cell.is_empty():
		min_cell = {"col": 0, "row": 0}
	if max_cell.is_empty():
		max_cell = {"col": size - 1, "row": size - 1}
	var changed := 0
	var radius_sq := disk_radius * disk_radius
	var row_start := maxi(0, int(min_cell["row"]))
	var row_end := mini(size - 1, int(max_cell["row"]))
	var col_start := maxi(0, int(min_cell["col"]))
	var col_end := mini(size - 1, int(max_cell["col"]))
	for row in range(row_start, row_end + 1):
		for col in range(col_start, col_end + 1):
			var center := cell_center(col, row)
			if center.distance_squared_to(Vector2(x, y)) <= radius_sq:
				if set_owner_at_index(index_of(col, row), owner_id):
					changed += 1
	if changed > 0:
		version += 1
	return changed


func is_disk_unowned(x: float, y: float, disk_radius: float) -> bool:
	var cell_radius := int(ceil(disk_radius / cell_size))
	var center := world_to_cell(x, y)
	if center.is_empty():
		return false
	var radius_sq := disk_radius * disk_radius
	var center_col := int(center["col"])
	var center_row := int(center["row"])
	for row in range(center_row - cell_radius, center_row + cell_radius + 1):
		for col in range(center_col - cell_radius, center_col + cell_radius + 1):
			if col < 0 or row < 0 or col >= size or row >= size:
				return false
			var point := cell_center(col, row)
			if point.distance_squared_to(Vector2(x, y)) <= radius_sq and cells[index_of(col, row)] != 0:
				return false
	return true


func clear_owner(owner_id: int) -> int:
	var changed := 0
	for cell_index in cells.size():
		if cells[cell_index] == owner_id:
			cells[cell_index] = 0
			changed += 1
	if changed > 0:
		counts[owner_id] = 0
		counts[0] = counts[0] + changed
		version += 1
	return changed


func share(owner_id: int) -> float:
	if inside_count == 0:
		return 0.0
	return float(count_for(owner_id)) / float(inside_count)


func for_each_inside(callback: Callable) -> void:
	for cell_index in cells.size():
		if cells[cell_index] >= 0:
			callback.call(int(cells[cell_index]), cell_index)
