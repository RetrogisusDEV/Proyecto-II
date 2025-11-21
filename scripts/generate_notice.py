#!/usr/bin/env python3
"""
generate_notice.py

Scan the repository for known third-party references (CDN links in HTML/JS and
Python requirements) and update the NOTICE file and produce a more detailed
THIRD_PARTY.md file.

Usage:
    python scripts/generate_notice.py

This script is intentionally simple and conservative — it reports detected
URLs and names but does not claim perfect coverage. Update patterns as needed.
"""
import re
import os
import sys
from datetime import datetime
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')

HTML_JS_EXTS = ('.html', '.js')

PATTERNS = {
    'Tailwind CSS': re.compile(r'https?://cdn\.tailwindcss\.com'),
    'OpenLayers': re.compile(r'https?://cdn\.jsdelivr\.net/.+?/ol@v?([0-9\.]+)'),
    'Firebase JS SDK': re.compile(r'https?://www\.gstatic\.com/firebasejs/([0-9\.]+)\/'),
    'MetroUI': re.compile(r'metroui|metro/([0-9\.]+)'),
    'CDNJS (generic)': re.compile(r'https?://cdnjs\.cloudflare\.com/.+'),
}

def scan_files():
    found = {}
    # Walk src/ for .html and .js
    for root, dirs, files in os.walk(SRC):
        for f in files:
            if f.lower().endswith(HTML_JS_EXTS):
                path = os.path.join(root, f)
                try:
                    with open(path, 'r', encoding='utf-8', errors='ignore') as fh:
                        text = fh.read()
                except Exception:
                    continue

                # find urls
                for name, pat in PATTERNS.items():
                    for m in pat.finditer(text):
                        ver = None
                        if m.groups():
                            ver = m.group(1)
                        url = m.group(0)
                        found.setdefault(name, set()).add((ver, url))

                # generic detection for firebase, ol, tailwind in script tags
                # Instead of substring matching, scan URLs and check host
                for m in re.finditer(r'https?://[^\s"\']+', text):
                    url = m.group(0)
                    try:
                        parsed = urllib.parse.urlparse(url)
                        if parsed.hostname and parsed.hostname.lower() == 'cdn.tailwindcss.com':
                            found.setdefault('Tailwind CSS', set()).add((None, url))
                    except Exception:
                        continue
                if 'firebasejs' in text:
                    # best-effort extract
                    for m in re.finditer(r'https?://www\.gstatic\.com/firebasejs/([0-9\.]+)/(?:firebase-)?', text):
                        found.setdefault('Firebase JS SDK', set()).add((m.group(1), m.group(0)))
                if 'ol@' in text or 'openlayers' in text or 'ol.js' in text:
                    for m in re.finditer(r'https?://cdn\.jsdelivr\.net/.+?/ol@v?([0-9\.]+)', text):
                        found.setdefault('OpenLayers', set()).add((m.group(1), m.group(0)))

    # Read requirements.txt
    req_file = os.path.join(ROOT, 'requirements.txt')
    py_reqs = []
    if os.path.exists(req_file):
        with open(req_file, 'r', encoding='utf-8') as fh:
            for line in fh:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                py_reqs.append(line)

    return found, py_reqs

def write_notice(found, py_reqs):
    notice_path = os.path.join(ROOT, 'NOTICE')
    now = datetime.utcnow().strftime('%Y-%m-%d')
    lines = []
    lines.append('NOTICE - third-party attributions (generated)')
    lines.append('')
    lines.append('Project: Sistema de gestión y monitoreo de averías y reportes para la')
    lines.append('empresa privada de fibra StarNET')
    lines.append('Repository: RetrogisusDEV/Proyecto-II')
    lines.append(f'Scan date: {now}')
    lines.append('')
    lines.append('Detected components (name — detected version if any — source URL):')
    lines.append('')

    for name, items in sorted(found.items()):
        lines.append(f'- {name}')
        for ver, url in sorted(items):
            if ver:
                lines.append(f'  - version: {ver} — {url}')
            else:
                lines.append(f'  - {url}')
        lines.append('')

    if py_reqs:
        lines.append('- Python requirements (from requirements.txt)')
        for r in py_reqs:
            lines.append(f'  - {r}')
        lines.append('')

    lines.append('Notes:')
    lines.append('- This NOTICE lists detected components and source URLs only.')
    lines.append('- Perform a full license compliance review before redistribution.')
    lines.append('')

    with open(notice_path, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines))

    print(f'Updated NOTICE ({notice_path})')

def write_third_party(found, py_reqs):
    md_path = os.path.join(ROOT, 'THIRD_PARTY.md')
    now = datetime.utcnow().strftime('%Y-%m-%d')
    lines = []
    lines.append('# Third-party components and compliance notes')
    lines.append('')
    lines.append(f'_Generated: {now}_')
    lines.append('')
    lines.append('This file summarizes detected third-party components used by the project.')
    lines.append('It is intended to help with license review and compliance. Verify upstream')
    lines.append('licenses for any redistribution or packaging.')
    lines.append('')

    for name, items in sorted(found.items()):
        lines.append(f'## {name}')
        for ver, url in sorted(items):
            if ver:
                lines.append(f'- Version: {ver}')
            lines.append(f'- Source: {url}')
        lines.append('')

    if py_reqs:
        lines.append('## Python requirements')
        lines.append('Listed in `requirements.txt`:')
        for r in py_reqs:
            lines.append(f'- {r}')
        lines.append('')

    lines.append('## Guidance')
    lines.append('- Review each upstream license and include required attributions in distributed artifacts.')
    lines.append('- If you add or update libraries, re-run this script to refresh `NOTICE` and `THIRD_PARTY.md`.')

    with open(md_path, 'w', encoding='utf-8') as fh:
        fh.write('\n'.join(lines))

    print(f'Wrote THIRD_PARTY.md ({md_path})')

def main():
    found, py_reqs = scan_files()
    write_notice(found, py_reqs)
    write_third_party(found, py_reqs)

if __name__ == '__main__':
    main()
