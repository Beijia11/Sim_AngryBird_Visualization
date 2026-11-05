"""Preview the weekly site locally, like GitHub Pages (static files + HTTP Range so videos can seek).

  python3 week10/serve_week10.py            # from the repo root, then open http://localhost:8510/week10/
  python3 week10/serve_week10.py --port 9000
Serves the repo root only (not the rest of /shared). Python standard library only.
"""
import argparse, mimetypes, os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

mimetypes.add_type('text/javascript', '.js'); mimetypes.add_type('image/webp', '.webp')

class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass
    def send_head(self):
        rng, path = self.headers.get('Range'), self.translate_path(self.path)
        if not rng or not os.path.isfile(path): return super().send_head()
        size = os.path.getsize(path); a, b = rng.split('=', 1)[1].split(',')[0].split('-')
        lo = int(a) if a else max(0, size - int(b)); hi = min(int(b) if a and b else size - 1, size - 1)
        if lo > hi: self.send_error(416); return None
        f = open(path, 'rb'); f.seek(lo)
        self.send_response(206); self.send_header('Content-Type', self.guess_type(path))
        self.send_header('Content-Range', f'bytes {lo}-{hi}/{size}'); self.send_header('Content-Length', str(hi - lo + 1))
        self.send_header('Accept-Ranges', 'bytes'); self.end_headers()
        self.copyfile(_Limited(f, hi - lo + 1), self.wfile); f.close(); return None

class _Limited:
    def __init__(self, f, n): self.f, self.n = f, n
    def read(self, k=-1):
        if self.n <= 0: return b''
        d = self.f.read(min(k if k > 0 else self.n, self.n)); self.n -= len(d); return d

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--port', type=int, default=8510); a = ap.parse_args()
    root = Path(__file__).resolve().parent.parent
    print(f'Serving {root}\n  http://localhost:{a.port}/week10/   (all weeks: http://localhost:{a.port}/)', flush=True)
    ThreadingHTTPServer(('127.0.0.1', a.port), partial(Handler, directory=str(root))).serve_forever()
