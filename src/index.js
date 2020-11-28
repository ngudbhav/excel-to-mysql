
"use strict";

const readExcel = require('read-excel-file/node');
const fs = require('fs');
const mysql = require('mysql');
const mysqldump = require('mysqldump');
const csv = require('csvtojson');
const path = require('path');

var noOfOperations = 0;
var checkInt = true;
var sRow = 0;
var eRow = 0;
var sCol = 0;
var eCol = 0;

//Differentiate between float and integer value
const isInt = function(n) {
  return parseInt(n) === n
};

//Format date according to mysql format
const formatDate = function(date) {
  var d = new Date(date),
    month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;
  return [year, month, day].join('-');
}

//check the number of digits
const numDigits = function(x) {
  return (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1;
}

//return int/bigint
const returnString = function (s, n){
  ++noOfOperations;
  if(noOfOperations == s){
    if(checkInt){
      if(numDigits(n)<8){
        return "int,";
      } else {
        return "bigint,";
      }
    }
  }
  return "";
}

//check if object is date (Excel format)
const isDate = function(d){
  return d instanceof Date && !isNaN(d);
}

const optionalizeParameter = function(options, callback) {
  if(typeof options === 'function'){
    callback = options;
    options = {};
  }
  return [options, callback];
};

const rowsFromExcel = async function(filePath, callback) {
  const extension = filePath.toString().slice(filePath.toString().length-3, filePath.toString().length);
  if(extension === 'csv' || extension === 'CSV'){
    fs.readFile(filePath, 'utf8', function(error, sdata){
      if (error) throw error;
      else {
        csv({
          noheader: true,
          output: "csv"
        }).fromString(sdata)
          .then(function(rows) {
            callback(rows);
          });
      }
    });
  } else {
    readExcel(fs.createReadStream(filePath)).then(function(rows) {
      callback(rows);
    });
  }
};

const createTable = function(options, rows, reject, callback) {
  var tableString = '';
  if(options.customStartEnd === true){
    //No need to parse the all the rows
    if(options.startRow && options.startCol && options.endRow && options.endCol){
      sRow = options.startRow-1;
      eRow = options.endRow;
      sCol = options.startCol-1;
      eCol = options.endCol;
    } else {
      reject("Custom Start End requires all 4 points to be declared, i.e., Start Row, Start Column, End Row, End Column. It Seems one or more end points are not declared.");
      return callback("Custom Start End requires all 4 points to be declared, i.e., Start Row, Start Column, End Row, End Column. It Seems one or more end points are not declared.");
    }
  } else {
    eCol = rows[0].length;
    eRow = rows.length;
  }
  //Make the string to insert as a query in MySQL
  if(options.autoId){
    tableString+='id int,';
  }
  //Scan the second row to check for the datatypes.
  //In case of numbers, we scan the whole column to make sure the datatype is int or float.
  for(var i=sCol;i<eCol;i++){
    noOfOperations = 0;
    checkInt = true;
    rows[sRow][i] = rows[sRow][i].toString().split(" ").join("_");
    tableString+=rows[sRow][i]+" ";
    //Check if the input is a number
    if(typeof(rows[sRow+1][i]) === 'number'){
      for(var j=sRow+1;j<eRow;j++){
        if(!isInt(rows[j][i])){
          //Check if it is float
          tableString+="float,";
          checkInt = false;
          break;
        }
        tableString+=returnString(eRow-1, rows[sRow+1][i]);
      }
    } else if(typeof(rows[sRow+1][i]) === 'string'){
      tableString+="text,";
    } else if(typeof(rows[sRow+1][i]) === 'object'){
      if(isDate(rows[sRow+1][i])){
        tableString+="date,";
        for(var j=sRow+1;j<eRow;j++){
          rows[j][i] = formatDate(rows[j][i]);
        }
      } else{
        //In case of unsupported datatype
        reject("Datatype unsupported!");
        return callback("Datatype unsupported!");
      }
    } else if(typeof(rows[sRow+1][i])==='boolean'){
      tableString+="bool,";
    }
  }
  tableString = tableString.replace(/.$/,"");
  return tableString;
};

const createInsertTable = function(options, rows, reject, callback) {
  var insertString = '';
  for(var i=sRow+1;i<eRow;i++){
    insertString+='(';
    if(options.autoId){
      insertString+=i+",";
    }
    for(var j=sCol;j<eCol;j++){
      if(!rows[i]){
        reject('End points may be defined out of bounds in reference to the file.');
        return callback('End points may be defined out of bounds in reference to the file.');
      }
      if(rows[i][j] === true){
        insertString+="1,"
      } else if(rows[i][j] === false){
        insertString+="0,"
      } else {
        insertString+="\""+rows[i][j]+"\",";
      }
    }
    //Remove the trailing commas and spaces
    insertString = insertString.replace(/.$/,"");
    insertString+='),';
  }
  //Remove the trailing comma.
  return insertString.replace(/.$/,'');
};

//Function to convert to file
exports.convertToFile = function(data, options, callback){
  //optional parameter 'options'
  const params = optionalizeParameter(options, callback);
  options = params[0];
  callback = params[1];
  noOfOperations = 0;
  return new Promise(async function(resolve, reject) {
    rowsFromExcel(data.path, function(rows) {
      const tableString = createTable(options, rows, reject, callback);
      if(!data.table){
        reject("Please specify a table");
        return callback("Please specify a table");
      }
      if(!data.db){
        reject("Please specify a database");
        return callback("Please specify a database");
      }

      const destination = options.destination || path.join(process.cwd(), data.db + '.sql');

      //Fire up the query
      fs.writeFile(destination, 'create database if not exists '+data.db+';\nuse '+data.db+';\ncreate table if not exists '+data.table+' ('+tableString+');\n', function(error){
        if(error) throw error;
        else{
          //Create the string first and then insert the full data at once.
          const insertString = createInsertTable(options, rows, reject, callback);

          fs.appendFile(destination, 'insert into '+data.table+' values'+insertString+';\n', function(error){
            if(error) throw error;
            else{
              resolve('Saved File to ' + destination);
              return callback(null, 'Saved File to ' + destination);
            }
          });
        }
      });
    });
  });
}
//Function to send the data directly to the database.
exports.covertToMYSQL = function(data, options, callback){
  //optional parameter 'options'
  const params = optionalizeParameter(options, callback);
  options = params[0];
  callback = params[1];

  if(options.verbose !==false) {
    options.verbose = true;
  }

  if (data.endConnection !== false) {
    data.endConnection = true;
  }

  noOfOperations = 0;
  return new Promise(async function(resolve, reject) {
    if(!data.table){
      reject("Please specify a table");
      return callback("Please specify a table");
    }
    if(!data.db){
      reject("Please specify a database");
      return callback("Please specify a database");
    }

    if(options.safeMode){
      if(options.verbose){
        console.log('Backing up database');
      }

      const destination = options.destination || path.join(process.cwd(), data.db + '.sql');

      //Dump the database in case safe mode is set
      mysqldump({
        connection: {
          host: data.host,
          user: data.user,
          password: data.pass,
          database: data.db,
        },
        dumpToFile: destination,
      });
    }

    //Try to connect with the provided credentials
    var connection = data.connection || mysql.createConnection({
      host: data.host,
      user: data.user,
      password: data.pass,
      multipleStatements: true
    });

    connection.connect(async function(error){
      if(options.verbose){
        console.log('Establishing connection!');
      }
      if(error){
        if(error.code === 'ER_ACCESS_DENIED_ERROR'){
          reject("Authentication Error!");
          return callback("Authentication Error!");
        } else{
          reject(error);
          return callback(error);
        }
      } else {
        rowsFromExcel(data.path, function(rows){
          const tableString = createTable(options, rows, reject, callback);

          //Fire up the query
          //Create database if not exists to allow database creation directly.
          connection.query('create database if not exists '+data.db+';use '+data.db+';create table if not exists '+data.table+' ('+tableString+')', function(error){
            if(options.verbose){
              console.log('Table created!');
            }
            if(error){
              if(error.code==='ER_PARSE_ERROR'){
                reject('It seems that the column heading are not in text format.');
                return callback('It seems that the column heading are not in text format.');
              } else {
                reject(error);
                return callback(error);
              }
            } else {
              //Create the string first and then insert the full data at once.
              const insertString = createInsertTable(options, rows, reject, callback);
              connection.query('insert into '+data.table+' values'+insertString, function(error, results){
                if(options.verbose){
                  console.log('Inserting data!');
                }
                if(error){
                  if(error.code === 'ER_WRONG_VALUE_COUNT_ON_ROW'){
                    reject('The table you provided either already contains some data or there is a problem with the already prevailing column count.');
                    return callback('The table you provided either already contains some data or there is a problem with the already prevailing column count.');
                  } else {
                    reject("Incorrectly formatted Excel file");
                    return callback("Incorrectly formatted Excel file");
                  }
                } else {
                  if (data.endConnection) {
                    connection.end();
                  }
                  resolve(results);
                  return callback(null, results);
                }
              });
            }
          });
        });
      }
    });
  });
}
