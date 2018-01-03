'use strict';

angular
    .module('citizenos')
    .factory('Activity', [
'$log', '$resource', 'sLocation', 'sAuth', function ($log, $resource, sLocation, sAuth) {
        $log.debug('citizenos.factory.Activity');
        var actStrings = [];

        var getUrlPrefix = function () {
            var prefix = sAuth.getUrlPrefix();
            if(!prefix) {
                prefix = '@prefix';
            }
            return prefix;
        };

        var getUrlUser = function () {
            var userId = sAuth.getUrlUserId();
            if(!userId) {
                userId = '@userId';
            }
            return userId;
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
            activity.string = 'ACTIVITY_FEED.' + stringparts.join('_').toUpperCase();
            actStrings.push(activity.string, activity.data.result);
        };

        var transformResponse = function (data, headerGetter, status) {
            if (status > 0 && status < 400) { // TODO: think this error handling through....
                var result = angular.fromJson(data).data;
                var parsedResult = [];
                result.forEach(function (activity) {
                    if (activity.data) {
                        if (activity.data.type === 'Update' && Array.isArray(activity.data.result)) {
                            var i = 0;
                            while (i < activity.data.result.length) {
                                var act = _.cloneDeep(activity);
                                var change = activity.data.result[i];
                                act.data.result = [change];
                                buildActivityString(act);
                                parsedResult.push(act);
                                i++;

                            }
                        } else {
                            buildActivityString(activity);
                            parsedResult.push(activity)
                        }
                    } else {
                        $log.error('Activity data missing');
                    }
                });
                return parsedResult;
            }
            return angular.fromJson(data);
        };

        var Activity = $resource(
            sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/activities'),
            {topicId: '@topicId', prefix: getUrlPrefix, userId: getUrlUser},
            {
                query: {
                    params: {topicId: '@topicId'},
                    isArray: true,
                    transformResponse: transformResponse
                }
            }
        );

        return Activity;
    }
]);
