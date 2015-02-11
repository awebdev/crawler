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
    parser = require('./modules/parser'),
    bodyParser = require('body-parser'),
    DB = require('./modules/DB'),
    Q = require('q'),
    rootUrls = ['http://www.google.com']

  app.use(bodyParser.urlencoded({extended: true}));

  app.use("/", express.static(__dirname + "/public"));

  app.param('collectionName', DB.useCollection)
  app.get('/api/clean/:collectionName', DB.cleanCollection)
  app.get('/api/:collectionName', DB.getCollection)
  app.get('/api/:collectionName/:id', DB.findById);
  app.delete('/api/:collectionName/:id', DB.removeById)

  function crawl(urls, crawlUrl) {
    var deferred = Q.defer(),
      finalUrls = []

    urls.forEach(function(url, key) {
      DB.isUrlVisited(url).then(function(urlVisited) {
        if (!urlVisited) {
          request(url, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              var foundUrls = parser.extractURLs(body)
                // save this url as visited
              DB.addVisitedUrl(url)

              if (foundUrls && foundUrls.length > 0) {
                var domains = parser.extractDomains(foundUrls)
                if (domains && domains.length > 0) {
                  // add ranks to the found domains
                  DB.addRanks(parser.rankUrls(domains))
                }
                request.post({url: crawlUrl, form: {urls: foundUrls}})
              }
              deferred.resolve()
            } else {
              deferred.reject()
            }
          })
        } else {
          deferred.resolve()
        }
      })
    })

    return deferred.promise
  }

  app.get('/crawl', function(req, res) {
    var crawlUrl = req.protocol + '://' + req.headers.host + '/crawl';
    request.post({url: crawlUrl, form: { urls: rootUrls}})
    res.send('started at ' + rootUrls)
  })

  app.post('/crawl', function(req, res, next) {
    var crawlUrl = req.protocol + '://' + req.headers.host + '/crawl';
    crawl(req.body.urls, crawlUrl).then(function(data) {
      res.send('crawl() done')
    })
  })

  app.get('/test', function(req, res, next) {
    request(rootUrls[0], function(error, response, body) {
      if (!error && response.statusCode == 200) {
        var foundUrls = parser.extractURLs(body)
        res.send(foundUrls)
      }
    })
  })

  var server = app.listen(port, function() {
    var host = 'localhost'
    console.log('crawler listening at http://%s:%s', host, port)
  })

}