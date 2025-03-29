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

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

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

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```
   cd ../frontend
   npm start
   ```

3. Open your browser and navigate to:
   - Main application: http://localhost:3000

## Usage

1. **Create a Game**:
   - From the home page, click "Create New Game"
   - Set a buy-in amount and create the game
   - Join the game with your name

2. **Join a Game**:
   - From the home page, click "Join Existing Game"
   - Enter the room code and your name
   - You'll be directed to the player controller

3. **Table Display**:
   - The first player (admin) will see the main table display
   - This should be shown on a TV or laptop that all players can see

4. **Player Controls**:
   - Use the player controller to place bets, fold, call, or check
   - Buy in again if you run out of chips
   - See your current balance and game status

5. **End Game and Settlements**:
   - The admin can end the game when play is complete
   - The system will calculate who owes whom based on buy-ins and final balances
   - Settlements will be displayed on the main table display

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with React, Node.js, and Socket.io
- Designed for home poker games 