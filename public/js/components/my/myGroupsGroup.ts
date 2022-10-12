import * as angular from 'angular';
import {orderBy, sortedUniqBy} from 'lodash';

let myGroupsGroup = {
    selector: 'myGroupsGroup',
    templateUrl: '/views/components/my_groups_groupId.html',
    controller: ['$state', '$stateParams', '$log', '$q', 'ngDialog', 'sAuth', 'Group', 'GroupService', 'GroupMemberUser', 'GroupMemberTopic', 'GroupInviteUser', 'AppService', class MyGroupsGroupController {
        public app;
        public group;
        private $q;
        private $log;
        private $state;
        private $stateParams;
        private Group;
        public GroupMemberUser;
        public GroupMemberTopic;
        public GroupInviteUser;
        private sAuth;
        private ngDialog;

        private ITEMS_COUNT_PER_PAGE = 10;
        public userList = {
            isVisible: false,
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name',
                sortOrder: 'ASC'
            }
        };
        public topicList = {
            isVisible: false,
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'title',
                sortOrder: 'ASC'
            }
        };
        public generalInfo = {
            isVisible: true
        };
        constructor ($state, $stateParams, $log, $q, ngDialog, sAuth, Group, GroupService, GroupMemberUser, GroupMemberTopic, GroupInviteUser, AppService) {
            $log.debug('MyTopicsTopicController');
            this.$q = $q;
            this.$log = $log;
            this.$state = $state;
            this.$stateParams = $stateParams;
            this.Group = Group;
            this.GroupMemberUser = GroupMemberUser
            this.GroupMemberTopic = GroupMemberTopic;
            this.GroupInviteUser = GroupInviteUser;
            this.sAuth = sAuth;
            this.ngDialog = ngDialog;
            this.app = AppService;
            this.group = GroupService.groups.find((item) => { if (item.id === $stateParams.groupId)return item});
            if (!this.group) {
                return $state.go('my/groups', {}, {reload:true});
            }
            if (sAuth.user.loggedIn && this.group?.id) {
                this.loadMemberTopicsList();
                this.loadMemberUsersList();
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

        loadMemberTopicsList (offset?, limit?, order?) {
            const self = this;
            order = order || '';
            if (!limit) {
                limit = this.ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }

            let search = null;
            if (this.topicList.searchFilter) {
                search = this.topicList.searchFilter.trim();
            }

            const statuses = ['inProgress', 'voting', 'followUp', 'closed'];
            const searchParams = {
                groupId: this.group.id,
                limit: limit,
                search: search,
                offset: offset,
                statuses: null,
                order: null,
                sortOrder: null
            };
            if (statuses.indexOf(order) > -1) {
                searchParams.statuses = order;
            }
            const param = order.split('.')[0];
            const sortOrder = order.split('.')[1];
            const orderParams = ['status', 'pinned', 'lastActivity'];
            if (orderParams.indexOf(param) > -1) {
                searchParams.order = param;
                if (sortOrder === 'descending') {
                    searchParams.sortOrder = 'desc';
                }
            }

            return this.GroupMemberTopic
                .query(searchParams).$promise
                .then((topics) => {
                    self.group.members.topics.rows = topics;
                    self.group.members.topics.count = topics.length;
                    self.group.members.topics.order = order;

                    if (topics.length) {
                        self.group.members.topics.count = topics[0].countTotal;
                    }

                    self.group.members.topics.totalPages = Math.ceil(self.group.members.topics.count / limit);
                    self.group.members.topics.page = Math.ceil((offset + limit) / limit);

                    return topics;
                });
        };

        loadMemberTopicsPage (page) {
            const offset = (page - 1) * this.ITEMS_COUNT_PER_PAGE;
            this.loadMemberTopicsList(offset, this.ITEMS_COUNT_PER_PAGE, this.group.members?.topics?.order || null);
        };

        loadMemberUsersList (offset?, limit?) {
            const self = this;
            if (!limit) {
                limit = this.ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }

            let search = null;
            if (this.userList.searchFilter) {
                search = this.userList.searchFilter.trim();
            }

            return this.GroupMemberUser
                .query({
                    groupId: this.group.id,
                    limit: limit,
                    search: search,
                    offset: offset
                }).$promise
                .then((users) => {
                    self.group.members.users.rows = users;
                    self.group.members.users.count = users.length;

                    if (users.length) {
                        self.group.members.users.count = users[0].countTotal;
                    }

                    self.group.members.users.totalPages = Math.ceil(self.group.members.users.count / limit);
                    self.group.members.users.page = Math.ceil((offset + limit) / limit);

                    return users;
                });
        };

        loadInviteUserList (offset?, limit?) {
            const self = this;
            if (!limit) {
                limit = this.ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }

            let search = null;
            if (this.userList.searchFilter) {
                search = this.userList.searchFilter.trim();
            }

            return this.GroupInviteUser
                .query({
                    groupId: this.group.id,
                    offset: offset,
                    search: search,
                    limit: limit
                }).$promise
                .then((invites) => {
                    self.group.invites = {
                        users: {
                            rows: [],
                            count: 0
                        }
                    };

                    // Need to show only 1 line per User with maximum level
                    // NOTE: Objects don't actually guarantee order if keys parsed to number, it was better if TopicMemberUser.LEVELS was a Map
                    const levelOrder = Object.keys(self.GroupMemberUser.LEVELS);
                    const inviteListOrderedByLevel = orderBy(invites, (invite) => {
                        return levelOrder.indexOf(invite.level);
                    }, ['desc']);
                    self.group.invites.users._rows = invites; // Store the original result from server to implement DELETE ALL, need to know the ID-s of the invites to delete

                    self.group.invites.users.rows = sortedUniqBy(inviteListOrderedByLevel, 'user.id');
                    self.group.invites.users.count = invites.length;
                    if (invites.length) {
                        self.group.invites.users.count = invites[0].countTotal;
                    }

                    self.group.invites.users.totalPages = Math.ceil(self.group.invites.users.count / limit);
                    self.group.invites.users.page = Math.ceil((offset + limit) / limit);

                    return invites;
                });
        };

        loadMemberUsersPage (page) {
            const offset = (page - 1) * this.ITEMS_COUNT_PER_PAGE;
            this.loadMemberUsersList(offset, this.ITEMS_COUNT_PER_PAGE);
        };

        loadUsersInvitedPage (page) {
            const offset = (page - 1) * this.ITEMS_COUNT_PER_PAGE;
            this.loadInviteUserList(offset, this.ITEMS_COUNT_PER_PAGE);
        };

        doShowMemberTopicList () {
            const self = this;
            this.loadMemberTopicsList()
                .then(() => {
                    if (self.group.members.topics.count) {
                        self.topicList.isVisible = true;
                    }
                });
        };

        doToggleMemberTopicList () {
            const self = this;
            const doShowList = this.topicList.isVisible;
            if (this.topicList.isVisible) {
                this.topicList.isVisible = !this.topicList.isVisible;
            }

            this.toggleTabParam('topic_list')
                .then(() => {
                    if (!doShowList) {
                        self.doShowMemberTopicList();
                        self.checkIfInView('topic_list');
                    }
                });
        };

        doOrderTopicList (order) {
            const self = this;
            const param = order.split('.')[0];
            const sortOrder = order.split('.')[1];
            const statuses = ['inProgress', 'voting', 'followUp', 'closed'];
            this.loadMemberTopicsList(0, this.ITEMS_COUNT_PER_PAGE, order)
                .then(() => {
                    if (param === 'status') {
                        const mapped = self.group.members.topics.rows.map((v, i) => {
                            return { i: i, value: statuses.indexOf(v.status) };
                        })

                        mapped.sort((a, b) => {
                            if (a.value > b.value) {
                                if (sortOrder === 'descending') return -1;

                                return 1;
                            }
                            if (a.value < b.value) {
                                if (sortOrder === 'descending') return 1;

                                return -1;
                            }
                            return 0;
                        });
                        const result = mapped.map((v) => { return self.group.members.topics.rows[v.i]});
                        self.group.members.topics.rows = result;
                    } else if (param === 'pinned') {
                        var mapped = self.group.members.topics.rows.map((v, i) => {
                            return { i: i, value: (v.pinned === true)? 1: -1 };
                        })
                        mapped.sort((a, b) => {
                            if (a.value < b.value) {
                                if (sortOrder === 'descending') return -1;

                                return 1;
                            }
                            if (a.value > b.value) {
                                if (sortOrder === 'descending') return 1;

                                return -1;
                            }
                            return 0;
                        });
                        const result = mapped.map((v) => { return self.group.members.topics.rows[v.i]});
                        self.group.members.topics.rows  = result
                    } else if (param === 'activity') {
                        const now = (new Date()).getTime();
                        const mapped = self.group.members.topics.rows.map((v, i) => {
                            return { i: i, value: now - (new Date(v.lastActivity)).getTime() };
                        });

                        mapped.sort((a, b) => {
                            if (a.value > b.value) {
                                if (sortOrder === 'descending') return -1;

                                return 1;
                            }
                            if (a.value < b.value) {
                                if (sortOrder === 'descending') return 1;

                                return -1;
                            }
                            return 0;
                        });
                        const result = mapped.map((v) => { return self.group.members.topics.rows[v.i]});
                        self.group.members.topics.rows  = result;
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
            const self = this;
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_member_topic_delete_confirm.html',
                    data: {
                        topic: groupMemberTopic
                    }
                })
                .then(() => {
                    groupMemberTopic
                        .$delete({groupId: self.group.id})
                        .then(() => {
                            self.loadMemberTopicsList();
                        });
                }, angular.noop);
        };

        doShowMemberUserList () {
            const self = this;
            return this.$q
                .all([self.loadMemberUsersList(), self.loadInviteUserList()])
                .then(() => {
                    self.userList.isVisible = true;
                });
        };

        doToggleMemberUserList () {
            const self = this;
            const doShowList = self.userList.isVisible;
            if (self.userList.isVisible) {
                self.userList.isVisible = !self.userList.isVisible;
            }
            self.toggleTabParam('user_list')
                .then(() => {
                    if (!doShowList) {
                        self.doShowMemberUserList()
                            .then(() => {
                                self.checkIfInView('user_list');
                            });
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
                            .then(self.loadMemberUsersList);
                    }, angular.noop);
            }
        };

        doDeleteInviteUser (groupInviteUser) {
            const self = this;
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
                        self.group.invites.users._rows.forEach((invite) => {
                            if (invite.user.id === groupInviteUser.user.id) {
                                promisesToResolve.push(invite.$delete({groupId: self.group.id}));
                            }
                        });
                    } else { // Delete single
                        promisesToResolve.push(groupInviteUser.$delete({groupId: self.group.id}));
                    }

                    self.$q
                        .all(promisesToResolve)
                        .then(self.loadInviteUserList());
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

