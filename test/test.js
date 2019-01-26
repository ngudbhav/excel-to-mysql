"use strict";

var excelToMYSQL = require('../index.js');

var data = {
	host: "localhost",
	user: "root",
	pass: "Udbhav11@",
	path: "test/sample1.xlsx",
	table: "sample",
	db: "ug"
};

excelToMYSQL.covertToMYSQL(data, {customStartEnd: true, startRow:1, startCol: 1, endRow: 100, endCol: 10, autoId:true}, function(error, results){
	if(error) throw error;
	else{
		console.log(results);
	}
});
excelToMYSQL.progress.on('progress', function(data){
	console.log(data);
})