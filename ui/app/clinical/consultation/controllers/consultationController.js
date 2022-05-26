'use strict';

angular.module('bahmni.clinical').controller('ConsultationController',
    ['$scope', '$rootScope', '$state', '$location', 'clinicalAppConfigService', 'diagnosisService', 'urlHelper', 'contextChangeHandler',
        'spinner', 'encounterService', 'messagingService', 'sessionService', 'retrospectiveEntryService', 'patientContext', '$q',
        'patientVisitHistoryService', '$stateParams', '$window', 'visitHistory', 'clinicalDashboardConfig', 'appService',
        'ngDialog', '$filter', 'configurations', 'offlineService', 'visitConfig',
        function ($scope, $rootScope, $state, $location, clinicalAppConfigService, diagnosisService, urlHelper, contextChangeHandler,
                  spinner, encounterService, messagingService, sessionService, retrospectiveEntryService, patientContext, $q,
                  patientVisitHistoryService, $stateParams, $window, visitHistory, clinicalDashboardConfig, appService,
                  ngDialog, $filter, configurations, offlineService, visitConfig) {
            var DateUtil = Bahmni.Common.Util.DateUtil;
            $scope.togglePrintList = false;
            $scope.patient = patientContext.patient;
            $scope.showDashboardMenu = false;
            $scope.stateChange = function () {
                return $state.current.name === 'patient.dashboard.show';
            };
            $scope.showComment = true;
            $scope.showSaveAndContinueButton = true;

            $scope.visitHistory = visitHistory;
            $scope.consultationBoardLink = clinicalAppConfigService.getConsultationBoardLink();
            $scope.showControlPanel = false;
            $scope.clinicalDashboardConfig = clinicalDashboardConfig;
            $scope.lastvisited = null;

            $scope.openConsultationInNewTab = function () {
                $window.open('#' + $scope.consultationBoardLink, '_blank');
            };

            $scope.toggleDashboardMenu = function () {
                $scope.showDashboardMenu = !$scope.showDashboardMenu;
            };

            $scope.showDashboard = function (dashboard) {
                if (!clinicalDashboardConfig.isCurrentTab(dashboard)) {
                    $scope.$parent.$broadcast("event:switchDashboard", dashboard);
                }
                $scope.showDashboardMenu = false;
            };

            var setPrintAction = function (event, tab) {
                tab.print = function () {
                    $rootScope.$broadcast(event, tab);
                };
            };
            var setDashboardPrintAction = _.partial(setPrintAction, "event:printDashboard", _);
            var setVisitTabPrintAction = function (tab) {
                tab.print = function () {
                    var url = $state.href('patient.dashboard.visitPrint', {
                        visitUuid: visitHistory.activeVisit.uuid,
                        tab: tab.title,
                        print: 'print'
                    });
                    window.open(url, '_blank');
                };
            };

            _.each(visitConfig.tabs, setVisitTabPrintAction);
            _.each(clinicalDashboardConfig.tabs, setDashboardPrintAction);
            $scope.printList = _.concat(clinicalDashboardConfig.tabs, visitConfig.tabs);

            clinicalDashboardConfig.quickPrints = appService.getAppDescriptor().getConfigValue('quickPrints');
            $scope.printDashboard = function (tab) {
                if (tab) {
                    tab.print();
                } else {
                    clinicalDashboardConfig.currentTab.print();
                }
            };

            $scope.allowConsultation = function () {
                if (offlineService.isOfflineApp()) {
                    return true;
                }
                return appService.getAppDescriptor().getConfigValue('allowConsultationWhenNoOpenVisit');
            };

            $scope.closeDashboard = function (dashboard) {
                clinicalDashboardConfig.closeTab(dashboard);
                $scope.$parent.$parent.$broadcast("event:switchDashboard", clinicalDashboardConfig.currentTab);
            };

            $scope.closeAllDialogs = function () {
                ngDialog.closeAll();
            };

            $scope.availableBoards = [];
            $scope.configName = $stateParams.configName;

            $scope.update = function () {
                console.log('ckhbvkzhvbksfgb', $scope.availableBoards);
                $scope.availableBoards.forEach(function (value, key) {
                    const label = $filter('titleTranslate')(value);
                    const item = $scope.selectedItem.trim();
                    if (label === item) {
                        return buttonClickAction(value);
                    }
                });
            };

            $scope.getTitle = function (board) {
                return $filter('titleTranslate')(board);
            };

            $scope.showBoard = function (boardIndex) {
                $rootScope.collapseControlPanel();
                return buttonClickAction($scope.availableBoards[boardIndex]);
            };

            $scope.gotoPatientDashboard = function () {
                if (!isFormValid()) {
                    $scope.$parent.$parent.$broadcast("event:errorsOnForm");
                    return $q.when({});
                }
                if (contextChangeHandler.execute()["allow"]) {
                    var params = {
                        configName: $scope.configName,
                        patientUuid: patientContext.patient.uuid,
                        encounterUuid: undefined
                    };
                    if ($scope.dashboardDirty) {
                        params['dashboardCachebuster'] = Math.random();
                    }
                    $state.go("patient.dashboard.show", params);
                }
            };

            // ipd button show/hide configuration support
            $scope.isGoToIPDButtonHidden = function () {
                return $scope.ipdButtonConfig.hideGoToIPDButton;
            };

            $scope.generateBedManagementURL = function (visitUuid) {
                return appService.getAppDescriptor().formatUrl($scope.ipdButtonConfig.forwardUrl, {'patientUuid': $scope.patient.uuid, 'visitUuid': visitUuid});
            };

            var isLongerName = function (value) {
                return value ? value.length > 18 : false;
            };

            $scope.getShorterName = function (value) {
                return isLongerName(value) ? value.substring(0, 15) + "..." : value;
            };

            $scope.isInEditEncounterMode = function () {
                return $stateParams.encounterUuid !== undefined && $stateParams.encounterUuid !== 'active';
            };

            $scope.enablePatientSearch = function () {
                return appService.getAppDescriptor().getConfigValue('allowPatientSwitchOnConsultation') === true;
            };

            var setCurrentBoardBasedOnPath = function () {
                var currentPath = $location.url();
                var board = _.find($scope.availableBoards, function (board) {
                    if (board.url === "treatment") {
                        return _.includes(currentPath, board.extensionParams ? board.extensionParams.tabConfigName : board.url);
                    }
                    return _.includes(currentPath, board.url);
                });
                if (board) {
                    $scope.currentBoard = board;
                    $scope.currentBoard.isSelectedTab = true;
                }
            };

            var initialize = function () {
                var appExtensions = clinicalAppConfigService.getAllConsultationBoards();
                $scope.availableBoards = $scope.availableBoards.concat(appExtensions);
                $scope.showSaveConfirmDialogConfig = appService.getAppDescriptor().getConfigValue('showSaveConfirmDialog');
                $scope.ipdButtonConfig = appService.getAppDescriptor().getConfigValue('ipdButton') || { "hideGoToIPDButton": true };
                setCurrentBoardBasedOnPath();
            };

            $scope.shouldDisplaySaveConfirmDialogForStateChange = function (toState, toParams, fromState, fromParams) {
                if (toState.name.match(/patient.dashboard.show.*/)) {
                    return fromParams.patientUuid != toParams.patientUuid;
                }
                return true;
            };

            var cleanUpListenerStateChangeStart = $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                if ($scope.showSaveConfirmDialogConfig) {
                    if ($rootScope.hasVisitedConsultation && $scope.shouldDisplaySaveConfirmDialogForStateChange(toState, toParams, fromState, fromParams)) {
                        if ($scope.showConfirmationPopUp) {
                            event.preventDefault();
                            spinner.hide(toState.spinnerToken);
                            ngDialog.close();
                            $scope.toStateConfig = {toState: toState, toParams: toParams};
                            $scope.displayConfirmationDialog();
                        }
                    }
                }
                setCurrentBoardBasedOnPath();
            });

            var cleanUpListenerErrorsOnForm = $scope.$on("event:errorsOnForm", function () {
                $scope.showConfirmationPopUp = true;
            });

            $scope.displayConfirmationDialog = function (event) {
                if ($rootScope.hasVisitedConsultation && $scope.showSaveConfirmDialogConfig) {
                    if (event) {
                        event.preventDefault();
                        $scope.targetUrl = event.currentTarget.getAttribute('href');
                    }
                    ngDialog.openConfirm({template: '../common/ui-helper/views/saveConfirmation.html', scope: $scope});
                }
            };

            var cleanUpListenerStateChangeSuccess = $scope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState) {
                if (toState.name.match(/patient.dashboard.show.+/)) {
                    $rootScope.hasVisitedConsultation = true;
                    $scope.showConfirmationPopUp = true;
                    if ($scope.showSaveConfirmDialogConfig) {
                        $rootScope.$broadcast("event:pageUnload");
                    }
                }
                if ((toState.name === fromState.name) && (fromState.name === "patient.dashboard.show")) {
                    $rootScope.hasVisitedConsultation = false;
                }
            });

            $scope.$on("$destroy", function () {
                cleanUpListenerStateChangeSuccess();
                cleanUpListenerErrorsOnForm();
                cleanUpListenerStateChangeStart();
            });

            $scope.cancelTransition = function () {
                $scope.showConfirmationPopUp = true;
                ngDialog.close();
                delete $scope.targetUrl;
            };

            $scope.saveAndContinue = function () {
                $scope.showConfirmationPopUp = false;
                $scope.save($scope.toStateConfig);
                $window.onbeforeunload = null;
                ngDialog.close();
            };

            $scope.continueWithoutSaving = function () {
                $scope.showConfirmationPopUp = false;
                if ($scope.targetUrl) {
                    $window.open($scope.targetUrl, "_self");
                }
                $window.onbeforeunload = null;
                $state.go($scope.toStateConfig.toState, $scope.toStateConfig.toParams);
                ngDialog.close();
            };

            var getUrl = function (board) {
                var urlPrefix = urlHelper.getPatientUrl();
                var url = "/" + $stateParams.configName + (board.url ? urlPrefix + "/" + board.url : urlPrefix);
                var queryParams = [];
                if ($state.params.encounterUuid) {
                    queryParams.push("encounterUuid=" + $state.params.encounterUuid);
                }
                if ($state.params.programUuid) {
                    queryParams.push("programUuid=" + $state.params.programUuid);
                }

                if ($state.params.enrollment) {
                    queryParams.push("enrollment=" + $state.params.enrollment);
                }

                if ($state.params.dateEnrolled) {
                    queryParams.push("dateEnrolled=" + $state.params.dateEnrolled);
                }

                if ($state.params.dateCompleted) {
                    queryParams.push("dateCompleted=" + $state.params.dateCompleted);
                }

                var extensionParams = board.extensionParams;
                angular.forEach(extensionParams, function (extensionParamValue, extensionParamKey) {
                    queryParams.push(extensionParamKey + "=" + extensionParamValue);
                });

                if (!_.isEmpty(queryParams)) {
                    url = url + "?" + queryParams.join("&");
                }

                $scope.lastConsultationTabUrl.url = url;
                return $location.url(url);
            };

            $scope.openConsultation = function () {
                if ($scope.showSaveConfirmDialogConfig) {
                    $rootScope.$broadcast("event:pageUnload");
                }
                $scope.closeAllDialogs();
                $scope.collapseControlPanel();
                $rootScope.hasVisitedConsultation = true;
                switchToConsultationTab();
            };

            var switchToConsultationTab = function () {
                if ($scope.lastConsultationTabUrl.url) {
                    $location.url($scope.lastConsultationTabUrl.url);
                } else {
                    // Default tab
                    getUrl($scope.availableBoards[0]);
                }
            };

            var contextChange = function () {
                return contextChangeHandler.execute();
            };

            var buttonClickAction = function (board) {
                if ($scope.currentBoard === board) {
                    return;
                }
                if (!isFormValid()) {
                    $scope.$parent.$broadcast("event:errorsOnForm");
                    return;
                }

                contextChangeHandler.reset();
                _.map($scope.availableBoards, function (availableBoard) {
                    availableBoard.isSelectedTab = false;
                });

                $scope.currentBoard = board;
                $scope.currentBoard.isSelectedTab = true;
                return getUrl(board);
            };
            var updateConsultationObject = function (tempConsultation) {
                if (tempConsultation.encounterUuid) {
                    var diagnosesFromDb = [];
                    var drugsFromDb = [];
                    encounterService.findByEncounterUuid(tempConsultation.encounterUuid).then(function (encounter) {
                        if (encounter) {
                            diagnosesFromDb = encounter.bahmniDiagnoses;
                            drugsFromDb = encounter.drugOrders;
                        }
                    });
                    var newlyAddedDiagnoses = tempConsultation.newlyAddedDiagnoses || [];
                    tempConsultation.newlyAddedDiagnoses = newlyAddedDiagnoses.map(function (diagnosis) {
                        if (diagnosis.isEmpty()) {
                            return diagnosis;
                        }
                        if (diagnosesFromDb.length === 0) {
                            return diagnosis;
                        } else {
                            _.map(diagnosesFromDb, function (fromDb) {
                                if (diagnosis.codedAnswer && fromDb.codedAnswer && (diagnosis.codedAnswer.uuid === fromDb.codedAnswer.uuid)) {
                                    diagnosis.existingObs = fromDb.existingObs;
                                    diagnosis.previousObs = fromDb.previousObs;
                                    return diagnosis;
                                }
                            });
                        }
                    });
                    var newlyAddedTreatments = tempConsultation.newlyAddedTreatments || [];
                    tempConsultation.newlyAddedTreatments = newlyAddedTreatments.map(function (treatment) {
                        _.map(drugsFromDb, function (fromDb) {
                            if (fromDb.uuid || fromDb.previousOrderUuid) {
                                if (treatment.drug && fromDb.drug && (treatment.drug.uuid === fromDb.drug.uuid)) {
                                    treatment.uuid = fromDb.uuid;
                                    treatment.previousOrderUuid = fromDb.previousOrderUuid;
                                    return treatment;
                                }
                            }
                        });
                    });
                }
                return tempConsultation;
            };

            var preSavePromise = function () {
                var deferred = $q.defer();

                var observationFilter = new Bahmni.Common.Domain.ObservationFilter();
                $scope.consultation.preSaveHandler.fire();
                $scope.lastvisited = $scope.consultation.lastvisited;
                var selectedObsTemplates = $scope.consultation.selectedObsTemplates;
                var selectedFormTemplates = _.filter(selectedObsTemplates, function (obsTemplate) { return obsTemplate.formUuid; });
                var tempConsultation = updateConsultationObject(angular.copy($scope.consultation));
                tempConsultation.observations = observationFilter.filter(tempConsultation.observations);
                tempConsultation.consultationNote = observationFilter.filter([tempConsultation.consultationNote])[0];
                tempConsultation.labOrderNote = observationFilter.filter([tempConsultation.labOrderNote])[0];

                addFormObservations(tempConsultation, selectedFormTemplates);
                storeTemplatePreference(selectedObsTemplates);
                var visitTypeForRetrospectiveEntries = clinicalAppConfigService.getVisitTypeForRetrospectiveEntries();
                var defaultVisitType = clinicalAppConfigService.getDefaultVisitType();
                var encounterData = new Bahmni.Clinical.EncounterTransactionMapper().map(tempConsultation, $scope.patient, sessionService.getLoginLocationUuid(), retrospectiveEntryService.getRetrospectiveEntry(),
                    visitTypeForRetrospectiveEntries, defaultVisitType, $scope.isInEditEncounterMode(), $state.params.enrollment);
                deferred.resolve(encounterData);
                return deferred.promise;
            };

            var storeTemplatePreference = function (selectedObsTemplates) {
                var templates = [];
                _.each(selectedObsTemplates, function (template) {
                    var templateName = template.formName || template.conceptName;
                    var isTemplateAlreadyPresent = _.find(templates, function (template) {
                        return template.name === templateName;
                    });
                    if (!isTemplateAlreadyPresent) {
                        templates.push(templateName);
                    }
                });

                var data = {
                    "patientUuid": $scope.patient.uuid,
                    "templates": templates
                };

                localStorage.setItem("templatePreference", JSON.stringify(data));
            };

            var discontinuedDrugOrderValidation = function (removableDrugs) {
                var discontinuedDrugOrderValidationMessage;
                _.find(removableDrugs, function (drugOrder) {
                    if (!drugOrder.dateStopped) {
                        if (drugOrder._effectiveStartDate < moment()) {
                            discontinuedDrugOrderValidationMessage = "Please make sure that " + drugOrder.concept.name + " has a stop date between " + DateUtil.getDateWithoutTime(drugOrder._effectiveStartDate) + " and " + DateUtil.getDateWithoutTime(DateUtil.now());
                            return true;
                        } else {
                            discontinuedDrugOrderValidationMessage = drugOrder.concept.name + " should have stop date as today's date since it is a future drug order";
                            return true;
                        }
                    }
                });
                return discontinuedDrugOrderValidationMessage;
            };

            var conflictingDiagnosisValidation = function (consulatation) {
                var conflictingDiagnosisValidationMessage;
                var addedDiagnoses = [];
                consulatation.newlyAddedDiagnoses.map(function (drug) {
                    if (addedDiagnoses.indexOf(drug.freeTextAnswer ? drug.getDisplayName() : drug.codedAnswer.uuid) !== -1) {
                        conflictingDiagnosisValidationMessage = "Diagnosis " + drug.getDisplayName() + " is already added.";
                    } else {
                        addedDiagnoses = addedDiagnoses.concat(drug.isNonCodedAnswer ? drug.getDisplayName() : drug.codedAnswer.uuid);
                    }
                });
                consulatation.savedDiagnosesFromCurrentEncounter.map(function (drug) {
                    if (addedDiagnoses.indexOf(drug.freeTextAnswer ? drug.getDisplayName() : drug.codedAnswer.uuid) !== -1) {
                        conflictingDiagnosisValidationMessage = "Diagnosis " + drug.getDisplayName() + " is already added.";
                    } else {
                        addedDiagnoses = addedDiagnoses.concat(drug.isNonCodedAnswer ? drug.getDisplayName() : drug.codedAnswer.uuid);
                    }
                });
                return conflictingDiagnosisValidationMessage;
            };

            var addFormObservations = function (tempConsultation, selectedFormTemplates) {
                if (tempConsultation.observationForms) {
                    _.remove(tempConsultation.observations, function (observation) {
                        return observation.formNamespace;
                    });
                    _.each(tempConsultation.observationForms, function (observationForm) {
                        if (observationForm.component) {
                            var formObservations = observationForm.component.getValue();
                            _.each(formObservations.observations, function (obs) {
                                tempConsultation.observations.push(obs);
                            });
                        } else {
                            var oldForm = _.find(selectedFormTemplates, function (form) { return form.formName === observationForm.formName; });
                            if (oldForm) {
                                _.each(oldForm.observations, function (obs) {
                                    tempConsultation.observations.push(obs);
                                });
                            }
                        }
                    });
                }
            };

            var isObservationFormValid = function () {
                var valid = true;
                _.each($scope.consultation.observationForms, function (observationForm) {
                    if (valid && observationForm.component) {
                        var value = observationForm.component.getValue();
                        if (value.errors) {
                            messagingService.showMessage('error', "{{'CLINICAL_FORM_ERRORS_MESSAGE_KEY' | translate }}");
                            valid = false;
                        }
                    }
                });
                return valid;
            };

            var isFormValid = function () {
                var contxChange = contextChange();
                var shouldAllow = contxChange["allow"];
                var discontinuedDrugOrderValidationMessage = discontinuedDrugOrderValidation($scope.consultation.discontinuedDrugs);
                var conflictingDiagnosisValidationMessage = conflictingDiagnosisValidation($scope.consultation);
                if (!shouldAllow) {
                    var errorMessage = contxChange["errorMessage"] ? contxChange["errorMessage"] : "{{'CLINICAL_FORM_ERRORS_MESSAGE_KEY' | translate }}";
                    messagingService.showMessage('error', errorMessage);
                } else if (discontinuedDrugOrderValidationMessage) {
                    var errorMessage = discontinuedDrugOrderValidationMessage;
                    messagingService.showMessage('error', errorMessage);
                } else if (conflictingDiagnosisValidationMessage) {
                    var errorMessage = conflictingDiagnosisValidationMessage;
                    messagingService.showMessage('error', errorMessage);
                }

                return shouldAllow && !discontinuedDrugOrderValidationMessage && isObservationFormValid() && !conflictingDiagnosisValidationMessage;
            };

            var onDeleteDiagnosisListener = $scope.$on("event:deleteDiagnosis", function (event, diagnosis) {
                if (!diagnosis.existingObs && $scope.consultation.savedDiagnosesFromCurrentEncounter.length > 0) {
                    for (var i = 0; i < $scope.consultation.savedDiagnosesFromCurrentEncounter.length; i++) {
                        if ($scope.consultation.savedDiagnosesFromCurrentEncounter[i].$$hashKey === diagnosis.$$hashKey) {
                            $scope.consultation.savedDiagnosesFromCurrentEncounter.splice(i, 1);
                        }
                    }
                    $scope.save();
                }
            });

            $scope.save = function (toStateConfig) {
                if (!isFormValid()) {
                    $scope.$parent.$parent.$broadcast("event:errorsOnForm");
                    return $q.when({});
                }
                return spinner.forPromise($q.all([preSavePromise(), encounterService.getEncounterType($state.params.programUuid, sessionService.getLoginLocationUuid())]).then(function (results) {
                    var encounterData = results[0];
                    encounterData.encounterTypeUuid = results[1].uuid;
                    var params = angular.copy($state.params);
                    params.cachebuster = Math.random();
                    return encounterService.create(encounterData)
                        .then(function (saveResponse) {
                            var consultationMapper = new Bahmni.ConsultationMapper(configurations.dosageFrequencyConfig(), configurations.dosageInstructionConfig(),
                                configurations.consultationNoteConcept(), configurations.labOrderNotesConcept(), configurations.stoppedOrderReasonConfig());
                            var consultation = consultationMapper.map(saveResponse.data);
                            consultation.lastvisited = $scope.lastvisited;
                            return consultation;
                        })
                        .then(function (savedConsulation) {
                            messagingService.showMessage('info', "{{'CLINICAL_SAVE_SUCCESS_MESSAGE_KEY' | translate}}");
                            spinner.forPromise(diagnosisService.populateDiagnosisInformation($scope.patient.uuid, savedConsulation)
                                .then(function (consultationWithDiagnosis) {
                                    consultationWithDiagnosis.preSaveHandler = $scope.consultation.preSaveHandler;
                                    consultationWithDiagnosis.postSaveHandler = $scope.consultation.postSaveHandler;
                                    $scope.$parent.consultation = consultationWithDiagnosis;
                                    $scope.$parent.consultation.postSaveHandler.fire();
                                    $scope.dashboardDirty = true;
                                    if ($scope.targetUrl) {
                                        return $window.open($scope.targetUrl, "_self");
                                    }
                                    return $state.transitionTo(toStateConfig ? toStateConfig.toState : $state.current, toStateConfig ? toStateConfig.toParams : params, {
                                        inherit: false,
                                        notify: true,
                                        reload: (toStateConfig !== undefined)
                                    });
                                }));
                        }).catch(function (error) {
                            var message = Bahmni.Clinical.Error.translate(error) || "{{'CLINICAL_SAVE_FAILURE_MESSAGE_KEY' | translate}}";
                            messagingService.showMessage('error', message);
                        });
                }));
            };

            initialize();
        }]);
