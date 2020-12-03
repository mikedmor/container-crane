# ![container crane](https://cdn.rawgit.com/v-braun/container-crane/1664bed60d95b0e8de5c5159fd44fc06ea8095b8/media/logo.svg)

> Listen for webhooks and execute a deployment script

By [v-braun - viktor-braun.de](https://viktor-braun.de).
Updated By [mikedmor - mikedmor.com](https://mikedmor.com/).


## Description
[Express](http://expressjs.com/) based HTTP Endpoint that listens to webhooks. Downloads a file named **deploy.crane** from the repository and executes it.

I use it with [Gogs](https://gogs.io/) to deploy my Docker container to a production environment.

## Installation

### As a Docker container
```bash
# (optional )Create a network for Gogs and container-crane (not port mappings required)
docker network create deployment-net

# Pull image from Docker Hub.
docker pull mikedmor/container-crane

# Use `docker run` for the first time.
# map the docker.sock from host within the container
# if you want to use docker commands in your deploy scripts 
# (to deploy "neighbor" containers).
docker run --name="container-crane" --net="deployment-net" --restart=always -d -v /var/run/docker.sock:/var/run/docker.sock -v /usr/local/bin/docker-compose:/bin/docker-compose -v $(which docker):/bin/docker mikedmor/container-crane

# Use `docker start` if you have stopped it.
docker start container-crane

# (optional) Restart your Gogs container within the deployment-net network
# docker run --name="gogs" --net=deployment-net // other params

```

## Usage

Setup a webhook in your Gogs repository that points to the */gogs/* endpoint of the **container-crane** container:

![image](https://raw.githubusercontent.com/v-braun/container-crane/master/doc/create-webhook.jpg)

Now you need a deployment script for your app, as well as a [docker-compose.yml](https://docs.docker.com/compose/compose-file/) if you are planning on using docker-compose. 
Alternatively you can use docker build and docker run, although your mileage may very.

You can write the deployment script in bash or node (both is installed on the container-crane Docker image)

Create a file named **deploy.crane** within your repository.

Here is an example as a bash script:

```bash
#! /bin/bash
if [ ! -d "my-app" ] ; then
    echo "Cloning Repository..."
    git clone http://gogs:3000/my-gogs-user/my-app.git
    echo "Entering Directory..."
    cd my-app
else
    echo "Entering Directory..."
    cd my-app
    echo "Pulling Updates..."
    git pull http://gogs:3000/my-gogs-user/my-app.git
fi
echo "Building & Starting the new Container..."
docker-compose up -d --build --no-color --force-recreate
echo "Done..."
```

> NOTE: container-crane depends not on docker! 
> The deploy.crane script depends on your hosting environment.

Now you can simply:

```bash
git push your-gogs-origin
```


After container-crane receive a POST request from Gogs, it parses the webhook request body and downloads a script named **deploy.crane**.
The **deploy.crane** example then copies the repository, or updates it if it already exists, then launches it into a new docker container
based on the provided **docker-compose.yml**


## FEATURES
- [x] Installation as container from Docker Hub
- [x] Handle secret from Gogs request
- [x] Handle Gogs Authenticated request
- [x] Fixed for Gogs V0.12.3

## Tests
To execute tests run:

```bash
npm test
```

To execute tests with watch run:

```bash
npm run dev
```



### Known Issues

If you discover any bugs, feel free to create an issue on GitHub fork and
send me a pull request.

[Issues List](https://github.com/mikedmor/container-crane/issues).

## Authors

![image](https://avatars3.githubusercontent.com/u/4738210?v=3&s=50)  
[v-braun](https://github.com/v-braun/)

![image](https://avatars1.githubusercontent.com/u/1064037?v=3&s=50)  
[mikedmor](https://github.com/mikedmor/)



## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request


## License

See [LICENSE](https://github.com/v-braun/container-crane/blob/master/LICENSE).
