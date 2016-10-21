import { Mongo } from 'meteor/mongo';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

export class ViceTokenTypeCollection {
  // Constructor
  constructor(typeCollectionName) {
    // Store reference to this object for access inside methods
    let self = this;

    // Create a new Mongo collection to hold all of the tree nodes
    this.collectionName = typeCollectionName;
    this.collection = new Mongo.Collection(typeCollectionName);

    // Create a SimpleSchema for the nodes in the tree
    this.typeSchema = new SimpleSchema({
      typeName: {
        type: String,
        //regEx: SimpleSchema.RegEx.Id,
      },
      userId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
      },
    });

    // Meteor method to insert a new Vice Token Type into the collection
    this.insertTypeMethod = new ValidatedMethod({
      name: this.collectionName + '.insertType',
      validate: this.typeSchema.validator({ clean: true }),
      run({ typeName, userId }) {
        return self.getCollection().insert({ typeName, userId });
      }
    });

    // Meteor method to remove a Vice Token Type from the collection
    this.removeTypeMethod = new ValidatedMethod({
      name: this.collectionName + '.removeType',
      validate: new SimpleSchema({
        typeId: {
          type: String,
          //regex: SimpleSchema.RegEx.Id,
        },
      }).validator({ clean: true }),
      run({ typeId }) {
        self.getCollection().remove(typeId);
      }
    })
  }

  // Returns the collection containing the Vice Token Types
  getCollection() {
    return this.collection;
  }

  // Returns the name of the collection containing the Vice Token Type
  getCollectionName() {
    return this.collectionName;
  }

  // Returns the schema used for the Vice Token Types
  getTypeSchema() {
    return this.nodeSchema;
  }

  // Finds a node with specified id in the Vice Token Types collection
  findNode(nodeId) {
    return this.getCollection().findOne(nodeId);
  }

  // Public method that returns all the Vice Token Types in the collection
  getAllNodes() {
    return this.getCollection().find({ }, { });
  }

  // Public method that inserts a Vice Token Type into the collection
  insertType(typeName, userId) {
    // Call the private insert node method
    return this.insertTypeMethod.call({ typeName, userId }, (err, res) => {
      if (err) {
        throw new Meteor.Error(this.insertTypeMethod.name,
          'Failed inserting Vice Token Type into the collection: ' + err);
      }
    });
  }

  // Public method that removes a Vice Token Type from the collection
  removeType(typeId) {
    // Call the private insert node method
    this.removeTypeMethod.call({ typeId }, (err, res) => {
      if (err) {
        throw new Meteor.Error(this.removeTypeMethod.name,
          'Failed removing Vice Token Type into the collection: ' + err);
      }
    });
  }
}

// Create a new Mongo collection to hold all of the Vice Token Types
export var ViceTokenTypes = new ViceTokenTypeCollection('vicetoken.tokentype');