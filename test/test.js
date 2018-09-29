"use strict";

var excelToMYSQL = require('../index.js');

var data = {
	host: "localhost",
	user: "root",
	pass: "",
	path: "test/sample1.xlsx",
	table: "sample",
	db: "ug"
};

excelToMYSQL.covertToMYSQL(data, {verbose:true}, function(error, results){
	if(error) throw error;
	else{
		console.log(results);
	}
});