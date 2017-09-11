# direct HTTP agent

`direct-http-agent` is a small web service to provide REST API and Webhook for [direct](https://direct4b.com/ja/).

## Build & Launch

This project uses Docker containers.
If you would like to launch the service locally, execute commands as below:

```sh
$ docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d
$ open http://localhost:3000/
```

You can also launch the service as production mode.

```sh
$ docker-compose -f docker-compose.yml -f docker-compose.vps.yml   up -d
```

## Usage

Please see `/home`.

## API

- [x] `POST /control/restart`
- [x] `GET /dapi/domains`
- [x] `GET /dapi/domains/:domainId/talks`
- [x] `POST /dapi/domains/:domainId/talks/:talkId/messages`
- [ ] `GET /webhooks`
- [ ] `POST /webhooks`
- [ ] `GET /webhooks/:webhookId`
- [ ] `PUT /webhooks/:webhookId`
- [ ] `DELETE /webhooks/:webhookId`