#!/usr/bin/env python3

import argparse
import concurrent.futures
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image


REPO_ROOT = Path(__file__).resolve().parents[1]
POKEMON_DATA_DIR = REPO_ROOT / "public" / "data" / "pokemonData"
ARTWORK_ROOT = (
    REPO_ROOT
    / "public"
    / "images"
    / "pokemon"
    / "official"
)
FULL_DIR = ARTWORK_ROOT / "full"
CARD_DIR = ARTWORK_ROOT / "card"
SPECIAL_DIR = (
    REPO_ROOT
    / "public"
    / "images"
    / "pokemon"
    / "special"
)
MANIFEST_PATH = (
    REPO_ROOT
    / "public"
    / "data"
    / "pokemonArtworkManifest.json"
)

TREE_URL = (
    "https://api.github.com/repos/PokeAPI/sprites/"
    "git/trees/master?recursive=1"
)
RAW_ROOT = (
    "https://raw.githubusercontent.com/PokeAPI/sprites/"
    "master/sprites/pokemon/other/official-artwork"
)
OFFICIAL_ARTWORK_PATTERN = re.compile(
    r"/official-artwork/(\d+)\.png(?:\?.*)?$"
)
TREE_ARTWORK_PATTERN = re.compile(
    r"^sprites/pokemon/other/official-artwork/(\d+)\.png$"
)
RAW_SPRITE_PREFIX = (
    "https://raw.githubusercontent.com/PokeAPI/sprites/"
    "master/sprites/pokemon/"
)


def request_bytes(url, attempts=8):
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "PokeLore-artwork-sync"},
    )

    for attempt in range(attempts):
        try:
            with urllib.request.urlopen(
                request,
                timeout=45,
            ) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if attempt == attempts - 1:
                raise

            retry_after = error.headers.get(
                "Retry-After"
            )
            delay = (
                float(retry_after)
                if retry_after
                else min(60, 4 * (2**attempt))
            )
            time.sleep(delay)
        except (
            TimeoutError,
            urllib.error.URLError,
        ):
            if attempt == attempts - 1:
                raise

            time.sleep(
                min(30, 2 * (2**attempt))
            )


def discover_referenced_ids():
    artwork_ids = set()

    for data_path in POKEMON_DATA_DIR.glob("*.json"):
        data = json.loads(
            data_path.read_text(encoding="utf-8")
        )
        sprite_urls = [data.get("sprite")]
        sprite_urls.extend(
            variety.get("sprite")
            for variety in data.get("varieties", [])
        )

        for sprite_url in sprite_urls:
            if not sprite_url:
                continue

            match = OFFICIAL_ARTWORK_PATTERN.search(
                sprite_url
            )
            if match:
                artwork_ids.add(int(match.group(1)))

    return artwork_ids


def discover_special_urls():
    sprite_urls = set()

    for data_path in POKEMON_DATA_DIR.glob("*.json"):
        data = json.loads(
            data_path.read_text(encoding="utf-8")
        )
        candidates = [
            data.get("sprite"),
            data.get("spriteFallback"),
        ]

        for variety in data.get("varieties", []):
            candidates.extend(
                [
                    variety.get("sprite"),
                    variety.get("spriteFallback"),
                ]
            )

        for sprite_url in candidates:
            if (
                sprite_url
                and sprite_url.startswith(
                    RAW_SPRITE_PREFIX
                )
                and "/official-artwork/"
                not in sprite_url
            ):
                sprite_urls.add(sprite_url)

    return sprite_urls


def discover_repository_ids():
    tree = json.loads(
        request_bytes(TREE_URL).decode("utf-8")
    )
    artwork_ids = set()

    for entry in tree.get("tree", []):
        match = TREE_ARTWORK_PATTERN.match(
            entry.get("path", "")
        )
        if match:
            artwork_ids.add(int(match.group(1)))

    return artwork_ids


