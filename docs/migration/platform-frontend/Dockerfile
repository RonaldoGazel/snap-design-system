# =============================================================================
# Platform Frontend — Multi-stage build
# =============================================================================
# Stage 1: Install dependencies + build the Angular production bundle
# Stage 2: Serve static assets with nginx-alpine
# =============================================================================

# -- Stage 1: Build ----------------------------------------------------------
FROM node:24-alpine AS builder

# pnpm ships with corepack in Node 24
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate

WORKDIR /build

# Install dependencies first (layer cache)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy source and build production bundle
COPY . .
RUN pnpm build

# -- Stage 2: Runtime ---------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# Remove default nginx site
RUN rm -rf /usr/share/nginx/html/*

# Copy build output
COPY --from=builder /build/dist/platform-frontend/browser /usr/share/nginx/html

# Custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Non-root user (nginx-alpine ships with nginx user)
RUN chown -R nginx:nginx /usr/share/nginx/html && \
  chown -R nginx:nginx /var/cache/nginx && \
  chown -R nginx:nginx /var/log/nginx && \
  touch /var/run/nginx.pid && \
  chown nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
