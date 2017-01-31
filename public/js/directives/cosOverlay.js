angular
    .module('citizenos')
    .directive('cosOverlay', ["$compile", function($compile) {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="item_link blue_link" ng-click="open()">{{title}}</div>',
        scope: {
            description: "@",
            title: "@",
            save: "&",
            innerdirective: '@',
            enableToggle: '='
        },
        controller: ["$scope", "$document", "$http", "$element", function($scope, $document ,$http, $element) {
            $scope.items = [];
            $scope.hide = false;
            $scope.content = '';
            $scope.template = '/views/modals/cosOverlay.html' ;
            $scope.dialog = null;

            this.setTemplate = function (html) {
                console.log(html);
                $scope.template = html
            };

            $scope.doSaveAction = function () {
                $scope.save();
                $scope.closeThisDialog();
            };

            $scope.closeThisDialog = function () {
                $scope.dialog.remove();
            };

            $scope.open = function () {
                $http.get($scope.template).then( function (response) {
                    $scope.dialog = $compile(response.data.toString())($scope);
                    var directive  = $compile('<div '+$scope.innerdirective+'></div>')($scope);
                    var dialogDivs = $scope.dialog.find('div');

                    for(var i=0; i < dialogDivs.length; i++) {
                        if(angular.element(dialogDivs[i]).hasClass('directive')) {
                            angular.element(dialogDivs[i]).replaceWith(directive);
                            break;
                        }
                    }
                    $element.parent().append($scope.dialog);
                });
            }
        }]
    };
}]);
