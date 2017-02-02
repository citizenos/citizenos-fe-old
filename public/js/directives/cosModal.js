angular
    .module('citizenos')
    .directive('cosModal', ['$compile', function($compile) {
    return {
        restrict: 'E',
        transclude: true,
        template: '<div ng-transclude></div>',
        replace: true,
        scope: {
            template: '@',
            save: '&',
            toggle: '=',
            ngModel: '=',
        },
        controller: ['$scope', '$templateCache', '$element', function($scope, $templateCache, $element) {
            $scope.item = $scope.ngModel;
            this.templateHtml = '';

            if(!$scope.template){
                $scope.template = '/views/modals/cosModal.html';
            }

            this.compileTemplate = function () {
                this.templateHtml = $compile($scope.template)($scope);
            }

            $scope.dialog = null;
            this.setLink = function (link) {
                $element.append(link);
            }

            this.setModalContent = function (content) {
                $scope.content = content;
            }

            this.setModalTitle = function (title) {
                $scope.title = title;
            }

            $scope.cosModalSaveAction = function () {
                if(!angular.isDefined($scope.toggle) || $scope.toggle ===true) {
                    $scope.ngModel = $scope.item;
                    $scope.save();
                }
                $scope.cosModalClose();
            };

            $scope.cosModalClose = function () {
                $scope.item = $scope.ngModel;
                $scope.dialog.remove();
            };

            $scope.switchToggle = function () {
                $scope.toggle = !$scope.toggle;
            }

            this.modalOpen  = function () {
                $scope.cosModalOpen();
            }
            $scope.cosModalOpen = function () {
                var template = $templateCache.get($scope.template);
                $scope.dialog = $compile(template)($scope);
                var dialogDivs = $scope.dialog.find('div');

                for(var i=0; i < dialogDivs.length; i++) {
                    if(angular.element(dialogDivs[i]).hasClass('cosModalTitle')) {
                        angular.element(dialogDivs[i]).replaceWith($compile($scope.title)($scope));
                    }

                    if(angular.element(dialogDivs[i]).hasClass('cosModalContent')) {
                        angular.element(dialogDivs[i]).replaceWith($compile($scope.content)($scope));
                    }
                }
                $element.parent().append($scope.dialog);
            }
        }],
    };
}]);

angular
    .module('citizenos')
    .directive('cosModalLink', function() {
    return {
        require: '^cosModal',
        link: function(scope, element, attrs, controller) {
            element.bind('click', function(e) {
                scope.$apply(function() { controller.modalOpen(); });
            });
            controller.setLink(element);
        }
    };
});

angular
    .module('citizenos')
    .directive('cosModalContent', function() {
    return {
        require: '^cosModal',
        link: function(scope, element, attrs, controller) {
            var content = angular.copy(element);
            controller.setModalContent(content[0].innerHTML);
            element.remove();
        }
    };
});

angular
    .module('citizenos')
    .directive('cosModalTitle', function() {
    return {
        require: '^cosModal',
        link: function(scope, element, attrs, controller) {
            var title = angular.copy(element);
            console.log(title);
            controller.setModalTitle(title[0].innerHTML);
            element.remove();
        }
    };
});
