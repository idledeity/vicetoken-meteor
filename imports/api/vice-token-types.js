import { Mongo } from 'meteor/mongo';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

export const ViceTokenTypes = new Mongo.Collection('vicetoken.tokentype');

ViceTokenTypes.schema = new SimpleSchema({
  name: {
    type: String
  },
  userId: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true
  },

  parentType: {
    type: String,
    regEx: SimpleSchema.RegEx.Id,
    optional: true
  },
  subTypes: {
    type: [String],
    regEx: SimpleSchema.RegEx.Id,
    optional: true
  }
});

ViceTokenTypes.insertMethod = new ValidatedMethod({
  name: 'vicetoken.tokentype.insert',
  validate: new SimpleSchema({
    name: { type: String },
    userId: { type: String, optional: true }
  }).validator(),
  run({ name, userId}) {
    ViceTokenTypes.insert({
      name, userId
    });
  }
});