# Use the official Node.js 20 image as the base image
FROM node:20

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Build the NestJS application
RUN npm run build

# Expose the port that the app will run on
EXPOSE 8080

# Set the environment variable for the port
ENV PORT 8080

# Command to run the application
CMD ["node", "dist/main.js"]
