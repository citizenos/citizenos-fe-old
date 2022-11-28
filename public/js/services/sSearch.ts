import * as angular from 'angular';

export class Search {
    private searchPendingDefer;
    constructor (private $http, private $log, private $q, private sLocation) {}

    /**
         * Search users
         *
         * NOTE: Each new requests cancels previous pending requests.
         *
         * @param {string} str Search string
         *
         * @returns {HttpPromise} Angular $http promise
         */
     searchUsers (str) {
        this.$log.debug('sSearch.search()', str);
        const path = this.sLocation.getAbsoluteUrlApi('/api/users/self/search/users');


        // Cancel all pending requests, there is no need to many in parallel as used in TypeAhead.
        if (this.searchPendingDefer) {
            this.searchPendingDefer.resolve('cancelled');
        }

        this.searchPendingDefer = this.$q.defer();

        return this.$http.get(path, {timeout: this.searchPendingDefer.promise, params: angular.extend({str: str})});
    };

            /**
     * Search
     *
     * NOTE: Each new requests cancels previous pending requests.
     *
     * @param {string} str Search string
     * @param {object} params Request parameters {limit, page, include, "my.topic.level"}
     *
     * @returns {HttpPromise} Angular $http promise
     */
    search (str, params) {
        this.$log.debug('sSearch.search()', str);
        const path = this.sLocation.getAbsoluteUrlApi('/api/search');


        // Cancel all pending requests, there is no need to many in parallel as used in TypeAhead.
        if (this.searchPendingDefer) {
            this.searchPendingDefer.resolve('cancelled');
        }

        this.searchPendingDefer = this.$q.defer();

        return this.$http.get(path, {timeout: this.searchPendingDefer.promise, params: angular.extend({str: str}, params)});
    };
}
angular
    .module('citizenos')
    .service('sSearch', ['$http', '$log', '$q', 'sLocation', Search]);
