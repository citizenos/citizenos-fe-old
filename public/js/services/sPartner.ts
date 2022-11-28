'use strict';
import * as angular from 'angular';

export class Partner {
    private defaultSuccess = (response) => {
        return response.data.data;
    };

    private defaultError = (response) => {
        return this.$q.reject(response);
    };

    constructor (private $http, private $q, $log, private sLocation) {
        $log.info('sPartner');
    }

    info (partnerId) {
        const path = this.sLocation.getAbsoluteUrlApi('/api/partners/:partnerId')
            .replace(':partnerId', partnerId);

        return this.$http.get(path).then(this.defaultSuccess, this.defaultError);
    };
}
angular
    .module('citizenos')
    .service('sPartner', ['$http', '$q', '$log', 'sLocation', Partner]);
