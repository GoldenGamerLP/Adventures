# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM --platform=$BUILDPLATFORM oven/bun:1.2.22 AS build
WORKDIR /app

COPY package.json bun.lock* ./

# use ignore-scripts to avoid building node modules like better-sqlite3
RUN --mount=type=cache,target=/root/.bun/install/cache bun install

# Copy the entire project
COPY . .

RUN bun --bun run preload
RUN bun --bun run build

# copy production dependencies and source code into final image
FROM --platform=$TARGETPLATFORM oven/bun:1.2.22 AS production
WORKDIR /app

# Only `.output` folder is needed from the build stage
COPY --from=build /app/.output /app

# run the app
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "--bun", "run", "/app/server/index.mjs" ]
