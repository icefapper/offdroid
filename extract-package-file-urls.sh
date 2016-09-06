#!/bin/bash
URL_MAP="$1"
FILE_SOURCE="$2"

last_arg=""
for ARG in $@; do
  if [ "$last_arg" = "--file-source" ]; then
    FILE_SOURCE="$ARG"
  elif [ "$last_arg" = "--url-hashes" ]; then
    URL_MAP="$ARG"
  fi
  last_arg="$ARG"
done
 
none() { return; }

if [ -e "$URL_MAP" ]; then
  none # echo "using url-map: <$URL_MAP>" 1>&2
else
  echo "url-map not found: <$URL_MAP>" 1>&2
  exit 1
fi

if [ -e "$FILE_SOURCE" ]; then
  none # echo "using file source: <$FILE_SOURCE>" 1>&2
else
  echo "file-source could not be found: <$FILE_SOURCE>" 1>&2
  exit 2
fi

 node get-addons.js repo "$URL_MAP" "$FILE_SOURCE"

