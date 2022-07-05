'use strict';

angular.module('bahmni.clinical')
.directive('numberOfWeeksForPrepProgram', ['programService', 'appService', 'spinner', function (programService, appService, spinner) {
    var link = function ($scope) {
        var PRePProgramName = "PrEP Program";
        var intiatedConceptName = "Initiated";

        var calculateWeeksBetween = function (startDate, stopDate) {
            var ONE_WEEK = 1000 * 60 * 60 * 24 * 7;
            var startDateInMilliSeconds = startDate.getTime();
            var stopDateInMilliSeconds = stopDate.getTime();
            var differenceMs = Math.abs(startDateInMilliSeconds - stopDateInMilliSeconds);
            return Math.round(differenceMs / ONE_WEEK);
        };

        var findActivePRePProgram = function (activePrograms) {
            return _.find(activePrograms, function (program) {
                return program.display === PRePProgramName;
            });
        };

        var findLastEndedPRePProgram = function (endedPrograms) {
            var endedPRePPrograms = _.filter(endedPrograms, function (program) {
                return program.display === PRePProgramName;
            });
            var sortedByDate = _.sortBy(endedPRePPrograms, function (program) {
                return new Date(program.dateCompleted);
            });
            return _.last(sortedByDate);
        };

        var find1stLineState = function (artProgram) {
            return _.find(artProgram.states, function (currentState) {
                return currentState.state.concept.display === intiatedConceptName;
            });
        };

        $scope.contentUrl = "dashboard/views/dashboardSections/numberOfWeeksForPrepProgram.html";
        spinner.forPromise(programService.getPatientPrograms($scope.patient.uuid, false, undefined).then(function (response) {
            var activePRePProgram = findActivePRePProgram(response.activePrograms);
            if (activePRePProgram) {
                var _1stLineState = find1stLineState(activePRePProgram);
                if (_1stLineState) {
                    var startDateValue = _1stLineState.startDate;
                    var stopDate = new Date();
                    $scope.numberOfWeeks = calculateWeeksBetween(new Date(startDateValue), stopDate);
                }
            } else {
                var lastEndedPRePProgram = findLastEndedPRePProgram(response.endedPrograms);
                if (lastEndedPRePProgram) {
                    var _1stLineState = find1stLineState(lastEndedPRePProgram);
                    if (_1stLineState) {
                        var startDateValue = _1stLineState.startDate;
                        var stopDate = lastEndedPRePProgram.dateCompleted;
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
