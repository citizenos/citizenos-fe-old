'use strict';
import * as angular from 'angular';
import * as $ from 'jquery';

let help = {
    selector: 'help',
    templateUrl: '/views/widgets/help.html',
    bindings: {},
    controller: ['$http', '$document', '$location', 'sLocation', '$window', '$cookies', 'sNotification', 'cosConfig', 'AppService', class HomeController {
        private errors;
        private email;
        private description;
        private clientData
        private isLoading

        constructor (private $http, private $document, private $location, private sLocation, private $window, private $cookies, private sNotification, private cosConfig, private app) {
        };

        init () {
            this.errors = null;
            this.email = null;
            this.description = null;
            this.clientData = false
            this.isLoading = false;
        };

        closeTootlip () {
            this.app.helptooltip = false;
            this.app.helpBubbleAnimate();
        }

        sendHelp () {
            this.isLoading = true;

            const mailParams = {
                email: this.email,
                description: this.description,
                userAgent: this.$window.clientInformation.userAgent,
                platform: this.$window.clientInformation.platform,
                height: this.$window.innerHeight,
                width: this.$window.innerWidth,
                location: this.$location.url()
            };

            const path = this.sLocation.getAbsoluteUrlApi('/api/internal/help');

            return this.$http.post(path, mailParams)
                .then(() => {
                    this.sNotification.addSuccess('HELP_WIDGET.MSG_REQUEST_SENT');
                    this.init();
                },() => {
                    this.isLoading = false;
                });
        };

        helpback () {
            const helpFrame = document.getElementById("help_frame") as HTMLIFrameElement | null;
            try {
                helpFrame.contentWindow.postMessage('back', 'https://citizenos.com/');
            } catch (err) {
                console.log('postmessage failed', err)
                helpFrame.src = helpFrame.src;
            }
        }
    }]
};

angular
    .module('citizenos')
    .component(help.selector, help);
