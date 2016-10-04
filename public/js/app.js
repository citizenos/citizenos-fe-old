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
    {
		"groupName": "My Topics 0",
		"groupResults": [
			{
				"resultTitles": []
            }
        ]
    },
	{
		"groupName": "My Topics 1",
		"groupResults": [
			{
				"resultTitles": [
					"Subjects",
					"Categories",
					"Creator"
				],
				"resultLinks": [
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 1",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 2",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 3",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 4",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 5",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 6",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
				]
			},
			{
				"resultTitles": [
					"Users"
				],
				"resultLinks": [
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "John Doe 1",
										"linkHref": "#11"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "John Doe 2",
										"linkHref": "#11"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "John Doe 3",
										"linkHref": "#11"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "John Doe 4",
										"linkHref": "#11"
									}
								]
							},
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "John Doe 5",
										"linkHref": "#11"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "John Doe 6",
										"linkHref": "#11"
									}
								]
							}
						]
					},
				]
			},
			{
				"resultTitles": [
					"Groups"
				],
				"resultLinks": [
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "Greenpeace 1",
										"linkHref": "#11"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "Greenpeace 2",
										"linkHref": "#11"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "Greenpeace 3",
										"linkHref": "#11"
									}
								]
							}
						]
					}
				]
			}
		]
	},
	{
		"groupName": "My Topics 2",
		"groupResults": [
			{
				"resultTitles": [
					"Subjects",
					"Categories",
					"Creator"
				],
				"resultLinks": [
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 1",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 2",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 3",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 4",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 5",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
					{
						"linksWrap": [
							{
								"links": [
									{
										"linkName": "A greener city garden will improve conditions in our neighbourhood 6",
										"linkHref": "#11"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "Ecology",
										"linkHref": "#21"
									},
									{
										"linkName": "Nature",
										"linkHref": "#22"
									},
									{
										"linkName": "Something else",
										"linkHref": "#23"
									}
								]
							},
							{
								"links": [
									{
										"linkName": "John Doe",
										"linkHref": "#31"
									}
								]
							}
						]
					},
				]
			}
		]
	},
]
    
}]);