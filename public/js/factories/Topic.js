angular
    .module('citizenos')
    .factory('Topic', ['$log', '$resource', 'sLocation', 'TopicMemberUser', 'TopicVote', function ($log, $resource, sLocation, TopicMemberUser, TopicVote) {
        $log.debug('citizenos.factory.Topic');

        var Topic = $resource(
            sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId'),
            {topicId: '@id'},
            {
                get: {
                    method: 'GET',
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) {
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                query: {
                    isArray: true,
                    transformResponse: function (data, headerGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            var array = angular.fromJson(data).data.rows || [];
                            array.forEach(function (topic) {
                                if (topic.vote && topic.vote.id) {
                                    topic.vote = new TopicVote(topic.vote);
                                }
                            });
                            return array;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                update: {
                    method: 'PUT'
                },
                save: {
                    method: 'POST',
                    transformResponse: function (data) {
                        return angular.fromJson(data).data;
                    }
                },
                join: {
                    method: 'POST',
                    params: {tokenJoin: '@id'},
                    url: sLocation.getAbsoluteUrlApi('/api/topics/join/:tokenJoin'),
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) {
                            return angular.fromJson(data);
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                updateTokenJoin: { //TODO: Support patch method
                    method: 'PUT',
                    params: {topicId: '@id'},
                    url: sLocation.getAbsoluteUrlApi('/api/users/self/topics/:topicId/tokenJoin'),
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // IF patch is working then make it return data again, for now return nothing to stop from overwriting all fields but topkenJoin
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                }
            }
        );

        Topic.VISIBILITY = {
            public: 'public', // Everyone has read-only on the Topic.  Pops up in the searches..
            private: 'private' // No-one can see except collaborators
        };

        Topic.CATEGORIES = {
            business: 'business', // Business and industry
            transport: 'transport', // Public transport and road safety
            taxes: 'taxes', // Taxes and budgeting
            agriculture: 'agriculture', // Agriculture
            environment: 'environment', // Environment, animal protection
            culture: 'culture', // Culture, media and sports
            health: 'health', // Health care and social care
            work: 'work', // Work and employment
            education: 'education', // Education
            politics: 'politics', // Politics and public administration
            communities: 'communities', // Communities and urban development
            defense: 'defense', //  Defense and security
            integration: 'integration', // Integration and human rights
            varia: 'varia' // Varia
        };

        Topic.CATEGORIES_COUNT_MAX = 3; // Maximum of 3 categories allowed at the time.

        Topic.prototype.isPrivate = function () {
            return this.visibility === Topic.VISIBILITY.private;
        };

        Topic.prototype.canUpdate = function () {
            return this.permission.level === TopicMemberUser.LEVELS.admin;
        };

        Topic.prototype.canDelete = function () {
            return this.canUpdate();
        };

        return Topic;
    }]);
