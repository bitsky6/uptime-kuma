# syntax=docker/dockerfile:1

###############
# Build Stage #
###############
FROM node:22.14.0-slim AS builder

# Log and set npm config for ARM if needed
RUN case "$TARGETPLATFORM" in \
      linux/arm*) \
        echo "Building for ARM architecture: $TARGETPLATFORM"; \
        npm config set build_from_source true; \
        ;; \
      *) \
        echo "Building for non-ARM architecture: $TARGETPLATFORM"; \
        ;; \
    esac

# Set working directory
WORKDIR /app

# Install build dependencies & tools
RUN apt-get update && apt-get --yes --no-install-recommends install \
      libaio1 \
      dumb-init \
      nano \
      net-tools \
      curl \
      dnsutils \
      iputils-ping \
      ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN ldconfig

# Copy uptime-kuma folder contents into /app
COPY uptime-kuma/ ./

# Optionally update dependencies if desired
RUN npm install -g n npm-check-updates && \
    ncu -u -t minor

# Install Node.js dependencies, build the app, and prune dev dependencies
RUN npm install && \
    CI=true npm run build && \
    npm prune

###############
# Final Stage #
###############
FROM node:22.14.0-slim

# Set working directory in the final image
WORKDIR /app

# Install only the minimal runtime dependencies
RUN apt-get update && apt-get --yes --no-install-recommends install \
      libaio1 \
      dumb-init \
      ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN ldconfig

# Copy the built app from the builder stage
COPY --from=builder /app /app

# Expose the application port and define a volume for persistent data
EXPOSE 3001
VOLUME ["/app/data"]

# Use dumb-init as the entrypoint to help manage processes in containers
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server/server.js"]
