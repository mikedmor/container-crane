'use strict';

var fs = require('fs');
var childProcess = require('child_process');
var path = require('path');
var request = require('request');
const crypto = require('crypto');

function validate(app, req, res){
  var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);

  var secret = req.headers['x-gogs-signature'];
  var payload = JSON.stringify(req.body, null, 2);

  var appSecret = crypto.createHmac("sha256", app.get('secret'))
    .update(payload)
    .digest("hex");

  if(appSecret !== secret){
    console.log("Invalid Secret Received from " + ip);
    return res.status(403).json({error: 'Invalid secret!'});
  } 

  if(!req.body.repository){
    console.log("No Repository received from " + ip);
    return res.status(400).json({error: 'no repository is given'});
  } 

  return null;
}

function deploy(app, url, req, res){
  console.log("deploy.crane Starting...");
  var username = app.get('gogsUsername');
  var password = app.get('gogsPassword');
  var auth = "Basic " + Buffer.from(username + ":" + password).toString("base64");
  if(username == ''){
    auth = "";
  }
  return request({
      url: url,
      headers: {
        "Authorization" : auth
      }
    }, (error, response, body) => {

    if (error || response.statusCode != 200) {
      console.log(`error fetching from: ${url} Status: ${response.statusCode} error: ${error}`);
      return res.status(400).json({error: `error during fetching the file: ${url} error: ${error}`});
    }
    
    var tmpFile = path.resolve(__dirname, '.tmp_script');
    fs.writeFile(tmpFile, body, {mode: 0o777}, (err) => {
      if(err){
        console.log("Error: ", err);
        return res.status(400).json({err: err});
      } 
      
      childProcess.execFile(tmpFile, [], (err, stdout, stderr) => {
        if(err) {
          var msg = `Error occurred \n` +
                    `error: ${err} \n` +
                    `stdout: ${stdout} \n` +
                    `stderr: ${stderr}`;
          console.log(msg);
          return res.status(400).json({err: msg});
        }
        else{
          console.log("deploy.crane completed:\n",stdout);
          return res.send(`stdout:\n${stdout}stderr:\n${stderr}`);
        } 
      });
    });
  });
}

function gogsUrl(app, req){
  var branch = app.get('branch');
  var url = `${req.body.repository.html_url}/raw/${branch}/deploy.crane`;
  return url;
}

module.exports.validate = validate;
module.exports.deploy = deploy;
module.exports.url = {
  gogs: gogsUrl,
};

