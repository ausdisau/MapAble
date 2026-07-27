#!/usr/bin/env bash
# Load KEY=VALUE pairs from a dotenv file without overriding already-set env vars.
# Usage: source scripts/load-env-file.sh && load_env_file path/to/.env
# shellcheck disable=SC2034

load_env_file() {
  local file="$1"
  if [[ ! -f "${file}" ]]; then
    return 0
  fi

  echo "[env] Loading ${file} (existing env wins)"
  local line key val
  while IFS= read -r line || [[ -n "${line}" ]]; do
    # strip CR, comments, blanks
    line="${line%$'\r'}"
    [[ -z "${line}" || "${line}" =~ ^[[:space:]]*# ]] && continue
    [[ "${line}" != *=* ]] && continue

    key="${line%%=*}"
    val="${line#*=}"
    # trim key whitespace
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    [[ "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]] || continue

    # strip matching single/double quotes around value
    if [[ "${val}" =~ ^\".*\"$ ]]; then
      val="${val:1:${#val}-2}"
    elif [[ "${val}" =~ ^\'.*\'$ ]]; then
      val="${val:1:${#val}-2}"
    fi

    # do not override vars already present in the environment
    if [[ -n "${!key+x}" ]]; then
      continue
    fi
    export "${key}=${val}"
  done < "${file}"
}
