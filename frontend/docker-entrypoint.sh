#!/bin/sh
set -e

echo "🚀 Inizializzazione frontend container..."

# Salva file dinamici se esistono (preservali durante aggiornamento)
TEMP_DIR="/tmp/preserve"
mkdir -p "$TEMP_DIR"

if [ -f "/usr/share/nginx/html/projects.json" ]; then
    echo "💾 Preservando projects.json..."
    cp /usr/share/nginx/html/projects.json "$TEMP_DIR/"
fi

if [ -f "/usr/share/nginx/html/imageMeta.json" ]; then
    echo "💾 Preservando imageMeta.json..."
    cp /usr/share/nginx/html/imageMeta.json "$TEMP_DIR/"
fi

if [ -d "/usr/share/nginx/html/optimized" ]; then
    echo "💾 Preservando cartella optimized/..."
    mkdir -p "$TEMP_DIR/optimized"
    cp -r /usr/share/nginx/html/optimized/* "$TEMP_DIR/optimized/" 2>/dev/null || true
fi

# Copia sempre il nuovo build (aggiorna JS/CSS/HTML)
echo "📦 Aggiornamento build..."
rm -rf /usr/share/nginx/html/*
cp -r /app/dist/* /usr/share/nginx/html/
echo "✓ Build aggiornato"

# Ripristina file dinamici preservati
if [ -f "$TEMP_DIR/projects.json" ]; then
    echo "♻️  Ripristino projects.json..."
    cp "$TEMP_DIR/projects.json" /usr/share/nginx/html/
fi

if [ -f "$TEMP_DIR/imageMeta.json" ]; then
    echo "♻️  Ripristino imageMeta.json..."
    cp "$TEMP_DIR/imageMeta.json" /usr/share/nginx/html/
fi

if [ -d "$TEMP_DIR/optimized" ]; then
    echo "♻️  Ripristino optimized/..."
    mkdir -p /usr/share/nginx/html/optimized
    cp -r "$TEMP_DIR/optimized"/* /usr/share/nginx/html/optimized/ 2>/dev/null || true
fi

# Cleanup
rm -rf "$TEMP_DIR"

# Assicurati che le directory esistano
mkdir -p /usr/share/nginx/html/optimized

echo "✅ Frontend pronto!"

# Avvia nginx
exec nginx -g "daemon off;"

