/**
 * CitizenOS Etherpad Lite iframe directive
 *
 * If Angulars JQuery wasn't so limited and .css also returned non-inline styles I could also check if iframes initial size was defined with CSS. @see {@link https://docs.angularjs.org/api/ng/function/angular.element#angular-s-jqlite}
 *
 * TO loose all scrolls, Etherpad Lite needs custom stylesheet where:
 * * #editorcontainer { overflow: hidden }
 * * #outerdocbody { overflow: hidden }
 *
 */
 import * as angular from 'angular';
 import {debounce} from 'lodash';
 import * as $ from 'jquery';

let cosEtherpad = {
    selector: 'cosEtherpad',
    template: `<iframe src="{{$ctrl.url}}" frameborder="0" scrolling="no" width="{{$ctrl.elemwidth}}" height="{{$ctrl.elemheight}}"></iframe>`,
    bindings: {
        elemheight: '@?',
        elemwidth: '@?',
        url: '='
    },
    controller: ['$window', '$log', '$element', class CosEtherpadController {
        private elemheight;
        private elemwidth;
        private url;
        private minWidth;
        private minHeight;
        private $window;
        private $element;
        private $log;

        constructor ($window,  $log, $element) {
            this.$window = $window;
            this.$log = $log;
            this.$element = $element;
            $(this.$window).on('message onmessage', angular.bind(this, this.receiveMessageHandler));
            $(this.$window).on('scroll resize', this.sendScrollMessage);
        }

        valueNotPercent  (value) {
            return (value + '').indexOf('%') < 0;
        };

        receiveMessageHandler (e) {
            if (this.elemwidth && this.valueNotPercent(this.elemwidth)) {
                this.minWidth = parseFloat(this.elemwidth);
            }

            if (this.elemheight && this.valueNotPercent(this.elemheight)) {
                this.minHeight = parseFloat(this.elemheight);
            }
            const msg = e.originalEvent.data;
            if (msg.name === 'ep_resize') {
                const width = msg.data.width;
                const height = msg.data.height;
                if (angular.isNumber(width) && width > this.minWidth) {
                    const newWidth = width + 'px';
                    if (newWidth !== this.elemwidth) {
                        this.elemwidth = newWidth;
                    }
                }

                if (angular.isNumber(height) && height > this.minHeight) {
                    const newHeight = height + 'px';
                    if (newHeight !== this.elemheight) {
                        this.elemheight = newHeight;
                    }
                }
            }
        };

        sendScrollMessage () {
            debounce(function () {
                const targetWindow = this.$element[0].contentWindow;

                let yOffsetExtra = 0; // Additional Y offset in case there is a floating header element
                const mobileHeader = this.$window.document.getElementById('mobile_header');
                if (mobileHeader) {
                    yOffsetExtra = parseFloat(this.$window.getComputedStyle(mobileHeader)['height']);
                }

                const data = {
                    scroll: {
                        top: this.$window.pageYOffset + yOffsetExtra,
                        left: this.$window.pageXOffset
                    },
                    frameOffset: this.getFrameOffset()
                };

                targetWindow.postMessage({
                    name: 'ep_embed_floating_toolbar_scroll',
                    data: data
                }, '*');

            }, 100);
        }


        // As angular.element does not support $.offset(), copied it over from Jquery source.
        getFrameOffset () {
            const elem = this.$element[0];

            // Return zeros for disconnected and hidden (display: none) elements (gh-2310)
            // Support: IE <=11 only
            // Running getBoundingClientRect on a
            // disconnected node in IE throws an error
            if (!elem.getClientRects().length) {
                return {top: 0, left: 0};
            }

            const rect = elem.getBoundingClientRect();

            const doc = elem.ownerDocument;
            const docElem = doc.documentElement;
            const win = doc.defaultView;

            return {
                top: rect.top + win.pageYOffset - docElem.clientTop,
                left: rect.left + win.pageXOffset - docElem.clientLeft
            };
        };
    }]
}

 angular
     .module('citizenos')
     .component(cosEtherpad.selector, cosEtherpad );
