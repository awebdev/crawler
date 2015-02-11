var cluster = require('cluster')

// Code to run if we're in the master process
if (cluster.isMaster) {

  // Count the machine's CPUs
  var cpuCount = require('os').cpus().length;

  // Create a worker for each CPU
  for (var i = 0; i < cpuCount; i += 1) {
    cluster.fork();
  }

  // Code to run if we're in a worker process
} else {

  var express = require('express'),
    request = require('request'),
    app = express(),
    host,
    port = 3000,
    crawler = require('./modules/crawler'),
    parser = require('./modules/parser'),
    bodyParser = require('body-parser'),
    DB = require('./modules/DB'),
    Q = require('q'),
    rootUrls = [
                  'https://www.youtube.com',
                  'http://www.lifehacker.com',
                  'https://www.google.com',
                  'http://www.cnn.com/',
                  'http://www.nytimes.com/'
                ],
    crawlUrl = "http://localhost:3000/crawl"

  app.use(function(req, res, next) {
    console.log(req.url);
    next();
  });

  app.use(bodyParser.urlencoded({extended: true}));

  // Handle static content
  app.use("/", express.static(__dirname + "/public"));

  // handle DB queries
  app.param('collectionName', DB.useCollection)
  app.get('/api/clean/:collectionName', DB.cleanCollection)
  app.get('/api/:collectionName', DB.getCollection)
  app.get('/api/:collectionName/:id', DB.findById);
  app.delete('/api/:collectionName/:id', DB.removeById)


  // for browser initiation
  app.get('/crawl', function(req, res) {
    request.post({url: crawlUrl, form: { urls: rootUrls}})
    res.send('started at ' + rootUrls)
  })

  // for async recurssive calls
  app.post('/crawl', function(req, res, next) {
    crawler
      .crawl(req.body.urls, crawlUrl)
        .then(function(data) {
            res.send('crawl() done')
          },
          function (argument) {
            res.send('crawl() failed')
          }
        )
  })

  app.listen(port, function() {
    var host = 'localhost'
    console.log('crawler listening at http://%s:%s', host, port)
  })
}
