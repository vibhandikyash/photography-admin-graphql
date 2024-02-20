# server-boilerplate

## Getting Started

1. Clone the project (use below command as we are using sub-module.)

```
git clone --recursive [URL to Git repo]
```

- And if already cloned then for getting sub modules

```
git submodule update --init
```

2. Setup postgresql DB if you want to use local DB
3. create .env file from .env.sample
4. Install dependencies by

```
npm i
```

5. And start the server using

```
npm start
```

## If you want to use by docker

1. Modify .env.dev in docker folder & update startup.sh file

2. create .env.dev in root directory from .env.sample

3. Install dependencies by `npm i`

4. And the server by `npm run dev-docker:up` in docker containers

5. To see logs run `docker logs -f <NODE_CONTAINER_NAME>` provided in step 1.

6. To stop the containers run `npm run dev-docker:down`
