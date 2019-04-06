FROM node:8.2.1

RUN mkdir -p /etc/agent /data/storage.local
WORKDIR /work

COPY package-lock.json .
COPY package.json .

RUN npm install
RUN sed -i -e "s/,this\.getOSString()//" node_modules/direct-js/lib/direct-node.min.js
RUN sed -i -e "s/else a()},j()}},getDomains/},a()}},getDomains/" node_modules/direct-js/lib/direct-node.min.js

COPY . .

RUN npm run build

ENV NODE_MONGODB_HOST mongodb
EXPOSE 3000
CMD ["node", "dist/index.js"]
