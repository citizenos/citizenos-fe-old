import * as angular from 'angular';

let groupMemberTopic = {
    selector: 'groupMemberTopic',
    templateUrl: '/views/components/group/group_member_topic.html',
    bindings: {
        memberTopic: '=',
        fields: '=?',
        group: '='
    },
    controller: ['ngDialog', 'GroupMemberTopic', 'Topic', 'Group', class GroupMemberTopicController {
        private memberTopic;
        private canUpdate;
        private group;
        public fields

        constructor (private ngDialog, private GroupMemberTopic, public Topic, public Group) {
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
            const memberTopic = this.memberTopic;
            const group = this.group;

            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_topic_delete_confirm.html',
                    data: {
                        topic: memberTopic
                    }
                })
                .then(() => {
                    this.GroupMemberTopic
                        .delete(memberTopic)
                        .then(() => {
                            group.getMemberTopics();
                        });
                }, angular.noop);
        };
    }]
}

angular
    .module('citizenos')
    .component(groupMemberTopic.selector, groupMemberTopic);
