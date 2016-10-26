'use strict';

angular
    .module('citizenos')
    .service('sAuth', ['$http', '$q', '$log', function ($http, $q, $log) {

    this.user = {
        loggedIn: false
    };
    var service = {
        login : login,
        status : status,
        user: this.user
    };

    return service;

    function login (email, password) {
        angular.extend(this.user, { loggedIn: true, loadlang: false, isLoading: true, id: "2eedafda-2f7f-48e7-9220-d951218f0bc1", name: "Ilmar Tyrk", company: "CitizenOS", language: "et", email: "ilmar.tyrk@gmail.com", imageUrl: null });
    }

    function status (){

        return $q(function(resolve, reject) {
            setTimeout(function() {
                this.user = {
                    loggedIn: true,
                    loadlang: false,
                    isLoading: true,
                    id: "2eedafda-2f7f-48e7-9220-d951218f0bc1",
                    name: "Ilmar Tyrk",
                    company: "CitizenOS",
                    language: "et",
                    email: "ilmar.tyrk@gmail.com",
                    imageUrl: null
                };
                resolve(this.user);
            }, 2000);
          });
    }

}]);
