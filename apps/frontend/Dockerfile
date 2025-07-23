FROM node:20-alpine

WORKDIR /app

# Copy shared-types package first
COPY packages/shared-types /packages/shared-types

# Copy package files first for better caching
COPY apps/frontend/package.json apps/frontend/yarn.lock ./

# Install dependencies with yarn
RUN yarn install

# Copy source code
COPY apps/frontend .

# Expose port
EXPOSE 3000

# Development command
CMD ["yarn", "dev"]