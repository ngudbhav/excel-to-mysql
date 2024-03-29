
"use strict";
const DB_PASS = '';
const INCORRECT_DB_PASS = 'incorrect';

const excelConverter = require('../src/index.js');

function generateOutput(error, resultIsError, results) {
  if(error) {
    if (resultIsError) {
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

async function file(data, options, resultIsError = false) {
	try {
    await excelConverter.convertToFile(data, options, function(error, results){
      if (!error) generateOutput(error, resultIsError, results);
    });
  } catch (error) {
	  generateOutput(error, resultIsError, null);
  }
}

async function mysql(data, options, resultIsError = false) {
	try {
    await excelConverter.covertToMYSQL(data, options, function(error, results){
      if (!error) generateOutput(error, resultIsError, results);
    });
  } catch (error) {
	  generateOutput(error, resultIsError, null);
  }
}

const initialData = {
	host: "localhost",
	user: "root",
  port: 3306,
	pass: DB_PASS,
	path: "test/sample1.xlsx",
	table: "sample",
	db: "ug",
	endConnection: true,
};

const initialOptions = {
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
  initialData["pass"] = INCORRECT_DB_PASS;
  await mysql(initialData, initialOptions, true);

  // Invalid Table or Database
  initialData["pass"] = DB_PASS;
  initialData["db"] = undefined;
  initialData["table"] = undefined;
  await mysql(initialData, initialOptions, true);
})();
