#!/bin/bash

HASH_MAP="file-hashes-for-offdroid"
num=0
base="$HASH_MAP"

while [ -e "$HASH_MAP" ]; do
  num=$[$num+1]
  HASH_MAP="$base$num"
done

find | xargs sha1sum > "$HASH_MAP"
echo -n "$HASH_MAP"


