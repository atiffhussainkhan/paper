import { SKINS, isSkinUnlocked } from "../meta/Skins.js";
import { catalogAssetUrl } from "../assets/ImageCatalog.js";

// Radio-group of ink swatches. Locked skins stay visible, disabled, and state
// the best share that opens them.
export class SkinPicker {
  constructor(root, onSelect, catalog = null) {
    this.root = root;
    this.onSelect = onSelect;
    this.catalog = catalog;
    this.buttons = new Map();
    this.selectedId = null;

    root.setAttribute("role", "radiogroup");
    root.setAttribute("aria-label", "Ink");
    for (const skin of SKINS) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "skin-chip";
      button.setAttribute("role", "radio");
      button.dataset.skin = skin.id;
      button.style.setProperty("--skin-dry", skin.dry);
      button.style.setProperty("--skin-wet", skin.wet);
      button.style.setProperty("--skin-core", skin.core);
      const pickerEntry = catalog?.getEntry?.(skin.pickerImageId || skin.patternImageId);
      if (pickerEntry) {
        button.style.setProperty("--skin-art", catalogAssetUrl(pickerEntry.path));
        button.classList.add("has-art");
      }
      button.innerHTML = [
        '<span class="skin-chip__bead" aria-hidden="true"></span>',
        '<span class="skin-chip__name"></span>',
      ].join("");
      button.querySelector(".skin-chip__name").textContent = skin.name;
      this.root.appendChild(button);
      this.buttons.set(skin.id, button);
    }

    this.stop = (event) => event.stopPropagation();
    this.handleClick = (event) => {
      const button = event.target.closest(".skin-chip");
      if (!button || button.disabled) return;
      this.onSelect?.(button.dataset.skin);
    };
    this.handleKeyDown = (event) => {
      const step = event.code === "ArrowRight" || event.code === "ArrowDown" ? 1
        : event.code === "ArrowLeft" || event.code === "ArrowUp" ? -1 : 0;
      if (!step) return;
      const enabled = [...this.buttons.values()].filter((button) => !button.disabled);
      const index = enabled.indexOf(document.activeElement);
      if (index < 0 || !enabled.length) return;
      event.preventDefault();
      const next = enabled[(index + step + enabled.length) % enabled.length];
      next.focus({ preventScroll: true });
      this.onSelect?.(next.dataset.skin);
    };

    root.addEventListener("pointerdown", this.stop);
    root.addEventListener("touchstart", this.stop, { passive: true });
    root.addEventListener("click", this.handleClick);
    root.addEventListener("keydown", this.handleKeyDown);
  }

  update(profile, celebrateIds = []) {
    const best = profile.get("bestPct", 0);
    const unlocked = profile.get("unlockedSkinIds", []);
    const equipped = profile.get("equippedSkinId");
    const celebrate = new Set(Array.isArray(celebrateIds) ? celebrateIds : []);
    this.selectedId = equipped;
    for (const skin of SKINS) {
      const button = this.buttons.get(skin.id);
      const open = unlocked.includes(skin.id) || isSkinUnlocked(skin, best);
      const selected = open && skin.id === equipped;
      button.disabled = !open;
      button.classList.toggle("is-unlocked-new", celebrate.has(skin.id));
      button.setAttribute("aria-checked", String(selected));
      button.tabIndex = selected ? 0 : -1;
      button.classList.toggle("is-selected", selected);
      button.classList.toggle("is-locked", !open);
      button.title = open ? `${skin.name}. ${skin.blurb}` : `${skin.name}. Locked: reach ${skin.unlockPct}% of the plane.`;
      button.setAttribute("aria-label", open ? skin.name : `${skin.name}, locked until ${skin.unlockPct}%`);
      button.querySelector(".skin-chip__name").textContent = open ? skin.name : `${skin.unlockPct}%`;
    }
  }

  focusSelected() {
    this.buttons.get(this.selectedId)?.focus({ preventScroll: true });
  }

  destroy() {
    this.root.removeEventListener("pointerdown", this.stop);
    this.root.removeEventListener("touchstart", this.stop);
    this.root.removeEventListener("click", this.handleClick);
    this.root.removeEventListener("keydown", this.handleKeyDown);
  }
}
