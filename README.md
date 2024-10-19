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
