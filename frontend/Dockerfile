# Use node image
FROM node:20-alpine

# Set workdir
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all code
COPY . .

# Expose port
EXPOSE 5173

# Command to run
CMD ["npm", "run", "dev", "--", "--host"]
