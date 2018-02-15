'use strict';

angular
    .module('citizenos')
    .service('sActivity', ['$http', '$q', '$log', '$translate', 'sLocation', function ($http, $q, $log, $translate, sLocation) {
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
                    || activity.data.object['@type'] === activity.data.origin['@type'])) {} else if (Array.isArray(activity.data.origin)) {
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
                if (activity.data.object.value === -1) {
                    val = 'down';
                }
                if (activity.data.object.value === 0) {
                    val = 'remove';
                }
                stringparts.push(val);
            }
            activity.string = 'ACTIVITY_FEED.' + stringparts.join('_').toUpperCase();
        };

        sActivity.getTopicActivities = function (topicId, offsetNr, limitNr) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/activities'.replace(':topicId', topicId));

            return $http.get(path, {params: {
                offset: offsetNr,
                limit: limitNr}}).then(success, defaultError);
        }

        sActivity.getActivities = function (offsetNr, limitNr, filter) {
            var path = sLocation.getAbsoluteUrlApi('/api/users/self/activities');
            var paramsObj = {offset: offsetNr,
                limit: limitNr};
            if (filter) {
                paramsObj.include = filter;
            }

            return $http.get(path, {params: paramsObj}).then(success, defaultError);
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
            var previousValueKey = null
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

        sActivity.getActivityValues = function (activity) {
            var values = {};
            if (activity.data.actor && activity.data.actor.name) {
                values.userName = activity.data.actor.name;
            }
            if (activity.data.object) {
                var dataobject = activity.data.object
                if (Array.isArray(dataobject)) {
                    dataobject = dataobject[0];
                }
                if (dataobject['@type'] === 'Topic' || dataobject['@type'] === 'TopicMemberUser') {
                    values.className = 'topic';
                }
                if (dataobject['@type'] === 'Topic' || activity.data.target && activity.data.target['@type'] === 'Topic') {
                    values.topicTitle = dataobject.title;
                }
                if (dataobject['@type'] === 'Group' || dataobject.groupName) {
                    values.groupName = dataobject.name || dataobject.groupName;
                    values.className = 'group';
                }
                if (dataobject['@type'] === 'Vote' || dataobject['@type'] === 'VoteList' || dataobject['@type'] === 'VoteOption' || dataobject['@type'] === 'CommentVote') {
                    values.className = 'vote';
                }
                if (dataobject['@type'] === 'Attachment' || dataobject.name) {
                    values.attachmentName = dataobject.name;
                }
                if (dataobject['@type'] === 'Comment' || dataobject.text) {
                    values.className = 'comment';
                    values.description = dataobject.text;
                }
                if (dataobject['@type'] === 'User' || dataobject.text) {
                    values.className = 'personal';
                }
            }
            activity.values = values;
            if (activity.data.type === 'Update') {
                sActivity.getUpdatedTranslations(activity);
            }

            return activity;
        };
    }]);