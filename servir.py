"""servir.py — Servidor local para testar o site (py servir.py).
Igual ao "python -m http.server", mas manda o navegador sempre buscar a versão nova dos arquivos."""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class SemCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    pasta = sys.argv[2] if len(sys.argv) > 2 else "public"
    servidor = ThreadingHTTPServer(("127.0.0.1", porta), partial(SemCache, directory=pasta))
    print(f"Volt Academia em http://localhost:{porta}  (Ctrl+C para parar)")
    servidor.serve_forever()
