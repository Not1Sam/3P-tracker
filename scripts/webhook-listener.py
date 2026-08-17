#!/usr/bin/env python3
"""GitHub webhook listener — pulls & rebuilds PWA on push."""

import hashlib
import hmac
import json
import os
import subprocess
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 9001
REPO_DIR = "/home/ubuntu/3p-tracker-pwa"
SECRET_FILE = os.path.join(REPO_DIR, ".webhook-secret")

def get_secret():
    if os.path.exists(SECRET_FILE):
        return open(SECRET_FILE).read().strip()
    secret = os.urandom(20).hex()
    with open(SECRET_FILE, "w") as f:
        f.write(secret)
    os.chmod(SECRET_FILE, 0o600)
    print(f"Generated webhook secret: {secret}")
    print("Add this as the webhook secret in GitHub.")
    return secret

SECRET = get_secret()

class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/deploy":
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        signature = self.headers.get("X-Hub-Signature-256", "")

        expected = "sha256=" + hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            print(f"[{self.log_date_time_string()}] Rejected — bad signature")
            self.send_response(403)
            self.end_headers()
            return

        print(f"[{self.log_date_time_string()}] Webhook verified. Deploying...")
        try:
            subprocess.run(["git", "pull", "origin", "master"], cwd=REPO_DIR, check=True)
            subprocess.run(
                ["sudo", "docker", "compose", "-f", "docker-compose.pwa.yml", "up", "-d", "--build"],
                cwd=REPO_DIR, check=True,
            )
            print(f"[{self.log_date_time_string()}] Deploy complete.")
        except subprocess.CalledProcessError as e:
            print(f"[{self.log_date_time_string()}] Deploy failed: {e}")

        self.send_response(200)
        self.send_header("Content-Type", "text/plain")
        self.end_headers()
        self.wfile.write(b"OK")

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", PORT), WebhookHandler)
    print(f"Listening on port {PORT}...")
    server.serve_forever()
