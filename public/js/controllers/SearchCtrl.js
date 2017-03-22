'use strict';

angular
    .module('citizenos')
    .controller('SearchCtrl', ['$scope', '$state', '$log', 'sAuth', 'sSearch', function ($scope, $state, $log, sAuth, sSearch) {
        $log.debug('sSearch');

        $scope.form = {
            searchInput: null
        };

        $scope.searchResults = null;
        $scope.noResults = true;
        $scope.searchString = null;
        $scope.doSearch = function (str) {
            $scope.noResults = true;
            $scope.searchResults = null;
            if (!str || str.length < 3) {
                $scope.searchString = null;
                $scope.app.showSearchResults = false;
                return;
            }
            $scope.searchString = str;
            var include = ['public.topic'];

            if (sAuth.user.loggedIn) {
                include = ['my.topic', 'my.group', 'public.topic'];
            }
            // TODO: Should use some kind of previous request cancellation mechanism while typing fast.
            sSearch
                .searchV2(str, {include: include, limit:5})
                .then(function (result) {
                    $scope.searchResults = result.data.data.results;
                    $scope.app.showSearchResults = true;
                    $scope.app.showNav = false;
                    $scope.app.showSearchFiltersMobile = false;
                    var contexts = Object.keys($scope.searchResults);
                    contexts.forEach(function (context) {
                        var models = Object.keys($scope.searchResults[context]);
                        models.forEach( function (model) {
                            if($scope.searchResults[context][model].count > 0) {
                                $scope.noResults = false;
                            }
                        });
                    });
                }, function (err) {
                    $log.error('SearchCtrl', 'Failed to retrieve search results', err);
                });
        };

        $scope.goToView = function (id, model) {
            if(model == 'topic') {
                $state.go('my.topics.topicId', {topicId: id, filter:null}, {reload:true});
            } else if (model === 'group') {
                $state.go('my.groups.groupId', {groupId: id, filter:'grouped'}, {reload:true});
            }
        };

        $scope.viewMoreResults = function (context, model) {
            if(context && model && $scope.searchResults[context][model].count > $scope.searchResults[context][model].rows.length) {
                var include = context + '.' + model;
                if(model === 'topics') {
                    include = context + '.topic';
                } else if(model ==='groups'){
                    include = context + '.group';
                }

                var page = Math.floor($scope.searchResults[context][model].rows.length/5)+1;

                sSearch
                    .searchV2($scope.searchString, {include: include, limit:5, page: page})
                    .then(function (result) {
                        var moreResults = result.data.data.results;

                        $scope.searchResults[context][model].count = moreResults[context][model].count;
                        moreResults[context][model].rows.forEach(function (row) {
                            $scope.searchResults[context][model].rows.push(row);
                        });

                    }, function (err) {
                        $log.error('SearchCtrl', 'Failed to retrieve search results', err);
                    });
            }
        };

        $scope.$watch(
            function () {
                return $scope.form.searchInput
            }
            , function (newValue) {
                $scope.doSearch(newValue);
            }
        );

        /* Make search area appear when selecting it and letters have been typed */
        $scope.checkLAndO = function () {
            $scope.doSearch($scope.form.searchInput);
        };

    }]);
