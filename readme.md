# excel-to-mysql <img src="https://travis-ci.org/ngudbhav/excel-to-mysql.svg?branch=master"> <br> <a href="https://nodei.co/npm/excel-to-mysql/"><img src="https://nodei.co/npm/excel-to-mysql.png"></a>
This module converts your correctly formatted Excel spreadsheet to a specified table in specified database in MYSQL.

# Excel Formats Supported
Supported Excel formats are XLS/XLSX

# Usage
The Database must already be created in MYSQL. A table name should be provided.

# Spreadsheet Format
Please have a look at the sample Excel sheets provided to have a clear view of the File. <a href="https://go.microsoft.com/fwlink/?LinkID=521962">Microsoft Sample Sheet</a>

# Installation
```sh
npm install excel-to-mysql --save
```

# Testing

```sh
git clone https://github.com/ngudbhav/excel-to-mysql.git
cd excel-to-mysql/
```
Navigate to the folder.
```sh
cd test/
nano test.js
```
Now this file needs the MYSQL credentials. Provide those credentials in String format and save by pressing the following keys.
```sh
'CTRL+X'
'Y'
'Return'
```
Get back and test the module.
```sh
cd ..
npm test
```
# Using
Note: Please correctly format the excel sheet else this won't work.
```sh
var excelMysql = require('excel-to-mysql');
```
This module needs 3 arguments.
The first one is the object with your credentials.

```sh
var credentials = {
	host: host,
	user: MYSQL Username,
	pass: Password for the above account,
	path: path for the excel file,
	table: Table name for creation,
	db: Your Database name
};
```
The second one is an optional argument of options with default values as follows.
```sh
var options = {
	verbose: false //Console.log the row number as per the excel file, if true.
	autoId: false //Automatically insert id of every row, i.e., numbering every row.
	customStartEnd: false //Custom insert the row and columns rather than full excel-file.
	startRow: <required> //Valid only if customStartEnd is true. Defines the start Row of the data.
	endRow: <required> //Valid only if customStartEnd is true. Defines the end Row of the data.
	startCol: <required> //Valid only if customStartEnd is true. Defines the start Column of the data.
	endCol: <required> //Valid only if customStartEnd is true. Defines the end Column of the data.
}
```
The third argument is the callback function which will be executed only after the completion of the whole conversion.

```sh
excelMysql.covertToMYSQL(credentials, options, callback);
```
If live progress monitoring is required, the following snippet can be used.
```sh
excelMysql.progress.on('progress', function(data){
	console.log(data); // int value returned ranging from 1-100.
});
```
# Want to use the GUI instead?
We have got you covered! <a href="https://github.com/ngudbhav/excel-to-mysql-electron-app">Github Link</a>.