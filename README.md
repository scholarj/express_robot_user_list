# express_robot_user_list
Ultra-small sample node/express/jade app. Robots user list and profile view.

Used as a demo app to show mongo DB backend use.

## Setup

### v1.0 with data.json flat-file DB backend.

```zsh
$> npm install
$> export PORT=3333
$> npm run dev
browser> http://localhost:3333
```

### v2.0 with Mongo DB backend using a native DB connection.

```zsh
# Mongo.
$> brew update
$> brew install mongodb
$> sudo mkdir -p /data/db
$> sudo chmod 777 /data/db
$> mongod --dbpath /data/db

# Robots app.
$> npm install
$> mongoimport --db robots --collection users --drop --file data.mongo
$> export PORT=3333
$> npm run dev
browser> http://localhost:3333
```
