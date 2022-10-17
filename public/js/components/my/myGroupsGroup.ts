import * as angular from 'angular';
import {orderBy, sortedUniqBy} from 'lodash';

let myGroupsGroup = {
    selector: 'myGroupsGroup',
    templateUrl: '/views/components/my_groups_groupId.html',
    controller: ['$state', '$stateParams', '$log', '$q', 'ngDialog', 'sAuth', 'Group', 'GroupService', 'GroupMemberUser', 'GroupMemberUserService', 'GroupMemberTopic', 'GroupMemberTopicService', 'GroupInviteUser', 'GroupInviteUserService', 'AppService', class MyGroupsGroupController {
        public app;
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
        constructor (private $state, private $stateParams, private $log, private  $q, private  ngDialog, private sAuth, private Group, GroupService, private GroupMemberUser, private GroupMemberUserService, private GroupMemberTopic, private GroupMemberTopicService, private GroupInviteUser, public GroupInviteUserService, AppService) {
            $log.debug('MyTopicsTopicController');
            this.app = AppService;
            this.group = GroupService.groups.find((item) => { if (item.id === $stateParams.groupId)return item});
            GroupMemberTopicService.groupId = $stateParams.groupId;
            GroupMemberTopicService.reload();
            GroupMemberUserService.groupId = $stateParams.groupId;
            GroupMemberUserService.reload();
            GroupInviteUserService.groupId = $stateParams.groupId;
            GroupInviteUserService.reload();
            if (!this.group) {
                return $state.go('my/groups', {}, {reload:true});
            }
            const self = this;
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
                            self.doShowMemberUserList();
                            break;
                        case 'topic_list':
                            self.doShowMemberTopicList();
                            break;
                    }
                });
            }
        };

        doShowMemberTopicList () {
            if (this.GroupMemberTopicService.countTotal) {
                this.topicList.isVisible = true;
            }
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
                groupMemberTopic
                    .$update({groupId: this.group.id})
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
                    groupMemberTopic
                        .$delete({groupId: this.group.id})
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

        doUpdateMemberUser (groupMemberUser, level) {
            if (groupMemberUser.level !== level) {
                const oldLevel = groupMemberUser.level;
                groupMemberUser.level = level;
                groupMemberUser
                    .$update({groupId: this.group.id})
                    .then(
                        angular.noop,
                        () => {
                            groupMemberUser.level = oldLevel;
                        });
            }
        };

        doDeleteMemberUser (groupMemberUser) {
            const self = this;
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
                        groupMemberUser
                            .$delete({groupId: self.group.id})
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
                                promisesToResolve.push(invite.$delete({groupId: this.group.id}));
                            }
                        });
                    } else { // Delete single
                        promisesToResolve.push(groupInviteUser.$delete({groupId: this.group.id}));
                    }

                    this.$q
                        .all(promisesToResolve)
                        .then(() => {
                            this.GroupInviteUserService.reload();
                        });
                }, angular.noop);
        };

        doLeaveGroup () {
            const self = this;
            self.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_user_leave_confirm.html',
                    data: {
                        group: self.group
                    }
                })
                .then(() => {
                    const groupMemberUser = new self.GroupMemberUser({id: self.sAuth.user.id});
                    groupMemberUser
                        .$delete({groupId: self.group.id})
                        .then(() => {
                            self.$state.go('my/groups', null, {reload: true});
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
                            this.$state.go('my/groups', null, {reload: true});
                        });
                }, angular.noop);
        };

        private checkIfInView (elemId) {
            const self = this;
            const elem = document.getElementById(elemId);
            const bounding = elem.getBoundingClientRect();

            if ((bounding.top + 100) > (window.scrollY + window.innerHeight)) {
                setTimeout(() => {
                    self.app.scrollToAnchor(elemId)
                }, 200);
            }
        };

        public canUpdate () {
            return this.group.permission && this.group.permission.level === this.GroupMemberUser.LEVELS.admin;
        };

        public canDelete () {
            return this.canUpdate();
        };

        public isPrivate  () {
            return this.group.visibility === this.Group.VISIBILITY.private;
        };
    }]
};

angular
    .module('citizenos')
    .component(myGroupsGroup.selector, myGroupsGroup);

