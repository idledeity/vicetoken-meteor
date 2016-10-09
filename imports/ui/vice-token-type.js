import { Template } from 'meteor/templating';

import { ViceTokenTypes } from '../api/vice-token-types.js';

import './vice-token-type.html';

Template.viceTokenType.events({
  'click .delete'() {
    Tasks.remove(this._id);
  },
});