// https://github.com/g00fy-/angular-datepicker/releases/tag/2.0.3
// NOTE: Modified - removed dateRange stuff, removed default template
'use strict';
import * as angular from 'angular';
import * as moment from 'moment-timezone';

(function(angular){
    /* global moment */
    var Module = angular.module('datePicker', []);

    Module.constant('datePickerConfig', {
        template: 'templates/datepicker.html',
        view: 'month',
        views: ['year', 'month', 'date', 'hours', 'minutes'],
        momentNames: {
            year: 'year',
            month: 'month',
            date: 'day',
            hours: 'hours',
            minutes: 'minutes'
        },
        viewConfig: {
            year: ['years', 'isSameYear'],
            month: ['months', 'isSameMonth'],
            hours: ['hours', 'isSameHour'],
            minutes: ['minutes', 'isSameMinutes'],
        },
        step: 5
    });

//Moment format filter.
    Module.filter('mFormat', function () {
        return function (m, format, tz) {
            if (!(moment.isMoment(m))) {
                return moment(m).format(format);
            }
            return tz ? moment.tz(m, tz).format(format) : m.format(format);
        };
    });

    Module.directive('datePicker', ['datePickerConfig', 'datePickerUtils', function datePickerDirective(datePickerConfig, datePickerUtils) {

        //noinspection JSUnusedLocalSymbols
        return {
            // this is a bug ?
            require: '?ngModel',
            template: '<div ng-include="template"></div>',
            scope: {
                model: '=datePicker',
                minDate: '=?',
                maxDate: '=?'
            },
            link: function (scope, element, attrs, ngModel) {
                function prepareViews() {
                    scope.views = datePickerConfig.views.concat();
                    scope.view = attrs.view || datePickerConfig.view;

                    scope.views = scope.views.slice(
                        scope.views.indexOf(attrs.maxView || 'year'),
                        scope.views.indexOf(attrs.minView || 'minutes') + 1
                    );

                    if (scope.views.length === 1 || scope.views.indexOf(scope.view) === -1) {
                        scope.view = scope.views[0];
                    }
                }

                function getDate(name) {
                    return datePickerUtils.getDate(scope, attrs, name);
                }

                datePickerUtils.setParams(attrs.timezone);

                var arrowClick = false,
                    tz = scope.tz = attrs.timezone,
                    createMoment = datePickerUtils.createMoment,
                    eventIsForPicker = datePickerUtils.eventIsForPicker,
                    step = parseInt(attrs.step || datePickerConfig.step, 10),
                    partial = !!attrs.partial,
                    minDate = getDate('minDate'),
                    maxDate = getDate('maxDate'),
                    pickerID = element[0].id,
                    now = scope.now = createMoment(),
                    selected = scope.date = createMoment(scope.model || now),
                    autoclose = attrs.autoClose === 'true';

                if (!scope.model) {
                    selected.minute(Math.ceil(selected.minute() / step) * step).second(0);
                }

                scope.template = attrs.template || datePickerConfig.template;

                scope.watchDirectChanges = attrs.watchDirectChanges !== undefined;
                scope.callbackOnSetDate = attrs.dateChange ? datePickerUtils.findFunction(scope, attrs.dateChange) : undefined;

                prepareViews();

                scope.setView = function (nextView) {
                    if (scope.views.indexOf(nextView) !== -1) {
                        scope.view = nextView;
                    }
                };

                scope.selectDate = function (date) {
                    if (attrs.disabled) {
                        return false;
                    }
                    if (isSame(scope.date, date)) {
                        date = scope.date;
                    }
                    date = clipDate(date);
                    if (!date) {
                        return false;
                    }
                    scope.date = date;

                    var nextView = scope.views[scope.views.indexOf(scope.view) + 1];
                    if ((!nextView || partial) || scope.model) {
                        setDate(date);
                    }

                    if (nextView) {
                        scope.setView(nextView);
                    } else if (autoclose) {
                        element.addClass('hidden');
                        scope.$emit('hidePicker');
                    } else {
                        prepareViewData();
                    }
                };

                function setDate(date) {
                    if (date) {
                        scope.model = date;
                        if (ngModel) {
                            ngModel.$setViewValue(date);
                        }
                    }
                    scope.$emit('setDate', scope.model, scope.view);

                    //This is duplicated in the new functionality.
                    if (scope.callbackOnSetDate) {
                        scope.callbackOnSetDate(attrs.datePicker, scope.date);
                    }
                }

                function update() {
                    var view = scope.view;
                    datePickerUtils.setParams(tz);

                    if (scope.model && !arrowClick) {
                        scope.date = createMoment(scope.model);
                        arrowClick = false;
                    }

                    var date = scope.date;

                    switch (view) {
                        case 'year':
                            scope.years = datePickerUtils.getVisibleYears(date);
                            break;
                        case 'month':
                            scope.months = datePickerUtils.getVisibleMonths(date);
                            break;
                        case 'date':
                            scope.weekdays = scope.weekdays || datePickerUtils.getDaysOfWeek();
                            scope.weeks = datePickerUtils.getVisibleWeeks(date);
                            break;
                        case 'hours':
                            scope.hours = datePickerUtils.getVisibleHours(date);
                            break;
                        case 'minutes':
                            scope.minutes = datePickerUtils.getVisibleMinutes(date, step);
                            break;
                    }

                    prepareViewData();
                }

                function watch() {
                    if (scope.view !== 'date') {
                        return scope.view;
                    }
                    return scope.date ? scope.date.month() : null;
                }

                scope.$watch(watch, update);

                if (scope.watchDirectChanges) {
                    scope.$watch('model', function () {
                        arrowClick = false;
                        update();
                    });
                }

                function prepareViewData() {
                    var view = scope.view,
                        date = scope.date,
                        classes = [], classList = '',
                        i, j;

                    datePickerUtils.setParams(tz);

                    if (view === 'date') {
                        var weeks = scope.weeks, week;
                        for (i = 0; i < weeks.length; i++) {
                            week = weeks[i];
                            classes.push([]);
                            for (j = 0; j < week.length; j++) {
                                classList = '';
                                if (datePickerUtils.isSameDay(date, week[j])) {
                                    classList += 'selected';
                                }
                                if (isNow(week[j], view)) {
                                    classList += ' now';
                                }
                                //if (week[j].month() !== date.month()) classList += ' disabled';
                                if (week[j].month() !== date.month() || !inValidRange(week[j])) {
                                    classList += ' disabled';
                                }
                                classes[i].push(classList);
                            }
                        }
                    } else {
                        var params = datePickerConfig.viewConfig[view],
                            dates = scope[params[0]],
                            compareFunc = params[1];

                        for (i = 0; i < dates.length; i++) {
                            classList = '';
                            if (datePickerUtils[compareFunc](date, dates[i])) {
                                classList += 'selected';
                            }
                            if (isNow(dates[i], view)) {
                                classList += ' now';
                            }
                            if (!inValidRange(dates[i])) {
                                classList += ' disabled';
                            }
                            classes.push(classList);
                        }
                    }
                    scope.classes = classes;
                }

                scope.next = function (delta) {
                    var date = moment(scope.date);
                    delta = delta || 1;
                    switch (scope.view) {
                        case 'year':
                        /*falls through*/
                        case 'month':
                            date.year(date.year() + delta);
                            break;
                        case 'date':
                            date.month(date.month() + delta);
                            break;
                        case 'hours':
                        /*falls through*/
                        case 'minutes':
                            date.hours(date.hours() + delta);
                            break;
                    }
                    date = clipDate(date);
                    if (date) {
                        scope.date = date;
                        setDate(date);
                        arrowClick = true;
                        update();
                    }
                };

                function inValidRange(date) {
                    var valid = true;
                    if (minDate && minDate.isAfter(date)) {
                        valid = isSame(minDate, date);
                    }
                    if (maxDate && maxDate.isBefore(date)) {
                        valid && isSame(maxDate, date);
                    }
                    return valid;
                }

                function isSame(date1, date2) {
                    return date1.isSame(date2, datePickerConfig.momentNames[scope.view]) ? true : false;
                }

                function clipDate(date) {
                    if (minDate && minDate.isAfter(date)) {
                        return minDate;
                    } else if (maxDate && maxDate.isBefore(date)) {
                        return maxDate;
                    } else {
                        return date;
                    }
                }

                function isNow(date, view) {
                    var is = true;

                    switch (view) {
                        case 'minutes':
                            is && ~~(now.minutes() / step) === ~~(date.minutes() / step);
                        /* falls through */
                        case 'hours':
                            is && now.hours() === date.hours();
                        /* falls through */
                        case 'date':
                            is && now.date() === date.date();
                        /* falls through */
                        case 'month':
                            is &&now.month() === date.month();
                        /* falls through */
                        case 'year':
                            is && now.year() === date.year();
                    }
                    return is;
                }

                scope.prev = function (delta) {
                    return scope.next(-delta || -1);
                };

                if (pickerID) {
                    scope.$on('pickerUpdate', function (event, pickerIDs, data) {
                        if (eventIsForPicker(pickerIDs, pickerID)) {
                            var updateViews = false, updateViewData = false;

                            if (angular.isDefined(data.minDate)) {
                                minDate = data.minDate ? data.minDate : false;
                                updateViewData = true;
                            }
                            if (angular.isDefined(data.maxDate)) {
                                maxDate = data.maxDate ? data.maxDate : false;
                                updateViewData = true;
                            }

                            if (angular.isDefined(data.minView)) {
                                attrs.minView = data.minView;
                                updateViews = true;
                            }
                            if (angular.isDefined(data.maxView)) {
                                attrs.maxView = data.maxView;
                                updateViews = true;
                            }
                            attrs.view = data.view || attrs.view;

                            if (updateViews) {
                                prepareViews();
                            }

                            if (updateViewData) {
                                update();
                            }
                        }
                    });
                }
            }
        };
    }]);
    /* global moment */

    angular.module('datePicker').factory('datePickerUtils', function () {
        var tz;
        var createNewDate = function (year, month, day, hour, minute) {
            var utc = Date.UTC(year | 0, month | 0, day | 0, hour | 0, minute | 0);
            return tz ? moment.tz(utc, tz) : moment(utc);
        };

        return {
            getVisibleMinutes: function (m, step) {
                var year = m.year(),
                    month = m.month(),
                    day = m.date(),
                    hour = m.hours(), pushedDate,
                    offset = m.utcOffset() / 60,
                    minutes = [], minute;

                for (minute = 0 ; minute < 60 ; minute += step) {
                    pushedDate = createNewDate(year, month, day, hour - offset, minute);
                    minutes.push(pushedDate);
                }
                return minutes;
            },
            getVisibleWeeks: function (m) {
                m = moment(m);
                var startYear = m.year(),
                    startMonth = m.month();

                //Set date to the first day of the month
                m.date(1);

                //Grab day of the week
                var day = m.day();

                if (day === 0) {
                    //If the first day of the month is a sunday, go back one week.
                    m.date(-6);
                } else {
                    //Otherwise, go back the required number of days to arrive at the previous sunday
                    m.date(1 - day);
                }

                var weeks = [];

                while (weeks.length < 6) {
                    if (m.year() === startYear && m.month() > startMonth) {
                        break;
                    }
                    weeks.push(this.getDaysOfWeek(m));
                    m.add(7, 'd');
                }
                return weeks;
            },
            getVisibleYears: function (d) {
                var m = moment(d),
                    year = m.year();

                m.year(year - (year % 10));
                year = m.year();

                var offset = m.utcOffset() / 60,
                    years = [],
                    pushedDate,
                    actualOffset;

                for (var i = 0; i < 12; i++) {
                    pushedDate = createNewDate(year, 0, 1, 0 - offset, 0);
                    actualOffset = pushedDate.utcOffset() / 60;
                    if (actualOffset !== offset) {
                        pushedDate = createNewDate(year, 0, 1, 0 - actualOffset, 0);
                        offset = actualOffset;
                    }
                    years.push(pushedDate);
                    year++;
                }
                return years;
            },
            getDaysOfWeek: function (m) {
                m = m ? m : (tz ? moment.tz(tz).day(0) : moment().day(0));

                var year = m.year(),
                    month = m.month(),
                    day = m.date(),
                    days = [],
                    pushedDate,
                    offset = m.utcOffset() / 60,
                    actualOffset;

                for (var i = 0; i < 7; i++) {
                    pushedDate = createNewDate(year, month, day, 0 - offset, 0);
                    actualOffset = pushedDate.utcOffset() / 60;
                    if (actualOffset !== offset) {
                        pushedDate = createNewDate(year, month, day, 0 - actualOffset, 0);
                    }
                    days.push(pushedDate);
                    day++;
                }
                return days;
            },
            getVisibleMonths: function (m) {
                var year = m.year(),
                    offset = m.utcOffset() / 60,
                    months = [],
                    pushedDate,
                    actualOffset;

                for (var month = 0; month < 12; month++) {
                    pushedDate = createNewDate(year, month, 1, 0 - offset, 0);
                    actualOffset = pushedDate.utcOffset() / 60;
                    if (actualOffset !== offset) {
                        pushedDate = createNewDate(year, month, 1, 0 - actualOffset, 0);
                    }
                    months.push(pushedDate);
                }
                return months;
            },
            getVisibleHours: function (m) {
                var year = m.year(),
                    month = m.month(),
                    day = m.date(),
                    hours = [],
                    hour, pushedDate, actualOffset,
                    offset = m.utcOffset() / 60;

                for (hour = 0 ; hour < 24 ; hour++) {
                    pushedDate = createNewDate(year, month, day, hour - offset, 0);
                    actualOffset = pushedDate.utcOffset() / 60;
                    if (actualOffset !== offset) {
                        pushedDate = createNewDate(year, month, day, hour - actualOffset, 0);
                    }
                    hours.push(pushedDate);
                }

                return hours;
            },
            isAfter: function (model, date) {
                return model && model.unix() >= date.unix();
            },
            isBefore: function (model, date) {
                return model.unix() <= date.unix();
            },
            isSameYear: function (model, date) {
                return model && model.year() === date.year();
            },
            isSameMonth: function (model, date) {
                return this.isSameYear(model, date) && model.month() === date.month();
            },
            isSameDay: function (model, date) {
                return this.isSameMonth(model, date) && model.date() === date.date();
            },
            isSameHour: function (model, date) {
                return this.isSameDay(model, date) && model.hours() === date.hours();
            },
            isSameMinutes: function (model, date) {
                return this.isSameHour(model, date) && model.minutes() === date.minutes();
            },
            setParams: function (zone) {
                tz = zone;
            },
            findFunction: function (scope, name) {
                //Search scope ancestors for a matching function.
                //Can probably combine this and the below function
                //into a single search function and two comparison functions
                //Need to add support for lodash style selectors (eg, 'objectA.objectB.function')
                var parentScope = scope;
                do {
                    parentScope = parentScope.$parent;
                    if (angular.isFunction(parentScope[name])) {
                        return parentScope[name];
                    }
                } while (parentScope.$parent);

                return false;
            },
            findParam: function (scope, name) {
                //Search scope ancestors for a matching parameter.
                var parentScope = scope;
                do {
                    parentScope = parentScope.$parent;
                    if (parentScope[name]) {
                        return parentScope[name];
                    }
                } while (parentScope.$parent);

                return false;
            },
            createMoment: function (m) {
                if (tz) {
                    return moment.tz(m, tz);
                } else {
                    //If input is a moment, and we have no TZ info, we need to remove TZ
                    //info from the moment, otherwise the newly created moment will take
                    //the timezone of the input moment. The easiest way to do that is to
                    //take the unix timestamp, and use that to create a new moment.
                    //The new moment will use the local timezone of the user machine.
                    return moment.isMoment(m) ? moment.unix(m.unix()) : moment(m);
                }
            },
            getDate: function (scope, attrs, name) {
                var result = false;
                // Removed the parent scope traversing - it's a bad idea. Probably was because of the ng-if child scope issue?
                if (scope[name]) {
                    result = this.createMoment(scope[name]);
                }

                return result;
            },
            eventIsForPicker: function (targetIDs, pickerID) {
                //Checks if an event targeted at a specific picker, via either a string name, or an array of strings.
                return (angular.isArray(targetIDs) && targetIDs.indexOf(pickerID) > -1 || targetIDs === pickerID);
            }
        };
    });
    /* global moment */
    var Module = angular.module('datePicker');

    /* global moment */
    var PRISTINE_CLASS = 'ng-pristine',
        DIRTY_CLASS = 'ng-dirty';

    var Module = angular.module('datePicker');

    Module.constant('dateTimeConfig', {
        template: function (attrs, id) {
            return '' +
                '<div ' +
                (id ? 'id="' + id + '" ' : '') +
                'date-picker="' + attrs.ngModel + '" ' +
                (attrs.view ? 'view="' + attrs.view + '" ' : '') +
                (attrs.maxView ? 'max-view="' + attrs.maxView + '" ' : '') +
                (attrs.maxDate ? 'max-date="' + attrs.maxDate + '" ' : '') +
                (attrs.autoClose ? 'auto-close="' + attrs.autoClose + '" ' : '') +
                (attrs.template ? 'template="' + attrs.template + '" ' : '') +
                (attrs.minView ? 'min-view="' + attrs.minView + '" ' : '') +
                (attrs.minDate ? 'min-date="' + attrs.minDate + '" ' : '') +
                (attrs.partial ? 'partial="' + attrs.partial + '" ' : '') +
                (attrs.step ? 'step="' + attrs.step + '" ' : '') +
                (attrs.onSetDate ? 'date-change="' + attrs.onSetDate + '" ' : '') +
                (attrs.ngModel ? 'ng-model="' + attrs.ngModel + '" ' : '') +
                (attrs.timezone ? 'timezone="' + attrs.timezone + '" ' : '') +
                'class="date-picker-date-time"></div>';
        },
        format: 'YYYY-MM-DD HH:mm',
        views: ['date', 'year', 'month', 'hours', 'minutes'],
        autoClose: false,
        position: 'relative'
    });

    Module.directive('dateTimeAppend', function () {
        return {
            link: function (scope, element) {
                element.bind('click', function () {
                    element.find('input')[0].focus();
                });
            }
        };
    });

})(angular);
