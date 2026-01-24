#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📝 Generating changelogs for Turborepo workspace...${NC}\n"

# Generate root changelog
echo -e "${GREEN}Generating root CHANGELOG.md${NC}"
git-cliff --config cliff.toml --output CHANGELOG.md

# Function to generate changelog for a package
generate_package_changelog() {
  local package_path=$1
  local package_name=$(basename "$package_path")
  
  echo -e "${GREEN}Generating changelog for $package_name${NC}"
  
  # Generate changelog only for commits affecting this package
  git-cliff --config cliff-workspace.toml \
    --include-path "${package_path}/*" \
    --output "${package_path}/CHANGELOG.md"
}

# Generate changelogs for all apps
if [ -d "apps" ]; then
  for app in apps/*; do
    if [ -d "$app" ]; then
      generate_package_changelog "$app"
    fi
  done
fi

# Generate changelogs for all packages
if [ -d "packages" ]; then
  for pkg in packages/*; do
    if [ -d "$pkg" ]; then
      generate_package_changelog "$pkg"
    fi
  done
fi

echo -e "\n${BLUE}✨ All changelogs generated successfully!${NC}"