# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy rest of the code
COPY . .

# Set environment variables for production build
ARG REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

# Build the app
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Copy build files to nginx html directory
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 