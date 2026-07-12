from pathlib import Path
from PIL import Image

SOURCE = Path("tmp/imagegen/p9-a2/item-drop-atlas-alpha.png")
OUTPUT = Path("client/public/assets/p9/items")
NAMES = (
    "potion", "lunchbox", "rat_tail", "mist_gel",
    "shell", "monster_cloth", "damp_wood", "reef_spark",
    "quest_key", "magic_core", "quest_seal", "equipment",
)

atlas = Image.open(SOURCE).convert("RGBA")
cell_width, cell_height = atlas.width // 4, atlas.height // 3
OUTPUT.mkdir(parents=True, exist_ok=True)

for index, name in enumerate(NAMES):
    column, row = index % 4, index // 4
    cell = atlas.crop((column * cell_width, row * cell_height, (column + 1) * cell_width, (row + 1) * cell_height))
    alpha_box = cell.getchannel("A").getbbox()
    if alpha_box is None:
        raise RuntimeError(f"{name}: empty alpha cell")
    subject = cell.crop(alpha_box)
    subject.thumbnail((36, 36), Image.Resampling.LANCZOS)
    icon = Image.new("RGBA", (40, 40), (0, 0, 0, 0))
    icon.alpha_composite(subject, ((40 - subject.width) // 2, 38 - subject.height))
    if icon.getpixel((0, 0))[3] != 0 or icon.getpixel((39, 39))[3] != 0:
        raise RuntimeError(f"{name}: transparent corner validation failed")
    coverage = sum(1 for value in icon.getchannel("A").getdata() if value > 16) / (40 * 40)
    if not 0.08 <= coverage <= 0.75:
        raise RuntimeError(f"{name}: implausible subject coverage {coverage:.3f}")
    icon.save(OUTPUT / f"{name}.png", optimize=True)
    print(f"{name}: 40x40 RGBA, coverage={coverage:.3f}")
