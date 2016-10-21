import { Template } from 'meteor/templating';

import { ViceTokenTypes } from '../api/vice-token-types.js';
import { ViceTokenTypeTreeCollection } from '../api/vice-token-type-tree.js';

import './vice-token-type.js';

import './vice-token-type-tree.html';

Template.ViceTokenTypeTree.events({
  'submit .new-sub-type'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const text = target.text.value;

    // Create the new sub type
    const newTypeId = ViceTokenTypes.insertType(text);
    ViceTokenTypeTreeCollection.insertNode(newTypeId, this._id);

    // Clear form
    target.text.value = '';

    return false;
  },

  'click .delete'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    ViceTokenTypes.removeType(this.targetId);
    ViceTokenTypeTreeCollection.removeNode(this._id);

    return false;
  },

  'click .move-up'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    if (this.parentNodeId != null) {
      let parentNode = ViceTokenTypeTreeCollection.findNode(this.parentNodeId);
      ViceTokenTypeTreeCollection.setParent(this._id, parentNode.parentNodeId);
    }

    return false;
  },

  'click .move-down'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get the parent node of the current node
    let parentNode = ViceTokenTypeTreeCollection.findNode(this.parentNodeId);

    // Get an array of sibling node id's based on whether we have a direct parent or not
    let nodeSiblingCollection = null;
    if (this.parentNodeId != null) {
      // Get the parent of this node
      nodeSiblingCollection = ViceTokenTypeTreeCollection.getCollection().find({ _id: { $in: parentNode.childNodeIds } }, { sort: { _id : 1 } });
    } else {
      nodeSiblingCollection = ViceTokenTypeTreeCollection.getRootNodes();
    }

    // Extract an array of ids for all of the sibling nodes
    const nodeSiblingIds = nodeSiblingCollection.map( function(siblingNode) { return siblingNode._id; } );

    // Search for this node in the array of sibling nodes
    const numSiblings = nodeSiblingIds.length;
    for (let siblingIdx = 0; siblingIdx < numSiblings; siblingIdx++) {
      // Found ourself!
      if (nodeSiblingIds[siblingIdx] == this._id) {
        // Now that we found ourselves amongst our sibblings, we can get a new parent id from our previous sibbling
        let newNodeParentId = null;

        // Check if this node is the first child of it's parent
        if (siblingIdx == 0) {
          // This is the first child, to 'move-up' we reparent to our parent's parent (if it exists)
          if (parentNode != null) {
            newNodeParentId = parentNode.parentNodeId;
          }
        } else {
          // If there is a valid sibling before this node, re-parent this node to that sibling
          newNodeParentId = nodeSiblingIds[siblingIdx - 1];
        }

        // If we found a valid new parent id, then set it now
        if (newNodeParentId != null) {
          ViceTokenTypeTreeCollection.setParent(this._id, newNodeParentId);
        }

        // Already found a match, so we can stop searching
        break;
      }
    }

    return false;
  },
});

Template.ViceTokenTypeTree.helpers({
  rootViceTokenTypes() {
    return ViceTokenTypeTreeCollection.getRootNodes();
  }

});

Template.viceTokenTypeTreeNode.helpers({
  getSubNodes: function() {
    if (this.childNodeIds != null) {
      return ViceTokenTypeTreeCollection.getCollection().find({ _id: { $in: this.childNodeIds } }, { sort: { _id : 1 } });
    }
  },

  getTargetViceToken: function() {
    return ViceTokenTypes.findNode(this.targetId);
  },
});
