# --- Backend Dockerfile ---
FROM node:20
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the code
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
