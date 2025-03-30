# Poker Companion Web App

A web application that helps manage poker games by eliminating the need for physical chips while allowing players to use real cards.

## Features

- **Main Table Display**: Shows the poker table with real-time player positions, bet amounts, and current pot
- **Mobile Player Controllers**: Players can join a game, place bets, buy-in, and manage actions from their phones
- **Buy-in System**: Players who run out of money can buy-in again to re-enter the game
- **Profit/Loss Tracking**: Track player balances and calculate settlements at the end of the game
- **Real-time Updates**: All actions are synchronized across devices using WebSockets

## Technology Stack

- **Backend**: Node.js, Express, SQLite, Socket.io
- **Frontend**: React, Socket.io Client
- **Data Storage**: SQLite with Sequelize ORM
- **Containerization**: Docker, Docker Compose

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm
- Docker and Docker Compose (for production deployment)

### Development Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/poker-companion.git
   cd poker-companion
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

4. Start the backend server:
   ```
   cd ../backend
   npm run dev
   ```

5. Start the frontend development server:
   ```
   cd ../frontend
   npm start
   ```

6. Open your browser and navigate to:
   - Main application: http://localhost:3000

### Production Deployment

#### Using Docker Compose

1. Create a .env file in the backend directory (copy from .env.example):
   ```
   cp backend/.env.example backend/.env
   ```

2. Build and start the containers:
   ```
   docker-compose up -d --build
   ```

3. Access the application:
   - Main application: http://localhost (or your server's IP/domain)

#### Manual Deployment

1. Build the frontend:
   ```
   cd frontend
   npm run build
   ```

2. Set up the backend:
   ```
   cd ../backend
   npm install --production
   ```

3. Configure environment variables in backend/.env

4. Start the backend server:
   ```
   npm start
   ```

5. Serve the frontend build folder using a web server of your choice (Nginx, Apache, etc.)

## Usage

1. **Create a Game**:
   - From the home page, click "Create New Game"
   - Set a buy-in amount and create the game
   - Join the game with your name

2. **Join a Game**:
   - From the home page, click "Join Existing Game"
   - Enter the room code and your name
   - You'll be directed to the player controller

3. **Starting a Game**:
   - The admin (creator) will see all players in the room
   - Players must mark themselves as ready
   - When all players are ready, the admin can start the game

4. **Playing the Game**:
   - Use the controller to place bets, fold, or check
   - All actions are reflected on the main table display
   - Players who run out of money can buy in again

5. **Ending a Game**:
   - The admin can end the game at any time
   - Results are calculated and displayed
   - Players can settle up based on the final balances

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React, Node.js, and Socket.io
- Designed for home poker games 