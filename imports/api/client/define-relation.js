
// copied from: https://blog.useful.io/sorting-with-relations-in-meteor-43d847b06634#.vkh2ss57y

export const DefineRelation = function(
  Collection, RelatedCollection, relationName, relatedFieldName
) {
  Collection._computations = Collection._computations || {};
  var comps = Collection._computations[relationName] = {};

  var stop = function(doc) {
    if (comps[doc._id]) {
      comps[doc._id].stop();
    }
  };

  var update = function(doc) {
    var setModifier = {};

    setModifier[relationName] = doc[relatedFieldName] ?
      RelatedCollection.findOne(doc[relatedFieldName]) : undefined;

    Collection._collection.update(doc._id, {
      $set: setModifier
    });
  };

  Collection.find().observe({
    added: function(newDoc) {
      stop(newDoc);
      comps[newDoc._id] = Tracker.autorun(function() {
        update(newDoc);
      });
    },
    changed: function(newDoc, oldDoc) {
      if (newDoc[relatedFieldName] !== oldDoc[relatedFieldName]) {
        stop(oldDoc);
        comps[newDoc._id] = Tracker.autorun(function() {
          update(newDoc);
        });
      }
    },
    removed: function(oldDoc) {
      stop(oldDoc);
    }
  });
};