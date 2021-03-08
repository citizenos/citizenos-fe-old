'use strict';

angular
    .module('citizenos')
    .service('sActivity', ['$http', '$state', '$stateParams', '$window', '$q', '$log', '$translate', 'sAuth', 'sLocation', 'ngDialog', function ($http, $state, $stateParams, $window, $q, $log, $translate, sAuth, sLocation, ngDialog) {
        var sActivity = this;

        sActivity.unread = 0;
        var defaultSuccess = function (response) {
            return response.data;
        };

        var defaultError = function (response) {
            return $q.reject(response);
        };

        var success = function (data) {
            var result = angular.fromJson(data).data;
            var parsedResult = [];
            result.data.forEach(function (activity, key) {
                if (activity.data) {
                    if (activity.data.type === 'Create' && !activity.data.target && activity.data.object && (activity.data.object['@type'] === 'Vote' || Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === 'VoteOption')) {
                        result.data.splice(key, 1);
                    } else if (activity.data.type === 'Update' && Array.isArray(activity.data.result)) {
                        var i = 0;
                        var resultItems = [];
                        if (activity.data.origin['@type'] === 'Topic') {
                            activity.data.origin.description = null;
                        }
                        var resultObject = _.cloneDeep(activity.data.origin);
                        activity.data.resultObject = jsonpatch.applyPatch(resultObject, activity.data.result).newDocument;
                        activity.data.result.forEach(function (item) {
                            var field = item.path.split('/')[1];
                            if (field === 'deletedById' || field === 'deletedByReportId') {
                                item = null;
                            } else {
                                var change = _.find(resultItems, function (resItem) {
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
                            var act = _.cloneDeep(activity);
                            var change = activity.data.result[i];
                            act.data.result = [change];
                            if (act.data.target) {
                                act.id = act.id + '_' + change.path; //this is to avoid weird grouping of update activities with multiple fields
                            }
                            act.id = act.id + '_' + change.path;
                            buildActivityString(act);
                            act = sActivity.getActivityValues(act);
                            parsedResult.push(act);
                            i++;
                        }
                    } else {
                        buildActivityString(activity);
                        activity = sActivity.getActivityValues(activity);
                        parsedResult.push(activity)
                    }
                } else {
                    $log.error('Activity data missing');
                }
            });

            return activitiesToGroups(parsedResult);
        };

        var activitiesToGroups = function (activities) {
            var userActivityGroups = {};
            var activityGroups = {};
            var grouped = {};
            var returnActivities = [];

            var addToGroup = function (key, value) {
                if (!grouped[key]) {
                    grouped[key] = [value];
                } else {
                    grouped[key].push(value);
                }
            }
            for(var i=0; i < activities.length; i++) {
                var objectId = activities[i].data.object.id;

                if (activities[i].data.target) {
                    var targetId = activities[i].data.target.id;
                    addToGroup(activities[i].string + '_ACTIVITYGROUP:' + targetId, activities[i].id);
                    addToGroup(activities[i].string + '_USERACTIVITYGROUP:' + targetId+ '_' + activities[i].data.actor.id, activities[i].id);
                }

                var groupKey = activities[i].string + '_' + objectId;
                var userGroupKey = groupKey + '_' + activities[i].data.actor.id;

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
            var final = {};
            activities.forEach(function (activity) {
                var groupKey;
                Object.keys(grouped).forEach(function (key) {
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
                        final[groupKey].sort(function(a, b) {
                            if (!a || !b) return 0;
                            var keyA = new Date(a.updatedAt),
                              keyB = new Date(b.updatedAt);
                            // Compare the 2 dates
                            if (keyA < keyB) return 1;
                            if (keyA > keyB) return -1;
                            return 0;
                        });
                    }
                    _.sortBy(final[groupKey], ['updatedAt']).reverse();
                } else {
                    final[activity.id] = [activity];
                }
            });

            Object.keys(final).forEach(function (key){
                returnActivities.push({referer: key, values: final[key]});
            });

            return _.sortBy(returnActivities, [function(o) { return o.values[0].updatedAt; }]).reverse();
        };

        var buildActivityString = function (activity) {
            var keys = Object.keys(activity.data);
            var stringparts = ['ACTIVITY'];
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
                var val = 'up';
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

        sActivity.getTopicActivities = function (topicId, offsetNr, limitNr) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/activities'.replace(':topicId', topicId));

            return $http
                .get(path, {
                    params: {
                        offset: offsetNr,
                        limit: limitNr
                    }
                })
                .then(success, defaultError);
        };

        sActivity.getTopicActivitiesUnauth = function (topicId, offsetNr, limitNr) {
            var path = sLocation.getAbsoluteUrlApi('/api/topics/:topicId/activities'.replace(':topicId', topicId));

            return $http
                .get(path, {
                    params: {
                        offset: offsetNr,
                        limit: limitNr
                    }
                })
                .then(success, defaultError);
        };

        sActivity.getUnreadActivities = function () {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/activities/unread');
            return $http
                .get(
                    path,
                    {
                        ignoreLoadingBar: true
                    }
                )
                .then(
                    function (response) {
                        var body = response.data;
                        sActivity.unread = body.data.count;

                        return $q.resolve(body.data.count);
                    },
                    defaultError
                );
        };

        sActivity.getActivities = function (offsetNr, limitNr, include, filter) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/activities');
            var paramsObj = {
                offset: offsetNr,
                limit: limitNr
            };
            if (include) {
                paramsObj.include = include;
            }
            if (filter) {
                paramsObj.filter = filter;
            }
            return $http
                .get(path, {params: paramsObj})
                .then(success, defaultError);
        };

        sActivity.getActivitiesUnauth = function (offsetNr, limitNr, include, filter, sourcePartnerId) {
            var path = sLocation.getAbsoluteUrlApi('/api/activities');
            var paramsObj = {
                offset: offsetNr,
                limit: limitNr,
                sourcePartnerId: sourcePartnerId
            };
            if (include) {
                paramsObj.include = include;
            }
            if (filter) {
                paramsObj.filter = filter;
            }

            return $http
                .get(path, {params: paramsObj})
                .then(success, defaultError);
        };

        var getCategoryTranslationKeys = function (catInput) {
            if (Array.isArray(catInput)) {
                var translationKeys = [];
                catInput.forEach(function (category) {
                    translationKeys.push('TXT_TOPIC_CATEGORY_' + category.toUpperCase());
                });

                return translationKeys;
            }

            return 'TXT_TOPIC_CATEGORY_' + catInput.toUpperCase();
        };

        sActivity.getUpdatedTranslations = function (activity) {
            var fieldName = activity.data.result[0].path.split('/')[1];
            activity.values.fieldName = fieldName;
            var previousValue = activity.data.origin[fieldName];
            var newValue = activity.data.resultObject[fieldName];
            var previousValueKey = null;
            var newValueKey = null;
            var fieldNameKey = null;
            var originType = activity.data.origin['@type'];
            if (originType === 'Topic' || originType === 'Comment') {
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
                            previousValueKey = getCategoryTranslationKeys(previousValue);
                        }
                        if (newValue) {
                            newValueKey = getCategoryTranslationKeys(newValue);
                        }
                    }
                }

                if (originType === 'CommentVote') {
                    if (fieldName === 'value') {
                        if (previousValue === 0 || previousValue) {

                            if (previousValue === 1) {
                                previousValue = 'up';
                            } else if (previousValue === -1) {
                                previousValue = 'down';
                            } else if (previousValue === 0) {
                                previousValue = 'remove';
                            }

                            previousValueKey = 'ACTIVITY_FEED.ACTIVITY_COMMENTVOTE_FIELD_VALUE_' + previousValue.toUpperCase();
                        }
                        if (newValue === 0 || previousValue) {
                            if (newValue === 1) {
                                newValue = 'up';
                            } else if (newValue === -1) {
                                newValue = 'down';
                            } else if (newValue === 0) {
                                newValue = 'remove';
                            }

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
                $translate(previousValueKey)
                    .then(function (prev) {
                        activity.values.previousValue = prev;
                        if (typeof prev === 'object') {
                            activity.values.previousValue = Object.values(prev).join(';');
                        }
                    });
            } else {
                activity.values.previousValue = previousValue;
            }
            if (fieldNameKey) {
                var translatedField = $translate.instant(fieldNameKey);
                activity.values.fieldName = translatedField;
                activity.values.groupItemValue = translatedField;
            }
            if (newValueKey) {
                var newVal = $translate.instant(newValueKey);
                if (typeof newVal === 'object') {
                    newVal =  Object.values(newVal).join(';');
                }
                activity.values.newValue = newVal;
                activity.values.groupItemValue += ': ' + newVal;
            } else {
                activity.values.newValue = newValue;
                activity.values.groupItemValue += ': ' + newValue;
            }

        };

        var getActivityTopicTitle = function (activity) {
            var dataobject = activity.data.object && activity.data.object.object ? activity.data.object.object : activity.data.object;
            if (Array.isArray(dataobject)) {
                dataobject = dataobject[0];
            }
            if (dataobject['@type'] === 'Topic') {
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

        var getActivityClassName = function (activity) {
            var dataobject = activity.data.object && activity.data.object.object ? activity.data.object.object : activity.data.object;
            if (Array.isArray(dataobject)) {
                dataobject = dataobject[0];
            }

            if (activity.data.type === 'Accept' || activity.data.type === 'Invite' || (activity.data.type === 'Add' && activity.data.actor.type === 'User' && activity.data.object['@type'] === 'User' && activity.data.target['@type'] === 'Group')) { // Last condition if for Group invites
                return 'invite';
            } else if (dataobject['@type'] === 'Topic' || dataobject['@type'] === 'TopicMemberUser' || dataobject['@type'] === 'CommentVote' || dataobject['@type'] === 'Attachment' || dataobject['@type'] === 'TopicPin' || activity.data.target && activity.data.target['@type'] === ' Topic') {
                return 'topic';
            } else if (dataobject['@type'] === 'Group' || dataobject.groupName) {
                return 'group';
            } else if (dataobject['@type'] === 'Vote' || dataobject['@type'] === 'VoteList' || dataobject['@type'] === 'VoteUserContainer' || dataobject['@type'] === 'VoteOption') {
                return 'vote';
            } else if (dataobject['@type'] === 'Comment' || dataobject.text) {
                return 'comment';
            } else if (dataobject['@type'] === 'User' || dataobject['@type'] === 'UserConnection' || dataobject.text) {
                return 'personal';
            } else {
                return 'topic';
            }
        };

        var getActivityDescription = function (activity) {
            var dataobject = activity.data.object && activity.data.object.object ? activity.data.object.object : activity.data.object;
            if (Array.isArray(dataobject)) {
                dataobject = dataobject[0];
            }

            if (dataobject['@type'] === 'Comment' || dataobject.text) {
                return dataobject.text;
            }
            if (activity.data.target && activity.data.target['@type'] === 'Comment') {
                return activity.data.target.text;
            }
        };

        var getActivityGroupName = function (activity) {
            var dataobject = activity.data.object && activity.data.object.object ? activity.data.object.object : activity.data.object;
            if (Array.isArray(dataobject)) {
                dataobject = dataobject[0];
            }

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

        var getActivityAttachmentName = function (activity) {
            var dataobject = activity.data.object;
            if (Array.isArray(dataobject)) {
                dataobject = dataobject[0];
            }

            if (dataobject['@type'] === 'Attachment' || dataobject.name) {
                return dataobject.name;
            }
        };

        var getAactivityUserConnectionName = function (activity) {
            var dataobject = activity.data.object;

            if (Array.isArray(dataobject)) {
                dataobject = dataobject[0];
            }

            if (dataobject['@type'] === 'UserConnection') {
                var key = 'ACTIVITY_FEED.ACTIVITY_USERCONNECTION_CONNECTION_NAME_:connectionId'
                    .replace(':connectionId', dataobject.connectionId)
                    .toUpperCase();
                var translation = $translate.instant(key);

                if (!translation || translation === key) { // No translation found
                    return dataobject.connectionId.charAt(0).toUpperCase() + dataobject.connectionId.slice(1)
                } else {
                    return translation;
                }
            }
        };

        var getActivityUsers = function (activity, values) {
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

        var getActivityUserLevel = function (activity, values) {
            var levelKeyPrefix = 'ACTIVITY_FEED.ACTIVITY_TOPIC_LEVELS_';
            var levelKey;

            if (activity.data.actor && activity.data.actor.level) {
                levelKey = levelKeyPrefix + activity.data.actor.level;
            } else if (activity.data.target && activity.data.target.level) { // Invite to Topic has target User - https://github.com/citizenos/citizenos-fe/issues/112
                levelKey = levelKeyPrefix + activity.data.target.level;
            }

            if (levelKey && levelKey !== levelKeyPrefix) {
                values.accessLevel = $translate.instant(levelKey.toUpperCase());
            }
        };

        sActivity.getActivityValues = function (activity) {
            var values = {};

            if (activity.data.object) {
                getActivityUsers(activity, values);
                values.topicTitle = getActivityTopicTitle(activity);
                values.className = getActivityClassName(activity);
                values.description = getActivityDescription(activity);
                values.groupName = getActivityGroupName(activity);
                values.attachmentName = getActivityAttachmentName(activity);
                values.connectionName = getAactivityUserConnectionName(activity);
                getActivityUserLevel(activity, values);

                values.groupItemValue =  values.userName;
                if (values.userName2) {
                    values.groupItemValue = values.userName2;
                }
                if (values.attachmentName) {
                    values.groupItemValue = values.attachmentName;
                }
                if (values.connectionName) {
                    values.groupItemValue = values.connectionName;
                }

                var dataobject = activity.data.object;
                if (Array.isArray(dataobject)) {
                    dataobject = dataobject[0];
                }

                if (dataobject['@type'] === 'Comment') {
                    values.groupItemValue = dataobject.text;
                }

                if (dataobject['@type'] === 'CommentVote' && activity.data.type === 'Create') {
                    var str = 'ACTIVITY_FEED.ACTIVITY_COMMENTVOTE_FIELD_VALUE_';
                    var val = 'UP';
                    if (dataobject.value === -1) {
                        val = 'DOWN';
                    } else if (dataobject.value === 0) {
                        val = 'REMOVE';
                    }
                    $translate(str + val).then(function (value) {
                        values.reaction = value;
                        values.groupItemValue = value;
                    });
                }
            }
            activity.values = values;
            if (activity.data.type === 'Update') {
                sActivity.getUpdatedTranslations(activity);
            }

            return activity;
        };

        sActivity.showActivityDescription = function (activity) {
            if (activity.data && activity.data.object && (Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === 'Comment' || activity.data.object['@type'] === 'Comment' || activity.data.object.text)) {
                return true;
            }

            if (activity.data && activity.data.target && activity.data.target['@type'] === 'Comment') {
                return true;
            }

            return false;
        };

        sActivity.showActivityUpdateVersions = function (activity) {
            if (activity.data.type === 'Update') {
                if (activity.data.result && (Array.isArray(activity.data.object) && activity.data.object[0]['@type'] === 'Topic' && activity.data.result[0].path.indexOf('description') > -1 || !Array.isArray(activity.data.object) && activity.data.object['@type'] === 'Topic' && activity.data.result[0].path.indexOf('description') > -1)) {
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

        sActivity.handleActivityRedirect = function (activity) {
            if (!activity.data) {
                return;
            }

            var activityType = activity.data.type;
            var stateName = '';
            var params = {};
            var hash = '';
            var object = activity.data.object && activity.data.object.object ? activity.data.object.object : activity.data.object;
            var target = activity.data.target;
            var origin = activity.data.origin;
            if (Array.isArray(object)) {
                object = object[0];
            }

            console.error('activityType', activityType, activity);
            if (activityType === 'Invite' && target['@type'] === 'User' && object['@type'] === 'Topic') { // https://github.com/citizenos/citizenos-fe/issues/112
                // The invited user is viewing
                if (sAuth.user.loggedIn && sAuth.user.id === target.id) {
                    stateName = 'topicsTopicIdInvitesUsers';
                    params.topicId = object.id;
                    params.inviteId = target.inviteId; // HACKISH! Change once issue resolves - https://github.com/w3c/activitystreams/issues/506
                } else {
                    // Creator of the invite or a person who has read permissions is viewing
                    stateName = 'topics.view';
                    params.topicId = object.id;
                }
            } else if ((object && object['@type'] === 'Topic')) {
                stateName = 'topics.view';
                params.topicId = object.id;
            } else if (object['@type'] === 'Comment' || object['@type'] === 'CommentVote') {
                if (target && (target['@type'] === 'Topic' || object.topicId || target.topicId)) {
                    stateName = 'topics.view';
                    params.topicId = object.topicId || target.topicId || target.id;
                    params.commentId = object.commentId || object.id;
                    // hash = object.commentId || object.id;
                }
            } else if (object['@type'] === 'Vote' || object['@type'] === 'VoteList' && target && target['@type'] === 'Topic') {
                stateName = 'topics.view.votes.view';
                params.topicId = target.topicId || target.id;
                params.voteId = object.voteId || object.id;
            } else if (object['@type'] === 'Group' || object['@type'] === 'TopicMemberGroup') {
                stateName = 'my.groups.groupId';
                params.groupId = object.id || object.groupId;
            } else if (target && target['@type'] === 'Topic' || target.topicId) {
                stateName = 'topics.view';
                params.topicId = target.topicId || target.id
            }

            if (target && target['@type'] === 'Group') {
                stateName = 'my.groups.groupId';
                params.groupId = target.id;
            }

            if (!stateName && origin && origin['@type'] === 'Topic') {
                stateName = 'topics.view';
                params.topicId  = origin.id;
            }
            if (stateName) {
                //  ngDialog.closeAll();
                var link = $state.href(stateName, params);
                if (hash) {
                    link = link + '#' + hash;
                }
                $window.location.href = link;
            }
        }
    }]);
