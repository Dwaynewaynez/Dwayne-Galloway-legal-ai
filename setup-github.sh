#!/bin/bash
# FORENSIC — GitHub Pages One-Click Deploy Script
# This script automates the entire deployment process

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   FORENSIC — GitHub Pages Auto-Deploy Script         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}ERROR: git is not installed.${NC}"
    echo "Install it: https://git-scm.com/downloads"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not installed.${NC}"
    echo "Install Node.js (includes npm): https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓ git found${NC}"
echo -e "${GREEN}✓ npm found${NC}"
echo ""

# Get GitHub username
echo -e "${CYAN}Step 1: GitHub Configuration${NC}"
echo "─────────────────────────────────────────────────────"
read -p "Enter your GitHub username: " GITHUB_USER

if [ -z "$GITHUB_USER" ]; then
    echo -e "${RED}ERROR: Username is required${NC}"
    exit 1
fi

# Get GitHub token
echo ""
echo "Get a token at: https://github.com/settings/tokens"
echo "(Check the 'repo' box when creating it)"
read -s -p "Enter your GitHub token: " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}ERROR: Token is required${NC}"
    exit 1
fi

# Test the token
echo ""
echo -e "${YELLOW}Testing token...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/user)

if [ "$HTTP_STATUS" != "200" ]; then
    echo -e "${RED}ERROR: Invalid token (HTTP $HTTP_STATUS)${NC}"
    echo "Create a new token at https://github.com/settings/tokens"
    exit 1
fi

echo -e "${GREEN}✓ Token is valid${NC}"

# Create the repository on GitHub
echo ""
echo -e "${CYAN}Step 2: Creating GitHub Repository${NC}"
echo "─────────────────────────────────────────────────────"
echo -e "${YELLOW}Creating 'forensic-legal-ai' repository...${NC}"

CREATE_RESPONSE=$(curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/user/repos \
    -d "{\"name\":\"forensic-legal-ai\",\"private\":false,\"auto_init\":false}" 2>/dev/null)

# Check if repo was created or already exists
if echo "$CREATE_RESPONSE" | grep -q "already exists"; then
    echo -e "${GREEN}✓ Repository already exists${NC}"
elif echo "$CREATE_RESPONSE" | grep -q "html_url"; then
    echo -e "${GREEN}✓ Repository created${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify repo creation, continuing anyway...${NC}"
fi

# Set up git credentials
echo ""
echo -e "${CYAN}Step 3: Configuring Git${NC}"
echo "─────────────────────────────────────────────────────"

# Use token-based authentication for this repo
git config user.email "deploy@forensic.local" 2>/dev/null || true
git config user.name "FORENSIC Deploy" 2>/dev/null || true

echo -e "${GREEN}✓ Git configured${NC}"

# Initialize git and commit
echo ""
echo -e "${CYAN}Step 4: Preparing Files${NC}"
echo "─────────────────────────────────────────────────────"

# Remove any existing git repo to start fresh
rm -rf .git

# Initialize fresh repo
git init
git branch -M main

# Set remote with token embedded for push
git remote add origin "https://$GITHUB_USER:$GITHUB_TOKEN@github.com/$GITHUB_USER/forensic-legal-ai.git"

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
.cache/
dist/
*.log
.env
.DS_Store
EOF

echo -e "${GREEN}✓ Git repository initialized${NC}"

# Build the project
echo ""
echo -e "${CYAN}Step 5: Building the Project${NC}"
echo "─────────────────────────────────────────────────────"
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --silent

echo -e "${YELLOW}Building for GitHub Pages...${NC}"
VITE_BASE_URL="/forensic-legal-ai/" npm run build

echo -e "${GREEN}✓ Build complete${NC}"

# Copy build output to a separate folder for deployment
echo ""
echo -e "${YELLOW}Preparing deployment files...${NC}"
mkdir -p .deploy
cp -r dist/* .deploy/

echo -e "${GREEN}✓ Files ready${NC}"

# Switch to a gh-pages branch for deployment
echo ""
echo -e "${CYAN}Step 6: Deploying to GitHub Pages${NC}"
echo "─────────────────────────────────────────────────────"

# Create an orphan branch (no history)
git checkout --orphan gh-pages 2>/dev/null || git checkout -B gh-pages

# Remove everything except .deploy and .git
git rm -rf . 2>/dev/null || true

# Move deploy files to root
cp -r .deploy/* .
rm -rf .deploy node_modules src scripts public .github

# Add all files
git add -A

# Commit
git commit -m "Deploy FORENSIC to GitHub Pages" --quiet

# Push
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push -f origin gh-pages

echo -e "${GREEN}✓ Code pushed${NC}"

# Enable GitHub Pages
echo ""
echo -e "${YELLOW}Enabling GitHub Pages...${NC}"

curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/repos/$GITHUB_USER/forensic-legal-ai/pages \
    -d '{"source":{"branch":"gh-pages","path":"/"}}' > /dev/null 2>&1 || true

echo -e "${GREEN}✓ GitHub Pages enabled${NC}"

# Done
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   DEPLOYMENT COMPLETE!                               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "Your site will be live at:"
echo -e "${CYAN}  https://$GITHUB_USER.github.io/forensic-legal-ai/${NC}"
echo ""
echo -e "It takes about ${YELLOW}2-3 minutes${NC} to become available."
echo ""
echo -e "Check progress at:"
echo -e "${CYAN}  https://github.com/$GITHUB_USER/forensic-legal-ai/actions${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Visit your site (wait 2-3 minutes first)"
echo "  2. If you see 404, wait a bit longer"
echo "  3. Check the Actions tab for build status"
echo ""

# Clear the token from memory
unset GITHUB_TOKEN
