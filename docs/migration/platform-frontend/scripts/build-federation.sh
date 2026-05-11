#!/usr/bin/env bash
# =============================================================================
# build-federation.sh — Build federation bundle with checksums and manifest
# =============================================================================
# Produces a self-contained directory ready for CFMDS ingestion:
#   dist/federation/
#     ├── remoteEntry.js
#     ├── *.js (chunks)
#     ├── checksums.json   (SHA256 hashes of all output files)
#     └── manifest.json    (module metadata for CFMDS)
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# ── 1. Build the federation bundle ──────────────────────────────────────────
echo "Building federation bundle..."
pnpm build:federation

OUTPUT_DIR="dist/federation"

if [ ! -d "$OUTPUT_DIR" ]; then
  echo "ERROR: Build output directory '$OUTPUT_DIR' not found." >&2
  exit 1
fi

# ── 2. Read version from package.json ───────────────────────────────────────
VERSION=$(node -p "require('./package.json').version")

# ── 3. Generate checksums.json ──────────────────────────────────────────────
echo "Generating checksums.json..."
cd "$OUTPUT_DIR"

# Collect SHA256 hashes for every file except the metadata files themselves
CHECKSUMS="{"
FIRST=true
while IFS= read -r file; do
  # Strip leading ./ for cleaner keys
  key="${file#./}"
  hash=$(sha256sum "$file" | awk '{print $1}')
  if [ "$FIRST" = true ]; then
    FIRST=false
  else
    CHECKSUMS+=","
  fi
  CHECKSUMS+="$(printf '\n  "%s": "%s"' "$key" "$hash")"
done < <(find . -type f \
  -not -name 'checksums.json' \
  -not -name 'manifest.json' \
  | sort)
CHECKSUMS+=$'\n}'

echo "$CHECKSUMS" > checksums.json

# ── 4. Generate manifest.json ───────────────────────────────────────────────
echo "Generating manifest.json..."

cd "$PROJECT_ROOT"

ANGULAR_CORE_VERSION=$(node -p "require('./package.json').dependencies['@angular/core'].replace(/^[^0-9]*/, '')")
RXJS_VERSION=$(node -p "require('./package.json').dependencies['rxjs'].replace(/^[^0-9]*/, '')")

cat > "$OUTPUT_DIR/manifest.json" << EOF
{
  "name": "platform-frontend",
  "version": "$VERSION",
  "exposedModule": "./bootstrap",
  "remoteEntry": "remoteEntry.js",
  "routes": ["/app/**"],
  "supportedLocales": ["en", "pt-BR"],
  "shared": {
    "@angular/core": "$ANGULAR_CORE_VERSION",
    "rxjs": "$RXJS_VERSION"
  }
}
EOF

# ── 5. Summary ──────────────────────────────────────────────────────────────
FILE_COUNT=$(find "$OUTPUT_DIR" -type f | wc -l | tr -d ' ')
echo ""
echo "Federation build complete:"
echo "  Output:  $OUTPUT_DIR"
echo "  Version: $VERSION"
echo "  Files:   $FILE_COUNT"
