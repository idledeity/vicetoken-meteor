import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { ViceTokenTypes } from '../api/vice-token-types.js';
import { ViceTokenTypeTreeCollection } from '../api/vice-token-type-tree.js';

import { DefineRelation } from '../api/client/define-relation.js';

import './vice-token-type.js';

import './vice-token-type-tree.html';

Template.ViceTokenTypeTree.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
  this.state.set('sortAlphaDirection', 1);
  this.state.set('sortType', "alpha");

  this.getTypeFindOptions = function() {
    if (this.state.get('sortType') == "alpha") {
      const direction = this.state.get('sortAlphaDirection');
      return { sort: { 'target.typeName': direction }};
    }
  }.bind(this);

  DefineRelation( ViceTokenTypeTreeCollection.getCollection(), ViceTokenTypes.getCollection(), "target", "targetId");
})

Template.ViceTokenTypeTree.events({
  'click .ViceTokenTypeTreeSortAlpha'(event, instance) {
    event.preventDefault();

    const currentSortType = instance.state.get('sortType');
    if (currentSortType == "alpha") {
      const currentAlphaDir = instance.state.get('sortAlphaDirection');
      instance.state.set('sortAlphaDirection', currentAlphaDir * -1);
    } else {
      instance.state.set('sortType', "alpha");
    }

    return false;
  },
});

Template.ViceTokenTypeTree.helpers({
  rootViceTokenTypes() {
    const instance = Template.instance();
    return ViceTokenTypeTreeCollection.getRootNodes(instance.getTypeFindOptions());
  },

  getSortAlphaIconImg() {
    const instance = Template.instance();
    if (instance.state.get('sortAlphaDirection') < 0) {
      return "images/ui/icons/sort_alphabetical_ascending.png";
    } else {
      return "images/ui/icons/sort_alphabetical_descending.png";
    }

  },

  getTypeFindOptions() {
    const instance = Template.instance();
    return instance.getTypeFindOptions();
  }
});

Template.ViceTokenTypeTreeNode.events({
  'submit .new-sub-type'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const text = target.text.value;

    // Create the new sub type
    const newTypeId = ViceTokenTypes.insertType(text);
    ViceTokenTypeTreeCollection.insertNode(newTypeId, this.data._id);

    // Clear form
    target.text.value = '';

    return false;
  },

  'click .delete'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    ViceTokenTypes.removeType(this.data.targetId);
    ViceTokenTypeTreeCollection.removeNode(this.data._id);

    return false;
  },

  'click .move-up'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    if (this.data.parentNodeId != null) {
      let parentNode = ViceTokenTypeTreeCollection.findNode(this.data.parentNodeId);
      ViceTokenTypeTreeCollection.setParent(this.data._id, parentNode.parentNodeId);
    }

    return false;
  },

  'click .move-down'(event, instance  ) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get the parent node of the current node
    let parentNode = ViceTokenTypeTreeCollection.findNode(this.data.parentNodeId);

    // Get an array of sibling node id's based on whether we have a direct parent or not
    let nodeSiblingCollection = null;
    if (this.data.parentNodeId != null) {
      // Get the parent of this node
      nodeSiblingCollection = ViceTokenTypeTreeCollection.getCollection().find({ _id: { $in: parentNode.childNodeIds } }, this.typeFindOptions);
    } else {
      nodeSiblingCollection = ViceTokenTypeTreeCollection.getRootNodes();
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
          ViceTokenTypeTreeCollection.setParent(this.data._id, newNodeParentId);
        }

        // Already found a match, so we can stop searching
        break;
      }
    }

    return false;
  },
});

Template.ViceTokenTypeTreeNode.helpers({
  getSubNodes: function() {
    const instance = Template.instance();
    if (this.childNodeIds != null) {
      return ViceTokenTypeTreeCollection.getCollection().find({ _id: { $in: this.childNodeIds } }, instance.data.typeFindOptions );
    }
  },

  getTargetViceToken: function() {
    return ViceTokenTypes.findNode(this.targetId);
  },
});
