import { Template } from 'meteor/templating';

import { ViceTokenTypes } from '../api/vice-token-types.js';

import './vice-token-types-tree.html';

Template.viceTokenTypeTreeNode.events({
  'submit .new-sub-type'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const text = target.text.value;

    // Insert the new subType
    ViceTokenTypes.insertSubType.call({
      parentTypeId: this._id,
      subType: {typeName : text}
    }, (err, res) => {
      if (err) {
        alert(err);
      } else {

      }
    });

    // Clear form
    target.text.value = '';

    return false;
  },

  'click .delete'(event) {
    ViceTokenTypes.removeType.call({
      typeId: this._id,
      orphanSubTypes: false,
    }, (err, res) => {
      if (err) {
        alert(err)
      } else {

      }
    });
  },

});

Template.viceTokenTypesTree.helpers({
  viceTokenTypesRootNodes() {
    return ViceTokenTypes.collection.find({ parentTypeId: null }, { sort: { createdAt: -1 } });
  },

});

Template.viceTokenTypeTreeNode.helpers({
  subTypeDocs: function() {
    return ViceTokenTypes.collection.find({ _id: { $in: this.subTypeIds } });
  },
});

