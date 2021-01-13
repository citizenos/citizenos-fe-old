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
  directive('cosMarkdown', ['$sanitize', '$filter', 'markdown', function ($sanitize, $filter, markdown) {
    return {
      restrict: 'A',
      scope: {
        item: '=ngModel',
        limit: '=maxlength'
      },
      link: function (scope, element, attrs) {
        var curLength = 0;
        var getCharLength = function () {
          if (scope.item && scope.item.length) {
            curLength = scope.item.length;
          }

          return curLength;
        }
        var config = {
          placeholder: attrs.placeholder,
          toolbar: ["bold", "italic", "strikethrough", "|", "ordered-list", "unordered-list", "preview"],
          preview:true,
          blockStyles: {
            italic: "_"
          },
          status: [{
            className: "charCounter",
            defaultValue: function(el) {
              el.innerHTML = scope.limit - getCharLength();
            },
            onUpdate: function(el) {
              el.innerHTML = scope.limit - getCharLength();
            }
          }],
          element:element[0],
          initialValue: scope.item,
          toolbarTips: false
        };

        var simplemde = new markdown(config);
        var enforceMaxLength = function(cm, change) {
          var maxLength = cm.getOption("maxLength");
          if (maxLength && change.update) {
              var str = change.text.join("\n");
              var delta = str.length-(cm.indexFromPos(change.to) - cm.indexFromPos(change.from));
              if (delta <= 0) { return true; }
              delta = cm.getValue().length+delta-maxLength;
              if (delta > 0) {
                  str = str.substr(0, str.length-delta);
                  change.update(change.from, change.to, str.split("\n"));
              }
          }
          return true;
      }

      simplemde.codemirror.setOption("maxLength", scope.limit);
      simplemde.codemirror.on("beforeChange", enforceMaxLength);
        simplemde.codemirror.on("change", function(){
          curLength = simplemde.value().length;
          scope.$apply(function () {
            scope.item = simplemde.value();
          });
        });
      }
    };
  }]);