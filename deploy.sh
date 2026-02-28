#!/bin/bash
set -e

# ============================================
# Gmail With Brains — Deployment Script
# Deploys frontend + backend to Vercel (free)
# ============================================

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}${BLUE}  $1${NC}"
  echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_step() {
  echo -e "${GREEN}✓${NC} $1"
}

print_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
  echo -e "${RED}✗${NC} $1"
}

ask_continue() {
  echo ""
  read -p "$(echo -e ${YELLOW}Press Enter to continue or Ctrl+C to abort...${NC})" _
  echo ""
}

# ============================================
# Pre-flight checks
# ============================================
print_header "Pre-flight Checks"

# Check Node.js
if ! command -v node &> /dev/null; then
  print_error "Node.js not found. Install from https://nodejs.org"
  exit 1
fi
print_step "Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
  print_error "npm not found."
  exit 1
fi
print_step "npm $(npm -v)"

# Check Vercel CLI
if ! command -v vercel &> /dev/null; then
  print_warn "Vercel CLI not found. Installing..."
  npm install -g vercel
fi
print_step "Vercel CLI installed"

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null 2>&1; then
  print_warn "Not logged in to Vercel. Logging in..."
  vercel login
fi
VERCEL_USER=$(vercel whoami 2>/dev/null)
print_step "Logged in to Vercel as: $VERCEL_USER"

# ============================================
# Check .env files
# ============================================
print_header "Checking Configuration"

if [ ! -f "backend/.env" ]; then
  print_error "backend/.env not found!"
  echo ""
  echo "  Create it from the example:"
  echo "    cp backend/.env.example backend/.env"
  echo "    # Then fill in your values"
  echo ""
  echo "  See DEPLOY_CHECKLIST.md for what you need."
  exit 1
fi
print_step "backend/.env found"

if [ ! -f "frontend/.env" ]; then
  print_error "frontend/.env not found!"
  echo ""
  echo "  Create it from the example:"
  echo "    cp frontend/.env.example frontend/.env"
  echo "    # Then fill in your values"
  echo ""
  exit 1
fi
print_step "frontend/.env found"

