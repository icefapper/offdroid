#!/bin/bash


PROXY=""; DOWNLOAD_DIR=".offdroid-files"

last_arg=""
for ARG in $@; do 
  if [ "$last_arg" = "--to" ]; then
    DOWNLOAD_DIR="$ARG/.offdroid-files"
  elif [ "$last_arg" = "--use-proxy" ]; then
    PROXY="$ARG"
  fi
  
  last_arg="$ARG"
done

num=0
BASEDIR="$DOWNLOAD_DIR"
while [ -e "$DOWNLOAD_DIR" ]; do
  num=$[$num+1]
  DOWNLOAD_DIR="$BASEDIR$num"
done

mkdir -p "$DOWNLOAD_DIR"

ROOT="http://dl.google.com/android/repository"
HASHLIST="69f54afb9b698723d339154bbe439f93fad84e9a" #list of the hashes found, initially containing the "not found" page's hash

XML_REPO="repository"
XML_ADDONLIST="addons_list"

get-and-save() {
  DEST="$2"
  curl="curl"
  SRC=$1
  if [ -n $PROXY ]; then
    curl="curl -x $PROXY"
  fi

  HASH=$($curl -s $SRC | tee "$DEST" | sha1sum) 
  RET=$?

  if [ $RET -eq 0 ]; then
    for H in $HASH;do HASH=$H; break 1; done
    echo "$HASHLIST" | grep -q -F $HASH
    if [ $? -ne 0 ]; then
      DL=$[$DL+1]
      echo "<$HASH> $SRC" 1>&2
      echo "$HASH $SRC"
      HASHLIST="$HASHLIST $HASH"
    else
      rm $DEST
    fi
  else
    echo "error:$RET $SRC"1>&2
  fi

  return 0
}

DL=1
idx=0

XML_REPO_FILE_NAMES=""
MAX_REPO=12

URL="$ROOT/$XML_REPO.xml"
SAVEDIR="$DOWNLOAD_DIR/$DL"
while get-and-save "$URL" "$SAVEDIR"; do
  if [ -n "$XML_REPO_FILE_NAMES" ]; then
    XML_REPO_FILE_NAMES="$XML_REPO_FILE_NAMES ";
  fi

  XML_REPO_FILE_NAMES="$XML_REPO_FILE_NAMES$URL $SAVEDIR"

  if [ $idx -eq $MAX_REPO ]; then
    break 1
  fi

  idx=$[$idx + 1];

  URL="$ROOT/$XML_REPO-$idx.xml"
  SAVEDIR="$DOWNLOAD_DIR/$DL"
done

idx=0

XML_ADDONLIST_FILE_NAMES=""
MAX_ADDONLIST=2

URL="$ROOT/$XML_ADDONLIST.xml"
SAVEDIR="$DOWNLOAD_DIR/$DL"

while get-and-save "$URL" "$SAVEDIR"; do
  if [ -n "$XML_ADDONLIST_FILE_NAMES" ]; then
    XML_ADDONLIST_FILE_NAMES="$XML_ADDONLIST_FILE_NAMES "
  fi

  XML_ADDONLIST_FILE_NAMES="$XML_ADDONLIST_FILE_NAMES$URL $SAVEDIR"
  
  if [ $idx -eq $MAX_ADDONLIST ]; then
    break 1
  fi  

  idx=$[$idx+1]

  URL="$ROOT/$XML_ADDONLIST-$idx.xml"
  SAVEDIR="$DOWNLOAD_DIR/$DL"
done

ADDON_URLS=$(node get-addons.js addon $XML_ADDONLIST_FILE_NAMES)
for ADDON in $ADDON_URLS; do
  if [ -n "$XML_REPO_FILE_NAMES" ]; then
    XML_REPO_NAMES="$XML_REPO_FILE_NAMES "
  fi
  SAVEDIR="$DOWNLOAD_DIR/$DL"
  get-and-save "$ADDON" "$SAVEDIR"
  XML_REPO_FILE_NAMES="$XML_REPO_FILE_NAMES $ADDON $SAVEDIR"
done

