    'use strict';

    angular
        .module('citizenos')
        .controller('SearchCtrl', ['$scope', '$state', '$log', 'sAuth', 'sSearch', function ($scope, $state, $log, sAuth, sSearch) {
            $log.debug('sSearch');

            $scope.form = {
                searchInput: null
            };

            $scope.searchResults = {combined: []};
            $scope.noResults = true;

            $scope.viewMoreInProgress = false;
            $scope.moreStr = null;

            $scope.combineResults = function () {
                var contexts = Object.keys($scope.searchResults);
                contexts.forEach(function (context) {
                    var models = Object.keys($scope.searchResults[context]);
                    models.forEach( function (model) {
                        if($scope.searchResults[context][model].count > 0) {
                            $scope.noResults = false;
                            $scope.searchResults[context][model].rows.forEach(function (item, key) {
                                if(item.id === 'viewMore') {
                                    $scope.searchResults[context][model].rows.splice(key,1);
                                }
                            })

                            var currentResults = $scope.searchResults[context][model].rows;
                                if($scope.searchResults[context][model].count > $scope.searchResults[context][model].rows.length) {
                                    currentResults.push({id:'viewMore', model: model, context: context});
                                }
                            $scope.searchResults.combined = $scope.searchResults.combined.concat(currentResults);
                        }
                    });
                });
            };

            $scope.doSearch = function (str) {
                if($scope.viewMoreInProgress) {
                    $scope.form.searchInput = $scope.moreStr;
                    return;
                }

                $scope.noResults = true;

                if (!str || str.length < 3) {
                    $scope.app.showSearchResults = false;
                    return;
                }
                var include = ['public.topic'];

                if (sAuth.user.loggedIn) {
                    include = ['my.topic', 'my.group', 'public.topic'];
                }

                sSearch
                    .searchV2(str, {include: include, limit:5})
                    .then(function (result) {
                        $scope.searchResults = result.data.data.results;
                        $scope.searchResults.combined = [];
                        $scope.app.showSearchResults = true;
                        $scope.app.showNav = false;
                        $scope.app.showSearchFiltersMobile = false;
                        $scope.combineResults();
                    }, function (err) {
                        $log.error('SearchCtrl', 'Failed to retrieve search results', err);
                    });
            };

            $scope.goToView = function (item) {
                if (item) {
                    var model = 'topic';
                    if(item.id  === 'viewMore') {
                        model = 'viewMore';
                        $scope.viewMoreResults(item.context, item.model);
                        return;
                    }
                    if( item.hasOwnProperty('name') ) {
                        model = 'group';
                    }
                    if(model == 'topic') {
                        if(sAuth.user.loggedIn) {
                            $state.go('my.topics.topicId', {topicId: item.id, filter:null}, {reload:true});
                        } else {
                            $state.go('topics.view', {topicId: item.id, filter:null}, {reload:true});
                        }
                    } else if (model === 'group') {
                        $state.go('my.groups.groupId', {groupId: item.id, filter:'grouped'}, {reload:true});
                    }
                } else if (model === 'group') {
                    $state.go('my.groups.groupId', {groupId: id, filter:'grouped'}, {reload:true});
                }
            };

            $scope.viewMoreResults = function (context, model) {
                if($scope.viewMoreInProgress) {
                    return;
                } else {
                    $scope.viewMoreInProgress = true;
                    $scope.moreStr = $scope.form.searchInput;
                }
                if(context && model && $scope.searchResults[context][model].count > $scope.searchResults[context][model].rows.length) {
                    var include = context + '.' + model;
                    if(model === 'topics') {
                        include = context + '.topic';
                    } else if(model ==='groups'){
                        include = context + '.group';
                    }

                    var page = Math.floor($scope.searchResults[context][model].rows.length/5)+1;

                    sSearch
                        .searchV2($scope.moreStr, {include: include, limit:5, page: page})
                        .then(function (result) {
                            var moreResults = result.data.data.results;

                            $scope.searchResults[context][model].count = moreResults[context][model].count;
                            moreResults[context][model].rows.forEach(function (row) {
                                $scope.searchResults[context][model].rows.push(row);
                            });

                            $scope.combineResults();

                            $scope.viewMoreInProgress = false;

                        }, function (err) {
                            $log.error('SearchCtrl', 'Failed to retrieve search results', err);
                        });
                }
            };

            $scope.closeSearchArea = function () {
                app.showSearchResults = false;
                $scope.form.searchInput = null;
                $scope.searchResults.combined = [];

            }

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
