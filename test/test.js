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

excelToMYSQL.covertToMYSQL(data, {verbose:true, customStartEnd: true, startRow:1, startCol: 1, endRow: 100, endCol: 10, autoId:true}, function(error, results){
	if(error) throw error;
	else{
		console.log(results);
	}
});