FROM node:10.16.3

ENV NODE_ENV=development

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "server.js" ]