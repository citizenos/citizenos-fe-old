'use strict';
import * as angular from 'angular';

let publicGroup = {
    selector: 'publicGroup',
    templateUrl: '/views/public_group.html',
    bindings: {},
    controller: ['$state', '$stateParams', '$log', 'sAuth', 'sGroup', 'Group', 'PublicGroup', 'GroupMemberUser', 'ngDialog', 'AppService', class PublicGroupController {
        private $state;
        private $stateParams;
        private $log;
        private sAuth;
        private sGroup;
        private Group;
        public PublicGroup;
        public GroupMemberUser;
        private ngDialog;
        public app;
        public group;
        private ITEMS_COUNT_PER_PAGE = 10;
        public topics = {
            rows: [],
            count: 0,
            order: null,
            totalPages: 0,
            page: 0
        };

        public users = {
            rows: [],
            count: 0,
            order: null,
            totalPages: 0,
            page: 0
        };

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
        constructor ($state, $stateParams, $log, sAuth, sGroup, Group, PublicGroup, GroupMemberUser, ngDialog, AppService) {
            this.sAuth = sAuth;
            this.sGroup = sGroup;
            this.Group = Group;
            this.PublicGroup = PublicGroup;
            this.GroupMemberUser = GroupMemberUser
            this.ngDialog = ngDialog;
            this.app = AppService;
            this.$state = $state;
            this.$stateParams = $stateParams;
            if ($stateParams.groupId) {
                PublicGroup
                .get($stateParams.groupId)
                .then((group) => {
                    this.group = group;
                    this.loadMemberTopicsList();
                    this.loadMemberUsersList();

                    this.app.tabSelected = $stateParams.tab || 'topics';
                });
            }
        }

        showSettings (tab?) {
            this.$state.go('public/groups/view/settings', {groupId: this.group.id, tab: tab});
        }

        loadMemberTopicsList (offset?, limit?, order?, sortOrder?) {
            const self = this;
            const params = {
                limit: limit || this.ITEMS_COUNT_PER_PAGE,
                offset: offset || 0
            };
            if (this.topicList.searchFilter) {
                params['search'] = this.topicList.searchFilter.trim();
            }
            if (order) {
                params['order'] = order;
            }
            const statuses = ['inProgress', 'voting', 'followUp', 'closed'];

            if (statuses.indexOf(order) > -1) {
                params['statuses'] = order;
            }

            return this.sGroup
                .publicTopicsList(this.group.id, params)
                .then((res) => {
                    const data = res.data.data;
                    self.topics.rows = data.rows;
                    self.topics.count = data.rows.length;
                    self.topics.order = order;

                    if (data.rows.length) {
                        self.topics.count = data.countTotal;
                    }

                    self.topics.totalPages = Math.ceil(self.topics.count / limit);
                    self.topics.page = Math.ceil((offset + limit) / limit);

                    return data.rows;
                });
        };

        loadMemberTopicsPage (page) {
            const offset = (page - 1) * this.ITEMS_COUNT_PER_PAGE;
            this.loadMemberTopicsList(offset, this.ITEMS_COUNT_PER_PAGE, this.topics?.order || null);
        };

        loadMemberUsersList (offset?, limit?) {
            const self = this;
            const params = {
                limit: limit || this.ITEMS_COUNT_PER_PAGE,
                offset: offset || 0
            };

            if (this.userList.searchFilter) {
                params['search'] = this.userList.searchFilter.trim();
            }

            return this.sGroup
                .publicMembersList(this.group.id, params)
                .then((res) => {
                    const data = res.data.data;
                    self.users.rows = data.rows;
                    self.users.count = data.rows.length;

                    if (data.rows.length) {
                        self.users.count = data.countTotal;
                    }

                    self.users.totalPages = Math.ceil(self.users.count / limit);
                    self.users.page = Math.ceil((offset + limit) / limit);

                    return data;
                });
        };

        loadMemberUsersPage (page) {
            const offset = (page - 1) * this.ITEMS_COUNT_PER_PAGE;
            this.loadMemberUsersList(offset, this.ITEMS_COUNT_PER_PAGE);
        };

        leaveGroup () {
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
                            $state.reload(true);
                        });
                });
        };

        deleteGroup () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/group_delete_confirm.html'
                })
                .then(() => {
                    this.Group.delete(this.group)
                        .then(() => {
                            this.$state.reload('public/groups', null, {reload: true});
                        });
                }, angular.noop);
        };

        sortMemberTopics (property) {
            let order = 'ASC';

            if (property === this.topicList.searchOrderBy.property && this.topicList.searchOrderBy.sortOrder === 'ASC') {
                order = 'DESC';
            }
            this.topicList.searchOrderBy.sortOrder = order;
            this.loadMemberTopicsList(0, this.ITEMS_COUNT_PER_PAGE, property, order);
        };

        joinGroup () {
            this.ngDialog.openConfirm({
                template: '/views/modals/group_join_confirm.html',
                closeByEscape: false
            })
            .then(() => {
                this.Group
                    .join(this.group.join.token)
                    .then((res) => {
                        if (res.id) {
                            this.$state.reload(true);
                        }
                    }, (res) => {
                        this.$log.error('Failed to join Topic', res);
                    }
                );
            });
        }

        canUpdate () {
            return this.group?.userLevel === this.GroupMemberUser.LEVELS.admin;
        }
    }]
}

angular
    .module('citizenos')
    .component(publicGroup.selector, publicGroup);