# Validate required backend vars
REQUIRED_BACKEND_VARS=("SUPABASE_URL" "SUPABASE_SERVICE_KEY" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET" "OPENAI_API_KEY")
MISSING=0
for var in "${REQUIRED_BACKEND_VARS[@]}"; do
  if ! grep -q "^${var}=" backend/.env || grep -q "^${var}=your-" backend/.env || grep -q "^${var}=sk-your" backend/.env; then
    print_error "backend/.env: $var is missing or still has placeholder value"
    MISSING=1
  fi
done

REQUIRED_FRONTEND_VARS=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
for var in "${REQUIRED_FRONTEND_VARS[@]}"; do
  if ! grep -q "^${var}=" frontend/.env || grep -q "^${var}=your-" frontend/.env; then
    print_error "frontend/.env: $var is missing or still has placeholder value"
    MISSING=1
  fi
done

if [ $MISSING -eq 1 ]; then
  echo ""
  print_error "Fix the missing environment variables above before deploying."
  echo "  See DEPLOY_CHECKLIST.md for setup instructions."
  exit 1
fi
print_step "All required environment variables configured"

# ============================================
# Install dependencies
# ============================================
print_header "Installing Dependencies"

echo "Installing backend dependencies..."
cd backend && npm install && cd ..
print_step "Backend dependencies installed"

echo "Installing frontend dependencies..."
cd frontend && npm install && cd ..
print_step "Frontend dependencies installed"

# ============================================
# Deploy Backend to Vercel
# ============================================
print_header "Deploying Backend to Vercel"

echo -e "${YELLOW}This will create a Vercel project for the backend.${NC}"
echo "When prompted:"
echo "  - Set up and deploy? ${BOLD}Y${NC}"
echo "  - Which scope? ${BOLD}Select your account${NC}"
echo "  - Link to existing project? ${BOLD}N${NC}"
echo "  - Project name? ${BOLD}gmail-brains-api${NC}"
echo "  - Directory? ${BOLD}./${NC} (just press Enter)"
echo ""
ask_continue

cd backend

# Deploy with env vars from .env file
echo "Setting environment variables on Vercel..."
while IFS='=' read -r key value; do
  # Skip comments and empty lines
  [[ "$key" =~ ^#.*$ ]] && continue
  [[ -z "$key" ]] && continue
  # Remove quotes from value
  value=$(echo "$value" | sed 's/^["'"'"']//;s/["'"'"']$//')
  if [ -n "$value" ]; then
    echo "$value" | vercel env add "$key" production 2>/dev/null || true
  fi
done < .env

print_step "Environment variables set"

echo ""
echo "Deploying backend..."
BACKEND_URL=$(vercel --prod --yes 2>&1 | grep -oP 'https://[^\s]+\.vercel\.app' | head -1)

if [ -z "$BACKEND_URL" ]; then
  print_warn "Could not auto-detect backend URL. Deploying..."
  vercel --prod --yes
  echo ""
  echo -e "${YELLOW}Enter your backend URL from above:${NC}"
  read -p "> " BACKEND_URL
fi

cd ..
print_step "Backend deployed: $BACKEND_URL"

# ============================================
# Deploy Frontend to Vercel
# ============================================
print_header "Deploying Frontend to Vercel"

echo -e "${YELLOW}This will create a Vercel project for the frontend.${NC}"
echo "When prompted:"
echo "  - Project name? ${BOLD}gmail-with-brains${NC}"
echo ""
ask_continue

cd frontend

# Update VITE_API_URL to point to deployed backend
echo "Setting environment variables on Vercel..."
vercel env add VITE_SUPABASE_URL production <<< "$(grep VITE_SUPABASE_URL .env | cut -d= -f2-)" 2>/dev/null || true
vercel env add VITE_SUPABASE_ANON_KEY production <<< "$(grep VITE_SUPABASE_ANON_KEY .env | cut -d= -f2-)" 2>/dev/null || true
echo "${BACKEND_URL}/api" | vercel env add VITE_API_URL production 2>/dev/null || true

print_step "Environment variables set (API URL: ${BACKEND_URL}/api)"

echo ""
echo "Deploying frontend..."
FRONTEND_URL=$(vercel --prod --yes 2>&1 | grep -oP 'https://[^\s]+\.vercel\.app' | head -1)

if [ -z "$FRONTEND_URL" ]; then
  vercel --prod --yes
  echo ""
  echo -e "${YELLOW}Enter your frontend URL from above:${NC}"
  read -p "> " FRONTEND_URL
fi

cd ..
print_step "Frontend deployed: $FRONTEND_URL"

# ============================================
# Update backend FRONTEND_URL for CORS
# ============================================
print_header "Updating CORS Configuration"

cd backend
echo "$FRONTEND_URL" | vercel env add FRONTEND_URL production 2>/dev/null || true
cd ..
print_step "Backend FRONTEND_URL updated to: $FRONTEND_URL"

echo -e "${YELLOW}Redeploying backend with updated CORS...${NC}"
cd backend && vercel --prod --yes > /dev/null 2>&1 && cd ..
print_step "Backend redeployed"

# ============================================
# Summary
# ============================================
print_header "Deployment Complete! 🎉"

echo -e "${BOLD}Your app is live:${NC}"
echo ""
echo -e "  Frontend:  ${GREEN}${FRONTEND_URL}${NC}"
echo -e "  Backend:   ${GREEN}${BACKEND_URL}${NC}"
echo -e "  Health:    ${GREEN}${BACKEND_URL}/api/health${NC}"
echo ""
echo -e "${BOLD}${YELLOW}⚠  IMPORTANT — Complete these manual steps:${NC}"
echo ""
echo "  1. Google Cloud Console → APIs & Services → Credentials"
echo "     → Edit your OAuth Client → Add to Authorized JavaScript Origins:"
echo -e "     ${BLUE}${FRONTEND_URL}${NC}"
echo ""
echo "  2. Google Cloud Console → Same OAuth Client"
echo "     → Verify this Redirect URI exists:"
echo -e "     ${BLUE}$(grep SUPABASE_URL backend/.env | cut -d= -f2-)/auth/v1/callback${NC}"
echo ""
echo "  3. Supabase Dashboard → Authentication → URL Configuration"
echo "     → Add to Redirect URLs:"
echo -e "     ${BLUE}${FRONTEND_URL}${NC}"
echo ""
echo -e "${BOLD}Test it:${NC}"
echo "  1. Open ${FRONTEND_URL}"
echo "  2. Click 'Sign in with Google'"
echo "  3. Authorize Gmail access"
echo "  4. Your inbox should load!"
echo ""
echo -e "${GREEN}All services are on free tiers. Total cost: \$0/month${NC}"
echo -e "${GREEN}(except OpenAI — ~\$0.01 per 50 email summaries)${NC}"
echo ""
