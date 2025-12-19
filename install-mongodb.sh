#!/bin/bash

echo "🔧 Installing MongoDB Community Edition..."
echo ""

# Add MongoDB tap
echo "Adding MongoDB tap..."
brew tap mongodb/brew

# Install MongoDB
echo "Installing MongoDB..."
brew install mongodb-community@7.0

echo ""
echo "✅ MongoDB installation complete!"
echo ""
echo "To start MongoDB:"
echo "  brew services start mongodb-community@7.0"
echo ""
