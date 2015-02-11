var mongoskin = require('mongoskin'),
    mongodb = mongoskin.db("mongodb://127.0.0.1:27017/crawler", {native_parser:true}),
    Q = require('q')

mongodb._emitter.setMaxListeners(0);

exports.useCollection = function(req, res, next, collectionName){
    req.collection = mongodb.collection(collectionName);
    return next();
  }

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

exports.getCollection = function(req, res, next) {
    req.collection.find({} ,{sort: {'count': 1}}).toArray(function(e, results){
      if (e) return next(e);
      res.send(results);
    });
  };

exports.cleanCollection = function(req, res, next) {
  var deferreds = []
  var promises = []

  req.collection.find({} ,{sort: {'_id': 1}}).toArray(function(e, results){
    if (e) return next(e);
    results.forEach(function(val, key) {
      deferreds[key] = Q.defer()
      req.collection.removeById(val._id, function(e, result){
        deferreds[key].resolve()
      });
      promises.push(deferreds[key].promise)
    })
  })

  Q.allSettled(promises).then(function() {
    res.send('collection cleaned');
  })
};

exports.addRanks = function (domains) {
  var deferred = Q.defer()

  domains.forEach(function(domain, rank) {
    mongodb.collection('ranks')
      .findOne({'domain': domain.name}, function(e, result){
        if (e) return next(e);

        if(!result) {
          mongodb.collection('ranks')
            .insert({"domain": domain.name, "count": domain.count}, {}, function(e, result){
              if(!e){
                deferred.resolve(result)
              } else {
                deferred.reject()
              }
            })
        } else {
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
