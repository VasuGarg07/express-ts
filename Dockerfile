# Use Node.js 20 on Alpine Linux as our base image
# Alpine is a minimal Linux distro (~5MB), keeps the image small
FROM node:20-alpine

# Set the working directory inside the container
# All following commands will run from this folder
WORKDIR /app

# Copy only package.json and package-lock.json first
# We do this before copying source code because Docker caches layers
# If package.json hasn't changed, Docker skips npm install on next build (faster)
COPY package*.json ./

# Install dependencies inside the container
RUN npm install

# Now copy the rest of the source code
COPY . .

# Compile TypeScript → JavaScript into /dist folder
# Node.js can't run TypeScript directly, so this step is required
RUN npm run build

# Backend will listen on port 5000
EXPOSE 5000

# Run the compiled JavaScript output
# Make sure this path matches your tsconfig outDir setting
CMD ["node", "dist/index.js"]