import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { ViceTokenTypes } from '../api/vice-token-types.js';
import { ViceTokenTypeTreeNodes } from '../api/vice-token-type-tree.js';

import { DefineRelation } from '../api/client/define-relation.js';

import './vice-token-type-tree-node.js';

import './vice-token-type-tree.html';

Template.ViceTokenTypeTree.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
  this.state.set('sortAlphaDirection', 1);
  this.state.set('sortType', "alpha");

  Meteor.subscribe('viceTokenTypeTreeNodes');
  Meteor.subscribe('viceTokenTypes');

  this.getTypeFindOptions = function() {
    if (this.state.get('sortType') == "alpha") {
      const direction = this.state.get('sortAlphaDirection');
      return { sort: { 'target.typeName': direction }};
    }
  }.bind(this);

  DefineRelation( ViceTokenTypeTreeNodes.getCollection(), ViceTokenTypes.getCollection(), "target", "targetId");
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
    return ViceTokenTypeTreeNodes.getRootNodes(instance.getTypeFindOptions());
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