'use strict';

angular.module('bahmni.registration')
    .controller('EditPatientController', ['$scope', 'patientService', 'encounterService', '$stateParams', 'openmrsPatientMapper', '$window', '$q', 'spinner', 'appService', 'messagingService', '$rootScope',
        function ($scope, patientService, encounterService, $stateParams, openmrsPatientMapper, $window, $q, spinner, appService, messagingService, $rootScope) {
            var dateUtil = Bahmni.Common.Util.DateUtil;
            var uuid = $stateParams.patientUuid;
            $scope.patient = {};
            $scope.actions = {};
            $scope.addressHierarchyConfigs = appService.getAppDescriptor().getConfigValue("addressHierarchy");
            $scope.disablePhotoCapture = appService.getAppDescriptor().getConfigValue("disablePhotoCapture");

            $scope.today = dateUtil.getDateWithoutTime(dateUtil.now());

            var setReadOnlyFields = function () {
                $scope.readOnlyFields = {};
                var readOnlyFields = appService.getAppDescriptor().getConfigValue("readOnlyFields");
                angular.forEach(readOnlyFields, function (readOnlyField) {
                    if ($scope.patient[readOnlyField]) {
                        $scope.readOnlyFields[readOnlyField] = true;
                    }
                });
            };

            var successCallBack = function (openmrsPatient) {
                $scope.openMRSPatient = openmrsPatient["patient"];
                $scope.patient = openmrsPatientMapper.map(openmrsPatient);
                setReadOnlyFields();
                expandDataFilledSections();
                $scope.patientLoaded = true;
            };

            var expandDataFilledSections = function () {
                angular.forEach($rootScope.patientConfiguration && $rootScope.patientConfiguration.getPatientAttributesSections(), function (section) {
                    var notNullAttribute = _.find(section && section.attributes, function (attribute) {
                        return $scope.patient[attribute.name] !== undefined;
                    });
                    section.expand = section.expanded || (notNullAttribute ? true : false);
                });
            };

            (function () {
                var getPatientPromise = patientService.get(uuid).then(successCallBack);

                var isDigitized = encounterService.getDigitized(uuid);
                isDigitized.then(function (data) {
                    var encountersWithObservations = data.data.results.filter(function (encounter) {
                        return encounter.obs.length > 0;
                    });
                    $scope.isDigitized = encountersWithObservations.length > 0;
                });

                spinner.forPromise($q.all([getPatientPromise, isDigitized]));
            })();

            $scope.update = function () {
                addNewRelationships();
                var errorMessages = Bahmni.Common.Util.ValidationUtil.validate($scope.patient, $scope.patientConfiguration.attributeTypes);
                if (errorMessages.length > 0) {
                    errorMessages.forEach(function (errorMessage) {
                        messagingService.showMessage('error', errorMessage);
                    });
                    return $q.when({});
                }

                return spinner.forPromise(patientService.update($scope.patient, $scope.openMRSPatient).then(function (result) {
                    var patientProfileData = result.data;
                    if (!patientProfileData.error) {
                        successCallBack(patientProfileData);
                        $scope.actions.followUpAction(patientProfileData);
                    }
                }));
            };

            var addNewRelationships = function () {
                var newRelationships = _.filter($scope.patient.newlyAddedRelationships, function (relationship) {
                    return relationship.relationshipType && relationship.relationshipType.uuid;
                });
                newRelationships = _.each(newRelationships, function (relationship) {
                    delete relationship.patientIdentifier;
                    delete relationship.content;
                    delete relationship.providerName;
                });
                $scope.patient.relationships = _.concat(newRelationships, $scope.patient.deletedRelationships);
            };

            $scope.isReadOnly = function (field) {
                return $scope.readOnlyFields ? ($scope.readOnlyFields[field] ? true : false) : undefined;
            };

            $scope.afterSave = function () {
                var identifiers = _.get($scope, 'openMRSPatient.identifiers', []);
                var prepoi = _.filter(identifiers, function (id) {
                    return _.get(id, 'identifierType.name') === 'PREP/OI Identifier';
                });
                if (prepoi.length > 0) {
                    prepoi = prepoi[0];
                    prepoi = _.get(prepoi, 'extraIdentifiers.PREP/OI Identifier', '');
                    prepoi = prepoi && prepoi.trim();
                } else {
                    prepoi = null;
                }

                var flag = true;
                var r1 = new RegExp("\\w{2}-\\w{2}-\\w{2}-\\d{4}-[P]{1}-\\d{5}", 'i');
                var r2 = new RegExp("\\w{2}-\\w{2}-\\w{2}-\\d{4}-(A|PR){1}-\\d{5}", 'i');
                if (prepoi) {
                    if (!r1.test(prepoi) && !r2.test(prepoi)) {
                        messagingService.showMessage("error", "Given Prep/Oi Identifier is not matching with the Expected Pattern");
                        flag = false;
                    } else {
                        var year = prepoi.split("-")[3];
                        year = year && Number(year);
                        var currentYear = new Date();
                        currentYear = currentYear.getFullYear();
                        if (year > currentYear) {
                            messagingService.showMessage("error", "Year in identifier cannot be greater than current year.");
                            flag = false;
                        }
                    }
                } else {
                    $scope.patient.extraIdentifiers = _.filter(identifiers, function (id) {
                        return _.get(id, 'identifierType.name') !== 'PREP/OI Identifier';
                    });
                    $scope.openMRSPatient.identifiers = _.filter(identifiers, function (id) {
                        return _.get(id, 'identifierType.name') !== 'PREP/OI Identifier';
                    });

                    spinner.forPromise(patientService.update($scope.patient, $scope.openMRSPatient).then(function (result) {
                        var patientProfileData = result.data;
                        if (!patientProfileData.error) {
                            $scope.openMRSPatient = patientProfileData["patient"];
                            $scope.patient = openmrsPatientMapper.map(patientProfileData);
                            $scope.patientLoaded = true;
                        }
                    }));
                }

                if (!flag) {
                    messagingService.showMessage("error", "PREP_OI_ERROR");
                } else {
                    messagingService.showMessage("info", "REGISTRATION_LABEL_SAVED");
                }
            };
        }]);
