/**
 * @ngdoc function
 * @name translateApp.directive:LanguageSelectDirective
 * @description
 * # LanguageSelectDirective
 * Directive to append language select and set its view and behavior
 */
app.directive('ngTranslateLanguageSelect', function (LocaleService) {
    'use strict';

    return {
      restrict: 'A',
      replace: true,
      template: ''+
        '<div dropdown id="dropdown_wrap">'+
            '<div class="section_item">'+
                '<div class="section_icon">'+
                    '<div class="table_cell">'+
                        '<div class="sprite sprite-x0-menu-icon-help2x"></div>'+
                    '</div>'+
                '</div>'+
                '<div class="section_icon arrow_down">'+
                    '<div class="table_cell">'+
                        '<div class="sprite sprite-x4-icon-language-dropdown2x"></div>'+
                    '</div>'+
                '</div>'+
                '{{currentLocaleDisplayName}}'+
            '</div>'+
            '<div class="dropdown">'+
                '<div class="section_item" ng-repeat="lang in localesDisplayNames" ng-click="changeLanguage(lang)">'+
                    '{{lang}}'+
                '</div>'+
           '</div>'+
        '</div>'+
      '',
      controller: function ($scope) {
        var init = function () {
            $scope.currentLocaleDisplayName = LocaleService.getLocaleDisplayName();
            $scope.localesDisplayNames = LocaleService.getLocalesDisplayNames();
            $scope.visible = $scope.localesDisplayNames && $scope.localesDisplayNames.length > 1;
        };
        init();

        $scope.changeLanguage = function (locale) {
          LocaleService.setLocaleByDisplayName(locale);
          init();
        };
      }
    };
  });


/*
        '<div class="language-select" ng-if="visible">'+
          '<label>'+
            '<select ng-model="currentLocaleDisplayName"'+
              'ng-options="localesDisplayName for localesDisplayName in localesDisplayNames"'+
              'ng-change="changeLanguage(currentLocaleDisplayName)">'+
            '</select>'+
          '</label>'+
        '</div>'+*/
