
"use strict";

const excelConverter = require('../src/index.js');

function generateOutput(error, resultIsError, results) {
  if(error) {
    if (resultIsError) {
      console.log(error);
      console.log('\x1b[36m%s\x1b[0m', 'Passed!');
    } else {
      throw error;
    }
  }
  else{
    if (resultIsError) {
      throw new Error('Failure! No error detected');
    } else {
      console.log(results);
      console.log('\x1b[36m%s\x1b[0m', 'Passed!');
    }
  }
}

async function file(data, options, resultIsError=false) {
	await excelConverter.convertToFile(data, options, function(error, results){
		generateOutput(error, resultIsError, results);
	});
}

async function mysql(data, options, resultIsError=false) {
	await excelConverter.covertToMYSQL(data, options, function(error, results){
    console.log(data);
		generateOutput(error, resultIsError, results);
	});
}

var initialData = {
	host: "localhost",
	user: "root",
	pass: "ngudbhav",
	path: "test/sample1.xlsx",
	table: "sample",
	db: "ug",
	endConnection: true,
};

var initialOptions = {
	customStartEnd: false,
	startRow:1,
	startCol: 1,
	endRow: 100,
	endCol: 10,
	autoId:true,
	destination: "",
};

(async function beginTest() {
  // Sanity test for the end result
  await file(initialData, initialOptions);
  await mysql(initialData, initialOptions);

  // Authentication Error Test
  initialData["pass"] = undefined;
  await mysql(initialData, initialOptions, true);

  // Invalid Table or Database
  initialData["pass"] = 'ngudbhav';
  initialData["db"] = undefined;
  initialData["table"] = undefined;
  await mysql(initialData, initialOptions, true);
})();
