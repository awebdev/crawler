# NodeJs Crawler application

## Setup
```sh
$ git clone git@bitbucket.org:anudeepwebdev/crawler.git
$ npm install
```
## Starting the application
```sh
$ npm start
```

## Links
  * /crawl              - Starts crawling for default routes
  * /api                - Get all collection data
    - /visitedUrls      - Shows all visited Urls
    - /ranks            - Shows ranks for all visited domains
  * /clean              - Clean collection
    - /visitedUrls      - Remove all visited urls from DB
    - /ranks            - Remove all domain ranks from DB