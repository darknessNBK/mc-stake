const express = require("express");

// recordRoutes is an instance of the express router.
// We use it to define our routes.
// The router will be added as a middleware and will take control of requests starting with path /record.
const recordRoutes = express.Router();

// This will help us connect to the database
const dbo = require("../db/conn");

// This help convert the id from string to ObjectId for the _id.
const ObjectId = require("mongodb").ObjectId;

// This section will help you get a single record by id
recordRoutes.route("/record/:collection/:wallet").get(function (req, res) {
    let db_connect = dbo.getDb();
    let myquery = { wallet: req.params.wallet};
    db_connect
        .collection(req.params.collection)
        .findOne(myquery, function (err, result) {
            if (err) throw err;
            res.json(result);
        });
});

// This section will help you create a new record.
recordRoutes.route("/record/:collection/add").post(function (req, response) {
    let db_connect = dbo.getDb();
    let myobj = {
        wallet: req.body.wallet,
        reward: req.body.reward,
        totalclaimed: req.body.totalclaimed,
    };
    db_connect.collection(req.params.collection).insertOne(myobj, function (err, res) {
        if (err) throw err;
        response.json(res);
    });
});

// This section will help you update a record by id.
recordRoutes.route("/update/:wallet").post(function (req, response) {
    let db_connect = dbo.getDb();
    let myquery = { wallet: req.params.wallet};
    let newvalues = {
        $set: {
            wallet: req.body.wallet,
            reward: req.body.reward,
        },
    };
});

// This section will help you delete a record
recordRoutes.route("/:collection/:wallet").delete((req, response) => {
    let db_connect = dbo.getDb();
    let myquery = { wallet: req.params.wallet};
    db_connect.collection(req.params.collection).deleteOne(myquery, function (err, obj) {
        if (err) throw err;
        console.log("1 document deleted");
        response.json(obj);
    });
});

module.exports = recordRoutes;
