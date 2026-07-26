#!/usr/bin/env bash
# Gera Clakete.xcodeproj a partir de project.yml (precisa rodar no Mac).
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v xcodegen >/dev/null 2>&1; then
  echo "Instale XcodeGen:"
  echo "  brew install xcodegen"
  exit 1
fi

xcodegen generate
echo "OK → abra Clakete.xcodeproj no Xcode"
open Clakete.xcodeproj
