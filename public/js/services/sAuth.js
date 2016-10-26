'use strict';

angular
    .module('citizenos')
    .service('sAuth', ['$http', '$q', '$log', function ($http, $q, $log) {

    this.user = {
        loggedIn: false
    };
    var service = {
        login : login,
        status : status
    };

    return service;

    function login (email, password) {
        angular.extend(this.user, { loggedIn: true, loadlang: false, isLoading: true, id: "2eedafda-2f7f-48e7-9220-d951218f0bc1", name: "Ilmar Tyrk", company: "CitizenOS", language: "et", email: "ilmar.tyrk@gmail.com", imageUrl: null });
    }

    function status (){
        setTimeout( function () {
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
        return true;
        },1000);
    }

}]);
