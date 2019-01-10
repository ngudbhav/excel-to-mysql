
"use strict";

var readExcel = require('read-excel-file/node');
var fs = require('fs');
var mysql = require('mysql');

var isInt = function(n){
	return parseInt(n) === n
};
function formatDate(date) {
	var d = new Date(date),
	month = '' + (d.getMonth() + 1),
	day = '' + d.getDate(),
	year = d.getFullYear();
	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;
	return [year, month, day].join('-');
}
function numDigits(x) {
	return (Math.log10((x ^ (x >> 31)) - (x >> 31)) | 0) + 1;
}
var noOfOperations = 0;
function returnString(s, n){
	++noOfOperations;
	if(noOfOperations == s){
		if(checkInt){
			if(numDigits(n)<8){
				return "int,";
			}
			else{
				return "bigint,";
			}
		}
	}
	return "";
}
function isDate(d){
	return d instanceof Date && !isNaN(d);
}
var checkInt = true;

exports.covertToMYSQL = function(data, options, callback){
	if(typeof options === 'function'){
		callback = options;
		options = {};
	}
	noOfOperations = 0;
	return new Promise((resolve, reject) => {
		var sRow = 0;
		var eRow = 0;
		var sCol = 0;
		var eCol = 0;
		var connection = mysql.createConnection({
			host: data.host,
			user: data.user,
			password: data.pass,
			database: data.db
		});
		connection.connect(function(error){
			if(error){
				if(error.code=='ER_BAD_DB_ERROR'){
					reject("Database not found!");
					return callback("Database not found!");
				}
				else if(error.code == 'ER_ACCESS_DENIED_ERROR'){
					reject("Authentication Error!");
					return callback("Authentication Error!");
				}
				else{
					reject(error);
					return callback(error);
				}
			}
			else{
				readExcel(fs.createReadStream(data.path)).then((rows) => {
					var progress = 1;
					var tableString = '';
					if(options.customStartEnd === true){
						if(options.startRow && options.startCol && options.endRow && options.endCol){
							sRow = options.startRow-1;
							eRow = options.endRow;
							sCol = options.startCol-1;
							eCol = options.endCol;
						}
						else{
							reject("Custom Start End requires all 4 points to be declared, i.e., Start Row, Start Column, End Row, End Column. It Seems one or more end points are not declared.");
							return callback("Custom Start End requires all 4 points to be declared, i.e., Start Row, Start Column, End Row, End Column. It Seems one or more end points are not declared.");
						}
					}
					else{
						eCol = rows[0].length;
						eRow = rows.length;
					}
					if(options.autoId){
						tableString+='id int,';
					}
					for(var i=sCol;i<eCol;i++){
						noOfOperations = 0;
						checkInt = true;
						rows[sRow][i] = rows[sRow][i].split(" ").join("_");
						tableString+=rows[sRow][i]+" ";
						if(typeof(rows[sRow+1][i]) === 'number'){
							for(var j=sRow+1;j<eRow;j++){
								if(!isInt(rows[j][i])){
									tableString+="float,";
									checkInt = false;
									break;
								}
								tableString+=returnString(eRow-1, rows[sRow+1][i]);
							}
						}
						else if(typeof(rows[sRow+1][i]) === 'string'){
							tableString+="text,";
						}
						else if(typeof(rows[sRow+1][i]) === 'object'){
							if(isDate(rows[sRow+1][i])){
								tableString+="date,";
								for(var j=sRow+1;j<eRow;j++){
									rows[j][i] = formatDate(rows[j][i]);
								}
							}
							else{
								reject("Datatype unsupported!");
								return callback("Datatype unsupported!");
							}
						}
						else if(typeof(rows[sRow+1][i])==='boolean'){
							tableString+="bool,";
						}
					}
					tableString = tableString.replace(/.$/,"");
					connection.query('create table if not exists '+data.table+' ('+tableString+')', function(error, results){
						if(error){
							reject(error);
							return callback(error);
						}
						else{
							for(var i=sRow+1;i<eRow;i++){
								var insertString = '';
								if(options.autoId){
									insertString+=i+",";
								}
								for(var j=sCol;j<eCol;j++){
									if(rows[i][j] === true){
										insertString+="1,"
									}
									else if(rows[i][j] === false){
										insertString+="0,"
									}
									else{
										insertString+="\""+rows[i][j]+"\",";
									}
								}
								insertString = insertString.replace(/.$/,"");
								connection.query('insert into '+data.table+' values('+insertString+')', function(error, results){
									if(error){
										reject("Incorrectly formatted Excel file.");
										return callback("Incorrectly formatted Excel file.");
									}
									else{
										if(options.verbose === true){
											console.log(`Placed ${progress++} row`);
										}
										var p = progress/(eRow);
										if(p===1){
											connection.end();
											resolve(results);
											return callback(null, results);
										}
									}
								});
							}
						}
					});
				});
			}
		});
	});
}