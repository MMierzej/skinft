FROM node:18

ENV NPM_CONFIG_LOGLEVEL info
USER node
WORKDIR /home/node
#COPY src src
COPY package*.json .
RUN npm install
EXPOSE 3000
EXPOSE 27017
