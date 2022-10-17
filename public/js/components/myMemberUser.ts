import * as angular from 'angular';

let myMemberUser = {
    selector: 'myMemberUser',
    templateUrl:  '/views/components/myMemberUser.html',
    bindings: {
        member: '=',
        canUpdate: '=?',
        group: '=?',
        topic: '=?',
        fields: '=?'
    },
    controller: ['ngDialog', 'GroupMemberUser', 'TopicMemberUser', 'sAuth', '$state', class MyMemberUserController {
        private member;
        private canUpdate;
        private group;
        private topic;
        public fields;

        private ngDialog;
        private GroupMemberUser;
        private TopicMemberUser;
        private sAuth;
        private $state;

        constructor (ngDialog, GroupMemberUser, TopicMemberUser, sAuth, $state) {
            this.ngDialog = ngDialog;
            this.GroupMemberUser = GroupMemberUser;
            this.TopicMemberUser = TopicMemberUser;
            this.sAuth = sAuth;
            this.$state = $state;
        }

        doUpdateMemberUser (level) {
            const member = new this.GroupMemberUser(this.member);
            if (member.level !== level) {
                const oldLevel = member.level;
                member.level = level;
                member
                    .$update({groupId: this.group.id})
                    .then(
                        angular.noop,
                        function () {
                            member.level = oldLevel;
                        });
            }
        };

        doDeleteMemberUser () {
            const member = this.member
            if (this.group) {
                const group = this.group
                if (member.id === this.sAuth.user.id) { // IF User tries to delete himself, show "Leave" dialog instead
                    this.doLeaveGroup();
                } else {
                    this.ngDialog
                        .openConfirm({
                            template: '/views/modals/group_member_user_delete_confirm.html',
                            data: {
                                user: member
                            }
                        })
                        .then(() => {
                            member
                                .$delete({groupId: group.id})
                                .then(() => {
                                    group.getMemberUsers();
                                });
                        }, angular.noop);
                }
            } else {
                const topic = this.topic;
                if (member.id = this.sAuth.user.id) {
                    this.doLeaveTopic();
                }
                this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_delete_confirm.html',
                    data: {
                        user: member
                    }
                })
                .then(() => {
                    member
                        .$delete({topicId: topic.id})
                        .then(() => {
                        //    return $scope.loadTopicMemberUserList(); // Good old topic.members.users.splice wont work due to group permission inheritance
                        });
                }, angular.noop);
            }
        };

        doLeaveGroup () {
            const GroupMemberUser = this.GroupMemberUser;
            const sAuth = this.sAuth;
            const group = this.group;
            const $state = this.$state;
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_user_leave_confirm.html',
                    data: {
                        group: group
                    }
                })
                .then(() => {
                    const groupMemberUser = new GroupMemberUser({id: sAuth.user.id});
                    groupMemberUser
                        .$delete({groupId: group.id})
                        .then(() => {
                            group.getMemberUsers();
                        });
                });
        };

        doLeaveTopic () {
            const self = this;
            self.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_member_user_leave_confirm.html',
                    data: {
                        topic: self.topic
                    }
                })
                .then(() => {
                    const topicMemberUser = new self.TopicMemberUser({id: self.sAuth.user.id});
                    topicMemberUser
                        .$delete({topicId: self.topic.id})
                        .then(() => {
                            self.$state.go('my.topics', null, {reload: true});
                        });
                });
        };

        isVisibleField (field) {
            return this.fields?.indexOf(field) > -1
        }
    }]
}

angular
    .module('citizenos')
    .component(myMemberUser.selector, myMemberUser);
