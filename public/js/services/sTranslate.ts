'use strict';

import * as angular from 'angular';

export class Translate  {

    private LANGUAGES;
    private currentLanguage;
    private  debugLang;

    constructor (private $state, private $stateParams, private $translate, private $log, private $q, cosConfig) {
        this.LANGUAGES = Object.keys(cosConfig.language.list);
        this.currentLanguage = cosConfig.language.default;
        this.debugLang = cosConfig.language.debug;
    };

    setLanguage (language) {
        this.$log.debug('setLanguage', language);
        return this.$q((resolve, reject) => {
            this.$translate.onReady(() => {
                this.$log.debug('setLanguage', 'onReady', language, this.$translate.use(), this.$translate.use() !== language);
                if (this.checkLanguageIsValid(language) && this.$translate.use() !== language) {
                    this.currentLanguage = language;

                    return resolve(this.$translate.use(language));
                }
                return resolve(this.$translate.use());
            });
        });
    };

    switchLanguage (language) {
        this.$translate.onReady(() => {
            if (this.checkLanguageIsValid(language)) {
                this.$stateParams.language = language;
                if (language === 'aa') { // Crowdin language selected, we need a full page reload for the in-context script to work.
                    window.location.href = this.$state.href(this.$state.current.name, this.$stateParams);
                } else {
                    this.$state.transitionTo(this.$state.current.name, this.$stateParams);
                }
            }
            this.setLanguage(language);
        });
    };

    debugMode () {
        this.$translate.onReady(() => {
            if (this.$translate.use() !== this.debugLang) {
                this.$translate.use(this.debugLang);
            } else {
                this.$translate.use(this.currentLanguage);
            }
        });
    };

    checkLanguageIsValid (language) {
        if (language === this.debugLang) {
            return false;
        }
        return this.LANGUAGES.indexOf(language) !== -1;
    };

    getCurrentLanguage () {
        return this.$q((resolve, reject) => {
            this.$translate.onReady(() => {
                return resolve(this.$translate.use());
            });
        });
    }

};

angular
    .module('citizenos')
    .service('sTranslate', ['$state', '$stateParams', '$translate', '$log', '$q', 'cosConfig', Translate]);
