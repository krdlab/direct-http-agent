# direct HTTP agent

## Build

```sh
$ docker-compose -f docker-compose.yml -f docker-compose.local.yml up -d
```

## Usage

<https://direct-agent.krdlab.com/login>

```sh
$ curl -H 'Authorization:Bearer <api token>' \
    'https://direct-agent.krdlab.com/webhooks'

$ curl -H 'Authorization:Bearer <api token>' \
    "https://direct-agent.krdlab.com/api/domains/${DOMAIN_ID}/talks"
```
