var htmlparser = require("htmlparser2")

function isValidUrl(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                            '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                            '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                            '(\\#[-a-z\\d_]*)?$','i') // fragment locator
  if(!pattern.test(str)) {
    return false
  } else {
    return true
  }
}

function extractURLs (body) {
  var urls = []

  var parser = new htmlparser.Parser({
    onopentag: function(name, attribs) {
      if (attribs.href && isValidUrl(attribs.href)) {
        urls.push(attribs.href)
      }
    }
  })

  parser.write(body)
  parser.end()

  return urls
}

function extractDomains (urls) {
  var domains = []

  urls.forEach(function(url, key){
    url = url.replace('https://', '')
              .replace('http://', '')
              .split('/')[0]
              .split('#')[0]
              .split('?')[0]

    if(url) {
      domains.push(url)
    }
  })

  return domains
}

function rankUrls(domains){
  var ranks = [],
      domainCounts = {}

  domains.forEach(function(url, key) {
    domainCounts[url] = (domainCounts[url] || 0) + 1
  })

  for(domain in domainCounts){
   ranks.push({'name': domain, 'count': domainCounts[domain]})
  }

  return ranks
}

module.exports = {
  extractURLs: extractURLs,
  extractDomains: extractDomains,
  rankUrls: rankUrls
}
