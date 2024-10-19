# uniscan

## Docker compose

### To run the development environment

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up --build
```

### To run the production environment

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up --build
```

### Setup Prisma Schema (in development)

After spinning up the containers, run the following command to initialise the database schema:

```bash
# SSH into the container
docker exec -it uniscan-nestjs bash

# Inside the container shell
pnpm db:sync 
# or
pnpm db:push
```
