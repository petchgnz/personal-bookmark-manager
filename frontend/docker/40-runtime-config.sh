#!/bin/sh
set -eu

require_value() {
  variable_name="$1"
  eval "variable_value=\${$variable_name:-}"
  if [ -z "$variable_value" ]; then
    echo "Missing required public runtime configuration: $variable_name" >&2
    exit 1
  fi
}

require_safe_domain() {
  case "$1" in
    *[!A-Za-z0-9.-]*)
      echo "VITE_AUTH0_DOMAIN contains unsupported characters" >&2
      exit 1
      ;;
  esac
}

require_safe_client_id() {
  case "$1" in
    *[!A-Za-z0-9_-]*)
      echo "VITE_AUTH0_CLIENT_ID contains unsupported characters" >&2
      exit 1
      ;;
  esac
}

require_safe_url() {
  case "$1" in
    http://*|https://*) ;;
    *)
      echo "$2 must be an absolute HTTP or HTTPS URL" >&2
      exit 1
      ;;
  esac

  case "$1" in
    *[!A-Za-z0-9:/._-]*)
      echo "$2 contains unsupported characters" >&2
      exit 1
      ;;
  esac
}

require_value VITE_AUTH0_DOMAIN
require_value VITE_AUTH0_CLIENT_ID
require_value VITE_AUTH0_AUDIENCE
require_value VITE_API_BASE_URL
require_safe_domain "$VITE_AUTH0_DOMAIN"
require_safe_client_id "$VITE_AUTH0_CLIENT_ID"
require_safe_url "$VITE_AUTH0_AUDIENCE" VITE_AUTH0_AUDIENCE
require_safe_url "$VITE_API_BASE_URL" VITE_API_BASE_URL

envsubst '${VITE_AUTH0_DOMAIN} ${VITE_AUTH0_CLIENT_ID} ${VITE_AUTH0_AUDIENCE} ${VITE_API_BASE_URL}' \
  < /opt/runtime-config.template.js \
  > /usr/share/nginx/html/runtime-config.js
