import * as angular from 'angular';

let myGroupsGroup = {
    selector: 'myGroupsGroup',
    templateUrl: '/views/components/my/my_groups_groupId.html',
    controller: ['$scope', '$state', '$stateParams', '$log', '$q', 'ngDialog', 'sAuth', 'Group', 'GroupService', 'GroupMemberUser', 'GroupMemberUserService', 'GroupMemberTopic', 'GroupMemberTopicService', 'GroupInviteUser', 'GroupInviteUserService', 'AppService', class MyGroupsGroupController {
        public group;

        public userList = {
            isVisible: false,
            isSearchVisible: false
        };
        public topicList = {
            isVisible: false,
            isSearchVisible: false
        };
        public generalInfo = {
            isVisible: true
        };
        public userSearch;
        constructor ($scope, private $state, private $stateParams, private $log, private  $q, private  ngDialog, private sAuth, private Group, private GroupService, private GroupMemberUser, private GroupMemberUserService, private GroupMemberTopic, private GroupMemberTopicService, private GroupInviteUser, public GroupInviteUserService, private app) {
            $log.debug('MyGroupsGroupController');
            this.group = this.app.group;
            GroupMemberTopicService.groupId = $stateParams.groupId;
            GroupMemberTopicService.reload();
            GroupMemberUserService.groupId = $stateParams.groupId;
            GroupMemberUserService.reload();
            GroupInviteUserService.groupId = $stateParams.groupId;
            GroupInviteUserService.reload();

            if ($stateParams.openTabs) {
                const params = angular.extend({}, $stateParams);
                this.userList.isVisible = false;
                this.topicList.isVisible = false;
                if (!Array.isArray(params.openTabs)) {
                    params.openTabs = [params.openTabs];
                }
                params.openTabs.forEach((tab) => {
                    switch (tab) {
                        case 'user_list':
                            this.doShowMemberUserList();
                            break;
                        case 'topic_list':
                            this.doShowMemberTopicList();
                            break;
                    }
                });
            }
        };

        doShowMemberTopicList () {
            this.GroupMemberTopicService.reload();
            this.topicList.isVisible = true;
        };

        doToggleMemberTopicList () {
            const doShowList = this.topicList.isVisible;
            if (this.topicList.isVisible) {
                this.topicList.isVisible = !this.topicList.isVisible;
            }

            this.toggleTabParam('topic_list')
                .then(() => {
                    if (!doShowList) {
                        this.doShowMemberTopicList();
                        this.checkIfInView('topic_list');
                    }
                });
        };

        doUpdateMemberTopic (groupMemberTopic, level) {
            this.$log.debug('groupMemberTopic', groupMemberTopic, level);
            if (groupMemberTopic.permission.levelGroup !== level) {
                const oldLevel = groupMemberTopic.permission.levelGroup;
                groupMemberTopic.permission.levelGroup = level;
                this.GroupMemberTopic
                    .update({groupId: this.group.id, topicId: groupMemberTopic.topicId}, groupMemberTopic)
                    .then(
                        angular.noop,
                        () => {
                            groupMemberTopic.permission.levelGroup = oldLevel;
                        });
            }
        };

        doDeleteMemberTopic (groupMemberTopic) {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_topic_delete_confirm.html',
                    data: {
                        topic: groupMemberTopic
                    }
                })
                .then(() => {
                    this.GroupMemberTopic.delete(groupMemberTopic)
                        .then(() => {
                            this.GroupMemberTopicService.reload();
                        });
                }, angular.noop);
        };

        doShowMemberUserList () {
            this.GroupMemberUserService.reload();
            this.GroupInviteUserService.reload();
            this.userList.isVisible = true;
        };

        doToggleMemberUserList () {
            const doShowList = this.userList.isVisible;
            if (this.userList.isVisible) {
                this.userList.isVisible = !this.userList.isVisible;
            }
            this.toggleTabParam('user_list')
                .then(() => {
                    if (!doShowList) {
                        this.doShowMemberUserList()
                        this.checkIfInView('user_list');
                    }
                });
        };

        toggleTabParam (tabName) {
            const $state = this.$state;
            const params  = angular.extend({}, this.$stateParams);
            return new Promise<void>((resolve) => {
                let tabIndex;
                if (params.openTabs) {
                    tabIndex = params.openTabs.indexOf(tabName);
                }

                if (tabIndex > -1) {
                    if (!Array.isArray(params.openTabs)) {
                        params.openTabs = null;
                    } else if (params.openTabs) {
                        params.openTabs.splice(tabIndex, 1);
                    }
                } else {
                    if (!params.openTabs) {
                        params.openTabs = [];
                    }
                    if (!Array.isArray(params.openTabs)) {
                        params.openTabs = [params.openTabs];
                    }
                    params.openTabs.push(tabName);
                }

                $state.transitionTo($state.current.name, params, {
                    notify: true,
                    reload: false
                }).then(resolve);
            });

        };

        searchMembers() {
            this.GroupMemberUserService.search = this.userSearch;
            this.GroupInviteUserService.search = this.userSearch;
            this.GroupMemberUserService.doSearch();
            this.GroupInviteUserService.doSearch();
        };

        doUpdateMemberUser (groupMemberUser, level) {
            if (groupMemberUser.level !== level) {
                const oldLevel = groupMemberUser.level;
                groupMemberUser.level = level;
                this.GroupMemberUser
                    .update({groupId: this.group.id, userId: groupMemberUser.userId}, groupMemberUser)
                    .then(
                        angular.noop,
                        () => {
                            groupMemberUser.level = oldLevel;
                        });
            }
        };

        doDeleteMemberUser (groupMemberUser) {
            if (groupMemberUser.id === this.sAuth.user.id) { // IF User tries to delete himself, show "Leave" dialog instead
                this.doLeaveGroup();
            } else {
                this.ngDialog
                    .openConfirm({
                        template: '/views/modals/group_member_user_delete_confirm.html',
                        data: {
                            user: groupMemberUser
                        }
                    })
                    .then(() => {
                        this.GroupMemberUser
                            .delete({groupId: this.group.id, userId: groupMemberUser.userId})
                            .then(() => {
                                this.GroupMemberUserService.reload();
                            });
                    }, angular.noop);
            }
        };

        doDeleteInviteUser (groupInviteUser) {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_invite_user_delete_confirm.html',
                    data: {
                        user: groupInviteUser.user
                    }
                })
                .then((isAll) => {
                    const promisesToResolve = [];
                    // Delete all
                    if (isAll) {
                        this.GroupInviteUserService.users.forEach((invite) => {
                            if (invite.user.id === groupInviteUser.user.id) {
                                promisesToResolve.push(this.GroupInviteUser.delete(invite));
                            }
                        });
                    } else { // Delete single
                        promisesToResolve.push(this.GroupInviteUser.delete(groupInviteUser));
                    }

                    this.$q
                        .all(promisesToResolve)
                        .then(() => {
                            this.GroupInviteUserService.reload();
                        });
                }, angular.noop);
        };

        doLeaveGroup () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_user_leave_confirm.html',
                    data: {
                        group: this.group
                    }
                })
                .then(() => {
                    this.GroupMemberUser
                        .delete({groupId: this.group.id, userId: this.sAuth.user.id})
                        .then(() => {
                            this.$state.go('my/groups', null, {reload: true});
                        });
                });
        };

        doDeleteGroup () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_delete_confirm.html'
                })
                .then(() => {
                    this.Group
                        .delete(this.group)
                        .then(() => {
                            this.GroupService.reload();
                            this.$state.go('my/groups', null, {reload: true});
                        });
                }, angular.noop);
        };

        private checkIfInView (elemId) {
            const elem = document.getElementById(elemId);
            const bounding = elem.getBoundingClientRect();

            if ((bounding.top + 100) > (window.scrollY + window.innerHeight)) {
                setTimeout(() => {
                    this.app.scrollToAnchor(elemId)
                }, 200);
            }
        };

        shareGroupDialog() {
            this.ngDialog.open({
                template: '<group-invite></group-invite>',
                plain:true
            })
        }

        createTopicDialog() {
            this.ngDialog.open({
                template: '<group-create-topic></group-create-topic>',
                plain:true
            })
        }

        addTopicDialog() {
            this.ngDialog.open({
                template: '<group-add-topics></group-add-topics>',
                plain:true
            })
        }
    }]
};

angular
    .module('citizenos')
    .component(myGroupsGroup.selector, myGroupsGroup);

