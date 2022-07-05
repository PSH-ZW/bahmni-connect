'use strict';

angular.module('bahmni.clinical')
.directive('numberOfWeeksForProgram', ['programService', 'appService', 'spinner', function (programService, appService, spinner) {
    var link = function ($scope) {
        var ARTProgramName = "ART Program";
        var _1stLineConceptName = "1st Line";

        var calculateWeeksBetween = function (startDate, stopDate) {
            var ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
            var startDateInMilliSeconds = startDate.getTime();
            var stopDateInMilliSeconds = stopDate.getTime();
            var differenceMs = Math.abs(startDateInMilliSeconds - stopDateInMilliSeconds);
            return Math.round(differenceMs / ONE_WEEK);
        };

        var findActiveARTProgram = function (activePrograms) {
            return _.find(activePrograms, function (program) {
                return program.display === ARTProgramName;
            });
        };

        var findLastEndedARTProgram = function (endedPrograms) {
            var endedARTPrograms = _.filter(endedPrograms, function (program) {
                return program.display === ARTProgramName;
            });
            var sortedByDate = _.sortBy(endedARTPrograms, function (program) {
                return new Date(program.dateCompleted);
            });
            return _.last(sortedByDate);
        };

        var find1stLineState = function (artProgram) {
            return _.find(artProgram.states, function (currentState) {
                return currentState.state.concept.display === _1stLineConceptName;
            });
        };

        $scope.contentUrl = appService.configBaseUrl() + "/customDisplayControl/views/numberOfWeeksForProgram.html";
        spinner.forPromise(programService.getPatientPrograms($scope.patient.uuid, false, undefined).then(function (response) {
            var activeARTProgram = findActiveARTProgram(response.activePrograms);
            if (activeARTProgram) {
                var _1stLineState = find1stLineState(activeARTProgram);
                if (_1stLineState) {
                    var startDateValue = _1stLineState.startDate;
                    var stopDate = new Date();
                    $scope.numberOfWeeks = calculateWeeksBetween(new Date(startDateValue), stopDate);
                }
            } else {
                var lastEndedARTProgram = findLastEndedARTProgram(response.endedPrograms);
                if (lastEndedARTProgram) {
                    var _1stLineState = find1stLineState(lastEndedARTProgram);
                    if (_1stLineState) {
                        var startDateValue = _1stLineState.startDate;
                        var stopDate = lastEndedARTProgram.dateCompleted;
                        $scope.numberOfWeeks = calculateWeeksBetween(new Date(startDateValue), stopDate);
                    }
                }
            }
        }));
    };

    return {
        restrict: 'E',
        link: link,
        scope: {
            patient: "=",
            section: "="
        },
        template: '<ng-include src="contentUrl"/>'
    };
}]);
