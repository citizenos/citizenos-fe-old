'use strict';
angular.module('cosmarkdown', ['ngSanitize']).
  provider('markdown', function () {
    var opts = {};
    return {
      config: function (newOpts) {
        opts = newOpts;
      },
      $get: function () {
        return SimpleMDE;
      }
    };
  }).
  service('marked', ['$window', function ($window) {
    if ($window.marked) {

        $window._thirdParty = $window._thirdParty || {};
        $window._thirdParty.marked = $window.marked;
        try {
            delete $window.marked;
        } catch (e) {
            $window.marked = undefined;
            /*<IE8 doesn't do delete of window vars, make undefined if delete error*/
        }
    }
    return $window._thirdParty.marked;
  }]).
  filter('markdown', ['$filter', '$sce', 'marked', function ($filter, $sce, marked) {
    return function (input) {
      var html = marked(input);
      var div = document.createElement('div');
      div.innerHTML = $filter('linky')(html, '_blank');
      return $sce.getTrustedHtml(div.textContent);
    }
  }]).
  directive('cosMarkdown', ['$sanitize', 'markdown', function ($sanitize, markdown) {
    return {
      restrict: 'A',
      scope: {
        item: '=ngModel'
      },
      link: function (scope, element, attrs) {
        var config = {
          placeholder: attrs.placeholder,
          toolbar: ["bold", "italic", "strikethrough", "|", "ordered-list", "unordered-list", "preview"],
          preview:true,
          styleSelectedText: false,
          blockStyles: {
            italic: "_"
          },
          element:element[0],
          initialValue: scope.item
        };

        var simplemde = new markdown(config);
        simplemde.codemirror.on("change", function(){
          scope.$apply(function () {
            scope.item = simplemde.value();
          });
        });
      }
    };
  }]);