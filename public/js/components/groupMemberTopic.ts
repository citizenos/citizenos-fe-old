import * as angular from 'angular';

let groupMemberTopic = {
    selector: 'groupMemberTopic',
    templateUrl: '/views/components/groupMemberTopic.html',
    bindings: {
        memberTopic: '=',
        fields: '=?',
        canUpdate: '=?',
        group: '='
    },
    controller: ['ngDialog', 'GroupMemberTopic', class GroupMemberTopicController {
        private memberTopic;
        private canUpdate;
        private group;
        public fields

        constructor (private ngDialog, private GroupMemberTopic) {
        }

        isVisibleField (field) {
            return this.fields?.indexOf(field) > -1
        }

        doUpdateMemberTopic (level) {
            const memberTopic = this.memberTopic;
            const group = this.group;
            if (memberTopic.permission.levelGroup !== level) {
                var oldLevel = memberTopic.permission.levelGroup;
                memberTopic.permission.levelGroup = level;
                memberTopic
                    .$update({groupId: group.id})
                    .then(
                        angular.noop,
                        function () {
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
                .then(function () {
                    memberTopic
                        .$delete({groupId: group.id})
                        .then(function () {
                            group.getMemberTopics();
                        });
                }, angular.noop);
        };
    }]
}

angular
    .module('citizenos')
    .component(groupMemberTopic.selector, groupMemberTopic);
