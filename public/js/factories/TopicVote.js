angular
    .module('citizenos')
    .factory('TopicVote', ['$log', '$state', '$resource', 'sLocation', 'sAuth', function ($log, $state, $resource, sLocation, sAuth) {
        $log.debug('citizenos.factory.TopicVote');

        var path = '/api/:prefix/:userId/topics/:topicId/votes/:voteId';
        var pathStatus = path+'/status';
        var pathSign = path+'/sign';

        var TopicVote = $resource(
            sLocation.getAbsoluteUrlApi(path),
            {topicId: '@topicId', voteId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
            {
                save: {
                    method: 'POST',
                    transformRequest: function (data) {
                        delete data.id;
                        delete data.topicId;
                        return angular.toJson(data);
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status === 205) {
                            $state.reload();
                        } else if (status > 0 && status < 400) {
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                get: {
                    method: 'GET',
                    params: {topicId: '@topicId', voteId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            var returndata = angular.fromJson(data).data;
                            var maxVotes = 0;
                            returndata.options.rows.forEach(function (voteOption) {
                                if (voteOption.voteCount > maxVotes) {
                                    maxVotes = voteOption.voteCount;
                                }
                            });
                            returndata.options.rows.forEach(function (voteOption) {
                                if (maxVotes && voteOption.voteCount === maxVotes ) {
                                    voteOption.winner = true;
                                }
                            });
                            return returndata;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                update: {
                    method: 'PUT',
                    params: {topicId: '@topicId', voteId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
                    transformResponse: function(data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                status: {
                    method: 'GET',
                    params: {topicId: '@topicId', voteId: '@id', prefix: sAuth.getUrlPrefix, userId: sAuth.getUrlUserId},
                    url: sLocation.getAbsoluteUrlApi(pathStatus),
                    transformResponse: function(data, headersGetter, status) {
                        if (status === 205) {
                            $state.reload();
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                sign: {
                    method: 'POST',
                    url: sLocation.getAbsoluteUrlApi(pathSign),
                    params: {topicId: '@topicId', voteId: '@id'}
                }
            }
        );

        TopicVote.prototype.getVoteCountTotal = function () {
            var voteCountTotal = 0;
            if (this.options) {
                var options = this.options.rows;
                for (var i in options) {
                    var voteCount = options[i].voteCount;
                    if (voteCount) {
                        voteCountTotal += voteCount;
                    }
                }
            }
            return voteCountTotal;
        };

        return TopicVote;
    }]);
