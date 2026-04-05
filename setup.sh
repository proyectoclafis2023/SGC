#!/bin/bash

# SGC System Deterministic Setup Script
# Version: 2.0.0
# Description: Robust and deterministic initialization for SGC.

# Error handling: stop on failure
set -e

# --- Configuration ---
ROOT_DIR=$(pwd)
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Ports to check
export BACKEND_PORT=3001
export FRONTEND_PORT_1=5173
export FRONTEND_PORT_2=5174

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# --- OS Check ---
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
  echo -e "${YELLOW}[WARN] Script optimizado para Linux${NC}"
fi

# --- Functions ---
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

check_port() {
  local port=$1
  if ( (echo > /dev/tcp/localhost/$port) >/dev/null 2>&1 ); then
    return 0 # Port is busy
  else
    return 1 # Port is free
  fi
}

check_dependencies() {
  log_info "Validating dependencies..."
  if ! command -v node >/dev/null 2>&1; then
    log_error "Node.js is not installed. Please install v18+."
    exit 1
  fi
  
  # Check Node.js version (min v18)
  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
  fi
  
  if ! command -v npm >/dev/null 2>&1; then
    log_error "npm is not installed."
    exit 1
  fi
  log_ok "Node.js $(node -v) and npm are present."
}

validate_ports() {
  log_info "Validating port availability..."
  if check_port $BACKEND_PORT; then
    log_warn "Port $BACKEND_PORT (Backend) is already in use. Please stop the process."
  fi
  if check_port $FRONTEND_PORT_1 || check_port $FRONTEND_PORT_2; then
    log_warn "One of the frontend ports ($FRONTEND_PORT_1/$FRONTEND_PORT_2) is in use."
  fi
}

setup_backend() {
  log_info "Entering backend directory..."
  cd "$BACKEND_DIR"

  log_info "Installing backend dependencies..."
  npm install

  # Environment setup
  if [ ! -f .env ]; then
    log_info "Creating .env from .env.example..."
    cp .env.example .env
  else
    log_ok ".env already exists. Skipping creation."
  fi

  # Generate JWT_SECRET if placeholder exists or if empty
  if grep -q "your_super_secret_jwt_key_here" .env; then
    log_info "Generating secure JWT_SECRET..."
    if command -v openssl >/dev/null 2>&1; then
      SECRET=$(openssl rand -base64 32)
    else
      SECRET="sgc_secret_$(date +%s)_$RANDOM"
    fi
    # Use different sed for macOS compatibility
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/your_super_secret_jwt_key_here/$SECRET/" .env
    else
      sed -i "s/your_super_secret_jwt_key_here/$SECRET/" .env
    fi
    log_ok "JWT_SECRET generated."
  fi

  # Database reset and initialization
  log_info "Resetting database for determinism..."
  # ALWAYS run generate, push --force-reset, and seed
  log_info "npx prisma generate..."
  npx prisma generate
  
  log_info "npx prisma db push --force-reset..."
  npx prisma db push --force-reset
  
  log_info "npx prisma db seed..."
  npx prisma db seed
  
  log_ok "Backend setup complete."
}

setup_frontend() {
  log_info "Entering frontend directory..."
  cd "$FRONTEND_DIR"

  log_info "Installing frontend dependencies..."
  npm install

  # Environment setup
  if [ ! -f .env ]; then
    log_info "Creating .env from .env.example..."
    if [ -f .env.example ]; then
      cp .env.example .env
    else
      echo "VITE_API_URL=http://localhost:3001" > .env
    fi
  fi
  
  log_ok "Frontend setup complete."
}

# --- Execution ---

echo -e "${YELLOW}"
echo "--------------------------------------------------------"
echo "  🚀 SGC DETERMINISTIC SETUP (Robust Mode)"
echo "--------------------------------------------------------"
echo -e "${NC}"

check_dependencies
validate_ports
setup_backend
setup_frontend

# Return to root
cd "$ROOT_DIR"

echo -e "\n${GREEN}✅ SETUP SUCCESSFULLY COMPLETED!${NC}"
echo "--------------------------------------------------------"
echo "System Access URLs:"
echo -e "Frontend URL:  ${BLUE}http://localhost:5173${NC}"
echo -e "Backend API:   ${BLUE}http://localhost:3001${NC}"
echo "--------------------------------------------------------"
echo "To start the system:"
echo "1. Backend:  cd backend && npm run dev"
echo "2. Frontend: cd frontend && npm run dev"
echo "--------------------------------------------------------"
echo "Demo Credentials (Default):"
echo "- Admin Email: gdcuentas@sgc.cl"
echo "- Password:    admin123"
echo "--------------------------------------------------------"
echo "Note: The database was fully reset and seeded for consistency."
echo "--------------------------------------------------------"
