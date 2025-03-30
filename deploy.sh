#!/bin/bash

# Poker Companion Deployment Script
echo "==============================="
echo "Poker Companion Deployment Tool"
echo "==============================="

# Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "Error: Docker is not installed. Please install Docker and Docker Compose first."
  exit 1
fi

# Check if Docker Compose is installed
if ! [ -x "$(command -v docker-compose)" ]; then
  echo "Error: Docker Compose is not installed. Please install Docker Compose first."
  exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f "backend/.env" ]; then
  echo "Creating .env file from template..."
  cp backend/.env.example backend/.env
  echo "Please edit the backend/.env file with your configuration settings before continuing."
  exit 0
fi

# Stop any running containers
echo "Stopping any running containers..."
docker-compose down

# Pull latest changes if in a git repository
if [ -d ".git" ]; then
  echo "Pulling latest changes from repository..."
  git pull
fi

# Build and start containers
echo "Building and starting containers..."
docker-compose up -d --build

# Check if containers are running
if [ "$(docker ps | grep poker-companion-backend)" ] && [ "$(docker ps | grep poker-companion-frontend)" ]; then
  echo "==============================="
  echo "Deployment successful!"
  echo "Your Poker Companion app is now running."
  echo ""
  echo "Access the application at:"
  echo "http://localhost (or your server's domain/IP)"
  echo "==============================="
else
  echo "==============================="
  echo "Error: Deployment failed. Some containers are not running."
  echo "Check the logs with: docker-compose logs"
  echo "==============================="
  exit 1
fi

exit 0 