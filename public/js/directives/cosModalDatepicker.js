angular
    .module('citizenos')
    .directive('cosModalDatepicker', ['$log', '$compile', '$templateCache', function ($log, $compile, $templateCache) {
        return {
            restrict: 'A',
            transclude: true,
            template: '<div ng-transclude ng-click="cosModalOpen()"></div>',
            scope: {
                model: '=ngModel',
                cosModalOnSave: '&', // Expects a function that returns a Promise
                cosModalTitle: '=',
                cosModalDescription: '=?'
            },
            controller: ['$scope', '$element', '$document', function ($scope, $element, $document) {
                $log.debug('cosModalDatepicker.controller', arguments);

                $scope.cosModelValue = $scope.model ? $scope.model : new Date(); // So that original model is not modified
                $scope.cosModalIsDateSelected = !!$scope.cosModelValue;

                $scope.datePickerAfter = new Date();

                $scope.isModalVisible = false;

                $scope.cosModalOpen = function () {
                    $scope.isModalVisible = true;
                };

                $scope.cosModalClose = function () {
                    $scope.isModalVisible = false;
                };

                $scope.cosModalSaveAction = function () {
                    $scope.model = $scope.cosModalIsDateSelected ? $scope.cosModelValue : null;
                    $scope.cosModalOnSave()()
                        .then(function () {
                            $scope.cosModalClose();
                        });
                }
            }],
            link: function (scope, element, attrs) {
                $log.debug('cosModalDatepicker.link', arguments);
                var $dialog; // Dialog JQLite element

                var showModal = function () {
                    var template = $templateCache.get('/views/directives/cos_modal_datepicker.html');
                    $dialog = $compile(template)(scope);
                    angular.element(document.body).append($dialog);
                };

                var hideModal = function () {
                    $dialog.remove();
                };

                scope.$watch(
                    function () {
                        return scope.isModalVisible
                    }, function (newVal, oldVal) {
                        if (newVal === oldVal) return;

                        if (newVal) {
                            showModal();
                        } else {
                            hideModal();
                        }
                    });
            }
        };
    }]);
