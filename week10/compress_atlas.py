"""Step 2: re-encode the mirrored lossless WebP atlases as lossy WebP (RGB quality Q, alpha kept lossless).

Lossless atlases make the mirror ~2.1 GB, past GitHub Pages' 1 GB site limit. On a 60-file sample, quality 90
gave ~3.1x smaller files at median RGB PSNR 38.7 dB (min 35.7) inside the person mask; alpha is unchanged.
Files keep their names, so no page or manifest changes are needed. Cached: existing outputs are skipped.
Usage: python3 compress_atlas.py [--raw DIR] [--out DIR] [--quality 90]   (needs Pillow; use the edenlive env)
"""
import argparse, os
from multiprocessing import Pool
from pathlib import Path
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('--raw', default='/home/beijial2/datasets/week10_atlas_raw')
ap.add_argument('--out', default='/home/beijial2/datasets/week10_atlas_webp_q90')
ap.add_argument('--quality', type=int, default=90)
a = ap.parse_args(); RAW, OUT = Path(a.raw), Path(a.out)

def one(src):
    dst = OUT / src.relative_to(RAW)
    if dst.exists(): return src.stat().st_size, dst.stat().st_size
    im = Image.open(src); im.load()
    dst.parent.mkdir(parents=True, exist_ok=True); tmp = dst.with_name(dst.name + '.part')
    im.save(tmp, 'WEBP', quality=a.quality, method=6, alpha_quality=100, exact=True)
    if tmp.stat().st_size >= src.stat().st_size: tmp.write_bytes(src.read_bytes())  # never grow a file
    os.replace(tmp, dst); return src.stat().st_size, dst.stat().st_size

if __name__ == '__main__':
    files = sorted(RAW.rglob('*.webp'))
    with Pool(24) as p: r = p.map(one, files, chunksize=32)
    print(f'{len(files)} webp: {sum(x for x, _ in r)/1e6:.0f} MB -> {sum(y for _, y in r)/1e6:.0f} MB')
