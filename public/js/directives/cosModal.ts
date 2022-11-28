/**
 *   Modal directive for angular
 *   Default template has save and cancel actions, but custom template may be used without these actions
 *   NOTE! If directive in cos-modal-content needs scope variable for initialization replace scope variable name with cosModalValue
 */
import * as angular from 'angular';
angular
    .module('citizenos')
    .directive('cosModal', ['$compile', function ($compile) {
        return {
            restrict: 'A',
            transclude: true,
            require: 'cosModalLink',
            template: '<div ng-transclude></div>',
            replace: true,
            scope: {
                template: '@',
                save: '&',
                model: '=ngModel',
                cosModalTitle: '=',
                cosModalDescription: '=?'
            },
            controller: ['$scope', '$templateCache', '$element', function ($scope, $templateCache, $element) {
                $scope.cosModalValue = $scope.model;

                if (!$scope.template) {
                    $scope.template = '/views/directives/cos_modal.html';
                }

                $scope.dialog = null;
                this.setLink = function (link) {
                    $element.append(link);
                };

                this.setModalContent = function (content) {
                    $scope.content = content;
                };

                $scope.cosModalSaveAction = function () {
                    if ($element.parent().html().indexOf('cos-toggle') > -1 && $scope.cosToggleStatus() === true) {

                        if (typeof $scope.cosModalValue === 'number') {
                            $scope.cosModalValue = 0;
                        } else {
                            $scope.cosModalValue = null;
                        }

                    }
                    $scope.model = $scope.cosModalValue;
                    $scope.save();

                    $scope.cosModalClose();
                };

                $scope.cosModalClose = function () {
                    $scope.cosModalValue = $scope.model;
                    $scope.dialog.remove();
                };

                this.modalOpen = function () {
                    $scope.cosModalOpen();
                };

                $scope.cosModalOpen = function () {
                    var template = $templateCache.get($scope.template);
                    $scope.dialog = $compile(template)($scope);
                    var dialogDivs = $scope.dialog.find('div');

                    for (var i = 0; i < dialogDivs.length; i++) {
                        if (angular.element(dialogDivs[i]).hasClass('cos_modal_content')) {
                            angular.element(dialogDivs[i]).replaceWith($compile($scope.content)($scope));
                        }
                    }
                    $element.parent().append($scope.dialog);
                }
            }]
        };
    }]);

angular
    .module('citizenos')
    .directive('cosModalLink', function () {
        return {
            require: '^cosModal',
            link: function (scope, element, attrs, controller) {
                element.off();
                element.on('click', function (e) {
                    scope.$apply(function () {
                        controller.modalOpen();
                    });
                });
                controller.setLink(element);
            }
        };
    });

angular
    .module('citizenos')
    .directive('cosModalContent', function () {
        return {
            require: '^cosModal',
            link: function (scope, element, attrs, controller) {
                var content = angular.copy(element);
                controller.setModalContent(content[0].innerHTML);
                element.remove();
            }
        };
    });
