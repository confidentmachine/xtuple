(function () {
  "use strict";

  var DEBUG = false,
    _      = require("underscore"),
    assert = require('chai').assert,
    dblib  = require('../dblib'),
    datasource = dblib.datasource,
    adminCred = dblib.generateCreds();

  describe("postCreditMemo(integer, integer)", function () {
    this.timeout(10 * 1000);

    var params = {
      itemNumber: "BTRUCK1",
      whCode: "WH1",
      qty: 10
    };

    it("should get the itemsite_id and qoh",function (done) {
      var sql = "SELECT itemsite_qtyonhand, itemsite_id" +
                "  FROM itemsite" +
                " WHERE itemsite_id = getitemsiteid($1, $2);",
        options = _.extend({}, adminCred, { parameters: [ params.whCode, params.itemNumber ]});

      datasource.query(sql, options, function (err, res) {
        assert.isNull(err);
        assert.equal(res.rowCount, 1);
        assert.operator(res.rows[0].itemsite_id, ">", 0);
        params.itemsiteId = res.rows[0].itemsite_id;
        params.qohBefore = res.rows[0].itemsite_qtyonhand;
        done();
      });
    });

    // Create a Credit Memo
    it("should create a credit memo", function (done) {
     var callback = function (result) {
        if (DEBUG)
          console.log("createCreditMemo callback result: ", result);

        assert.isNotNull(result);
        params.cmheadId = result;
        done();
      };

      dblib.createCreditMemo(callback);
    });

    // Create a Credit Memo Line Item
    it("should create a credit memo line item", function (done) {
     var callback = function (result) {
        if (DEBUG)
          console.log("createCreditMemoLineItem callback result: ", result);

        assert.isNotNull(result);
        params.cmitemId = result;
        done();
      };

      dblib.createCreditMemoLineItem(params, callback);
    });

    it("should post a credit memo", function (done) {
      var sql = "SELECT postCreditMemo($1, NULL) AS result;",
        options = _.extend({}, adminCred, { parameters: [ params.cmheadId ]});

      datasource.query(sql, options, function (err, res) {
        assert.isNull(err);
        assert.equal(res.rowCount, 1);
        assert.isNotNull(res.rows[0].result);
        assert.operator(res.rows[0].result, ">", 0);
        done();
      });
    });

    // Note: Don't handle distribution detail here, that will be done in private-extensions/test/manufacturing

    it("should have updated qoh", function (done) {
      var sql = "SELECT itemsite_qtyonhand AS result" + 
                "  FROM itemsite" + 
                " WHERE itemsite_id=$1::integer;",
        options = _.extend({}, adminCred, { parameters: [ params.itemsiteId ]});

      datasource.query(sql, options, function (err, res) {
        assert.isNull(err);
        assert.equal(res.rowCount, 1);
        assert.equal(res.rows[0].result, (+params.qohBefore + +params.qty));
        params.qohBefore = res.rows[0].result;
        done();
      });
    });

    it("there should be no unposted invhist records", function (done) {
      var sql = "SELECT true AS result" +
                "  FROM invhist" +
                " WHERE invhist_posted = false;";

      datasource.query(sql, adminCred, function (err, res) {
        assert.isNull(err);
        assert.equal(res.rowCount, 0);
        done();
      });
    });
  });
}());

