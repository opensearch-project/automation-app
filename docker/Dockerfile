# The build context must be the project root (or use docker/compose.yaml, which
# sets context: ../) so that `COPY . .` copies the whole project.
FROM node:22
WORKDIR /usr/share/app
COPY . .
RUN test -f package.json || (echo "ERROR: build context must be the project root, or use docker/compose.yaml." && exit 1)
RUN npm ci && npm run compile
