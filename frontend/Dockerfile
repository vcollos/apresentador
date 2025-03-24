FROM node:16-alpine as build

WORKDIR /app

COPY package.json ./
RUN npm ci

COPY . .
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar os arquivos de build
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]