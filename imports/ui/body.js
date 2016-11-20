import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import { Tasks } from '../api/tasks.js';
import { ViceTokenTypes } from '../api/vice-token-type/vice-token-types.js';
import { ViceTokenTypeTreeNodes } from '../api/vice-token-type/vice-token-type-tree.js';

import './task.js';
import './vice-token-type/vice-token-type-tree.js';
import './body.html';

Template.body.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
})

Template.body.helpers({
  tasks() {
    const instance = Template.instance();
    if (instance.state.get('hideCompleted')) {
      // If hide completed is checked, filter tasks
      return Tasks.find({ checked: { $ne: true } }, { sort: { createdAt: -1 } });
    }

    return Tasks.find({}, { sort: { createdAt: -1 } });
  },
  viceTokenTypes() {
    return ViceTokenTypes.collection.find({}, { sort: { createdAt: -1 } });
  },

});

Template.body.events({
  'submit .new-task'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const text = target.text.value;

    // Insert a task into the collection
    Tasks.insert({
      text,
      createdAt: new Date(), // current time
      owner: Meteor.userId(),
      username: Meteor.user().username,
    });

    // Clear form
    target.text.value = '';
  },
  'submit .new-vice-token-type'(event) {
    // Prevent default browser form submit
    event.preventDefault();

    // Get value from form element
    const target = event.target;
    const text = target.text.value;

    const newTypeId = ViceTokenTypes.insertType(text, null, "");
    ViceTokenTypeTreeNodes.insertNode(newTypeId);

    // Clear form
    target.text.value = '';
  },
  'change .hide-completed input'(event, instance) {
      instance.state.set('hideCompleted', event.target.checked);
  },
});