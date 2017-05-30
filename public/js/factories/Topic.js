angular
    .module('citizenos')
    .factory('Topic', ['$log', '$resource', 'sLocation', 'sAuth', 'TopicMemberUser', 'TopicVote', 'Vote', function ($log, $resource, sLocation, sAuth, TopicMemberUser, TopicVote, Vote) {
        $log.debug('citizenos.factory.Topic');

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

        var Topic = $resource(
            sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId'),
            {topicId: '@id', prefix: getUrlPrefix, userId: getUrlUser},
            {
                get: {
                    method: 'GET',
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) {
                            var topic = angular.fromJson(data).data;
                            if ((topic.vote && topic.vote.id) || topic.voteId) {
                                if(topic.vote){
                                    topic.vote = new TopicVote(topic.vote);
                                } else {
                                    topic.vote = new TopicVote({id:topic.voteId, topicId:topic.id});
                                }
                            }
                            return topic;
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
                                if ((topic.vote && topic.vote.id) || topic.voteId) {
                                    if(topic.vote){
                                        topic.vote = new TopicVote(topic.vote);
                                    } else {
                                        topic.vote = new TopicVote({topicId:topic.id, id:topic.voteId});
                                    }
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
                patch: {
                    method: 'PATCH'
                },
                save: {
                    method: 'POST',
                    transformResponse: function (data) {
                        return angular.fromJson(data).data;
                    }
                },
                delete: {
                    method: 'DELETE',
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

        Topic.STATUSES = {
            inProgress: 'inProgress', // Being worked on
            voting: 'voting', // Is being voted which means the Topic is locked and cannot be edited.
            followUp: 'followUp', // Done editing Topic and executing on the follow up plan.
            closed: 'closed' // Final status - Topic is completed and no editing/reopening/voting can occur.
        };

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
            return (this.permission && this.permission.level === TopicMemberUser.LEVELS.admin);
        };

        Topic.prototype.canEdit = function () {
            return [TopicMemberUser.LEVELS.admin, TopicMemberUser.LEVELS.edit].indexOf(this.permission.level) > -1;
        };

        Topic.prototype.canDelete = function () {
            return this.canUpdate();
        };

        Topic.prototype.canVote = function () {
            return this.vote && ((this.permission.level !== TopicMemberUser.LEVELS.none || (this.vote.authType === Vote.VOTE_AUTH_TYPES.hard && this.visibility === Topic.VISIBILITY.public)) && this.status === Topic.STATUSES.voting);
        };

        Topic.prototype.canDelegate = function () {
            return (this.canVote() && this.vote.delegationIsAllowed === true);
        };

        Topic.prototype.canSendToFollowUp = function () {
            return this.canUpdate() && this.vote && this.vote.id && this.status !== Topic.STATUSES.followUp;
        };

        Topic.prototype.canSendToVote = function () {
            return this.canUpdate() && [Topic.STATUSES.voting, Topic.STATUSES.closed].indexOf(this.status) < 0;
        };

        Topic.prototype.hasVoteEnded = function () {
            if ([Topic.STATUSES.followUp, Topic.STATUSES.closed].indexOf(this.status) > -1) {
                return true;
            }

            return this.vote && this.vote.endsAt && new Date() > new Date(this.vote.endsAt);
        };

        return Topic;
    }]);
