'use strict';
angular.module('bahmni.common.services')
    .factory('drugService', ['$q', 'offlineDbService', 'offlineService', 'androidDbService',
        function ($q, offlineDbService, offlineService, androidDbService) {
            if (offlineService.isAndroidApp()) {
                offlineDbService = androidDbService;
            }
            var v = 'custom:(uuid,strength,name,dosageForm,concept:(uuid,name,names:(name)))';
            var search = function (drugName, conceptUuid) {
                var params = {
                    v: v,
                    q: drugName,
                    conceptUuid: conceptUuid,
                    s: "ordered"
                };
                return offlineDbService.getConceptByUuid(conceptUuid).then(function (response) {
                    return response.data.results;
                });
            };
            var searchDrugWithName = function (drugName) {
                var deferred = $q.defer();
                var resultSet = [];
                offlineDbService.searchDrugWithName(drugName).then(function (results) {
                    _.map(results, function (drug) {
                        resultSet = resultSet.concat(drug.data);
                    });
                    deferred.resolve(resultSet);
                });
                return deferred.promise;
            };
            var getDrugMetaData = function () {
                return offlineDbService.getConceptByName("offline-drugs").then(function (response) {
                    return response.data.results[0];
                });
            };

            var getSetMembersOfConcept = function (conceptSetFullySpecifiedName, searchTerm) {
                return offlineDbService.getConceptByName(conceptSetFullySpecifiedName).then(function (response) {
                    return response.data.results;
                });
            };

            var getRegimen = function (patientUuid, patientProgramUuid, drugs) {
                var params = {
                    patientUuid: patientUuid,
                    patientProgramUuid: patientProgramUuid,
                    drugs: drugs
                };
                return $q.when({});
            };

            return {
                search: search,
                searchDrugWithName: searchDrugWithName,
                getRegimen: getRegimen,
                getSetMembersOfConcept: getSetMembersOfConcept,
                getDrugMetaData: getDrugMetaData
            };
        }]);
