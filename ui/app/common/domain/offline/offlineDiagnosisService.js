'use strict';

angular.module('bahmni.common.domain')
    .service('diagnosisService', ['$q', '$rootScope', 'offlineEncounterServiceStrategy', '$bahmniTranslate', 'offlineDbService', 'androidDbService', 'offlineService',
        function ($q, $rootScope, offlineEncounterServiceStrategy, $bahmniTranslate, offlineDbService, androidDbService, offlineService) {
            if (offlineService.isAndroidApp()) {
                offlineDbService = androidDbService;
            }

            var filterAndSortDiagnosis = function (diagnoses) {
                diagnoses = _.filter(diagnoses, function (singleDiagnosis) {
                    return ((singleDiagnosis.revised === undefined) || (singleDiagnosis.revised == false));
                });
                diagnoses = _.sortBy(diagnoses, 'diagnosisDateTime').reverse();
                return diagnoses;
            };

            this.getDiagnoses = function (patientUuid, visitUuid) {
                var deferred = $q.defer();
                var diagnoses = [];
                offlineEncounterServiceStrategy.getEncountersByPatientUuid(patientUuid).then(function (results) {
                    _.each(results, function (result) {
                        if (result.encounter.bahmniDiagnoses) {
                            diagnoses = diagnoses.concat(result.encounter.bahmniDiagnoses);
                        }
                    });
                    diagnoses = filterAndSortDiagnosis(diagnoses);
                    deferred.resolve({"data": diagnoses});
                });
                return deferred.promise;
            };

            this.getAllFor = function (searchTerm, masterList) {
                var deferred = $q.defer();
                var resultSet = [];
                if (masterList) {
                    _.each(masterList, function (item) {
                        if (_.includes(item.name.name.toLowerCase(), searchTerm.toLowerCase())) {
                            resultSet = resultSet.concat({
                                conceptName: item.name.name,
                                conceptUuid: item.uuid,
                                matchedName: item.name.name
                            });
                        }
                    });
                }
                deferred.resolve({"data": resultSet});
                return deferred.promise;
            };

            this.deleteDiagnosis = function (obsUuid) {
                return $q.when({"data": {}});
            };

            this.getDiagnosisConceptSet = function () {
                return $q.when({"data": {}});
            };

            this.getPastAndCurrentDiagnoses = function (patientUuid, encounterUuid) {
                return this.getDiagnoses(patientUuid).then(function (response) {
                    var diagnosisMapper = new Bahmni.DiagnosisMapper($rootScope.diagnosisStatus);
                    var allDiagnoses = diagnosisMapper.mapDiagnoses(response.data);
                    var pastDiagnoses = diagnosisMapper.mapPastDiagnosis(allDiagnoses, encounterUuid);
                    var savedDiagnosesFromCurrentEncounter = diagnosisMapper.mapSavedDiagnosesFromCurrentEncounter(allDiagnoses, encounterUuid);
                    return {
                        "pastDiagnoses": pastDiagnoses,
                        "savedDiagnosesFromCurrentEncounter": savedDiagnosesFromCurrentEncounter
                    };
                });
            };

            this.populateDiagnosisInformation = function (patientUuid, consultation) {
                consultation.savedDiagnosesFromCurrentEncounter = [];
                consultation.pastDiagnoses = [];
                return $q.when(consultation);
            };
        }]);
