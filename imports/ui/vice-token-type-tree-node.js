import { Template } from 'meteor/templating';

import { ViceTokenTypes } from '../api/vice-token-types.js';
import { ViceTokenTypeTreeNodes } from '../api/vice-token-type-tree.js';

import './vice-token-type.js';

import './vice-token-type-tree-node.html';


Template.ViceTokenTypeTreeNode.events({
  'submit .new-sub-type'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const text = target.text.value;

    // Create the new sub type
    const newTypeId = ViceTokenTypes.insertType(text);
    ViceTokenTypeTreeNodes.insertNode(newTypeId, this.data._id);

    // Clear form
    target.text.value = '';

    return false;
  },

  'click .delete'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    ViceTokenTypes.removeType(this.data.targetId);
    ViceTokenTypeTreeNodes.removeNode(this.data._id);

    return false;
  },

  'click .move-up'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    if (this.data.parentNodeId != null) {
      let parentNode = ViceTokenTypeTreeNodes.findNode(this.data.parentNodeId);
      ViceTokenTypeTreeNodes.setParent(this.data._id, parentNode.parentNodeId);
    }

    return false;
  },

  'click .move-down'(event, instance  ) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get the parent node of the current node
    let parentNode = ViceTokenTypeTreeNodes.findNode(this.data.parentNodeId);

    // Get an array of sibling node id's based on whether we have a direct parent or not
    let nodeSiblingCollection = null;
    if (this.data.parentNodeId != null) {
      // Get the parent of this node
      nodeSiblingCollection = ViceTokenTypeTreeNodes.getCollection().find({ _id: { $in: parentNode.childNodeIds } }, this.typeFindOptions);
    } else {
      nodeSiblingCollection = ViceTokenTypeTreeNodes.getRootNodes();
    }

    // Extract an array of ids for all of the sibling nodes
    const nodeSiblingIds = nodeSiblingCollection.map( function(siblingNode) { return siblingNode._id; } );

    // Search for this node in the array of sibling nodes
    const numSiblings = nodeSiblingIds.length;
    for (let siblingIdx = 0; siblingIdx < numSiblings; siblingIdx++) {
      // Found ourself!
      if (nodeSiblingIds[siblingIdx] == this.data._id) {
        // Now that we found ourselves amongst our sibblings, we can get a new parent id from our previous sibbling
        let newNodeParentId = null;

        // Check if this node is the first child of it's parent
        if (siblingIdx > 0) {
          // If there is a valid sibling before this node, re-parent this node to that sibling
          newNodeParentId = nodeSiblingIds[siblingIdx - 1];
        }

        // If we found a valid new parent id, then set it now
        if (newNodeParentId != null) {
          ViceTokenTypeTreeNodes.setParent(this.data._id, newNodeParentId);
        }

        // Already found a match, so we can stop searching
        break;
      }
    }

    return false;
  },
});

Template.ViceTokenTypeTreeNode.helpers({
  // Returns a cursor containing all of the current node's children
  getChildNodes: function() {
    const instance = Template.instance();
    if (this.childNodeIds != null) {
      const children = ViceTokenTypeTreeNodes.getCollection().find({ _id: { $in: this.childNodeIds } }, instance.data.typeFindOptions );
      return children;
    }
  },

  // Returns the ViceToken document the current node targets
  getTargetViceToken: function() {
    const tokenType = ViceTokenTypes.findNode(this.targetId);
    return tokenType;
  },
});
