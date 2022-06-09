'use strict';

Bahmni.Registration.Identifier = function (identifierType) {
    this.identifierType = identifierType;
    this.preferred = identifierType.primary;
    this.voided = false;
    return this;
};

var prototype = Bahmni.Registration.Identifier.prototype;
prototype.hasIdentifierSources = function () {
    return this.identifierType.identifierSources.length > 0;
};

prototype.isPrimary = function () {
    return this.identifierType.primary;
};
prototype.map = function (identifiers) {
    var savedIdentifier = _.find(identifiers, {identifierType: {uuid: this.identifierType.uuid}});
    if (savedIdentifier) {
        this.registrationNumber = savedIdentifier.identifier;
        this.identifier = savedIdentifier.identifier;
        this.preferred = savedIdentifier.preferred;
        this.voided = savedIdentifier.voided;
        this.uuid = savedIdentifier.uuid;
    }
    return this;
};

prototype.hasIdentifierSourceWithEmptyPrefix = function () {
    var identifierSources = this.identifierType.identifierSources;
    return identifierSources.length === 1 && identifierSources[0].prefix === "";
};

prototype.isIdentifierRequired = function () {
    if (this.hasOldIdentifier) {
        return true;
    } else if (this.identifierType.required) {
        return !this.hasIdentifierSources();
    }
    return false;
};

prototype.generate = function () {
    if (this.registrationNumber && this.registrationNumber.length > 0) {
        this.identifier = this.selectedIdentifierSource ? this.selectedIdentifierSource.prefix + this.registrationNumber : this.registrationNumber;
        this.voided = false;
    } else if (this.uuid) {
        this.voided = true;
    }
};

prototype.validateIdentifier = function () {
    var prepoi = this.identifier;
    var r1 = new RegExp("\\w{2}-\\w{2}-\\w{2}-\\d{4}-[P]{1}-\\d{5}", 'i');
    var r2 = new RegExp("\\w{2}-\\w{2}-\\w{2}-\\d{4}-(A|PR){1}-\\d{5}", 'i');
    if (prepoi && (!r1.test(prepoi) && !r2.test(prepoi))) {
        alert("Given Prep/Oi Identifier is not matching with the Expected Pattern");
        this.clearRegistrationNumber();
    } else {
        var year = prepoi && prepoi.split("-")[3];
        year = year && Number(year);
        var currentYear = new Date();
        currentYear = currentYear.getFullYear();
        if (year > currentYear) {
            alert("Year in identifier cannot be greater than current year.");
            this.clearRegistrationNumber();
        }
    }
};

prototype.clearRegistrationNumber = function () {
    this.registrationNumber = null;
    this.identifier = null;
};

