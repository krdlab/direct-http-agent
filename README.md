# direct HTTP agent

## Build

```sh
$ docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d
$ docker-compose -f docker-compose.yml -f docker-compose.vps.yml   up -d
```

## Usage

<https://direct-agent.krdlab.com>

```sh
$ curl -H 'Authorization: Bearer <api token>' https://direct-agent.krdlab.com/dapi/domains/${DOMAIN_ID}/talks
$ curl -H 'Authorization: Bearer <api token>' https://direct-agent.krdlab.com/webhooks
```