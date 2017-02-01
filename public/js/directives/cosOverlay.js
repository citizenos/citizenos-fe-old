angular
    .module('citizenos')
    .directive('cosOverlay', ["$compile", function($compile) {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="item_content"><div class="item_text">{{value}}</div><div class="v_line"></div><div class="item_link blue_link" ng-click="open()">{{link}}</div></div>',
        scope: {
            modalDescription: "@",
            modalTitle: "@",
            link: "@",
            value: "=",
            save: "&",
            innerdirective: '@',
            toggle: '='
        },
        controller: ["$scope", "$document", "$http", "$element", function($scope, $document ,$http, $element) {
            $scope.item = $scope.value;
            console.log($scope.value);
            $scope.showToggle = angular.isDefined($scope.toggle);
            $scope.hide = false;
            $scope.content = '';
            $scope.template = '/views/modals/cosOverlay.html' ;
            $scope.dialog = null;

            this.setTemplate = function (html) {
                console.log(html);
                $scope.template = html
            };

            $scope.doSaveAction = function () {
                if(!angular.isDefined($scope.toggle) || $scope.toggle ===true) {
                    $scope.value = $scope.item;
                    $scope.save();
                }
                $scope.closeThisDialog();
            };

            $scope.closeThisDialog = function () {
                $scope.item = $scope.value;
                $scope.dialog.remove();
            };

            $scope.switchToggle = function () {
                $scope.toggle = !$scope.toggle;
            }

            $scope.open = function () {
                $http.get($scope.template).then( function (response) {
                    $scope.dialog = $compile(response.data.toString())($scope);
                    if($scope.showToggle) {
                        $scope.innerdirective += ' disabled="toggle" ';
                    }
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
