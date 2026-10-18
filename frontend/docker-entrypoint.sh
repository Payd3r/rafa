#!/bin/sh
set -eu

# Keep CMS data and media in place; only replace application build files.
PUBLIC_DIR=/usr/share/nginx/html
mkdir -p "$PUBLIC_DIR"
find "$PUBLIC_DIR" -mindepth 1 -maxdepth 1 \
    ! -name optimized ! -name projects.json ! -name imageMeta.json \
    ! -name masonryLayouts.json -exec rm -rf {} \;
for asset in /app/dist/*; do
    name=$(basename "$asset")
    case "$name" in
        optimized|projects.json|imageMeta.json|masonryLayouts.json)
            if [ ! -e "$PUBLIC_DIR/$name" ]; then cp -R "$asset" "$PUBLIC_DIR/"; fi
            ;;
        *) cp -R "$asset" "$PUBLIC_DIR/" ;;
    esac
done
mkdir -p "$PUBLIC_DIR/optimized"
exec nginx -g 'daemon off;'
