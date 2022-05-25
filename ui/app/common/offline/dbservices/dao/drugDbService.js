'use strict';

angular.module('bahmni.common.offline')
    .service('drugDbService', ['$q',
        function ($q) {
            var db;
            var init = function (_db) {
                db = _db;
            };
            var insertDrug = function (data) {
                var drug = db.getSchema().table('drug');
                var row = drug.createRow({
                    data: data,
                    uuid: data.uuid,
                    name: data.name
                });
                return db.insertOrReplace().into(drug).values([row]).exec();
            };

            var getAllDrugs = function () {
                var drug = db.getSchema().table('drug');
                return db.select()
                    .from(drug).exec();
            };

            var getDrugByUuid = function (uuid) {
                var drug = db.getSchema().table('drug');
                return db.select().from(drug)
                    .where(drug.uuid.eq(uuid)).exec().then(function (results) {
                        return results[0];
                    });
            };

            var searchDrugWithName = function (searchString) {
                var drug = db.getSchema().table('drug');
                return db.select().from(drug)
                    .where(drug.name.match(new RegExp(searchString, 'i')))
                    .limit(10)
                    .exec().then(function (results) {
                        return results;
                    });
            };

            return {
                init: init,
                insertDrug: insertDrug,
                getAllDrugs: getAllDrugs,
                getDrugByUuid: getDrugByUuid,
                searchDrugWithName: searchDrugWithName
            };
        }]);

