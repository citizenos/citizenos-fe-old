
import {Group} from './Group';
import * as angular from 'angular';

export class PublicGroup extends Group {

    constructor($http, GroupMemberUser, sAuth, sLocation) {
        super($http, GroupMemberUser, sAuth, sLocation);
        this.$http = $http;
        this.GroupMemberUser = GroupMemberUser;
        var path = '/api/groups';
        console.log(sLocation.getAbsoluteUrlApi(path))
        this.apiRoot = sLocation.getAbsoluteUrlApi(path);
    }
};


angular
  .module("citizenos")
  .service("PublicGroup", PublicGroup);