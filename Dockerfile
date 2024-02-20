FROM node:16.16.0-alpine

RUN mkdir /app

WORKDIR /app

COPY package.json ./

RUN npm install

RUN npm install mysql2 --save

RUN npx sequelize init

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
