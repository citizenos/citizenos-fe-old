angular
    .module('citizenos')
    .directive('cosModalDatepicker', ['$log', '$compile', '$templateCache', '$http', '$timeout', function ($log, $compile, $templateCache, $http, $timeout) {
        return {
            restrict: 'A',
            transclude: true,
            template: '<div ng-transclude ng-click="cosModalOpen(model)"></div>',
            scope: {
                date: '=?',
                model: '=ngModel',
                cosModalOnSave: '&', // Expects a function that returns a Promise
                cosModalTitle: '=?',
                cosModalDescription: '=?'
            },
            controller: ['$scope', '$element', '$document' , '$translate', function ($scope, $element, $document, $translate) {
                $log.debug('cosModalDatepicker.controller', arguments);

                $scope.form = {
                    endsAt: {
                        date: null,
                        min: 0,
                        h: 0,
                        timezone: moment().utcOffset()/60,
                        timeFormat: 24
                    },
                    deadline: $scope.model,
                    numberOfDaysLeft: 0
                };

                $translate($scope.cosModalDescription)
                    .then(function (newVal) {
                        $scope.cosModalDescription = newVal;
                    });
                $translate($scope.cosModalTitle)
                    .then(function (newVal) {
                        $scope.cosModalTitle = newVal;
                    });

                $scope.datePickerMin = new Date();

                $scope.isModalVisible = false;

                $scope.cosModalOpen = function (date) {
                    $scope.isModalVisible = true;
                    console.log(date);
                    if (date) {
                        $scope.setFormValues();
                    }
                };

                $scope.cosModalClose = function () {
                    $scope.isModalVisible = false;
                };

                $scope.cosModalSaveAction = function () {
                    // The 'add' and 'subtract' - because the picked date is inclusive
                    $scope.model = $scope.cosModalIsDateSelected ? $scope.form.deadline : null;

                    $timeout(function () {
                        $scope.cosModalOnSave()()
                            .then(function () {
                                $scope.cosModalClose();
                            });
                    });
                };
                $scope.timezones = [
                    {name: "Etc/GMT+0", value: 0},
                    {name: "Etc/GMT+1", value: 1},
                    {name: "Etc/GMT+2", value: 2},
                    {name: "Etc/GMT+3", value: 3},
                    {name: "Etc/GMT+4", value: 4},
                    {name: "Etc/GMT+5", value: 5},
                    {name: "Etc/GMT+6", value: 6},
                    {name: "Etc/GMT+7", value: 7},
                    {name: "Etc/GMT+8", value: 8},
                    {name: "Etc/GMT+9", value: 9},
                    {name: "Etc/GMT+10", value: 10},
                    {name: "Etc/GMT+11", value: 11},
                    {name: "Etc/GMT+12", value: 12},
                    {name: "Etc/GMT-0", value: -0},
                    {name: "Etc/GMT-1", value: -1},
                    {name: "Etc/GMT-2", value: -2},
                    {name: "Etc/GMT-3", value: -3},
                    {name: "Etc/GMT-4", value: -4},
                    {name: "Etc/GMT-5", value: -5},
                    {name: "Etc/GMT-6", value: -6},
                    {name: "Etc/GMT-7", value: -7},
                    {name: "Etc/GMT-8", value: -8},
                    {name: "Etc/GMT-9", value: -9},
                    {name: "Etc/GMT-10", value: -10},
                    {name: "Etc/GMT-11", value: -11},
                    {name: "Etc/GMT-12", value: -12},
                    {name: "Etc/GMT-13", value: -13},
                    {name: "Etc/GMT-14", value: -14}
                ];

                $scope.HCount = 24;

                $scope.formatTime = function (val) {
                    if (val < 10) {
                        val = '0' + val;
                    }
                }

                $scope.getTimeZoneName = function (value) {
                    return ($scope.timezones.find(function(item) {return item.value === value})).name;
                };

                $scope.setTimeFormat = function () {
                    $scope.HCount = 24;

                    if ($scope.$parent.$parent.form.timeFormat !== 24) {
                        $scope.HCount = 12;
                        if ($scope.form.endsAt.h > 12) {
                            $scope.form.endsAt.h -= 12;
                        }
                    }
                    $scope.setEndsAtTime();
                };

                $scope.daysToVoteEnd = function () {
                    if ($scope.form.deadline) {
                        if ($scope.form.deadline === true) {
                            $scope.form.deadline = new Date();
                        }
                        var endDate = $scope.form.deadline;
                        var diffTime = new Date(endDate).getTime() - new Date().getTime();
                        $scope.form.numberOfDaysLeft = Math.ceil(diffTime / (1000 * 3600 * 24)); // Diff in days
                    }
                    return $scope.form.numberOfDaysLeft;
                };

                $scope.setEndsAtTime = function () {
                    $scope.form.endsAt.date = $scope.form.endsAt.date || new Date();
                    $scope.form.deadline = moment($scope.form.endsAt.date);
                    $scope.form.deadline.utcOffset($scope.form.endsAt.timezone, true);
                    var hour = $scope.form.endsAt.h;
                    if ($scope.form.endsAt.timeFormat === 'PM') { hour += 12; }
                    $scope.form.deadline.hour(hour);
                    $scope.form.deadline.minute($scope.form.endsAt.min);
                };

                $scope.setFormValues = function () {
                    $scope.form.deadline = $scope.model;
                    $scope.form.endsAt.date = $scope.model;
                    $scope.form.endsAt.min = moment($scope.form.deadline).minutes();
                    $scope.form.endsAt.h = moment($scope.form.deadline).hours();
                    $scope.form.endsAt.timezone = moment($scope.form.deadline).utcOffset()/60;
                    $scope.cosModalIsDateSelected = true;
                };

                $scope.$watch(
                    function () {
                        return $scope.form.endsAt.date
                    }
                    , function (newValue, oldValue) {
                        if (newValue && newValue !== oldValue) {
                            $scope.setEndsAtTime();
                        }
                    }
                );

                $scope.$watch(function () {
                    return $scope.cosModalIsDateSelected
                }, function (newValue) {
                    if (newValue === true) {
                        if (!$scope.model) {
                            $scope.setEndsAtTime();
                        } else {
                            $scope.setFormValues();
                        }
                    }
                })
            }],
            link: function (scope, element, attrs) {
                $log.debug('cosModalDatepicker.link', arguments);
                var $dialog; // Dialog JQLite element

                var showModal = function () {
                    $http
                        .get('/views/directives/cos_modal_datepicker.html', {
                                  ignoreLoadingBar: true
                        })
                        .then(function (response) {
                                var template = response.data;
                                $dialog = $compile(template)(scope);
                                angular.element(document.body).append($dialog);
                            },
                            function (err) {
                                $log.error('error', err);
                            }
                        );

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
