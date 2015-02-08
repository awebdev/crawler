import urllib.request

def getPage(url):
    req = urllib.request.Request(url)
    response = urllib.request.urlopen(req)
    return response.read()

print(getPage('https://www.google.com'))
