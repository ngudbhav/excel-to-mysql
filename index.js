
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
					for(var i in rows[0]){
						noOfOperations = 0;
						checkInt = true;
						rows[0][i] = rows[0][i].split(" ").join("_");
						tableString+=rows[0][i]+" ";
						if(typeof(rows[1][i]) === 'number'){
							for(var j=1;j<rows.length;j++){
								if(!isInt(rows[j][i])){
									tableString+="float,";
									checkInt = false;
									break;
								}
								tableString+=returnString(rows.length-1, rows[1][i]);
							}
						}
						else if(typeof(rows[1][i]) === 'string'){
							tableString+="text,";
						}
						else if(typeof(rows[1][i]) === 'object'){
							if(isDate(rows[1][i])){
								tableString+="date,";
								for(var j=1;j<rows.length;j++){
									rows[j][i] = formatDate(rows[j][i]);
								}
							}
							else{
								reject(error);
								return callback(error);
							}
						}
						else if(typeof(rows[1][i])==='boolean'){
							tableString+="bool,";
						}
					}
					tableString = tableString.replace(/.$/,"");
					connection.query('create table if not exists '+data.table+' ('+tableString+')', function(error, results){
						if(error){
							else{
								reject(error);
								return callback(error);
							}
						}
						else{
							for(var i=1;i<rows.length;i++){
								var insertString = '';
								for(var j=0;j<rows[0].length;j++){
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
										var p = progress/(rows.length);
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