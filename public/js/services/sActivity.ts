'use strict';
import * as angular from 'angular';
import {sortBy, find, cloneDeep} from 'lodash';
import * as jsonpatch from 'fast-json-patch';

export class Activity {
    private unread = 0;
    constructor (private $http, private $state, private $stateParams, private $window, private $q, private $log, private $translate, private sAuth, private sLocation, private ngDialog) {}
    private defaultSuccess = (response) => {
        return response.data;
    };

    private defaultError = (response) => {
        return this.$q.reject(response);
    };

    private getActivityObject = (activity) => {
        let dataobject = activity.data.object && activity.data.object.object ? activity.data.object.object : activity.data.object;
        if (Array.isArray(dataobject)) {
            dataobject = dataobject[0];
        }
        return dataobject;
    }
    private success = (data) => {
        const result = angular.fromJson(data).data;
        const parsedResult = [];
        result.data.forEach((activity, key) => {
            if (activity.data) {
                if (activity.data.type === 'Create' && !activity.data.target && activity.data.object && (activity.data.object['@type'] === 'Vote' || Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === 'VoteOption')) {
                    result.data.splice(key, 1);
                } else if (activity.data.type === 'Update' && Array.isArray(activity.data.result)) {
                    var i = 0;
                    var resultItems = [];
                    if (activity.data.origin['@type'] === 'Topic') {
                        activity.data.origin.description = null;
                    }
                    var resultObject = cloneDeep(activity.data.origin);
                    activity.data.resultObject = jsonpatch.applyPatch(resultObject, activity.data.result).newDocument;
                    activity.data.result.forEach((item) => {
                        var field = item.path.split('/')[1];
                        if (['deletedById', 'deletedByReportId', 'edits'].indexOf(field) > -1 ) {
                            item = null;
                        } else {
                            const change = find(resultItems, (resItem) => {
                                return resItem.path.indexOf(field) > -1;
                            });

                            if (!change) {
                                resultItems.push(item);
                            } else if (item.value) {
                                if (!Array.isArray(change.value)) {
                                    change.value = [change.value];
                                }
                                change.value.push(item.value);
                            }
                        }
                    });
                    activity.data.result = resultItems;
                    while (i < activity.data.result.length) {
                        var act = cloneDeep(activity);
                        var change = activity.data.result[i];
                        act.data.result = [change];
                        if (act.data.target) {
                            act.id = act.id + '_' + change.path; //this is to avoid weird grouping of update activities with multiple fields
                        }
                        act.id = act.id + '_' + change.path;
                        this.buildActivityString(act);
                        act = this.getActivityValues(act);
                        parsedResult.push(act);
                        i++;
                    }
                } else {
                    this.buildActivityString(activity);
                    activity = this.getActivityValues(activity);
                    parsedResult.push(activity)
                }
            } else {
                this.$log.error('Activity data missing');
            }
        });

        return this.activitiesToGroups(parsedResult);
    };

