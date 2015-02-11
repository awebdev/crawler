var request = require('request'),
    Q = require('q'),
    bodyParser = require('body-parser'),
    DB = require('./DB'),
    parser = require('./parser'),
    crawlUrl = "http://localhost:3000/crawl",
    deferred

function pageFetchHandler(error, response, body, url) {
  if (!error && response.statusCode == 200) {
    foundUrls = parser.extractURLs(body)
    handlePage()
  } else {
    deferred.reject()
  }
}

function handlePage() {
  if (foundUrls && foundUrls.length > 0) {
    // extract domains from urls
    domains = parser.extractDomains(foundUrls)

    // crawl into found urls
    request.post({url: crawlUrl, form: {urls: foundUrls}})

    // add ranks to the domains
    if (domains && domains.length > 0) {
      DB.addRanks(parser.rankUrls(domains))
    }
  }
  deferred.resolve()
}

// initiates crawl request for non-visited urls
function crawl(urls) {
  var finalUrls = [],
    foundUrls,
    domains

  deferred = Q.defer()

  urls.forEach(function(url, key) {
    DB.isUrlVisited(url)
      .then(function(isUrlVisited) {
        // visit only first time url's
        if (!isUrlVisited) {
          request(url, function (error, response, body) {
            pageFetchHandler(error, response, body, url)
          })

          // save this url as visited
          DB.addVisitedUrl(url)
        } else {
          deferred.resolve()
        }
      },
      function () {
        deferred.reject('isUrlVisited() Failed')
      })
  })

  return deferred.promise
}


module.exports = {
  crawl: crawl
}
