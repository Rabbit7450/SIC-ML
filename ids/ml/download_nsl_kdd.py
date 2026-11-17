"""Descarga NSL-KDD desde un espejo académico público."""

from __future__ import annotations

from pathlib import Path
from urllib.request import urlretrieve

BASE = Path(__file__).resolve().parents[2] / "datasets" / "nsl-kdd"
FILES = {
    "KDDTrain+.txt": "https://raw.githubusercontent.com/jmnwong/NSL-KDD-Dataset/master/KDDTrain+.txt",
    "KDDTest+.txt": "https://raw.githubusercontent.com/jmnwong/NSL-KDD-Dataset/master/KDDTest+.txt",
}


def main() -> None:
    BASE.mkdir(parents=True, exist_ok=True)
    for name, url in FILES.items():
        dest = BASE / name
        if dest.exists() and dest.stat().st_size > 0:
            print(f"ya existe {dest}")
            continue
        print(f"descargando {name}...")
        urlretrieve(url, dest)
        print(f"ok {dest} ({dest.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
