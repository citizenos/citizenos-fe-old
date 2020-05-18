angular
    .module('citizenos')
    .factory('VoteDelegation', ['$log', '$resource', 'sLocation', function ($log, $resource, sLocation) {
        $log.debug('citizenos.factory.VoteDelegation');

        var VoteDelegation = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/votes/:voteId/delegations'),
            {topicId: '@topicId', voteId: '@voteId'},
            {
                save: {
                    method: 'POST',
                    transformResponse: function (data) {
                        if (status > 0 && status < 400) {
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                delete: {
                    method: 'DELETE'
                }
            }
        );

        return VoteDelegation;
    }]);
