FROM node:14

WORKDIR /var/www/api/project

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 80

CMD [ "node", "index.js" ]
