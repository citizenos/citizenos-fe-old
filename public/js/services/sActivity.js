'use strict';

angular
    .module('citizenos')
    .service('sActivity', ['$http', '$state', '$stateParams', '$window', '$q', '$log', '$translate', 'sLocation', 'ngDialog', function ($http, $state, $stateParams, $window, $q, $log, $translate, sLocation, ngDialog) {
        var sActivity = this;

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
                    }
                    else if (activity.data.type === 'Update' && Array.isArray(activity.data.result)) {
                        var i = 0;
                        var resultItems = [];
                        if (activity.data.origin['@type'] === 'Topic') {
                            activity.data.origin.description = null;
                        }
                        var resultObject = _.cloneDeep(activity.data.origin);
                        activity.data.resultObject = jsonpatch.apply(resultObject, activity.data.result);
                        activity.data.result.forEach(function (item) {
                            var field = item.path.split('/')[1];

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
                        });
                        activity.data.result = resultItems;
                        while (i < activity.data.result.length) {
                            var act = _.cloneDeep(activity);
                            var change = activity.data.result[i];
                            act.data.result = [change];
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
            return parsedResult;
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

            if (keys.indexOf('object') > -1) {
                if (Array.isArray(activity.data.object)) {
                    stringparts.push(activity.data.object[0]['@type']);
                } else {
                    stringparts.push(activity.data.object['@type']);
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

        sActivity.getActivities = function (offsetNr, limitNr, filter) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/activities');
            var paramsObj = {
                offset: offsetNr,
                limit: limitNr
            };
            if (filter) {
                paramsObj.include = filter;
            }

            return $http
                .get(path, {params: paramsObj})
                .then(success, defaultError);
        };

        sActivity.getActivitiesUnauth = function (offsetNr, limitNr, filter) {
            var path = sLocation.getAbsoluteUrlApi('/api/activities');
            var paramsObj = {
                offset: offsetNr,
                limit: limitNr
            };
            if (filter) {
                paramsObj.include = filter;
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

            if (activity.data.origin['@type'] === 'Topic') {
                var fieldNameKey = 'ACTIVITY_FEED.ACTIVITY_TOPIC_FIELD_' + fieldName.toUpperCase();
                $translate(fieldNameKey)
                    .then(function (translatedField) {
                        activity.values.fieldName = translatedField;
                    })
            }

            if (Array.isArray(previousValue) && previousValue.length === 0) {
                previousValue = '';
            }

            if (previousValue || newValue) {
                if (activity.data.origin['@type'] === 'Topic') {
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

                if (activity.data.origin['@type'] === 'CommentVote') {
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
            if (newValueKey) {
                $translate(newValueKey)
                    .then(function (newVal) {
                        activity.values.newValue = newVal;
                        if (typeof newVal === 'object') {
                            activity.values.newValue = Object.values(newVal).join(';');
                        }
                    });
            } else {
                activity.values.newValue = newValue;
            }
        };

        var getActivityTopicTitle = function (activity) {
            var dataobject = activity.data.object;
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
            }
        };

        var getActivityClassName = function (activity) {
            var dataobject = activity.data.object;
            if (Array.isArray(dataobject)) {
                dataobject = dataobject[0];
            }

            if (dataobject['@type'] === 'Topic' || dataobject['@type'] === 'TopicMemberUser' || dataobject['@type'] === 'CommentVote' || dataobject['@type'] === 'Attachment' || dataobject.name || activity.data.target && activity.data.target['@type'] === ' Topic') {
                return 'topic';
            } else if (dataobject['@type'] === 'Group' || dataobject.groupName) {
                return 'group';
            } else if (dataobject['@type'] === 'Vote' || dataobject['@type'] === 'VoteList' || dataobject['@type'] === 'VoteUserContainer' || dataobject['@type'] === 'VoteOption') {
                return 'vote';
            } else if (dataobject['@type'] === 'Comment' || dataobject.text) {
                return 'comment';
            } else if (dataobject['@type'] === 'User' || dataobject.text) {
                return 'personal';
            }
        };

        var getActivityDescription = function (activity) {
            var dataobject = activity.data.object;
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
            var dataobject = activity.data.object;
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
            var levelKey = 'ACTIVITY_FEED.ACTIVITY_TOPIC_LEVELS_';

            if (activity.data.actor && activity.data.actor.level) {
                levelKey += activity.data.actor.level;
            }

            $translate(levelKey.toUpperCase()).then(function (value) {
                values.accessLevel = value;
            })
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
                getActivityUserLevel(activity, values);

                var dataobject = activity.data.object;
                if (Array.isArray(dataobject)) {
                    dataobject = dataobject[0];
                }

                if (dataobject['@type'] === 'CommentVote' && activity.data.type === 'Create') {
                    var str = 'ACTIVITY_FEED.ACTIVITY_COMMENTVOTE_FIELD_VALUE_'
                    var val = 'UP';
                    if (dataobject.value === -1) {
                        val = 'DOWN';
                    } else if (dataobject.value === 0) {
                        val = 'REMOVE';
                    }
                    $translate(str + val).then(function (value) {
                        values.reaction = value;
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
            var stateName = '';
            var params = {};
            var hash = '';
            var object = activity.data.object;
            if (Array.isArray(object)) {
                object = object[0];
            }
            var type = activity.data.type;

            if (object['@type'] === 'Topic') {
                stateName = 'topics.view';
                params.topicId = object.id;
            } else if (object['@type'] === 'Comment' || object['@type'] === 'CommentVote' || (object['@type'] === 'User' && activity.data.target && activity.data.target['@type'] === 'Topic')) {
                if (activity.data.target) {
                    if (activity.data.target['@type'] === 'Topic' || activity.data.target.topicId) {
                        stateName = 'topics.view';
                        params.topicId = activity.data.target.topicId || activity.data.target.id;
                        params.commentId = object.commentId || object.id;
                        // hash = object.commentId || object.id;
                    }
                }
            } else if (object['@type'] === 'Vote' || object['@type'] === 'VoteList') {
                stateName = 'topics.view.votes.view';
                params.topicId = activity.data.target.topicId || activity.data.target.id;
                params.voteId = object.voteId || object.id;
            } else if (object['@type'] === 'Group') {
                stateName = 'my.groups.groupId';
                params.groupId = object.id;
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
