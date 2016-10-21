import { Mongo } from 'meteor/mongo';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

export class TreeNodeCollection {
  // Constructor
  constructor(nodeCollectionName) {
    // Store reference to this object for access inside methods
    let self = this;

    // Create a new Mongo collection to hold all of the tree nodes
    this.nodeCollectionName = nodeCollectionName;
    this.nodeCollection = new Mongo.Collection(nodeCollectionName);

    // Create a SimpleSchema for the nodes in the tree
    this.nodeSchema = new SimpleSchema({
      targetId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
      },
      parentNodeId: {
        type: String,
        regEx: SimpleSchema.RegEx.Id,
        optional: true
      },
      childNodeIds: {
        type: [String],
        regEx: SimpleSchema.RegEx.Id,
        defaultValue: [],
        optional: true
      },
    });

    // Meteor method for inserting a new node into the tree collection
    this.insertNodeMethod = new ValidatedMethod({
      name: nodeCollectionName + '.insertNode',
      validate: this.getNodeSchema().validator({ clean: true }),

      run({ targetId, parentNodeId, childNodeIds }) {
        // Insert the node
        return self.getCollection().insert({ targetId, parentNodeId });
      },
    });

    // Meteor method for removing a node from the tree collection
    this.removeNodeMethod = new ValidatedMethod({
      name: nodeCollectionName + '.removeNode',
      validate: new SimpleSchema({
        nodeId: {
          type: String,
          regEx: SimpleSchema.RegEx.Id,
        },
        destroyChildren: {
          type: Boolean,
          optional: true,
        },
        orphanChildren: {
          type: Boolean,
          optional: true,
        }
      }).validator({ clean: true }),

      run({ nodeId, destroyChildren, orphanChildren }) {

        // Get the target node
        let targetNode = self.findNode(nodeId);
        if (targetNode == null) {
          throw new Meteor.Error(self.removeNodeMethod.name + '.targetNotFound',
            'Could not find the target ViceTokenType, check that it exists.');
        }

        // First, set the parent on the node being removed to 'null' to clean-up all the references
        self.setParent(nodeId, null);

        // Update the subTypes for the target token type
        if (targetNode.childNodeIds != null) {
          if (destroyChildren) {
            // Remove all the subTypes recursively
            targetNode.childNodeIds.forEach(function(childNode) {
              self.removeNode(childNode, true, false);
            });
          } else {
            // Update the parent id of all of the subTypes
            targetNode.childNodeIds.forEach(function(childNode) {
              const newParentId = orphanChildren ? null : targetNode.parentNodeId;
              self.setParent(childNode, newParentId);
            });
          }
        }

        // Delete the node
        self.getCollection().remove(nodeId);
      },
    });

    // Meteor method that set the parent of a target tree node
    this.setNodeParentMethod = new ValidatedMethod({
      name: nodeCollectionName + '.setNodeParent',
      validate: new SimpleSchema({
        nodeId: {
          type: String,
          regEx: SimpleSchema.RegEx.Id,
        },
        parentNodeId: {
          type: String,
          regEx: SimpleSchema.RegEx.Id,
          optional: true,
        },
      }).validator({ clean: true }),

      run({ nodeId, parentNodeId }) {
        // Get the target node
        let targetNode = self.findNode(nodeId);
        if (targetNode == null) {
          throw new Meteor.Error(self.setNodeParentMethod.name + '.nodeNotFound',
            'Could not find the target node with id: ' + nodeId + ', check that it exists.');
        }

        // Check if a valid parent node id was specified for the new parent
        if (parentNodeId != null) {
          // Add the target node as a child to the new parent
          // (we do this before anything else so we can leave the target node were it is if it fails)
          const numUpdated = self.getCollection().update(parentNodeId,
            { $addToSet: { childNodeIds: nodeId } },
            { } );
          if (numUpdated == 0) {
            throw new Meteor.Error(self.setNodeParentMethod.name + '.cannotAddToParent',
              'Failed to add node to parent node with id: ' + parentNodeid + '.');
          }
        }

        // Next up, we update the previous parent (if there is one)
        if (targetNode.parentNodeId != null) {
          self.getCollection().update(targetNode.parentNodeId,
            { $pullAll: { childNodeIds: [ nodeId ] } },
            { } );
        }

        // Lastly, set the parent on the taget node
        self.getCollection().update(nodeId,
          { $set: { parentNodeId: parentNodeId } },
          { } );
      },
    });

  }

  // Returns the collection containing the tree's nodes
  getCollection() {
    return this.nodeCollection;
  }

  // Returns the name of the collection containing the tree's nodes
  getCollectionName() {
    return this.nodeCollectionName;
  }

  // Returns the schema used for the tree nodes
  getNodeSchema() {
    return this.nodeSchema;
  }

  // Finds a node with specified id in the tree node collection
  findNode(nodeId) {
    return this.getCollection().findOne(nodeId);
  }

  // Public method that returns all the tree nodes in the collection
  getAllNodes() {
    return this.getCollection().find({ }, { });
  }

  // Public method that returns all tree nodes at the top of the tree hierarchy
  getRootNodes() {
    return this.getCollection().find({ parentNodeId: null }, { sort: { _id : 1 } });
  }

  // Public method that inserts a tree node into the collection tree structure
  insertNode(targetId, parentNodeId) {
    // Call the private insert node method
    const newNodeId = this.insertNodeMethod.call({ targetId }, (err, res) => {
      if (err) {
        throw new Meteor.Error(this.insertNodeMethod.name,
          'Failed inserting node into the collection: ' + err);
      }
    });

    // If a parent node ID was provided, set the parent of the new node
    if (parentNodeId != null) {
      this.setNodeParentMethod.call({ nodeId: newNodeId, parentNodeId: parentNodeId }, (err, res) => {
        if (err) {
          throw new Meteor.Error(this.setNodeParentMethod.name,
            'Failed setting parent on inserted node: ' + err);
        }
      });
    }

    return newNodeId;
  }

  // Public method that removes a node from the tree collection
  removeNode(nodeId, destroyChildren, orphanChildren) {
    // Call the private remove node method
    this.removeNodeMethod.call({ nodeId, destroyChildren, orphanChildren }, (err, res) => {
      if (err) {
        throw new Meteor.Error(this.removeNodeMethod.name,
          'Failed removing node from the collection: ' + err);
      }
    });
  }

  // Public method that sets the parent of a node in the tree collection
  setParent(nodeId, parentNodeId) {
    // Call the private set parent method
    this.setNodeParentMethod.call({ nodeId, parentNodeId }, (err, res) => {
      if (err) {
        throw new Meteor.Error(this.setNodeParentMethod.name,
          'Failed setting parent on node in collection: ' + err);
      }
    });
  }

}