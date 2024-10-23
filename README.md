# uniscan

## Installation

### Clone the repository

```bash
git clone https://github.com/hwennnn/uniscan.git
cd uniscan
```

### Copy the environment variables

```bash
cp .env.example .env

cd backend
cp .env.example .env

cd ../
```

## Run Docker compose

We will be running the app in development mode for now.

### To run the development environment

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up --build
```

### Setup Prisma Schema (in development)

After spinning up the containers, run the following command to initialise the database schema:

```bash
# SSH into the container
docker exec -it uniscan-nestjs bash

# Inside the container shell
pnpm db:push # to push the schema to the database
# or
pnpm db:sync
```

View the frontend at `http://localhost:5173` and the backend at `http://localhost:8000`.

## WIP

### To run the production environment

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up --build
```
