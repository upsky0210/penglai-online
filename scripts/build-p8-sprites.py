from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "tmp" / "imagegen" / "p8"
PUBLIC = ROOT / "client" / "public" / "assets" / "p8"


def fit_subject(subject: Image.Image, frame_size: tuple[int, int], max_size: tuple[int, int], bottom: int) -> Image.Image:
    bbox = subject.getbbox()
    if not bbox:
        return Image.new("RGBA", frame_size)
    subject = subject.crop(bbox)
    scale = min(max_size[0] / subject.width, max_size[1] / subject.height)
    size = (max(1, round(subject.width * scale)), max(1, round(subject.height * scale)))
    subject = subject.resize(size, Image.Resampling.LANCZOS)
    frame = Image.new("RGBA", frame_size)
    x = (frame_size[0] - subject.width) // 2
    y = max(0, bottom - subject.height)
    frame.alpha_composite(subject, (x, y))
    return frame


def slice_grid_row(
    source: Image.Image,
    row: int,
    row_count: int,
    column_count: int,
    frame_count: int,
    frame_size: tuple[int, int],
    max_size: tuple[int, int],
    bottom: int,
) -> Image.Image:
    strip = Image.new("RGBA", (frame_size[0] * frame_count, frame_size[1]))
    for column in range(frame_count):
        left = round(source.width * column / column_count)
        right = round(source.width * (column + 1) / column_count)
        top = round(source.height * row / row_count)
        lower = round(source.height * (row + 1) / row_count)
        cell = source.crop((left, top, right, lower))
        frame = fit_subject(cell, frame_size, max_size, bottom)
        strip.alpha_composite(frame, (column * frame_size[0], 0))
    return strip


def slice_centered_row(
    source: Image.Image,
    row: int,
    row_count: int,
    center_fractions: list[float],
    crop_width_fraction: float,
    frame_size: tuple[int, int],
    max_size: tuple[int, int],
    bottom: int,
    row_bounds: tuple[float, float] | None = None,
) -> Image.Image:
    strip = Image.new("RGBA", (frame_size[0] * len(center_fractions), frame_size[1]))
    top = round(source.height * (row_bounds[0] if row_bounds else row / row_count))
    lower = round(source.height * (row_bounds[1] if row_bounds else (row + 1) / row_count))
    crop_width = round(source.width * crop_width_fraction)
    for index, center_fraction in enumerate(center_fractions):
        center = round(source.width * center_fraction)
        left = max(0, center - crop_width // 2)
        right = min(source.width, center + crop_width // 2)
        cell = source.crop((left, top, right, lower))
        frame = fit_subject(cell, frame_size, max_size, bottom)
        strip.alpha_composite(frame, (index * frame_size[0], 0))
    return strip


def save_strip(source_name: str, destination: Path, frame_count: int, frame_size: tuple[int, int], max_size: tuple[int, int], bottom: int):
    source = Image.open(SOURCE / source_name).convert("RGBA")
    strip = slice_grid_row(source, 0, 1, frame_count, frame_count, frame_size, max_size, bottom)
    destination.parent.mkdir(parents=True, exist_ok=True)
    strip.save(destination, optimize=True)


def main():
    hero = Image.open(SOURCE / "hero_alpha.png").convert("RGBA")
    hero_specs = [
        ("player_idle.png", 0, [0.102, 0.215, 0.326, 0.432], 0.105, (80, 80), (68, 70), (0.0, 0.215)),
        ("player_run.png", 1, [0.105, 0.255, 0.405, 0.545, 0.675, 0.79], 0.16, (96, 80), (90, 70), (0.215, 0.4)),
        ("player_jump.png", 2, [0.105, 0.255], 0.18, (80, 80), (70, 70), (0.4, 0.58)),
        ("player_attack.png", 3, [0.105, 0.275, 0.445, 0.625], 0.155, (112, 80), (106, 70), (0.58, 0.77)),
        ("player_skill_slash.png", 4, [0.105, 0.275, 0.45, 0.63, 0.82], 0.18, (128, 80), (122, 70), (0.77, 1.0)),
    ]
    player_dir = PUBLIC / "characters" / "player"
    player_dir.mkdir(parents=True, exist_ok=True)
    for name, row, centers, crop_width, frame_size, max_size, row_bounds in hero_specs:
        strip = slice_centered_row(hero, row, 5, centers, crop_width, frame_size, max_size, 76, row_bounds)
        strip.save(player_dir / name, optimize=True)

    save_strip("harbor_clerk_alpha.png", PUBLIC / "npcs" / "anping_harbor_clerk_idle.png", 4, (80, 80), (68, 72), 76)
    save_strip("granary_rat_alpha.png", PUBLIC / "monsters" / "granary_rat_idle.png", 4, (64, 48), (60, 40), 44)
    save_strip("basic_slash_alpha.png", PUBLIC / "effects" / "basic_ink_slash.png", 4, (96, 64), (86, 54), 59)

    chest = Image.open(SOURCE / "cargo_chest_alpha.png").convert("RGBA")
    fit_subject(chest, (96, 80), (90, 72), 76).save(PUBLIC / "props" / "anping_cargo_chest.png", optimize=True)

    expected_sizes = {
        player_dir / "player_idle.png": (320, 80),
        player_dir / "player_run.png": (576, 80),
        player_dir / "player_jump.png": (160, 80),
        player_dir / "player_attack.png": (448, 80),
        player_dir / "player_skill_slash.png": (640, 80),
        PUBLIC / "npcs" / "anping_harbor_clerk_idle.png": (320, 80),
        PUBLIC / "monsters" / "granary_rat_idle.png": (256, 48),
        PUBLIC / "effects" / "basic_ink_slash.png": (384, 64),
        PUBLIC / "props" / "anping_cargo_chest.png": (96, 80),
    }
    for path, expected_size in expected_sizes.items():
        image = Image.open(path).convert("RGBA")
        assert image.size == expected_size, f"{path.name}: expected {expected_size}, got {image.size}"
        assert all(image.getpixel(point)[3] == 0 for point in [(0, 0), (image.width - 1, 0), (0, image.height - 1), (image.width - 1, image.height - 1)]), f"{path.name}: corners must be transparent"


if __name__ == "__main__":
    main()