def special_destination(source_url):
    relative_path = urllib.parse.unquote(
        source_url.split(
            RAW_SPRITE_PREFIX,
            1,
        )[1].split("?", 1)[0]
    )
    destination = (
        SPECIAL_DIR / Path(relative_path)
    ).resolve()

    if SPECIAL_DIR.resolve() not in (
        destination,
        *destination.parents,
    ):
        raise ValueError(
            f"Unsafe special artwork path: {source_url}"
        )

    return destination


def validate_special_artwork(path):
    if ".svg" in {
        suffix.lower()
        for suffix in path.suffixes
    }:
        try:
            text = path.read_text(
                encoding="utf-8"
            )
            return "<svg" in text
        except (OSError, UnicodeDecodeError):
            return False

    return validate_png(path)


def download_special_artwork(
    source_url,
    force=False,
):
    destination = special_destination(
        source_url
    )
    destination.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    if (
        not force
        and destination.exists()
        and validate_special_artwork(
            destination
        )
    ):
        return source_url, False

    temp_path = destination.with_suffix(
        destination.suffix + ".tmp"
    )
    temp_path.write_bytes(
        request_bytes(source_url)
    )

    if not validate_special_artwork(temp_path):
        temp_path.unlink(missing_ok=True)
        raise ValueError(
            f"Downloaded invalid special artwork: {source_url}"
        )

    temp_path.replace(destination)
    return source_url, True


def validate_png(path):
    try:
        with Image.open(path) as image:
            image.load()
            return (
                image.format == "PNG"
                and image.width > 0
                and image.height > 0
            )
    except (OSError, ValueError):
        return False


def validate_card_artwork(path, size):
    try:
        with Image.open(path) as image:
            image.load()
            return (
                image.format == "WEBP"
                and image.width > 0
                and image.height > 0
                and image.width <= size
                and image.height <= size
            )
    except (OSError, ValueError):
        return False


def download_artwork(artwork_id, force=False):
    destination = FULL_DIR / f"{artwork_id}.png"

    if (
        not force
        and destination.exists()
        and validate_png(destination)
    ):
        return artwork_id, False

    source_url = f"{RAW_ROOT}/{artwork_id}.png"
    temp_path = destination.with_suffix(".png.tmp")
    temp_path.write_bytes(request_bytes(source_url))

    if not validate_png(temp_path):
        temp_path.unlink(missing_ok=True)
        raise ValueError(
            f"Downloaded invalid PNG for {artwork_id}"
        )

    temp_path.replace(destination)
    return artwork_id, True


def generate_card_artwork(
    artwork_id,
    size,
    quality,
    force=False,
):
    source = FULL_DIR / f"{artwork_id}.png"
    destination = CARD_DIR / f"{artwork_id}.webp"

    if (
        not force
        and destination.exists()
        and destination.stat().st_mtime
        >= source.stat().st_mtime
        and validate_card_artwork(
            destination,
            size,
        )
    ):
        return False

    temp_path = destination.with_suffix(
        ".webp.tmp"
    )

    with Image.open(source) as image:
        image = image.convert("RGBA")
        image.thumbnail(
            (size, size),
            Image.Resampling.LANCZOS,
        )
        image.save(
            temp_path,
            "WEBP",
            quality=quality,
            method=6,
            exact=True,
        )

    if not validate_card_artwork(
        temp_path,
        size,
    ):
        temp_path.unlink(missing_ok=True)
        raise ValueError(
            f"Generated invalid WebP for {artwork_id}"
        )

    temp_path.replace(destination)
    return True


