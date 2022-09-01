import * as angular from 'angular';
import * as _ from 'lodash';

let myTopicsTopic = {
    selector: 'myTopicsTopic',
    templateUrl: '/views/components/my_topics_topicId.html',
    controller: ['$log', '$rootScope', '$state', '$stateParams', '$anchorScroll', '$q', 'sAuth', 'Topic', 'TopicMemberUser', 'TopicMemberGroup', 'TopicInviteUser', 'AppService', class MyTopicsTopicController {
        public app;
        public topic;
        private $state;
        private $anchorScroll;
        private $stateParams;
        private $q;
        private Topic;
        private TopicMemberUser;
        private TopicMemberGroup;
        private TopicInviteUser;
        private sAuth;
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
        public groupList = {
            isVisible: false,
            isSearchVisible: false,
            searchFilter: '',
            searchOrderBy: {
                property: 'name',
                sortOrder: 'ASC'
            }
        };
        public generalInfo = {
            isVisible: true
        };
        constructor ($log, $rootScope, $state, $stateParams, $anchorScroll, $q, sAuth, Topic, TopicMemberUser, TopicMemberGroup, TopicInviteUser, AppService) {
            $log.debug('MyTopicsTopicController');
            console.log($rootScope);
            this.$state = $state;
            this.$stateParams = $stateParams;
            this.$anchorScroll = $anchorScroll;
            this.$q = $q;
            this.Topic = Topic;
            this.TopicMemberUser = TopicMemberUser;
            this.TopicMemberGroup = TopicMemberGroup;
            this.TopicInviteUser = TopicInviteUser;
            this.sAuth = sAuth;
            this.app = AppService;
            const self = this;
            this.loadTopic()
                .then(() => {
                    if ($stateParams.openTabs) {
                        this.userList.isVisible = false;
                        this.groupList.isVisible = false;
                        const stateParams = Object.assign({}, $stateParams);
                        if (!Array.isArray($stateParams.openTabs)) {
                            stateParams.openTabs = [$stateParams.openTabs];
                        }
                        stateParams.openTabs.forEach((tab) => {
                            switch (tab) {
                                case 'user_list':
                                    self.doShowMemberUserList();
                                    break;
                                case 'group_list':
                                    self.doShowMemberGroupList();
                                    break;
                                case 'activity_feed':
                                    self.app.activityFeed = true;
                                    //self.loadActivities(0);
                                case 'vote_results':
                                    //self.voteResults.isVisible = true;
                                    break;
                            }
                        });
                    }

                    if ($stateParams.notificationSettings) {
                        self.app.doShowTopicNotificationSettings(self.topic.id);
                    }
                });
        };

        loadTopic () {
            const self = this;
            const urlParams = {
                topicId: this.$stateParams.topicId,
                include: 'vote',
                prefix: null,
                userId: null
            };
            console.log(this.sAuth);
            if (this.sAuth.user.loggedIn) {
                urlParams.prefix = 'users';
                urlParams.userId = 'self';
            }
            return this.Topic.get(urlParams).$promise
                .then((topic) => {
                    self.$anchorScroll('content_root'); // TODO: Remove when the 2 columns become separate scroll areas
                    self.topic = topic;
                });
        }


        loadTopicMemberUserList (offset?, limit?, order?, sortOrder?) {
            const self = this;
            if (!limit) {
                limit = this.ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }

            let search = null;
            if (this.userList.searchFilter) {
                search = self.userList.searchFilter.trim();
            }

            if (order) {
                self.userList.searchOrderBy.property = order;
            }
            if (sortOrder) {
                self.userList.searchOrderBy.sortOrder = sortOrder;
            }

            return self.TopicMemberUser
                .query({
                    topicId: self.topic.id,
                    offset: offset,
                    search: search,
                    order: self.userList.searchOrderBy.property,
                    sortOrder: self.userList.searchOrderBy.sortOrder,
                    limit: limit
                }).$promise
                .then((users) => {
                    self.topic.members.users.rows = users;
                    self.topic.members.users.count = users.length;
                    if (users.length) {
                        self.topic.members.users.count = users[0].countTotal;
                    }

                    self.topic.members.users.totalPages = Math.ceil(self.topic.members.users.count / limit);
                    self.topic.members.users.page = Math.ceil((offset + limit) / limit);
                    return users;
                });
        };

        loadMemberUsersPage (page) {
            const offset = (page - 1) * this.ITEMS_COUNT_PER_PAGE;
            this.loadTopicMemberUserList(offset, this.ITEMS_COUNT_PER_PAGE);
        };

        doShowMemberUserList () {
            const self = this;
            return self.$q
                .all([self.loadTopicMemberUserList(), self.loadTopicInviteUserList()])
                .then(() => {
                    self.userList.isVisible = true;
                });
        };

        toggleTabParam (tabName) {
            const self = this;
            return new Promise<void>((resolve) => {
                let tabIndex;
                const stateParams = Object.assign({}, self.$stateParams);
                if (self.$stateParams.openTabs) {
                    tabIndex = self.$stateParams.openTabs.indexOf(tabName);
                }
                if (tabIndex > -1) {
                    if (!Array.isArray(self.$stateParams.openTabs)) {
                        stateParams.openTabs = null;
                    } else if (self.$stateParams.openTabs) {
                        stateParams.openTabs.splice(tabIndex, 1);
                    }
                } else {
                    if (!self.$stateParams.openTabs) {
                        stateParams.openTabs = [];
                    }
                    if (!Array.isArray(self.$stateParams.openTabs) && self.$stateParams.openTabs) {
                        stateParams.openTabs = [self.$stateParams.openTabs];
                    }
                    stateParams.openTabs.push(tabName);
                }
                self.$state.transitionTo(self.$state.current.name, stateParams, {
                    notify: false,
                    reload: false,
                    inherit: true,
                    replace: true
                }).then(() => {
                    return resolve();
                });
            });

        };

        doToggleMemberUserList () {
            const self = this;
            let doShowList = this.userList.isVisible;
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

        loadTopicInviteUserList (offset?, limit?, order?, sortOrder?) {
            const self = this;
            if (!limit) {
                limit = self.ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }

            let search = null;
            if (self.userList.searchFilter) {
                search = self.userList.searchFilter.trim();
            }

            if (order) {
                self.userList.searchOrderBy.property = order;
            }
            if (sortOrder) {
                self.userList.searchOrderBy.sortOrder = sortOrder;
            }

            return self.TopicInviteUser
                .query({
                    topicId: self.topic.id,
                    offset: offset,
                    search: search,
                    order: self.userList.searchOrderBy.property,
                    sortOrder: self.userList.searchOrderBy.sortOrder,
                    limit: limit
                }).$promise
                .then((invites) => {
                    self.topic.invites = {
                        users: {
                            rows: [],
                            count: 0
                        }
                    };

                    // Need to show only 1 line per User with maximum level
                    // NOTE: Objects don't actually guarantee order if keys parsed to number, it was better if TopicMemberUser.LEVELS was a Map
                    let levelOrder = Object.keys(self.TopicMemberUser.LEVELS);
                    const inviteListOrderedByLevel = _.orderBy(invites, function (invite) {
                        return levelOrder.indexOf(invite.level);
                    }, ['desc']);
                    self.topic.invites.users._rows = invites; // Store the original result from server to implement DELETE ALL, need to know the ID-s of the invites to delete

                    self.topic.invites.users.rows = _.sortedUniqBy(inviteListOrderedByLevel, 'user.id');
                    self.topic.invites.users.count = invites.length;
                    if (invites.length) {
                        self.topic.invites.users.count = invites[0].countTotal;
                    }

                    self.topic.invites.users.totalPages = Math.ceil(self.topic.invites.users.count / limit);
                    self.topic.invites.users.page = Math.ceil((offset + limit) / limit);

                    return invites;
                });
        }

        loadUsersInvitedPage (page) {
            const offset = (page - 1) * this.ITEMS_COUNT_PER_PAGE;
            this.loadTopicInviteUserList(offset, this.ITEMS_COUNT_PER_PAGE);
        }

        sortMemberUsers (property) {
            let order = 'ASC';
            if (property === this.userList.searchOrderBy.property && this.userList.searchOrderBy.sortOrder === 'ASC') {
                order = 'DESC'
            }
            this.loadTopicMemberUserList(0, this.ITEMS_COUNT_PER_PAGE, property, order);
            this.loadTopicInviteUserList(0, this.ITEMS_COUNT_PER_PAGE, property, order);
        }

        viewMemberUsers () {
            const self = this;
            if (!this.userList.isVisible) {
                this.doShowMemberUserList()
                    .then(() => {
                        self.checkIfInView('user_list');
                    });
            } else {
                self.checkIfInView('user_list');
            }
        };


        doToggleMemberGroupList () {
            const self = this;
            const doShowList = self.groupList.isVisible;
            if (self.groupList.isVisible) {
                self.groupList.isVisible = !self.groupList.isVisible;
            }
            self.toggleTabParam('group_list')
                .then(() => {
                    if (!doShowList) {
                        self.doShowMemberGroupList();
                        self.checkIfInView('group_list');
                    }
                });
        };

        doShowMemberGroupList () {
            const self = this;
            self.loadTopicMemberGroupList()
                .then(() => {
                    if (self.topic.members.groups.count) {
                        self.groupList.isVisible = true;
                    }
                });
        };

        viewMemberGroups () {
            const self = this;
            if (!this.groupList.isVisible) {
                this.doShowMemberGroupList();
                this.checkIfInView('group_list')
            } else {
                this.checkIfInView('group_list');
            }
        };

        loadTopicMemberGroupList (offset?, limit?, order?, sortOrder?) {
            const self = this;
            if (!limit) {
                limit = this.ITEMS_COUNT_PER_PAGE;
            }
            if (!offset) {
                offset = 0;
            }
            var search = null;
            if (this.groupList.searchFilter) {
                search = this.groupList.searchFilter.trim();
            }

            if (order) {
                this.groupList.searchOrderBy.property = order;
            }
            if (sortOrder) {
                this.groupList.searchOrderBy.sortOrder = sortOrder;
            }

            return this.TopicMemberGroup
                .query({
                    topicId: this.topic.id,
                    offset: offset,
                    search: search,
                    order: this.groupList.searchOrderBy.property,
                    sortOrder: this.groupList.searchOrderBy.sortOrder,
                    limit: limit
                }).$promise
                .then((groups) => {
                    self.topic.members.groups.rows = groups;
                    self.topic.members.groups.count = groups.length;
                    if (groups.length) {
                        self.topic.members.groups.count = groups[0].countTotal;
                    }

                    self.topic.members.groups.totalPages = Math.ceil(self.topic.members.groups.count / limit);
                    self.topic.members.groups.page = Math.ceil((offset + limit) / limit);
                    return groups;
                });
        };

        loadMemberGroupPage (page) {
            const offset = (page - 1) * this.ITEMS_COUNT_PER_PAGE;
            this.loadTopicMemberGroupList(offset, this.ITEMS_COUNT_PER_PAGE);
        };

        sortMemberGroups (property) {
            let order = 'ASC';

            if (property === this.groupList.searchOrderBy.property && this.groupList.searchOrderBy.sortOrder === 'ASC') {
                order = 'DESC'
            }

            this.loadTopicMemberGroupList(0, this.ITEMS_COUNT_PER_PAGE, property, order);
        };

        checkIfInView (elemId) {
            const self = this;
            const elem = document.getElementById(elemId);
            const bounding = elem.getBoundingClientRect();

            if ((bounding.top + 100) > (window.scrollY + window.innerHeight)) {
                setTimeout(() => {
                    self.app.scrollToAnchor(elemId)
                }, 200);
            }
        };
    }]
};

angular
    .module('citizenos')
    .component(myTopicsTopic.selector, myTopicsTopic);

