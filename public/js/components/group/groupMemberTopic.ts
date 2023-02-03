import * as angular from 'angular';

let groupMemberTopic = {
    selector: 'groupMemberTopic',
    templateUrl: '/views/components/group/group_member_topic.html',
    bindings: {
        memberTopic: '=',
        fields: '=?',
        group: '='
    },
    controller: ['ngDialog', 'GroupMemberTopic', 'GroupMemberTopicService', 'Topic', 'Group', 'AppService', class GroupMemberTopicController {
        private memberTopic;
        private canUpdate;
        private group;
        public fields

        constructor (private ngDialog, private GroupMemberTopic, private GroupMemberTopicService, public Topic, public Group, public app) {
        }

        isVisibleField (field) {
            return this.fields?.indexOf(field) > -1
        }

        doUpdateMemberTopic (level) {
            const memberTopic = this.memberTopic;
            const group = this.group;
            if (memberTopic.permission.levelGroup !== level) {
                const oldLevel = memberTopic.permission.levelGroup;
                memberTopic.permission.levelGroup = level;
                memberTopic.level = level;
                this.GroupMemberTopic
                    .update({groupId: group.id, topicId: memberTopic.id}, memberTopic)
                    .then(angular.noop,
                    () => {
                        memberTopic.permission.levelGroup = oldLevel;
                    });
            }
        }
        doDeleteMemberTopic () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_topic_delete_confirm.html',
                    data: {
                        topic: this.memberTopic
                    }
                })
                .then(() => {
                    this.GroupMemberTopic
                        .delete({
                            topicId: this.memberTopic.id,
                            groupId: this.group.id
                        })
                        .then(() => {
                            this.GroupMemberTopicService.reload();
                            location.reload();
                        });
                }, angular.noop);
        };
    }]
}

angular
    .module('citizenos')
    .component(groupMemberTopic.selector, groupMemberTopic);