def run_parallel(items, worker, label, workers):
    completed = 0
    changed = 0
    failures = []

    with concurrent.futures.ThreadPoolExecutor(
        max_workers=workers
    ) as executor:
        futures = {
            executor.submit(worker, item): item
            for item in items
        }

        for future in concurrent.futures.as_completed(
            futures
        ):
            item = futures[future]
            completed += 1

            try:
                result = future.result()
                changed += int(
                    result[1]
                    if isinstance(result, tuple)
                    else result
                )
            except Exception as error:
                failures.append((item, str(error)))

            if (
                completed % 50 == 0
                or completed == len(items)
            ):
                print(
                    f"{label}: {completed}/{len(items)}"
                )

    if failures:
        failure_summary = "\n".join(
            f"  {item}: {error}"
            for item, error in failures
        )
        raise RuntimeError(
            f"{label} failed for {len(failures)} items:\n"
            f"{failure_summary}"
        )

    return changed


def write_manifest(
    artwork_ids,
    special_urls,
    card_size,
):
    entries = {
        str(artwork_id): {
            "full": (
                f"/images/pokemon/official/full/"
                f"{artwork_id}.png"
            ),
            "card": (
                f"/images/pokemon/official/card/"
                f"{artwork_id}.webp"
            ),
        }
        for artwork_id in artwork_ids
    }
    manifest = {
        "cardSize": card_size,
        "count": len(entries),
        "artwork": entries,
        "special": {
            source_url: (
                "/"
                + special_destination(
                    source_url
                )
                .relative_to(
                    REPO_ROOT / "public"
                )
                .as_posix()
            )
            for source_url in sorted(
                special_urls
            )
        },
    }
    MANIFEST_PATH.write_text(
        json.dumps(
            manifest,
            indent=2,
            sort_keys=True,
        )
        + "\n",
        encoding="utf-8",
    )


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Mirror official Pokémon artwork and generate "
            "card-sized WebP assets."
        )
    )
    parser.add_argument(
        "--card-size",
        type=int,
        default=384,
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=82,
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=3,
    )
    parser.add_argument(
        "--force",
        action="store_true",
    )
    args = parser.parse_args()

    FULL_DIR.mkdir(parents=True, exist_ok=True)
    CARD_DIR.mkdir(parents=True, exist_ok=True)
    SPECIAL_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    referenced_ids = discover_referenced_ids()
    special_urls = discover_special_urls()
    repository_ids = discover_repository_ids()
    artwork_ids = sorted(
        referenced_ids | repository_ids
    )

    missing_repository_ids = sorted(
        referenced_ids - repository_ids
    )
    if missing_repository_ids:
        print(
            "Referenced IDs missing from repository tree: "
            + ", ".join(
                str(artwork_id)
                for artwork_id in missing_repository_ids
            )
        )

    print(
        f"Discovered {len(artwork_ids)} artwork files "
        f"({len(referenced_ids)} referenced by PokeLore)."
    )

    downloaded = run_parallel(
        artwork_ids,
        lambda artwork_id: download_artwork(
            artwork_id,
            force=args.force,
        ),
        "Downloading artwork",
        args.workers,
    )
    downloaded_special = run_parallel(
        sorted(special_urls),
        lambda source_url:
            download_special_artwork(
                source_url,
                force=args.force,
            ),
        "Downloading special artwork",
        args.workers,
    )
    generated = run_parallel(
        artwork_ids,
        lambda artwork_id: generate_card_artwork(
            artwork_id,
            args.card_size,
            args.quality,
            force=args.force,
        ),
        "Generating card artwork",
        args.workers,
    )

    write_manifest(
        artwork_ids,
        special_urls,
        args.card_size,
    )

    full_bytes = sum(
        path.stat().st_size
        for path in FULL_DIR.glob("*.png")
    )
    card_bytes = sum(
        path.stat().st_size
        for path in CARD_DIR.glob("*.webp")
    )

    print(
        f"Downloaded {downloaded} files; generated "
        f"{generated} card images."
    )
    print(
        f"Downloaded {downloaded_special} special "
        f"form assets."
    )
    print(
        f"Full artwork: {full_bytes / 1024 / 1024:.2f} MiB"
    )
    print(
        f"Card artwork: {card_bytes / 1024 / 1024:.2f} MiB"
    )
    print(f"Manifest: {MANIFEST_PATH}")


if __name__ == "__main__":
    main()
