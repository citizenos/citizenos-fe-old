'use strict';
import * as angular from 'angular';

let groupAddTopics = {
    selector: 'groupAddTopics',
    templateUrl: '/views/components/group/group_add_topics.html',
    bindings: {
    },
    controller: ['$stateParams', '$timeout', 'ngDialog', 'sSearch', 'Group', 'GroupMemberTopic', 'GroupMemberTopicService', 'AppService', class GroupAddTopicsController {
        public levels = {
            none: 0,
            read: 1,
            edit: 2,
            admin: 3
        };

        public topicList = {
            searchFilter: '',
            searchOrderBy: {
                property: 'title'
            }
        };

        public memberTopics = [];

        public searchStringTopic = null;
        public searchResults = {
            topics: []
        };

        public group;

        public errors = null;

        constructor(private $stateParams, private $timeout, private ngDialog, private sSearch, private Group, private GroupMemberTopic, private GroupMemberTopicService, private app) {
            this.Group.get(this.$stateParams.groupId)
                .then((group) => {
                    this.group = group;
                    // Create a copy of parent scopes Group, so that while modifying we don't change parent state
                    this.group = angular.copy(this.group);
                });
        }

        search(str) {
            if (str && str.length >= 2) {
                this.sSearch
                    .search(str, {
                        include: 'my.topic',
                        'my.topic.level': 'admin'
                    })
                    .then((response) => {
                        this.searchResults = angular.merge({}, { users: [], topics: [] });
                        response.data.data.results.my.topics.rows.forEach((topic) => {
                            if (this.group.visibility === this.Group.VISIBILITY.public && topic.visibility === this.Group.VISIBILITY.private) {
                                return
                            }
                            this.searchResults.topics.push(topic);
                        });
                    });

            } else {
                this.searchResults = angular.merge({}, { topics: [] });
            }
        };

        addGroupMemberTopic(topic) {
            this.searchStringTopic = null;
            this.searchResults.topics = [];

            if (!topic || !topic.id || !topic.title) {
                return false;
            }
            const member = this.memberTopics.find((o) => {
                return o.id === topic.id;
            });

            if (!member) {
                topic.permission.level = this.GroupMemberTopic.LEVELS.read;
                this.memberTopics.push(topic);
            }
        };

        removeGroupMemberTopic(topic) {
            this.memberTopics.splice(this.memberTopics.indexOf(topic), 1);
        };

        updateGroupMemberTopicLevel(topic, level) {
            topic.permission.level = level;
        };

        doOrderTopics(property) {
            if (this.topicList.searchOrderBy.property == property) {
                property = '-' + property;
            }
            this.topicList.searchOrderBy.property = property;
        };

        doSaveGroup() {
            this.errors = null;

            const savePromises = [];
            // TODO: Once there is POST /groups/:groupId/members/topics use that
            this.memberTopics.forEach((topic) => {
                const member = {
                    groupId: this.group.id,
                    topicId: topic.id,
                    level: topic.permission.level
                };
                savePromises.push(
                    this.GroupMemberTopic.save({ groupId: this.group.id, topicId: topic.id }, member)
                )
            });

            return Promise.all(savePromises)
                .then(() => {
                    const dialogs = this.ngDialog.getOpenDialogs();
                    this.$timeout(() => {
                        this.GroupMemberTopicService.reload();
                        this.ngDialog.close(dialogs[0], '$closeButton');
                        location.reload();
                    })
                }), ((errorResponse) => {
                    if (errorResponse.data && errorResponse.data.errors) {
                        this.errors = errorResponse.data.errors;
                        console.log(errorResponse.data.errors);
                    }
                });
        };

    }]
}
angular
    .module('citizenos')
    .component(groupAddTopics.selector, groupAddTopics);
