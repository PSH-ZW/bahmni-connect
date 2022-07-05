'use strict';

angular.module('bahmni.home')
    .factory('initialization', ['$rootScope', 'appService', 'spinner', '$window', 'offlineConfigInitialization',
        function ($rootScope, appService, spinner, $window, offlineConfigInitialization) {
            var initApp = function () {
                return appService.initApp('home');
            };
            $window.triggerConfigSync = function () {
                offlineConfigInitialization().then(function () {
                    console.log('configured');
                });
            };
            return function () {
                return spinner.forPromise(initApp());
            };
        }
    ]);
