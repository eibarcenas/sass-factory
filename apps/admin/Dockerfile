FROM node:20-alpine AS builder
WORKDIR /app

# Build args for Firebase config (passed via --build-arg or set via Cloud Run)
ARG VITE_API_URL=https://catalog-mx-api-105288105956.us-central1.run.app
ARG VITE_STOREFRONT_URL=https://catalog-mx-storefront-105288105956.us-central1.run.app
ARG VITE_FIREBASE_API_KEY=""
ARG VITE_FIREBASE_AUTH_DOMAIN=""
ARG VITE_FIREBASE_PROJECT_ID=""

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_STOREFRONT_URL=$VITE_STOREFRONT_URL
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Serve with nginx
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
