FROM node:8.2.1

ENV TINI_VERSION v0.15.0
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini.asc /tini.asc
RUN gpg --keyserver hkp://p80.pool.sks-keyservers.net:80 --recv-keys 595E85A6B1B4779EA4DAAEC70B588DFF0527A9B7 && gpg --verify /tini.asc
RUN chmod +x /tini

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
ENTRYPOINT ["/tini", "--"]
CMD ["node", "dist/index.js"]