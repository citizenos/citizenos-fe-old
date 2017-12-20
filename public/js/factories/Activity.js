angular
    .module('citizenos')
    .factory('Activity', ['$log', '$resource', 'sLocation', 'sAuth', function ($log, $resource, sLocation, sAuth) {
        $log.debug('citizenos.factory.Activity');

        var Activity = $resource(
            sLocation.getAbsoluteUrlApi('/api/topics/:topicId/activities'),
            {topicId: '@topicId'},
            {
                query: {
                    params: {topicId: '@topicId'},
                    isArray: true,
                    transformResponse: function (data, headerGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            var result = angular.fromJson(data).data;

                            var parsedResult = preParseActivities(result)
//                          .then(function (result) {
                                console.log('RESULT', result);
                                parsedResult.forEach(function (activity) {
                                    buildActivityString(activity);
                                });
                                return parsedResult;
//                            });

                        } else {
                            return angular.fromJson(data);
                        }
                    }
                }
            }
        );

        var preParseActivities = function (activities) {
            var results = [];
       //     return new Promise(function (resolve, reject) {
            activities.forEach(function (activity) {
                if (activity.data.type === 'Update' && Array.isArray(activity.data.result)) {
                    var i = 0;
                    console.log('LEN', activity.data.result.length)
                    var act = _.clone(activity);
                    while(i < activity.data.result.length) {
                        var change = activity.data.result[i];
                        act.data.result = change;
                        results.push(act);
                        i++;
                    }
                } else {
                    results.push(activity)
                }
            });
            return results;
        }

        var buildActivityString = function (activity) {
            var keys = Object.keys(activity.data);
            var stringparts = ['ACTIVITY'];
            if (keys.indexOf('actor') > -1) {
                stringparts.push(activity.data['actor']['type']);
            }

            if (keys.indexOf('type') > -1) {
                stringparts.push(activity.data['type']);
            }

            if (keys.indexOf('object') > -1) {
                if(Array.isArray(activity.data['object'])) {
                    stringparts.push(activity.data['object'][0]['@type']);
                } else {
                    stringparts.push(activity.data['object']['@type']);
                }
            }

            if (keys.indexOf('origin') > -1) {
                if(keys.indexOf('object') > -1 && ((Array.isArray(activity.data['object']) && activity.data['object'][0]['@type'] === activity.data['origin']['@type']) ||
                    activity.data['object']['@type'] === activity.data['origin']['@type'])) {}
                else {
                    stringparts.push(activity.data['origin']['@type']);
                }

            }
            if (keys.indexOf('target') > -1) {
                stringparts.push(activity.data['target']['@type']);
            }

            if(keys.indexOf('inReplyTo') > -1) {
                stringparts.push('IN_REPLY_TO');
                stringparts.push(activity.data['inReplyTo']['@type'])
            }
            activity.string = 'ACTIVITY_FEED.' + stringparts.join('_').toUpperCase();;
        };

        return Activity;
    }]);
