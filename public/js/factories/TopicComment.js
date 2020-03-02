angular
    .module('citizenos')
    .factory('TopicComment', ['$log', '$resource', 'sLocation', 'sAuth', function ($log, $resource, sLocation, sAuth) {
        $log.debug('citizenos.factory.TopicComment');

        var path = '/api/:prefix/:userId/topics/:topicId/comments/:commentId';

        // Transform an argument (comment) tree to 2 levels - bring all replies and their replies to same level.
        function flattenTree (parentNode, currentNode) {
            if (currentNode.replies.rows.length > 0) {
                if (parentNode != currentNode) {
                    parentNode.replies.rows = parentNode.replies.rows.concat(currentNode.replies.rows);
                }
                currentNode.replies.rows.forEach(function (reply) {
                    flattenTree(parentNode, reply);
                });
            } else {
                return;
            }
        }

        var TopicComment = $resource(
            sLocation.getAbsoluteUrlApi(path),
            {
                topicId: '@topicId',
                commentId: '@id'
            },
            {
                save: {
                    method: 'POST',
                    params: {
                        topicId: '@topicId',
                        commentId: '@id',
                        prefix: sAuth.getUrlPrefix,
                        userId: sAuth.getUrlUserId
                    },
                    transformRequest: function (data) {
                        return angular.toJson(data);
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                query: {
                    isArray: true,
                    url: sLocation.getAbsoluteUrlApi('/api/:prefix/:userId/topics/:topicId/comments'),
                    params: {
                        topicId: '@topicId',
                        commentId: '@id',
                        prefix: sAuth.getUrlPrefix,
                        userId: sAuth.getUrlUserId
                    },
                    transformResponse: function (data, headerGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            var result = angular.fromJson(data).data.rows;
                            result.forEach(function (row, k) {
                                row.count = angular.fromJson(data).data.count;
                                flattenTree(row, row);
                            });

                            return result;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                update: {
                    method: 'PUT',
                    params: {
                        topicId: '@topicId',
                        commentId: '@id',
                        prefix: sAuth.getUrlPrefix,
                        userId: sAuth.getUrlUserId
                    },
                    transformRequest: function (data) {
                        var requestObject = {};
                        _.forEach(data.toJSON(), function (value, key) { // Remove all object properties as we have none we care about in the server side
                            if (!_.isObject(value)) {
                                requestObject[key] = value;
                            }
                        });
                        return angular.toJson(requestObject);
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.fromJson(data);
                        }
                    }
                },
                vote: {
                    method: 'POST',
                    url: sLocation.getAbsoluteUrlApi('/api/topics/:topicId/comments/:commentId/votes'),
                    transformRequest: function (data) {
                        return angular.toJson(data);
                    }
                },
                report: {
                    method: 'POST',
                    params: {
                        topicId: '@topicId',
                        commentId: '@id'
                    },
                    url: sLocation.getAbsoluteUrlApi('/api/topics/:topicId/comments/:commentId/reports'),
                    transformRequest: function (data) {
                        return angular.toJson(data);
                    }
                },
                delete: {
                    method: 'DELETE',
                    params: {
                        topicId: '@topicId',
                        commentId: '@id',
                        prefix: sAuth.getUrlPrefix,
                        userId: sAuth.getUrlUserId
                    },
                    transformResponse: function (data, headersGetter, status) {
                        if (status > 0 && status < 400) { // TODO: think this error handling through....
                            return angular.fromJson(data).data;
                        } else {
                            return angular.toJson(data);
                        }
                    }
                }
            }
        );

        TopicComment.prototype.isEdited = function () {
            return this.edits.length > 1;
        };

        TopicComment.prototype.isVisible = function () {
            return (!this.deletedAt && !this.showDeletedComment) || (this.deletedAt && this.showDeletedComment);
        };

        TopicComment.prototype.canEdit = function () {
            return (this.creator.id === sAuth.user.id && !this.deletedAt);
        };

        TopicComment.prototype.canDelete = function () {
            return this.canEdit();
        };

        TopicComment.prototype.isVisible = function () {
            return (!this.deletedAt && !this.showDeletedComment) || (this.deletedAt && this.showDeletedComment);
        };

        TopicComment.COMMENT_TYPES = {
            pro: 'pro',
            con: 'con',
            reply: 'reply'
        };

        TopicComment.COMMENT_REPORT_TYPES = {
            abuse: 'abuse', // is abusive or insulting
            obscene: 'obscene', // contains obscene language
            spam: 'spam', // contains spam or is unrelated to topic
            hate: 'hate', // contains hate speech
            netiquette: 'netiquette', // infringes (n)etiquette
            duplicate: 'duplicate' // duplicate
        };

        TopicComment.COMMENT_ORDER_BY = {
            rating: 'rating',
            popularity: 'popularity',
            date: 'date'
        };

        return TopicComment;
    }]);
