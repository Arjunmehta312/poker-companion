### **🎯 Complete Poker Companion Web App – Enhanced Version**  

I have started a **Poker Companion Web App** that eliminates the need for physical chips while allowing players to use real cards. The app consists of:  
- A **TV/Laptop Display** showing real-time game status, bets, and settlements.  
- **Mobile Player Controllers** where players can join a room, place bets, buy-in, and manage actions.  

This project currently has some backend and frontend code files, but everything else still needs to be built from scratch.  

---

## **🛠️ Current Project Structure**  
The following files exist in the codebase:  
```
poker-companion/
    backend/
        package-lock.json
        package.json
        server.js
    frontend/
        package-lock.json
        package.json
        README.md
        public/
            favicon.ico
            index.html
            logo192.png
            logo512.png
            manifest.json
            robots.txt
        src/
            App.css
            App.js
            App.test.js
            index.css
            index.js
            logo.svg
            reportWebVitals.js
            setupTests.js
```
This is the codebase so far. **You need to complete the full implementation.**  

---

## **🚀 Your Tasks**  
### **1️⃣ Backend (Node.js + Express + SQLite)**  
- **Set up Express API** to handle:  
  - Game creation (`/game/create`) with a fixed **buy-in amount** (e.g., 100 rupees).  
  - Player joining (`/game/join`).  
  - Betting (`/bet/place`).  
  - Game state updates (`/game/state`).  
  - **Buy-in system**: Players who run out of money can **buy-in again** to re-enter the game.  
- **Database (SQLite + Sequelize)** for:  
  - `Game` model (room code, pot, status, fixed buy-in amount).  
  - `Player` model (name, balance, total buy-ins, seat, actions).  
  - `Bet` model (amount, type: raise/call/fold).  
  - **Profit/Loss Tracking**:  
    - Track how much each player **bought in total**.  
    - Track each player's **final balance** at the end.  
    - Calculate **who has to pay whom** for settlement.  
- **WebSockets (Socket.io)** for real-time updates:  
  - Sync game state across all connected devices.  
  - Notify players of bets, turns, and buy-ins.  
  - **At game end**, calculate **final standings** and show who owes money to whom.  

---

### **2️⃣ Frontend (React)**  
- **Main Display UI (Poker Table)**  
  - Show player positions around a virtual table.  
  - Update betting actions in real time.  
  - Display total pot, blinds, and round progress.  
  - **End-of-game results**: Show player profits/losses and **settlements**.  
- **Mobile Player Controllers**  
  - Players enter a **room code** to join a game.  
  - Buttons for **Raise, Call, Fold, Check**.  
  - Display current **balance** and bet options.  
  - **Buy-in button** if balance reaches 0.  
- **WebSocket Integration**  
  - Sync player actions with the server.  
  - Handle real-time status updates.  

---

### **3️⃣ Additional Features**  
- **Game Admin Controls**  
  - Option to **restart a game** after settlement.  
  - Ability to **kick inactive players** from a game.  
- **Basic Authentication System**  
  - Players should provide a **nickname** when joining.  
  - Prevent duplicate names in the same game.  
- **Leaderboard (Optional)**  
  - Display players with highest total winnings across multiple games.  

---

## **📌 Notes**  
- The game **does NOT include automated card dealing** (players handle real cards).  
- The app **manages chips and betting only**.  
- **Players can buy-in again** when they run out of money.  
- **Final tally at game end**:  
  - Total money each player **bought in**.  
  - Each player's **final balance**.  
  - **Who owes money to whom** for settlement.  
- The UI should be **clean, responsive, and intuitive**.  

Start by implementing the **backend API and WebSocket server**. Once the backend is working, create the **React UI for both the main display and mobile controllers**. Ensure the frontend correctly connects to the WebSocket server.  

---

### **⚡ Expected Deliverables**  
- Fully working **Poker Companion Web App**.  
- Backend with **Express + SQLite + Socket.io**.  
- Frontend with **React + WebSockets** for real-time updates.  
- Buy-in system with **profit/loss tracking** and **final settlement calculations**.  
- Clean, easy-to-use UI for both the **main display and player controls**.  

---

## **🔧 Additional Constraints**  
- Do NOT use Tailwind CSS – use standard CSS (App.css) or inline styles instead.  
- Keep dependencies minimal – avoid complex state management like Redux unless necessary.