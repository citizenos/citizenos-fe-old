'use strict';

/**
 * Angular HWCrypto service
 *
 * @see https://github.com/open-eid/hwcrypto.js
 * @see http://jameshill.io/articles/angular-third-party-injection-pattern/
 */
import * as angular from 'angular';
(function () {
    angular.module('angularHwcrypto', [])
        .service('hwcrypto', ['$window', function ($window) {
            if ($window.hwcrypto) {
                $window._thirdParty = $window._thirdParty || {};
                $window._thirdParty.hwcrypto = $window.hwcrypto;
                try {
                    delete $window.hwcrypto;
                } catch (e) {
                    $window.hwcrypto = undefined;
                    /*<IE8 doesn't do delete of window vars, make undefined if delete error*/
                }
            }
            return $window._thirdParty.hwcrypto;
        }]);
})();
