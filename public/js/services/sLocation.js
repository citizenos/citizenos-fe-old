'use strict';

app.service('sLocation', ['cosConfig',function (cosConfig) {
    var Location = this;

    Location.baseUrl = function () {
        return window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
    };

    Location.removeLangFromUrl = function () {
    var baseUrl = Location.baseUrl();
    var langlist = Object.keys(cosConfig.language.list);
    var path = window.location.pathname;
    var pathList = path.split('/');

    if (langlist.indexOf(pathList[1]) > -1) {
        pathList.splice(1,1);
    }

    return baseUrl+pathList.join('/');
    };

}]);
