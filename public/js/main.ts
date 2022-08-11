import 'angular';
import 'angular-cookies';
import 'angular-load';
import 'angular-loading-bar';
import 'angular-moment';
import 'angular-resource';
import 'angular-socialshare';
import 'angular-sanitize';
import 'angular-touch';
import 'angular-tooltips';
import 'angular-translate';
import 'angular-translate-storage-local';
import 'angular-translate-storage-cookie';
import 'angular-translate-loader-static-files';
import 'angular-translate-handler-log';
import '@uirouter/angularjs';
import 'easymde';
import 'moment';
import 'ng-dialog';
import 'lodash';
import 'fast-json-patch';
import 'validator';

import './libs';

import './app';
import './factories';
import './services';
import './filters';
import './directives';
import './components';
import './controllers';
import "../styles";

import './polyfills.ts';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

@NgModule({
    imports: [
        BrowserModule,
        UpgradeModule
    ]
})

export class AppModule {
    ngDoBootstrap () {
    }
};

platformBrowserDynamic().bootstrapModule(AppModule)
    .then(module => {
        console.log('ANGULAR DUALBOOT');
        const upgrade = module.injector.get(UpgradeModule) as UpgradeModule;
        upgrade.bootstrap(document.body.parentElement, ['citizenos']);
    })
    .catch(err => console.error(err));
