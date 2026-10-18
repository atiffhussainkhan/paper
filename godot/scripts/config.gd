extends RefCounted
class_name InkConfig

# Snapshot of src/config.js and the brand hex values in docs/BRAND.md.
# The web files stay authoritative. Re-copy this snapshot before filling in
# combat, capture, or bot behavior so a later balance pass is not frozen here.

const SIM_HZ := 60
const MAX_FRAME_TIME := 0.2
const MAX_STEPS_PER_FRAME := 8

const ARENA_RADIUS := 1200.0
const GRID_SIZE := 160
const START_TERRITORY_RADIUS := 120.0

const PLAYER_SPEED := 200.0
const BOT_SPEED := 125.0
const STEER_RATE := PI * 1.85
const BODY_RADIUS := 13.0

const TRAIL_WIDTH := 11.0
const TRAIL_SAMPLE_SPACING := 8.0
const MAX_TRAIL_POINTS := 5000
const SELF_GRACE_POINTS := 22
const SELF_COLLISION_RADIUS_SCALE := 0.45
const ENEMY_HEAD_GRACE_POINTS := 4

const BOT_COUNT := 3
const BOT_INITIAL_SPAWN_RADIUS := 920.0
const BOT_MIN_PLAYER_SEPARATION := 520.0
const BOT_LOOP_OUT_DISTANCE := 185.0
const BOT_LOOP_SIDE_DISTANCE := 145.0
const BOT_EDGE_OUT_DISTANCE := 210.0
const BOT_EDGE_SWEEP_DISTANCE := 235.0
const BOT_EDGE_RIM_MARGIN := 44.0
const BOT_SMALL_LOOP_OUT_DISTANCE := 150.0
const BOT_SMALL_LOOP_SIDE_DISTANCE := 120.0
const BOT_CUTTER_OUT_DISTANCE := 175.0
const BOT_CUTTER_SIDE_DISTANCE := 142.0
const BOT_CUTTER_RANGE := 200.0
const BOT_CUTTER_MAX_SELF_TRAIL := 18
const BOT_MAX_OUT_TIME := 3.1
const BOT_MAX_SAFE_TRAIL_POINTS := 42
const BOT_LOOK_AHEAD_DISTANCE := 115.0
const BOT_WAYPOINT_RADIUS := 28.0
const BOT_RESPAWN_ATTEMPTS := 1200
const BOT_HUNT_GRACE_SECONDS := 20.0

const CAMERA_VIEW_HEIGHT := 1000.0
const CAMERA_MIN_VIEW_WIDTH := 720.0
const CAMERA_MAX_VIEW_SPAN := 1400.0
const CAMERA_LOOK_AHEAD := 120.0
const CAMERA_LOOK_AHEAD_FOLLOW := 5.5
const CAMERA_FOLLOW := 7.5
const PLANE_GRID_SPACING := 120.0

const WIN_SHARE := 1.0

# Mirrors ENTITY_SPECS. `name` is the spoken ink name (Tide, Ochre, Moss).
const ENTITY_SPECS := [
	{
		"id": 1,
		"name": "You",
		"dry_token": "--ink-player",
		"wet_token": "--ink-player-wet",
		"role": "player",
	},
	{
		"id": 2,
		"name": "Tide",
		"dry_token": "--ink-bot-1",
		"wet_token": "--ink-bot-1-wet",
		"role": "edge-farmer",
	},
	{
		"id": 3,
		"name": "Ochre",
		"dry_token": "--ink-bot-2",
		"wet_token": "--ink-bot-2-wet",
		"role": "small-looper",
	},
	{
		"id": 4,
		"name": "Moss",
		"dry_token": "--ink-bot-3",
		"wet_token": "--ink-bot-3-wet",
		"role": "opportunistic-cutter",
	},
]

const INK_HEX := {
	"--sumi-950": "#0b0c0e",
	"--sumi-900": "#111316",
	"--sumi-800": "#181b1f",
	"--sumi-700": "#23272c",
	"--sumi-600": "#353a41",
	"--bone-100": "#efe9db",
	"--bone-300": "#c9c2b2",
	"--bone-500": "#8f897c",
	"--ink-player": "#d9452b",
	"--ink-player-wet": "#ff6a4a",
	"--ink-bot-1": "#1f9e94",
	"--ink-bot-1-wet": "#3fd1c4",
	"--ink-bot-2": "#c9962e",
	"--ink-bot-2-wet": "#f2bd4f",
	"--ink-bot-3": "#6f9a3c",
	"--ink-bot-3-wet": "#9cc95c",
	"--state-cut": "#ff6a4a",
	"--state-win": "#efe9db",
	"--focus-ring": "#f2bd4f",
}

static func color(token: String) -> Color:
	var hex := str(INK_HEX.get(token, "#efe9db"))
	return Color.html(hex)
