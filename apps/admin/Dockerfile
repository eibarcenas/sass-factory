FROM node:20-alpine AS builder
WORKDIR /app

# Firebase web API keys are public by design — security is enforced by
# Firebase Auth rules (domain restrictions) and Firestore rules.
ENV VITE_API_URL=https://catalog-mx-api-dev-q3peeste7q-uc.a.run.app
ENV VITE_STOREFRONT_URL=https://catalog-mx-storefront-dev-q3peeste7q-uc.a.run.app
ENV VITE_FIREBASE_API_KEY=AIzaSyCIhK1icvEyOEYGZ2bn6yjbZt2Kc6YhILQ
ENV VITE_FIREBASE_AUTH_DOMAIN=catalog-mx-dev.firebaseapp.com
ENV VITE_FIREBASE_PROJECT_ID=catalog-mx-dev
ENV VITE_ADMIN_URL=https://catalog-mx-admin-dev-q3peeste7q-uc.a.run.app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
