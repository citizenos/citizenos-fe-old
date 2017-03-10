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
                        return angular.fromJson(data).data;
                    }
                },
                delete: {
                    method: 'DELETE'
                }
            }
        );

        return VoteDelegation;
    }]);
