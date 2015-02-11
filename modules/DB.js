var mongoskin = require('mongoskin'),
    mongodb = mongoskin.db("mongodb://127.0.0.1:27017/crawler", {native_parser:true}),
    Q = require('q')

// disable max listners to remove limit on simultaneous open connections
mongodb._emitter.setMaxListeners(0);

exports.useCollection = function(req, res, next, collectionName){
    req.collection = mongodb.collection(collectionName);
    return next();
  }

// check is url is saved as visited
exports.isUrlVisited = function(url) {
  var deferred = Q.defer()
  mongodb.collection('visitedUrls')
    .findOne({'url': url}, function(e, result){
      if(!e){
        deferred.resolve(result);
      } else {
        deferred.reject();
      }
    });

  return deferred.promise;
}

// add a url to visited collection
exports.addVisitedUrl = function(url) {
  var deferred = Q.defer()
  mongodb.collection('visitedUrls')
    .insert({url:url}, {}, function(e, result){
      if(!e){
        deferred.resolve(result);
      } else {
        deferred.reject();
      }
    });

  return deferred.promise;
}

// get all collection data
exports.getCollection = function(req, res, next) {
    req.collection.find({} ,{sort: {'count': 1}}).toArray(function(e, results){
      if (e) return next(e);
      res.send(results);
    });
  };

// remove all entries in a collection
exports.cleanCollection = function(req, res, next) {
  var deferreds = []
  var promises = []

  // get all entries in collection
  req.collection.find({} ,{sort: {'_id': 1}}).toArray(function(e, results){
    if (e) return next(e);
    // loop through all entries
    results.forEach(function(val, key) {
      deferreds[key] = Q.defer()
      // remove entry from collection
      req.collection.removeById(val._id, function(e, result){
        deferreds[key].resolve()
      });
      // collect all promises to enable async removal
      promises.push(deferreds[key].promise)
    })
  })

  // send response when everything is removed
  Q.allSettled(promises).then(function() {
    res.send('collection cleaned');
  })
};

// add/increment rank for a domain
exports.addRanks = function (domains) {
  var deferred = Q.defer()

  // loop through the provided domain array
  domains.forEach(function(domain, rank) {
    mongodb.collection('ranks')
      .findOne({'domain': domain.name}, function(e, result){
        if (e) return next(e);

        if(!result) {
          // insert domain if doesnot exits
          mongodb.collection('ranks')
            .insert({"domain": domain.name, "count": domain.count}, {}, function(e, result){
              if(!e){
                deferred.resolve(result)
              } else {
                deferred.reject()
              }
            })
        } else {
          // increment count if domain already exist
          mongodb.collection('ranks')
                  .update({"domain": domain.name},
                            { $inc : { "count" : domain.count }},
                            function(e, result){
                              if(!e){
                                deferred.resolve(result)
                              } else {
                                deferred.reject()
                              }
                            })
        }
      });
  })
  return deferred.promise;
}

exports.insertCollection = function(req, res, next) {
    req.collection.insert(req.body, {}, function(e, results){
      if (e) return next(e);
      res.send(results);
    });
  };

exports.findById = function(req, res, next) {
    req.collection.findOne({'_id': req.params.id}, function(e, result){
      if (e) return next(e);
      res.send(result);
    });
  };

exports.updateById = function(req, res, next) {
    req.collection.updateById(req.params.id, {$set: req.body}, {safe: true, multi: false}, function(e, result){
      if (e) return next(e);
      res.send((result === 1) ? {msg:'success'} : {msg: 'error'});
    });
  };

exports.deleteById = exports.removeById = function(req, res, next) {
    req.collection.removeById(req.params.id, function(e, result){
      if (e) return next(e);
      res.send((result === 1)?{msg: 'success'} : {msg: 'error'});
    });
  };
