FROM node:18-alpine3.18
COPY package*.json ./
COPY . ./
RUN apk update \
  && apk -u list \
  && apk upgrade \
  && npm i \
  && npm run build
EXPOSE 3000
CMD npm start