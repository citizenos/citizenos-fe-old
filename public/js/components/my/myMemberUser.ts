import * as angular from 'angular';

let myMemberUser = {
    selector: 'myMemberUser',
    templateUrl: '/views/components/my/my_member_user.html',
    bindings: {
        member: '=',
        group: '=?',
        topic: '=?',
        fields: '=?'
    },
    controller: ['ngDialog', 'Group', 'Topic', 'GroupMemberUser', 'GroupMemberUserService', 'TopicMemberUser', 'TopicMemberUserService', 'sAuth', '$state', class MyMemberUserController {
        private member;
        private group;
        private topic;
        public fields;

        constructor(private ngDialog, private Group, private Topic, private GroupMemberUser, private GroupMemberUserService, private TopicMemberUser, private TopicMemberUserService, private sAuth, private $state) {
        }

        doUpdateMemberUser(level) {
            if (this.member.level !== level) {
                const oldLevel = this.member.level;
                this.member.level = level;
                if (this.group) {
                    this.member.groupId = this.group.id;
                    console.log(this.member);
                    this.GroupMemberUser
                        .update(this.member)
                        .then(
                            angular.noop,
                            () => {
                                this.member.level = oldLevel;
                            });
                } else {
                    this.member.topicId = this.topic.id;
                    this.TopicMemberUser
                        .update(this.member)
                        .then(
                            angular.noop,
                            () => {
                                this.member.level = oldLevel;
                            });
                }
            }
        };

        canUpdate() {
            if (this.group) {
                return this.Group.canUpdate(this.group);
            }
            return this.Topic.canUpdate(this.topic);
        }

        doDeleteMemberUser() {
            const member = this.member
            if (this.group) {
                const group = this.group
                if (member.id === this.sAuth.user.id) { // IF User tries to delete himself, show "Leave" dialog instead
                    return this.doLeaveGroup();
                }
                this.ngDialog
                    .openConfirm({
                        template: '/views/modals/group_member_user_delete_confirm.html',
                        data: {
                            user: member
                        }
                    })
                    .then(() => {
                        this.GroupMemberUser
                            .delete({ groupId: group.id, userId: member.userId || member.id })
                            .then(() => {
                                return this.GroupMemberUserService.reload();
                            });
                    }, angular.noop);

            } else {
                const topic = this.topic;
                if (member.id === this.sAuth.user.id) {
                    return this.doLeaveTopic();
                }
                this.ngDialog
                    .openConfirm({
                        template: '/views/modals/topic_member_user_delete_confirm.html',
                        data: {
                            user: member
                        }
                    })
                    .then(() => {
                        member.topicId = topic.id;
                        this.TopicMemberUser.delete({topicId: topic.id, userId: member.userId || member.id})
                            .then(() => {
                                return this.TopicMemberUserService.reload(); // Good old topic.members.users.splice wont work due to group permission inheritance
                            });
                    }, angular.noop);
            }
        };

        doLeaveGroup() {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_user_leave_confirm.html',
                    data: {
                        group: this.group
                    }
                })
                .then(() => {
                    this.GroupMemberUser
                        .delete({ groupId: this.group.id, userId: this.sAuth.user.id })
                        .then(() => {
                            this.group.getMemberUsers();
                        });
                });
        };

        doLeaveTopic() {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_leave_confirm.html',
                    data: {
                        topic: this.topic
                    }
                })
                .then(() => {
                    this.TopicMemberUser
                        .delete({ id: this.sAuth.user.id, topicId: this.topic.id })
                        .then(() => {
                            this.$state.go('my.topics', null, { reload: true });
                        });
                });
        };

        isVisibleField(field) {
            return this.fields?.indexOf(field) > -1
        }
    }]
}

angular
    .module('citizenos')
    .component(myMemberUser.selector, myMemberUser);
