'use strict';

/**
 *  Angular App
 *
 *  @see https://angularjs.org/
 */

var app = angular.module('citizenos', ['ngRoute', 'ngTouch']);

app.config(function ($routeProvider, $locationProvider) {

    $locationProvider.html5Mode(true);

    $routeProvider
        .when('/', {
            controller: 'HomeCtrl',
            templateUrl: '../views/no_topics.html'
        });


});

/* Set global w_width variable for responsive dom hiding */
app.directive('resize', function ($window, $rootScope) {
    return function (scope, element) {

        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return {
                'w': window.innerWidth
            };
        };

        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            $rootScope.w_width = newValue.w;
            if ($rootScope.w_width > 1024) {
                $rootScope.nav_open = false;
            }
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
});

/* Search dummy data */
app.controller('search', ['$scope', function($scope) {

    $scope.results = [
        
        {"group_name": "My Topics 1",
            "group_results" : [{
                    "result_titles" : ["Subjects", "Categories", "Creator"],
                    "result_links" : [
                        { "link" : {
                            "link_name" : "A greener city garden will improve conditions in our neighbourhood",
                            "link_href" : "#",
                        }},
                        { "link" : {
                            "link_name1" : "A greener city garden will improve conditions in our neighbourhood 2",
                            "link_href1" : "#",
                            "link_name2" : "Ecology, Nature, Something else 2",
                            "link_href2" : "#",
                            "link_name3" : "John Doe 2",
                            "link_href3" : "#",
                        }},
                    
                    ]
            }]
        },
    
    ];
    
}]);