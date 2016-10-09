import { Mongo } from 'meteor/mongo';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

export const ViceTokenTypes = { }

// Create a new Mongo collection to hold all of the Vice Token Types
ViceTokenTypes.collection = new Mongo.Collection('vicetoken.tokentype');

// Define the expected data schema for a Vice Token Type
ViceTokenTypes.schema = new SimpleSchema({
  typeName: {
    type: String
  },
  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true
  },
  parentTypeId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true
  },
  subTypeIds: {
    type: [String],
    regEx: SimpleSchema.RegEx.Id,
    defaultValue: [],
    optional: true
  }
});

ViceTokenTypes.insertMethod = new ValidatedMethod({
  name: 'vicetoken.tokentype.insert',
  validate: ViceTokenTypes.schema.validator({ clean: true }),
  run({ typeName, userId, parentTypeId, sybTypeIds }) {
    ViceTokenTypes.collection.insert({ typeName, userId, parentTypeId, sybTypeIds });
  }
});

ViceTokenTypes.insertSubType = new ValidatedMethod({
  name: 'vicetoken.tokentype.insertSubType',
  validate: new SimpleSchema({
    parentTypeId: {
      type: String,
      ///regex: SimpleSchema.RegEx.Id,
    },
    subType: {
      type: ViceTokenTypes.schema,
    },
  }).validator({ clean: true }),
  run({ parentTypeId, subType }) {
    // Add the new subType to the collection
    const subTypeId = ViceTokenTypes.collection.insert(subType);

    // Set the parent of the new subType
    ViceTokenTypes.setParent.call({
      typeId: subTypeId,
      parentTypeId: parentTypeId,
    }, (err, res) => {
      if (err) {
        throw new Meteor.Error(name + '.setParentFailed',
          'Error setting parent: ' + err);
      }
    });

  }
});

ViceTokenTypes.setParent = new ValidatedMethod({
  name: 'vicetoken.tokentype.setParent',
  validate: new SimpleSchema({
    typeId: {
      type: String,
     //regex: SimpleSchema.RegEx.Id,
    },
    parentTypeId: {
      type: String,
      //regex: SimpleSchema.RegEx.Id,
      optional: true,
    },
  }).validator({ clean: true }),
  run({ typeId, parentTypeId }) {
    // Get the target token type
    let targetType = ViceTokenTypes.collection.findOne(typeId);
    if (targetType == null) {
      throw new Meteor.Error('vicetoken.tokentype.setParent.targetNotFound',
        'Could not find the target ViceTokenType, check that it exists.');
    }

    // Check if a valid parent type id was specified for the new parent
    if (parentTypeId != null) {
      // Add the target token as a subType to the new parent
      // (we do this before anything else so we can leave the target type were it is if it fails)
      const numUpdated = ViceTokenTypes.collection.update(parentTypeId,
        { $addToSet: { subTypeIds: typeId } },
        { } );
      if (numUpdated == 0) {
        throw new Meteor.Error('vicetoken.tokentype.setParent.noMatchingParent',
          'No matching type found for the specified new parentTypeId, check that it exists.');
      }
    }

    // Next up, we update the previous parent (if there is one)
    if (targetType.parentTypeId != null) {
      ViceTokenTypes.collection.update(
        targetType.parentTypeId,
        { $pullAll: { subTypeIds: [ typeId ] } },
        { } );
    }

    // Lastly, set the parent on the taget type
    ViceTokenTypes.collection.update(typeId,
      { $set: { parentTypeId: parentTypeId } },
      { } );
  }
});

ViceTokenTypes.removeType = new ValidatedMethod({
  name: 'vicetoken.tokentype.removeType',
  validate: new SimpleSchema({
    typeId: {
      type: String,
      //regex: SimpleSchema.RegEx.Id,
    },
    destroySubTypes: {
      type: Boolean,
      optional: true,
    },
    orphanSubTypes: {
      type: Boolean,
      optional: true,
    }

  }).validator({ clean: true }),
  run({ typeId, destroySubTypes, orphanSubTypes }) {

    // Get the target token type
    let targetType = ViceTokenTypes.collection.findOne(typeId);
    if (targetType == null) {
      throw new Meteor.Error('vicetoken.tokentype.removeType.targetNotFound',
        'Could not find the target ViceTokenType, check that it exists.');
    }

    // First, set the parent on the type being removed to 'null' to clean-up all the references
    ViceTokenTypes.setParent.call({
      typeId: typeId,
      parentTypeId: null,
    }, (err, res) => {
      if (err) {
        throw new Meteor.Error('vicetoken.tokentype.removeType.setParentFailed',
          'Error setting parent: ' + err);
      }
    });

    // Update the subTypes for the target token type
    if (targetType.subTypeIds != null) {
      if (destroySubTypes == false) {

        // Remove all the subTypes recursively
        targetType.subTypeIds.forEach(function(subType){
          // Remove this subType by id
          ViceTokenTypes.removeType.call({
            typeId: subType,
            destroySubTypes: true,
          }, (err, res) => {
            if (err) {
              throw new Meteor.Error('vicetoken.tokentype.removeType.removeSubTypeFailed',
                'Error removing subType from parent: ' + err);
            }
          });
        });
      } else {
        // Update the parent id of all of the subTypes
        targetType.subTypeIds.forEach(function(subType){
          ViceTokenTypes.setParent.call({
            typeId: subType,
            parentTypeId: orphanSubTypes ? null : targetType.parentTypeId,
          }, (err, res) => {
            if (err) {
              throw new Meteor.Error('vicetoken.tokentype.removeType.reparentChildFailed',
                'Error setting parent: ' + err);
            }
          });
        });
      }
    }

    // And finally, it's safe to remove the target token type from the collection
    ViceTokenTypes.collection.remove(typeId);
  }
})