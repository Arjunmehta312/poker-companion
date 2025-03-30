FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy rest of the code
COPY . .

# Expose the port
EXPOSE 5000

# Start the application
CMD ["node", "server.js"] 