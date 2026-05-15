#!/usr/bin/env bash
# Regenerates tiktok/product-catalog.md's data rows from the live product pages
# in site/public/products/. Run after Mike adds/removes/repriced any product.
#
# This script only extracts the raw data — it doesn't rewrite the prose or the
# "Hook angles" / "Avoid saying" columns. After running, open product-catalog.md
# and:
#   1. Update the "Last refreshed" date at the top.
#   2. Add rows for any new products under the right category section.
#   3. Remove rows for products no longer in site/public/products/.
#
# Usage:
#   bash tiktok/scripts/regenerate-catalog.sh > tiktok/scripts/_catalog-raw.txt
#   # then merge by hand into product-catalog.md

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PRODUCTS_DIR="$REPO_ROOT/site/public/products"

if [ ! -d "$PRODUCTS_DIR" ]; then
  echo "ERROR: products directory not found at $PRODUCTS_DIR" >&2
  exit 1
fi

printf 'SLUG | ITEM_ID | NAME | PRICE | IMAGE | DESCRIPTION\n'
printf -- '---|---|---|---|---|---\n'

for slug_dir in "$PRODUCTS_DIR"/*/; do
  slug="$(basename "$slug_dir")"
  html="$slug_dir/index.html"
  [ -f "$html" ] || continue

  name=$(grep -oE 'data-item-name="[^"]*"' "$html" | head -1 | sed 's/data-item-name="//;s/"$//')
  price=$(grep -oE 'data-item-price="[^"]*"' "$html" | head -1 | sed 's/data-item-price="//;s/"$//')
  item_id=$(grep -oE 'data-item-id="[^"]*"' "$html" | head -1 | sed 's/data-item-id="//;s/"$//')
  img=$(grep -oE 'og:image" content="[^"]*"' "$html" | head -1 | sed 's/.*content="//;s/"$//')
  desc=$(grep -oE '<meta name="description" content="[^"]*"' "$html" | head -1 | sed 's/.*content="//;s/"$//')

  # Truncate description for table readability
  desc_short=$(printf '%s' "$desc" | cut -c1-120)
  [ ${#desc} -gt 120 ] && desc_short="${desc_short}..."

  printf '%s | %s | %s | $%s | %s | %s\n' \
    "$slug" "$item_id" "$name" "$price" "$(basename "$img")" "$desc_short"
done | sort

echo "" >&2
echo "Done. Compare this output against product-catalog.md and merge by hand." >&2
echo "Tip: pipe through 'sort' or filter by category to make merging easier." >&2
