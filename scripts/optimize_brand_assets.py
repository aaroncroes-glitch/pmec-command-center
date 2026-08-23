from pathlib import Path

from PIL import Image


SOURCE = Path("/home/ubuntu/webdev-static-assets/lumen-app-icon.png")
DESTINATIONS = [
    Path("/home/ubuntu/lumen-tasks/assets/images/icon.png"),
    Path("/home/ubuntu/lumen-tasks/assets/images/splash-icon.png"),
    Path("/home/ubuntu/lumen-tasks/assets/images/favicon.png"),
    Path("/home/ubuntu/lumen-tasks/assets/images/android-icon-foreground.png"),
]


def main() -> None:
    with Image.open(SOURCE) as original:
        image = original.convert("RGB")
        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        optimized = image.quantize(colors=192, method=Image.Quantize.MEDIANCUT)
        for destination in DESTINATIONS:
            optimized.save(destination, format="PNG", optimize=True, compress_level=9)


if __name__ == "__main__":
    main()
