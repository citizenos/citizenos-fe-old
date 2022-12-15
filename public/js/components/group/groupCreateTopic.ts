'use strict';
import * as angular from 'angular';
import {sortedUniq, find} from 'lodash';
import {isEmail} from 'validator';
import * as $ from 'jquery';

let groupCreateTopic = {
    selector: 'groupCreateTopic',
    templateUrl: '/views/components/group/group_create_topic.html',
    bindings: {
    },
    controller: ['$state', '$stateParams', 'Group', 'GroupMemberTopic', 'AppService', class GroupCreateTopicController {
        public levels = {
            none: 0,
            read: 1,
            edit: 2,
            admin: 3
        };

        public newMemberTopicTitle = null
        public group;

        constructor (private $state, private $stateParams, private Group, private GroupMemberTopic, private app) {
            Group.get(this.$stateParams.groupId)
                .then((group) => {
                    this.group = group;
                    // Create a copy of parent scopes Group, so that while modifying we don't change parent state
                    this.group = angular.copy(this.group);
                });
        }

        addNewGroupMemberTopic () {
            this.$state.go('topics/create', {
                groupId: this.group.id,
                title: this.newMemberTopicTitle,
                groupLevel: this.GroupMemberTopic.LEVELS.read,
                groupVisibility: this.group.visibility
            });
        };
    }]
}
angular
    .module('citizenos')
    .component(groupCreateTopic.selector, groupCreateTopic);