    private activitiesToGroups = (activities) => {
        const userActivityGroups = {};
        const activityGroups = {};
        const grouped = {};
        const returnActivities = [];

        const addToGroup = (key, value) => {
            if (!grouped[key]) {
                grouped[key] = [value];
            } else {
                grouped[key].push(value);
            }
        }
        for(let i=0; i < activities.length; i++) {
            const objectId = activities[i].data.object.id || activities[i].data.object.topicId || activities[i].data.object.groupId;

            if (activities[i].data.target) {
                const targetId = activities[i].data.target.id;
                addToGroup(activities[i].string + '_ACTIVITYGROUP:' + targetId, activities[i].id);
                addToGroup(activities[i].string + '_USERACTIVITYGROUP:' + targetId+ '_' + activities[i].data.actor.id, activities[i].id);
            }

            const groupKey = activities[i].string + '_' + objectId;
            const userGroupKey = groupKey + '_' + activities[i].data.actor.id;

            addToGroup(activities[i].string + '_ACTIVITYGROUP:' + objectId, activities[i].id);
            addToGroup(activities[i].string + '_USERACTIVITYGROUP:' + objectId+ '_' + activities[i].data.actor.id, activities[i].id);
            //Create group with id-s

            if (!activityGroups[groupKey]) {
                activityGroups[groupKey] = new Array(activities[i]);
            } else {
                activityGroups[groupKey].push(activities[i]);
            }

            //Create group with same actor
            if (!userActivityGroups[userGroupKey]) {
                userActivityGroups[userGroupKey] = new Array(activities[i]);
            } else {
                userActivityGroups[userGroupKey].push(activities[i]);
            }
        }

        // Filter out the final activities
        const final = {};
        activities.forEach((activity) => {
            let groupKey;
            Object.keys(grouped).forEach((key) => {
                if (grouped[key].length > 1 && grouped[key].indexOf(activity.id) > -1) {
                    if (key.indexOf('USERACTIVITYGROUP')) {
                        groupKey = key;
                    } else if (groupKey.indexOf('USERACTIVITYGROUP') === -1) {
                        groupKey = key;
                    }
                }
            });
            if (groupKey) {
                if (!final[groupKey]) {
                    final[groupKey] = [activity];
                } else {
                    final[groupKey].push(activity);
                    final[groupKey].sort((a, b) => {
                        if (!a || !b) return 0;
                        var keyA = new Date(a.updatedAt),
                          keyB = new Date(b.updatedAt);
                        // Compare the 2 dates
                        if (keyA < keyB) return 1;
                        if (keyA > keyB) return -1;
                        return 0;
                    });
                }
                sortBy(final[groupKey], ['updatedAt']).reverse();
            } else {
                final[activity.id] = [activity];
            }
        });

        Object.keys(final).forEach((key) => {
            returnActivities.push({referer: key, values: final[key]});
        });

        return sortBy(returnActivities, [(o) => { return o.values[0].updatedAt; }]).reverse();
    };

    buildActivityString = (activity) => {
        const keys = Object.keys(activity.data);
        const stringparts = ['ACTIVITY'];
        if (keys.indexOf('actor') > -1) {
            stringparts.push(activity.data.actor.type);
        }

        if (keys.indexOf('type') > -1) {
            stringparts.push(activity.data.type);
        }

        // TODO: Maybe should implement recursive checking of "object", "origin", "target"  right now hardcoded to 2 levels because of Invite/Accept - https://github.com/citizenos/citizenos-fe/issues/112
        if (keys.indexOf('object') > -1) {
            if (Array.isArray(activity.data.object)) {
                stringparts.push(activity.data.object[0]['@type']);
            } else if (activity.data.object['@type']) {
                stringparts.push(activity.data.object['@type']);
            } else {
                stringparts.push(activity.data.object.type);
            }

            if (activity.data.object.object) { // Originally created to support Accept activity - https://www.w3.org/TR/activitystreams-vocabulary/#dfn-accept
                stringparts.push(activity.data.object.object['@type']);
            }
        }

        if (keys.indexOf('origin') > -1) {
            if (keys.indexOf('object') > -1 && (Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === activity.data.origin['@type']
                || activity.data.object['@type'] === activity.data.origin['@type'])) {
            } else if (Array.isArray(activity.data.origin)) {
                stringparts.push(activity.data.origin[0]['@type']);
            } else {
                stringparts.push(activity.data.origin['@type']);
            }
            if (activity.data.object && activity.data.object['@type'] && activity.data.result && activity.data.result[0].path.indexOf('level') > -1 && activity.data.result[0].value === 'none') {
                stringparts.push('none');
            }
        }

        if (keys.indexOf('target') > -1) {
            stringparts.push(activity.data.target['@type']);
        }

        if (keys.indexOf('inReplyTo') > -1) {
            stringparts.push('IN_REPLY_TO');
            stringparts.push(activity.data.inReplyTo['@type'])
        }

        if (activity.data.object && activity.data.object['@type'] && activity.data.object['@type'] === 'CommentVote' && activity.data.type !== 'Delete') {
            let val = 'up';
            if ((activity.data.resultObject && activity.data.resultObject.value === -1) || (!activity.data.resultObject && activity.data.object.value === -1)) {
                val = 'down';
            }
            if (activity.data.resultObject && activity.data.resultObject.value === 0) {
                val = 'remove';
            }
            stringparts.push(val);
        }
        activity.string = 'ACTIVITY_FEED.' + stringparts.join('_').toUpperCase();
    };

    getTopicActivities (topicId, offsetNr?, limitNr?) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/activities'.replace(':topicId', topicId));

