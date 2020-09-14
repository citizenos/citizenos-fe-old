'use strict';

angular
    .module('citizenos')
    .service('sAuth', ['$http', '$q', '$log', 'sLocation', 'hwcrypto', 'cosConfig', function ($http, $q, $log, sLocation, hwcrypto, cosConfig) {
        var sAuth = this;

        sAuth.user = {
            loggedIn: false,
            isLoading: true
        };

        var defaultSuccess = function (response) {
            return response.data;
        };

        var defaultError = function (response) {
            return $q.reject(response);
        };

        sAuth.signUp = function (email, password, name, company, redirectSuccess) {
            var data = {
                email: email,
                password: password,
                name: name,
                company: company,
                redirectSuccess: redirectSuccess
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/signup');
            return $http.post(path, data).then(defaultSuccess, defaultError);
        };

        sAuth.login = function (email, password) {
            var data = {
                email: email,
                password: password
            };

            var success = function (response) {
                sAuth.user.loggedIn = true;
                angular.extend(sAuth.user, response.data.data);
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/login');
            return $http.post(path, data).then(success, defaultError);
        };

        sAuth.loginMobiilIdInit = function (pid, phoneNumber) {
            var data = {
                pid: pid,
                phoneNumber: phoneNumber
            };

            var success = function (response) {
                return response.data.data;
            };


            var path = sLocation.getAbsoluteUrlApi('/api/auth/mobile/init');
            return $http.post(path, data).then(success, defaultError);
        };

        sAuth.loginMobiilIdStatus = function (token) {
            var success = function (response) {
                if ([20002, 20003].indexOf(response.data.status.code) > -1) {
                    sAuth.user.loggedIn = true;
                    angular.extend(sAuth.user, response.data.data);
                }
                return response;
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/mobile/status');
            return $http.get(path, {params: {token: token}}).then(success, defaultError);
        };

        sAuth.loginSmartIdInit = function (pid, countryCode) {
            var data = {
                pid: pid,
                countryCode: countryCode
            };

            var success = function (response) {
                return response.data.data;
            };


            var path = sLocation.getAbsoluteUrlApi('/api/auth/smartid/init');
            return $http.post(path, data).then(success, defaultError);
        };

        sAuth.loginSmartIdStatus = function (token) {
            var success = function (response) {
                if ([20002, 20003].indexOf(response.data.status.code) > -1) {
                    sAuth.user.loggedIn = true;
                    angular.extend(sAuth.user, response.data.data);
                }
                return response;
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/smartid/status');
            return $http.get(path, {params: {token: token}}).then(success, defaultError);
        };

        sAuth.loginIdCard = function () {
            var success = function (response) {
                $log.debug('Auth.loginId', 'success');
                if ([20002, 20003].indexOf(response.data.status.code) > -1) {
                    sAuth.user.loggedIn = true;
                    angular.extend(sAuth.user, response.data.data);
                }
                return response;
            };

            function _hex2array(str) {
                if (typeof str == "string") {
                    var len = Math.floor(str.length / 2);
                    var ret = new Uint8Array(len);
                    for (var i = 0; i < len; i++) {
                        ret[i] = parseInt(str.substr(i * 2, 2), 16);
                    }
                    return ret;
                }
            }

            function hexToBase64(hexStr) {
                return btoa(function () {
                    hexStr.split('').reduce(function (acc, _, i) {
                        acc += !(i - 1 & 1) ? String.fromCharCode(parseInt(hexStr.substring(i - 1, i + 1), 16)) : ""
                    });
                });
            }

            if (!window.btoa) {
                var tableStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                var table = tableStr.split("");

                window.btoa = function (bin) {
                  for (var i = 0, j = 0, len = bin.length / 3, base64 = []; i < len; ++i) {
                    var a = bin.charCodeAt(j++), b = bin.charCodeAt(j++), c = bin.charCodeAt(j++);
                    if ((a | b | c) > 255) throw new Error("String contains an invalid character");
                    base64[base64.length] = table[a >> 2] + table[((a << 4) & 63) | (b >> 4)] +
                                            (isNaN(b) ? "=" : table[((b << 2) & 63) | (c >> 6)]) +
                                            (isNaN(b + c) ? "=" : table[c & 63]);
                  }
                  return base64.join("");
                };

            }

            function hexToBase64(str) {
                return btoa(String.fromCharCode.apply(null,
                    str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
                );
            }
            return hwcrypto
                .getCertificate({filter: 'AUTH'})
                .then(function (certificate) {
                    var der =  hexToBase64(certificate.hex);
                    var path = sLocation.getAbsoluteUrlApi('/api/auth/id');

                    return $http.get(path, {
                        headers: {
                            'x-ssl-client-cert': der
                        }
                    }).then(function (response) {
                        if (response.data.data.hash) {
                            var hash = response.data.data.hash;
                            var token = response.data.data.token;

                            return hwcrypto
                                .sign(certificate, {value: _hex2array(hash), type: "SHA-256"},{})
                                .then(function (signature) {
                                    return $http.post(path, {
                                        'signature': signature,
                                        'token': token,
                                    },{headers: {
                                        'x-ssl-client-cert': der
                                    }});
                                }).then(success, defaultError)

                        }
                    });
                });
        };

        sAuth.logout = function () {
            var success = function (response) {
                // Delete all user data except login status.
                // Cant reference a new object here as Angular looses bindings.
                angular.forEach(sAuth.user, function (value, key) {
                    if (key !== 'loggedIn') {
                        delete sAuth.user[key];
                    }
                });
                sAuth.user.loggedIn = false;
                return response;
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/logout');
            return $http.post(path).then(success, defaultError);
        };

        sAuth.status = function () {
            var success = function (response) {
                $log.debug('sAuth.status', response);
                angular.extend(sAuth.user, response.data.data);
                sAuth.user.loggedIn = true;
                sAuth.user.isLoading = false;
                return response.data.data;
            };

            var error = function (response) {
                sAuth.user.isLoading = false;
                return defaultError(response);
            };

            var path = sLocation.getAbsoluteUrlApi('/api/auth/status');
            return $http.get(path).then(success, error);
        };

        sAuth.passwordResetSend = function (email) {
            var path = sLocation.getAbsoluteUrlApi('/api/auth/password/reset/send');
            return $http.post(path, {email: email}).then(defaultSuccess, defaultError);
        };

        sAuth.passwordReset = function (email, password, passwordResetCode) {
            var path = sLocation.getAbsoluteUrlApi('/api/auth/password/reset');
            return $http.post(path, {
                email: email,
                password: password,
                passwordResetCode: passwordResetCode
            }).then(defaultSuccess, defaultError);
        };

        sAuth.getUrlPrefix = function () {
            if (sAuth.user.loggedIn) {
                return 'users';
            }
            return null;
        };

        sAuth.getUrlUserId = function () {
            if (sAuth.user.loggedIn) {
                return 'self';
            }
            return null;
        };

    }]);
