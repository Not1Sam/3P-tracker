FROM node:20-alpine AS build
WORKDIR /app
ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_ANON_KEY
ARG EXPO_PUBLIC_VERSION_URL
ENV EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL
ENV EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY
ENV EXPO_PUBLIC_VERSION_URL=$EXPO_PUBLIC_VERSION_URL
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx expo export --platform web
RUN npx workbox-cli generateSW workbox-config.js
RUN node scripts/patch-pwa.js

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
