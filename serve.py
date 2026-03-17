from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import webbrowser


def main() -> None:
    host = "127.0.0.1"
    port = 5173
    url = f"http://{host}:{port}/"
    print(f"Serving on {url}")
    try:
        webbrowser.open(url)
    except Exception:
        pass
    ThreadingHTTPServer((host, port), SimpleHTTPRequestHandler).serve_forever()


if __name__ == "__main__":
    main()

