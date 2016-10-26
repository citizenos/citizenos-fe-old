'use strict';

angular
    .module('citizenos')
    .service('sUrlResolver', ['$state', '$translate', '$log', '$location', 'cosConfig', 'sAuth', 'sTranslate', function ($state, $translate, $log, $location, cosConfig, sAuth, sTranslate) {
    console.log('sUrlResolver');
    var UrlResolver = this;
    var locationUrl = $location.url();
    var locationPath = locationUrl.split('/');

    var langkeys = Object.keys(cosConfig.language.list);
    var userLang = cosConfig.language.default;

    UrlResolver.stateUrls = [];
    sAuth.status();

    var currentLang = sTranslate.currentLocale();
    init();
    UrlResolver.services = {
        resolve: resolve
    };
    return UrlResolver.services;

    function resolve () {
            if (langkeys.indexOf(locationPath[1]) > -1) {
                console.log('isLang', '/' + locationPath[1] + '/');
                return '/' + locationPath[1] + '/';
            } else if (locationPath.length > 1) {
                if(sAuth.user){
                    console.log('HasUser+fullURL','/' + userLang + locationUrl);
                    return '/' + userLang + locationUrl;
                }
                console.log('fullURL','/' + currentLang  + locationUrl);
                return '/' + currentLang + locationUrl;
            } else {
                if(sAuth.user){
                    console.log('HasUser+Home','/' + userLang + '/');
                    return '/' + userLang + '/';
                }
                console.log('Home','/' + currentLang + '/');
                return '/' + currentLang + '/';
            }
    }

    function matchState () {
        var matchUrl = locationUrl;
        console.log(matchUrl);
        if( langkeys.indexOf(locationPath[1] )) {
            matchUrl.replace('/'+locationPath[1], '');
        }
        console.log('MATCHURL', matchUrl);
        angular.forEach(UrlResolver.stateUrls, function(stateUrl, key) {
            if(stateUrl.indexOf(matchUrl) > -1){
                console.log('Match 1', stateUrl);
                console.log('Match 1', matchUrl);
            }
            else if (matchUrl.indexOf(stateUrl) > -1 ) {
                console.log('Match 1', stateUrl);
                console.log('Match 1', matchUrl);
            }
        });

    }
    function init () {
        sAuth.status();
        getStateUrls();
    }

    function getStateUrls () {
        var states = $state.get();
        angular.forEach(states, function(state, key) {
            UrlResolver.stateUrls.push(state.url);
        });

    }

}]);
