'use strict';

angular.module('bahmni.clinical')
    .factory('treatmentService', ['$q', 'appService', 'offlineDbService', 'offlineService', 'androidDbService', 'offlineEncounterServiceStrategy',
        function ($q, appService, offlineDbService, offlineService, androidDbService, offlineEncounterServiceStrategy) {
            if (offlineService.isAndroidApp()) {
                offlineDbService = androidDbService;
            }

            var createDrugOrder = function (drugOrder) {
                return Bahmni.Clinical.DrugOrder.create(drugOrder);
            };

            var getPrescribedAndActiveDrugOrders = function (patientUuid, numberOfVisits, getOtherActive,
                                                         visitUuids, startDate, endDate, getEffectiveOrdersOnly) {
                var params = {
                    patientUuid: patientUuid,
                    numberOfVisits: numberOfVisits,
                    getOtherActive: getOtherActive,
                    visitUuids: visitUuids,
                    startDate: startDate,
                    endDate: endDate,
                    getEffectiveOrdersOnly: getEffectiveOrdersOnly
                };
                var deferred = $q.defer();
                var visitDrugOrders = [];
                offlineDbService.getVisitsByPatientUuid(patientUuid, numberOfVisits).then(function (visits) {
                    var mappedVisitUuids = _.map(visits, function (visit) {
                        return visit.uuid;
                    });
                    // if (mappedVisitUuids && mappedVisitUuids.length === 0) {
                    //     deferred.resolve({"data": {}});
                    // }
                    params.visitUuids = mappedVisitUuids || [];
                    var isNewEncounter = params.visitUuids.length === 0;
                    var getDrugOrdersFun = isNewEncounter ? offlineDbService.getEncountersByPatientUuid : offlineDbService.getPrescribedAndActiveDrugOrders;
                    var updatedParam = isNewEncounter ? params.patientUuid : params;
                    var now = Bahmni.Common.Util.DateUtil.now();
                    getDrugOrdersFun(updatedParam).then(function (results) {
                        _.each(results, function (result) {
                            var drugOrders = result.encounter.drugOrders ? result.encounter.drugOrders : [];
                            if (isNewEncounter) {
                                result.encounter.visit = {startDateTime: now};
                            } else {
                                _.each(visits, function (visit) {
                                    if (result.encounter.visitUuid === visit.uuid) {
                                        result.encounter.visit = {
                                            startDateTime: visit.startDatetime,
                                            uuid: visit.uuid
                                        };
                                    }
                                });
                            }
                            _.each(drugOrders, function (drugOrder) {
                                drugOrder.provider = result.encounter.providers[0];
                                drugOrder.creatorName = result.encounter.providers[0].name;
                                drugOrder.visit = result.encounter.visit;
                            });
                            visitDrugOrders = visitDrugOrders.concat(drugOrders);
                        });
                        var uuids = [];
                        _.each(visitDrugOrders, function (visitDrugOrder) {
                            if (visitDrugOrder.previousOrderUuid) {
                                uuids.push(visitDrugOrder.previousOrderUuid);
                            }
                        });

                        for (var index = 0; index < visitDrugOrders.length; index++) {
                            for (var indx = 0; indx < uuids.length; indx++) {
                                if (uuids[indx] === visitDrugOrders[index].uuid) {
                                    visitDrugOrders.splice(index, 1);
                                }
                            }
                        }

                        var response = {visitDrugOrders: visitDrugOrders};
                        for (var key in response) {
                            response[key] = response[key].map(createDrugOrder);
                        }
                        deferred.resolve({"data": response});
                    });
                });
                return deferred.promise;
            };

            var getConfig = function () {
                return offlineDbService.getReferenceData('DrugOrderConfig');
            };

            var getProgramConfig = function () {
                var programConfig = appService.getAppDescriptor() ? appService.getAppDescriptor().getConfigValue("program") || {} : {};
                return programConfig;
            };

            // get encounter.drugOrders between start date and end date
            var getActiveDrugOrders = function (patientUuid, startDate, endDate) {
                var deferred = $q.defer();
                var activeDrugOrders = [];
                offlineEncounterServiceStrategy.getEncountersByPatientUuid(patientUuid).then(function (results) {
                    _.each(results, function (result) {
                        var drugOrders = result.encounter.drugOrders || [];
                        _.each(drugOrders, function (drug) {
                            activeDrugOrders = activeDrugOrders.concat(createDrugOrder(drug));
                        });
                    });
                    deferred.resolve(activeDrugOrders);
                });
                return deferred.promise;
            };

            var getPrescribedDrugOrders = function (patientUuid) {
                var deferred = $q.defer();
                var prescribedDrugOrders = [];
                offlineEncounterServiceStrategy.getEncountersByPatientUuid(patientUuid).then(function (results) {
                    _.each(results, function (result) {
                        var drugOrders = result.encounter.drugOrders || [];
                        var drugUuidsWithPreviousOrderUuid = [];
                        _.each(drugOrders, function (drug) {
                            if (!drug.uuid && drug.previousOrderUuid) {
                                drugUuidsWithPreviousOrderUuid.push(drug.previousOrderUuid);
                            }
                        });
                        _.each(drugOrders, function (drug) {
                            if (drugUuidsWithPreviousOrderUuid.indexOf(drug.uuid) === -1) {
                                prescribedDrugOrders = prescribedDrugOrders.concat(createDrugOrder(drug));
                            }
                        });
                    });
                    deferred.resolve(prescribedDrugOrders);
                });
                return deferred.promise;
            };

            var getNonCodedDrugConcept = function () {
                var deferred = $q.defer();
                offlineDbService.getReferenceData('NonCodedDrugConcept').then(function (response) {
                    deferred.resolve(response.data);
                });
                return deferred.promise;
            };

            var getAllDrugOrdersFor = function () {
                return $q.when([]);
            };

            var voidDrugOrder = function (drugOrder) {
                return $q.when([]);
            };

            return {
                getActiveDrugOrders: getActiveDrugOrders,
                getConfig: getConfig,
                getPrescribedDrugOrders: getPrescribedDrugOrders,
                getPrescribedAndActiveDrugOrders: getPrescribedAndActiveDrugOrders,
                getNonCodedDrugConcept: getNonCodedDrugConcept,
                getAllDrugOrdersFor: getAllDrugOrdersFor,
                voidDrugOrder: voidDrugOrder
            };
        }]);
