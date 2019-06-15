"use strict";

var excelToMYSQL = require('../index.js');

var data = {
	host: "localhost",
	user: "root",
	pass: "ngudbhav",
	path: "test/test.csv",
	table: "sample",
	db: "ug"
};
var fdata = {
	path: "test/sample1.xlsx",
	table: "sample",
	db: "ug"
};

excelToMYSQL.convertToFile(fdata, {customStartEnd: true, startRow:1, startCol: 1, endRow: 100, endCol: 10, autoId:true}, function(error, results){
	if(error) throw error;
	else{
		console.log(results);
	}
});

excelToMYSQL.covertToMYSQL(data, {safeMode: true, customStartEnd: false, startRow:1, startCol: 1, endRow: 100, endCol: 10, autoId:true, verbose:true}, function(error, results){
	if(error) throw error;
	else{
		console.log(results);
	}
});