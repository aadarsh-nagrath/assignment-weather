# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
# Copy package manifests and prisma schema first so postinstall can find it
COPY package*.json ./
COPY prisma ./prisma
RUN npm install
# Now copy the full source
COPY . .
# Generate Prisma client explicitly (redundant if postinstall ran, but safe)
RUN npx prisma generate
RUN npm run build

# Runner stage
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
EXPOSE 3000
CMD ["npm", "start"]
