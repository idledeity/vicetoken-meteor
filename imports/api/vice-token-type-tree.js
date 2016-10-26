
import { TreeNodeCollection } from './common/tree-node-collection.js';

export var ViceTokenTypeTreeNodes = new TreeNodeCollection('vicetoken.tokentype.treenodes');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('viceTokenTypeTreeNodes', function viceTokenTypeTreeNodesPublication() {
    return ViceTokenTypeTreeNodes.getCollection().find();
  });
}