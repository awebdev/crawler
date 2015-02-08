var express = require('express'),
    request = require('request'),
    app = express(),
    host,
    port = 3000,
    parser = require('./models/parser'),
    bodyParser = require('body-parser')

app.use(bodyParser.urlencoded())


function crawl (req, res) {
  request(req.body.url, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var urls = parser.extractURLs(body)
      var domains = parser.extractDomains(urls)
      res.send(parser.rankUrls(domains))
    }
  })
}

app.get('/', function (req, res) {
  request
    .post({url: 'http://localhost:3000/crawl', form: {url: 'https://www.google.com' }})
    .pipe(res)
})

app.post('/crawl', crawl)

var server = app.listen(port, function () {
  var host = 'http://localhost'

  console.log('crawler listening at http://%s:%s', host, port)
})