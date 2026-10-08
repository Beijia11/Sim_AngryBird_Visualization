"""Copy the five frozen tennis programs without modifying their execution code."""
import hashlib
import json
import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
WORKSPACE = HERE.parent.parent
EVALUATION = WORKSPACE / "newnew_harness/evaluation"
SOURCES = {
    "simple": EVALUATION / "case_studies/tennis_fullbody_ik_failure/simple_baseline",
    "v2": EVALUATION / "case_studies/tennis_fullbody_ik_failure/program",
    "v3": EVALUATION / "case_studies/tennis_preserve_simple_v3/program",
    "v4": EVALUATION / "case_studies/tennis_contact_v4/program",
    "v5": EVALUATION / "runs/clip_006/generations/adaptive_contact_v5/attempts/generate/20261008T152605-4b2563f2/program",
}


def main():
    manifest = {}
    for version, source in SOURCES.items():
        if not (source / "world.js").is_file():
            raise FileNotFoundError(source)
        target = HERE / "play/tennis" / version
        files = {}
        for path in sorted(source.rglob("*")):
            if not path.is_file():
                continue
            relative = path.relative_to(source)
            destination = target / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, destination)
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
            assert hashlib.sha256(destination.read_bytes()).hexdigest() == digest
            files[str(relative)] = digest
        manifest[version] = {"source": str(source.relative_to(WORKSPACE)), "sha256": files}
    (HERE / "play/tennis/manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Copied {len(manifest)} original programs with verified file hashes.")


if __name__ == "__main__":
    main()
