'use strict';

/**
 *  Angular App
 *
 *  @see https://angularjs.org/
 */

var app = angular.module('citizenos', ['ngRoute', 'ngTouch', 'ngDialog', 'focus-if']);

app.constant('cosConfig', {
    language: {
        default: 'en',
        list: {
            en: 'English',
            et: 'Eesti',
            ru: 'Pусский'
        },
        debug: 'dbg'
    }
});

app.config(function ($routeProvider, $locationProvider, ngDialogProvider) {

    $locationProvider.html5Mode(true);

    $routeProvider
        .when('/', {
            controller: 'HomeCtrl',
            templateUrl: '../views/home.html'
        })
        
        .when('/topics', {
            controller: 'HomeCtrl',
            templateUrl: '../views/no_topics.html'
        });

    ngDialogProvider.setDefaults({
        overlay: false,
        showClose: false,
        trapFocus: false,
        disableAnimation: true,
        closeByNavigation: true,
        closeByDocument: true,
        closeByEscape: true
    });

});

/* Close dropdowns when clicked outside of it */ 
app.directive('dropdown', function($document) {
	return {
		restrict: "A",
		link: function(scope, elem, attr) {
			
			elem.bind('click', function() {
				elem.toggleClass('dropdown_active');
				elem.addClass('active_recent');
			});
			
			$document.bind('click', function() {
				if(!elem.hasClass('active_recent')) {
					elem.removeClass('dropdown_active');
				}
				elem.removeClass('active_recent');
			});
			
		}
	}
});

/* Set global wWidth variable for responsive dom hiding */
app.directive('resize', function ($window, $rootScope) {
    return function (scope, element) {

        var w = angular.element($window);
        scope.getWindowDimensions = function () {
            return {
                'w': window.innerWidth
            };
        };

        scope.$watch(scope.getWindowDimensions, function (newValue, oldValue) {
            $rootScope.wWidth = newValue.w;
            if ($rootScope.wWidth > 1024) {
                scope.app.showNav = false; // TODO: Bad separation of concerns that does not make this directive reusable but will do for now.
            }
        }, true);

        w.bind('resize', function () {
            scope.$apply();
        });
    }
});
