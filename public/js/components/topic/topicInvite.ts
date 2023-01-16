'use strict';
import * as angular from 'angular';
import {find, filter, sortedUniq} from 'lodash';
import * as validator from 'validator';

let topicInvite = {
    selector: 'topicInvite',
    templateUrl: '/views/components/topic/topic_invite.html',
    bindings: {},
    controller: ['$stateParams', '$log', '$timeout', 'ngDialog', 'sSearch', 'sLocation', 'sNotification', 'sAuth', 'TopicInviteUser', 'TopicInviteUserService', 'TopicMemberUser', 'TopicMemberGroup', 'TopicJoin', 'Topic', 'AppService', class TopicInviteController {
        private EMAIL_SEPARATOR_REGEXP = /[;,\s]/ig;
        public memberGroups = ['groups', 'users'];
        public inviteMessageMaxLength = 1000;
        public topic;
        public topicList = {
            searchFilter: '',
            searchOrderBy: {
                property: 'title'
            }
        };
        public form = {
            topic: null,
            description: null,
            join: {
                level: null,
                token: null
            },
            joinUrl: null,
            inviteMessage: null
        };

        public members = [];
        public invalid = [];
        public searchString = null;
        public searchResults = {users: [], groups: [], emails: [], combined: []};

        public errors = null;
        public groupLevel;
        public membersPage = 1;
        private maxUsers = 50;
        private itemsPerPage = 10;
        public tabSelected = 'invite';

        constructor ($stateParams, private $log, private $timeout, private ngDialog, private sSearch, private sLocation, private sNotification, private sAuth, private TopicInviteUser, private TopicInviteUserService, private TopicMemberUser, private TopicMemberGroup, private TopicJoin, private Topic, private app) {
            $log.debug('TopicInviteController', $stateParams);
            this.tabSelected = $stateParams.tab || 'invite';

            this.sNotification = sNotification;
            this.init();
        }

        init () {
            this.topic = this.app.topic;
            this.form.topic = angular.copy(this.topic);
            this.form.description = angular.element(this.topic.description).text().replace(this.topic.title, '');
            this.form.join = this.form.topic.join;
            if (!this.form.join.level) {
                this.form.join.level = this.Topic.LEVELS.read;
            }
            this.generateJoinUrl();
            this.groupLevel = this.Topic.LEVELS.read;
        };

        search (str) {
            this.searchString = str; // TODO: Hackish - Typeahead has term="searchString" but somehow the 2 way binding does not work there, investigate when time
            if (str && str.length >= 2) {
                if (str.match(this.EMAIL_SEPARATOR_REGEXP)) {
                    this.searchResults = angular.merge({}, {users: [], groups: [], emails: [], combined: [str]});
                } else {
                    const include = ['my.group'];
                    this.sSearch
                        .search(str, {include: include})
                        .then((groupresponse) => {
                            this.sSearch
                                .searchUsers(str)
                                .then((userrespons) => {
                                    this.searchResults = angular.merge({}, {users: [], groups: [], emails: [], combined: []});
                                    if (userrespons.data.data.results.public.users.rows.length) {
                                        userrespons.data.data.results.public.users.rows.forEach((user) => {
                                            this.searchResults.users.push(user);
                                        });
                                    } else if (validator.isEmail(str)) {
                                        this.searchResults.emails.push(this.searchString);
                                    }
                                    if (groupresponse.data.data.results.my.groups.rows.length) {
                                        groupresponse.data.data.results.my.groups.rows.forEach((group) => {
                                            this.searchResults.groups.push(group);
                                        });
                                    }
                                    this.searchResults.combined = this.searchResults.users.concat(this.searchResults.groups).concat(this.searchResults.emails);
                                });
                        });
                }
            } else {
                this.searchResults = angular.merge({}, {users: [], groups: [], emails: [], combined: []});
            }
        };

        itemsExist (type) {
            let exists = false;
            let i = (this.membersPage * this.itemsPerPage) - this.itemsPerPage;
            for (i; i < this.members.length && i < (this.membersPage * this.itemsPerPage); i++) {
                if (type === 'groups') {
                    if (this.members[i].groupId) {
                        exists = true;
                        break;
                    }
                } else if (!this.members[i].groupId) {
                    exists = true;
                    break;
                }

            }

            return exists;
        };

        isInGroup (item, group) {
            if (group === 'groups') {
                return !!item.groupId;
            } else {
                return !item.groupId;
            }
        };

        updateGroupLevel (level) {
            this.groupLevel = level;
            this.members.forEach((item) => {
                item.level = level;
            });
        };

        removeAllMembers () {
            this.members = [];
        };

        loadPage (pageNr) {
            this.membersPage = pageNr;
        };

        totalPages () {
            return Math.ceil(this.members.length / this.itemsPerPage);
        };

        isOnPage (index, page) {
            const endIndex = page * this.itemsPerPage;
            return (index >= (endIndex - this.itemsPerPage) && index < endIndex);
        };

        orderMembers () {
            const compare = (a, b) => {
                const property = 'name';
                return (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            };
            const groups = this.members.filter((member) => {
                return !!member.groupId;
            }).sort(compare);
            const users = this.members.filter((member) => {
                return !member.groupId;
            }).sort(compare);

            this.members = groups.concat(users);
        };

        addTopicMember (member) {
            if (this.members.length >= this.maxUsers) {
                this.sNotification.addError('MSG_ERROR_INVITE_MEMBER_COUNT_OVER_LIMIT');
                return;
            }
            if (!member || (typeof member === 'string' && (validator.isEmail(member) || member.match(this.EMAIL_SEPARATOR_REGEXP)))) {
                this.$log.debug('go to addTopicMemberUser');
                return this.addTopicMemberUser();
            }
            if (member.hasOwnProperty('company')) {
                return this.addTopicMemberUser(member);
            } else {
                return this.addTopicMemberGroup(member);
            }
        };

        addTopicMemberGroup (group) {
            this.searchString = null;
            this.searchResults = angular.merge({}, {users: [], groups: [], emails: [], combined: []});

            if (!group || !group.id || !group.name) {
                return false;
            }
            const member = find(this.members, (o) => {
                return o.id === group.id;
            });

            if (!member) {
                const memberClone = angular.copy(group);
                memberClone.groupId = group.id;
                memberClone.level = this.groupLevel;

                this.members.push(memberClone);
                this.orderMembers();
            }
        };

        addCorrectedEmail (email, key) {
            if (validator.isEmail(email.trim())) {
                if (!find(this.members, ['userId', email])) {
                    this.addTopicMemberUser({
                        id: email,
                        userId: email,
                        name: email,
                        level: this.groupLevel
                    });
                }
                this.invalid.splice(key, 1);
            }
        };

        removeInvalidEmail (key) {
            this.invalid.splice(key, 1);
        };

        clearSearchResults () {
            this.searchResults = angular.merge({}, {users: [], groups: [], emails: [], combined: []});
        }
        addTopicMemberUser (member?) {
            if (member) {
                if (find(this.members, {userId: member.id})) {
                    // Ignore duplicates
                    this.searchString = null;
                    this.clearSearchResults();
                    return;
                } else {
                    const memberClone = angular.copy(member);
                    memberClone.userId = member.id;
                    memberClone.level = this.groupLevel;

                    this.members.push(memberClone);
                    this.orderMembers();
                    this.clearSearchResults();
                }
            } else {
                if (!this.searchString) return;

                // Assume e-mail was entered.
                const emails = this.searchString.replace(this.EMAIL_SEPARATOR_REGEXP, ',').split(',');

                const filtered = filter(emails, (email) => {
                    return validator.isEmail(email.trim())
                });

                const invalid = filter(emails, (email) => {
                    return !validator.isEmail(email.trim()) && email.trim().length > 0;
                });

                if (!filtered.length && !invalid.length) {
                    return this.$log.debug('Ignoring member, as it does not look like e-mail', this.searchString);
                }

                sortedUniq(filtered.sort()).forEach((email) => {
                    email = email.trim();
                    if (this.members.length >= this.maxUsers) {
                        return this.sNotification.addError('MSG_ERROR_INVITE_MEMBER_COUNT_OVER_LIMIT');
                    }
                    if (!find(this.members, ['userId', email])) {
                        this.members.push({
                            userId: email,
                            name: email,
                            level: this.groupLevel
                        });
                        this.orderMembers();
                    }
                });

                if (invalid && invalid.length) {
                    invalid.forEach((item) => {
                        if (this.invalid.indexOf(item) === -1) {
                            this.invalid.push(item);
                        }
                    });
                }

                this.clearSearchResults();
                this.searchString = null;
            }
        };

        removeTopicMemberUser (member) {
            this.members.splice(this.members.indexOf(member), 1);
        };

        updateTopicMemberUserLevel (member, level) {
            this.members[this.members.indexOf(member)].level = level;
        };

        removeTopicMemberGroup (group) {
            this.members.splice(this.members.indexOf(group), 1);
        };

        updateTopicMemberGroupLevel (group, level) {
            this.members[this.members.indexOf(group)].level = level;
        };

        doSaveTopic () {
            this.errors = null;

            if (this.form.topic.endsAt && this.topic.endsAt === this.form.topic.endsAt) { //Remove endsAt field so that topics with endsAt value set could be updated if endsAt is not changed
                delete this.form.topic.endsAt;
            }

            const savePromises = [];
            // Users
            const topicMemberUsersToSave = [];
            this.members.forEach((member) => {
                if (member.groupId) {
                    member = {
                        groupId: member.groupId,
                        topicId: this.topic.id,
                        level: member.level
                    };

                    savePromises.push(this.TopicMemberGroup.save(member));
                } else {
                    topicMemberUsersToSave.push({
                        userId: member.userId || member.id,
                        inviteMessage: this.form.inviteMessage,
                        level: member.level
                    })
                }
            });

            if (topicMemberUsersToSave.length) {
                savePromises.push(
                    this.TopicInviteUser.save(this.topic.id, topicMemberUsersToSave)
                );
            }

            Promise.all(savePromises).then((data) => {
                this.$timeout(() => { // Avoid $digest already in progress
                    this.TopicInviteUserService.reload()
                    const dialogs = this.ngDialog.getOpenDialogs();
                    this.ngDialog.close(dialogs[0], '$closeButton');
                });
            });
        };

        generateTokenJoin () {
            this.ngDialog
                .openConfirm({
                    template: '/views/modals/topic_join_link_generate_confirm.html',
                })
                .then(() => {
                    this.TopicJoin
                        .save({
                            topicId: this.topic.id,
                            userId: this.sAuth.user.id,
                            level: this.form.join.level
                        })
                        .then((res) => {
                            this.topic.join = res;
                            this.form.join.token = res.token;
                            this.form.join.level = res.level;
                            this.generateJoinUrl();
                        });
                }, angular.noop);
        }

        doUpdateJoinToken (level) {
            const topicJoin = {
                topicId: this.topic.id,
                userId: this.sAuth.user.id,
                level: level,
                token: this.form.join.token
            };

            this.TopicJoin
                .update(topicJoin)
                .then(() => {
                    this.form.join.level = level;
                });
        }

        copyInviteLink () {
            const urlInputElement = document.getElementById('url_invite_topic_input') as HTMLInputElement || null;
            urlInputElement.focus();
            urlInputElement.select();
            urlInputElement.setSelectionRange(0, 99999);
            document.execCommand('copy');
        }

        generateJoinUrl () {
            if (this.topic.join.token && this.Topic.canUpdate(this.topic)) {
                this.form.joinUrl = this.sLocation.getAbsoluteUrl('/topics/join/' + this.topic.join.token);
            }
        }

        getExpiresAt () {
            const time = new Date();
            time.setDate(time.getDate() + 14);
            return time;
        }
    }]
}
angular
    .module('citizenos')
    .component(topicInvite.selector, topicInvite);