        return this.$http
            .get(path, {
                params: {
                    offset: offsetNr,
                    limit: limitNr
                },
                transformResponse: (data, headers, status) => {
                    if (status !== 404) {
                        return angular.fromJson(data)
                    }
                }
            })
            .then(this.success, this.defaultError);
    };

    getTopicActivitiesUnauth (topicId, offsetNr?, limitNr?) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/topics/:topicId/activities'.replace(':topicId', topicId));

        return this.$http
            .get(path, {
                params: {
                    offset: offsetNr,
                    limit: limitNr
                }
            })
            .then(this.success, this.defaultError);
    };

    getUnreadActivities () {
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/activities/unread');
        return this.$http
            .get(
                path,
                {
                    ignoreLoadingBar: true
                }
            )
            .then((response) => {
                    const body = response.data;
                    this.unread = body.data.count;
                    return this.$q.resolve(body.data.count);
                },
                this.defaultError
            );
    };

    getActivities (offsetNr?, limitNr?, include?, filter?) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/activities');
        const paramsObj = {
            offset: offsetNr,
            limit: limitNr
        };
        if (include) {
            paramsObj['include'] = include;
        }
        if (filter) {
            paramsObj['filter'] = filter;
        }
        return this.$http
            .get(path, {params: paramsObj})
            .then(this.success, this.defaultError);
    };

    getActivitiesUnauth (offsetNr?, limitNr?, include?, filter?, sourcePartnerId?) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/activities');
        const paramsObj = {
            offset: offsetNr,
            limit: limitNr,
            sourcePartnerId: sourcePartnerId
        };
        if (include) {
            paramsObj['include'] = include;
        }
        if (filter) {
            paramsObj['filter'] = filter;
        }

        return this.$http
            .get(path, {params: paramsObj})
            .then(this.success, this.defaultError);
    };

    private getCategoryTranslationKeys = (catInput) => {
        if (Array.isArray(catInput)) {
            const translationKeys = [];
            catInput.forEach((category) => {
                translationKeys.push('TXT_TOPIC_CATEGORY_' + category.toUpperCase());
            });

            return translationKeys;
        }

        return 'TXT_TOPIC_CATEGORY_' + catInput.toUpperCase();
    };

    getUpdatedTranslations (activity) {
        const fieldName = activity.data.result[0].path.split('/')[1];
        activity.values.fieldName = fieldName;
        let previousValue = activity.data.origin[fieldName];
        let newValue = activity.data.resultObject[fieldName];
        let previousValueKey = null;
        let newValueKey = null;
        let fieldNameKey = null;
        const originType = activity.data.origin['@type'];
        if (originType === 'Topic' || originType === 'Comment' || originType === 'Group') {
            fieldNameKey = 'ACTIVITY_FEED.ACTIVITY_' + originType.toUpperCase() + '_FIELD_' + fieldName.toUpperCase();
        }

        if (Array.isArray(previousValue) && previousValue.length === 0) {
            previousValue = '';
        }

        if (previousValue || newValue) {
            if (originType === 'Topic') {
                if (fieldName === 'status' || fieldName === 'visibility') {
                    if (previousValue) {
                        previousValueKey = 'ACTIVITY_FEED.ACTIVITY_TOPIC_FIELD_' + fieldName.toUpperCase() + '_' + previousValue.toUpperCase();
                    }
                    if (newValue) {
                        newValueKey = 'ACTIVITY_FEED.ACTIVITY_TOPIC_FIELD_' + fieldName.toUpperCase() + '_' + newValue.toUpperCase();
                    }
                }
                if (fieldName === 'categories') {
                    if (previousValue) {
                        previousValueKey = this.getCategoryTranslationKeys(previousValue);
                    }
                    if (newValue) {
                        newValueKey = this.getCategoryTranslationKeys(newValue);
                    }
                }
            }

            if (originType === 'CommentVote') {
                const handleValue = (value) => {
                    if (value === 1) {
                        value = 'up';
                    } else if (value === -1) {
                        value = 'down';
                    } else if (value === 0) {
                        value = 'remove';
                    }
                    return value;
                }
                if (fieldName === 'value') {
                    if (previousValue === 0 || previousValue) {
                        previousValue = handleValue(previousValue);
                        previousValueKey = 'ACTIVITY_FEED.ACTIVITY_COMMENTVOTE_FIELD_VALUE_' + previousValue.toUpperCase();
                    }
                    if (newValue === 0 || previousValue) {
                        newValue = handleValue(newValue);
                        newValueKey = 'ACTIVITY_FEED.ACTIVITY_COMMENTVOTE_FIELD_VALUE_' + newValue.toUpperCase();
                    }
                }
            }

            if (originType === 'Comment') {
                if (fieldName === 'deletedReasonType') {
                    newValueKey = 'ACTIVITY_FEED.ACTIVITY_COMMENT_FIELD_DELETEDREASONTYPE_' + newValue.toUpperCase();
                }
                if (fieldName === 'type') {
                    newValueKey = 'ACTIVITY_FEED.ACTIVITY_COMMENT_FIELD_VALUE_' + newValue.toUpperCase();
                }
            }
        }
        if (previousValueKey) {
            this.$translate(previousValueKey)
                .then((prev) => {
                    activity.values.previousValue = prev;
                    if (typeof prev === 'object') {
                        activity.values.previousValue = Object.values(prev).join(';');
                    }
                });
        } else {
            activity.values.previousValue = previousValue;
        }
        if (fieldNameKey) {
            const translatedField = this.$translate.instant(fieldNameKey);
            activity.values.fieldName = translatedField;
        }
        if (newValueKey) {
            let newVal = this.$translate.instant(newValueKey);
            if (typeof newVal === 'object') {
                newVal =  Object.values(newVal).join(';');
            }
            activity.values.newValue = newVal;
        } else {
            activity.values.newValue = newValue;
        }

    };

    private getActivityTopicTitle = (activity) => {
        const dataobject = this.getActivityObject(activity);
        if (['Topic', 'VoteFinalContainer'].indexOf(dataobject['@type']) > -1) {
            return dataobject.title;
        } else if (dataobject.topicTitle) {
            return dataobject.topicTitle;
        } else if (activity.data.target && activity.data.target.title) {
            return activity.data.target.title;
        } else if (activity.data.target && activity.data.target.topicTitle) {
            return activity.data.target.topicTitle;
        } else if (activity.data.origin && activity.data.origin.title) {
            return activity.data.origin.title;
        } else if (activity.data.origin && activity.data.origin.topicTitle) {
            return activity.data.origin.topicTitle;
        }
    };

    private getActivityClassName = (activity) => {
        const dataobject = this.getActivityObject(activity);

        if (activity.data.type === 'Accept' || activity.data.type === 'Invite' || (activity.data.type === 'Add' && activity.data.actor.type === 'User' && activity.data.object['@type'] === 'User' && activity.data.target['@type'] === 'Group')) { // Last condition if for Group invites
            return 'invite';
        } else if (['Topic', 'TopicMemberUser', 'Attachment', 'TopicPin' ].indexOf(dataobject['@type']) > -1 || activity.data.target && activity.data.target['@type'] === ' Topic') {
            return 'topic';
        } else if (['Group'].indexOf(dataobject['@type']) > -1 || dataobject.groupName) {
            return 'group';
        } else if (['Vote', 'VoteList', 'VoteUserContainer', 'VoteFinalContainer', 'VoteOption', 'VoteDelegation'].indexOf(dataobject['@type']) > -1) {
            return 'vote';
        } else if (['Comment', 'CommentVote'].indexOf(dataobject['@type']) > -1) {
            return 'comment';
        } else if (['User', 'UserConnection'].indexOf(dataobject['@type']) > -1 || dataobject.text) {
            return 'personal';
        } else {
            return 'topic';
        }
    };

    private getActivityDescription = (activity) => {
        const dataobject = this.getActivityObject(activity);

        if (dataobject['@type'] === 'Comment' || dataobject.text) {
            return dataobject.text;
        }
        if (activity.data.target && activity.data.target['@type'] === 'Comment') {
            return activity.data.target.text;
        }
    };

    private getActivityGroupName = (activity) => {
        const dataobject = this.getActivityObject(activity);

        if (dataobject['@type'] === 'Group') {
            return dataobject.name;
        } else if (dataobject.groupName) {
            return dataobject.groupName;
        } else if (activity.data.target && activity.data.target['@type'] === 'Group') {
            return activity.data.target.name;
        } else if (activity.data.target && activity.data.target.groupName) {
            return activity.data.target.groupName;
        } else if (activity.data.origin && activity.data.origin['@type'] === 'Group') {
            return activity.data.origin.name;
        } else if (activity.data.origin && activity.data.origin.groupName) {
            return activity.data.origin.groupName;
        }
    };

    private getActivityAttachmentName = (activity) => {
        let dataobject = activity.data.object;
        if (Array.isArray(dataobject)) {
            dataobject = dataobject[0];
        }

        if (dataobject['@type'] === 'Attachment' || dataobject.name) {
            return dataobject.name;
        }
    };

    private getAactivityUserConnectionName = (activity) => {
        let dataobject = activity.data.object;

        if (Array.isArray(dataobject)) {
            dataobject = dataobject[0];
        }

        if (dataobject['@type'] === 'UserConnection') {
            var key = 'ACTIVITY_FEED.ACTIVITY_USERCONNECTION_CONNECTION_NAME_:connectionId'
                .replace(':connectionId', dataobject.connectionId)
                .toUpperCase();
            const translation = this.$translate.instant(key);

            if (!translation || translation === key) { // No translation found
                return dataobject.connectionId.charAt(0).toUpperCase() + dataobject.connectionId.slice(1)
            } else {
                return translation;
            }
        }
    };

    private getActivityUsers = (activity, values) => {
        var dataobject = activity.data.object;
        if (Array.isArray(dataobject)) {
            dataobject = dataobject[0];
        }
        if (activity.data.actor && activity.data.actor.name) {
            values.userName = activity.data.actor.name;
        }
        if (dataobject['@type'] === 'User') {
            values.userName2 = dataobject.name;
        } else if (dataobject.userName) {
            values.userName2 = dataobject.userName;
        } else if (activity.data.target && activity.data.target['@type'] === 'User') {
            values.userName2 = activity.data.target.name;
        } else if (activity.data.target && activity.data.target.userName) {
            values.userName2 = activity.data.target.userName;
        }
    };

    private getActivityUserLevel = (activity, values) => {
        const levelKeyPrefix = 'ACTIVITY_FEED.ACTIVITY_TOPIC_LEVELS_';
        let levelKey;

        if (activity.data.actor && activity.data.actor.level) {
            levelKey = levelKeyPrefix + activity.data.actor.level;
        } else if (activity.data.target && activity.data.target.level) { // Invite to Topic has target User - https://github.com/citizenos/citizenos-fe/issues/112
            levelKey = levelKeyPrefix + activity.data.target.level;
        }

        if (levelKey && levelKey !== levelKeyPrefix) {
            values.accessLevel = this.$translate.instant(levelKey.toUpperCase());
        }
    };

    getActivityValues (activity) {
        const values = {};

        if (activity.data.object) {
            this.getActivityUsers(activity, values);
            values['topicTitle'] = this.getActivityTopicTitle(activity);
            values['className'] = this.getActivityClassName(activity);
            values['description'] = this.getActivityDescription(activity);
            values['groupName'] = this.getActivityGroupName(activity);
            values['attachmentName'] = this.getActivityAttachmentName(activity);
            values['connectionName'] = this.getAactivityUserConnectionName(activity);
            this.getActivityUserLevel(activity, values);

            let dataobject = activity.data.object;
            if (Array.isArray(dataobject)) {
                dataobject = dataobject[0];
            }

            if (dataobject['@type'] === 'CommentVote' && activity.data.type === 'Create') {
                const str = 'ACTIVITY_FEED.ACTIVITY_COMMENTVOTE_FIELD_VALUE_';
                let val = 'UP';
                if (dataobject.value === -1) {
                    val = 'DOWN';
                } else if (dataobject.value === 0) {
                    val = 'REMOVE';
                }
                this.$translate(str + val).then((value) =>{
                    values['reaction'] = value;
                });
            }
        }
        activity.values = values;
        if (activity.data.type === 'Update') {
            this.getUpdatedTranslations(activity);
        }

        return activity;
    };

    showActivityDescription (activity) {
        if (activity.data && activity.data.object && (Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === 'Comment' || activity.data.object['@type'] === 'Comment' || activity.data.object.text)) {
            return true;
        }

        if (activity.data && activity.data.target && activity.data.target['@type'] === 'Comment') {
            return true;
        }

        return false;
    };

    showActivityUpdateVersions (activity) {
        if (activity.data.type === 'Update') {
            if (activity.data.result && (Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === 'Topic' && activity.data.result[0].path.indexOf('description') > -1 || !Array.isArray(activity.data.object) && activity.data.object['@type'] === 'Topic' && activity.data.result[0].path.indexOf('description') > -1)) {
                return false;
            }
            if (activity.data.object['@type'] === 'UserNotificationSettings' && activity.data.type === 'Update') {
                return false;
            }

            if (activity.data.object['@type'] === 'CommentVote' && activity.data.type === 'Update' && activity.data.resultObject && activity.data.resultObject.value === 0) {
                return false;
            }

            if (activity.data.result && !Array.isArray(activity.data.object) && activity.data.object['@type'] === 'TopicMemberUser' && activity.data.result[0].path.indexOf('level') > -1 && activity.data.result[0].value === 'none') {
                return false;
            }

            return true;
        }
        return false;
    };

    handleActivityRedirect (activity) {
        if (!activity.data) {
            return;
        }

        const activityType = activity.data.type;
        let stateName = '';
        const params = {};
        let hash = '';
        const object = this.getActivityObject(activity);
        const target = activity.data.target;
        const origin = activity.data.origin;


        if (activityType === 'Invite' && target['@type'] === 'User' && object['@type'] === 'Topic') { // https://github.com/citizenos/citizenos-fe/issues/112
            // The invited user is viewing
            if (this.sAuth.user.loggedIn && this.sAuth.user.id === target.id) {
                stateName = 'topicsTopicIdInvitesUsers';
                params['topicId'] = object.id;
                params['inviteId'] = target.inviteId; // HACKISH! Change once issue resolves - https://github.com/w3c/activitystreams/issues/506
            } else {
                // Creator of the invite or a person who has read permissions is viewing
                stateName = 'topics/view';
                params['topicId'] = object.id;
            }
        } else if (activityType === 'Invite' && target['@type'] === 'User' && object['@type'] === 'Group') { // https://github.com/citizenos/citizenos-fe/issues/348
            // The invited user is viewing
            if (this.sAuth.user.loggedIn && this.sAuth.user.id === target.id) {
                stateName = 'groupsGroupIdInvitesUsers';
                params['groupId'] = object.id;
                params['inviteId'] = target.inviteId; // HACKISH! Change once issue resolves - https://github.com/w3c/activitystreams/issues/506
            } else {
                // Creator of the invite or a person who has read permissions is viewing
                stateName = 'group/view';
                params['groupId'] = object.id;
            }
        } else if ((object && object['@type'] === 'Topic')) {
            stateName = 'topics/view';
            params['topicId'] = object.id;
        } else if ((object && object['@type'] === 'TopicMemberUser')) {
            stateName = 'topics/view';
            params['topicId'] = object.topicId;
        } else if (object['@type'] === 'Comment' || object['@type'] === 'CommentVote') {
            if (target && (target['@type'] === 'Topic' || object.topicId || target.topicId)) {
                stateName = 'topics/view';
                params['topicId'] = object.topicId || target.topicId || target.id;
                params['commentId'] = object.commentId || object.id;
                // hash = object.commentId || object.id;
            }
        } else if (object['@type'] === 'Vote' || object['@type'] === 'VoteList' && target && target['@type'] === 'Topic') {
            stateName = 'topics/view/votes/view';
            params['topicId'] = target.topicId || target.id;
            params['voteId'] = object.voteId || object.id;
        } else if (object['@type'] === 'Group' || object['@type'] === 'TopicMemberGroup') {
            stateName = 'my/groups/groupId';
            params['groupId'] = object.id || object.groupId;
        } else if (object['@type'] === 'Vote' || object['@type'] === 'VoteFinalContainer' ) {
            stateName = 'topics/view/votes/view';
            params['topicId'] = object.topicId || object.id;
            params['voteId'] = object.voteId || object.id;
        } else if (target && target['@type'] === 'Topic' || target.topicId) {
            stateName = 'topics/view';
            params['topicId'] = target.topicId || target.id
        }

        if (target && target['@type'] === 'Group') {
            stateName = 'my/groups/groupId';
            params['groupId'] = target.id;
        }

        if (!stateName && origin && origin['@type'] === 'Topic') {
            stateName = 'topics/view';
            params['topicId']  = origin.id;
        }
        if (stateName) {
            //  ngDialog.closeAll();
            let link = this.$state.href(stateName, params);
            if (hash) {
                link = link + '#' + hash;
            }
            this.$window.location.href = link;
        }
    }
};

angular
    .module('citizenos')
    .service('sActivity', ['$http', '$state', '$stateParams', '$window', '$q', '$log', '$translate', 'sAuth', 'sLocation', 'ngDialog', Activity]);
