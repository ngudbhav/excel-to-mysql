# excel-to-mysql
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
}
```
The third argument is the callback function which should be executed.

```sh
excelMysql.covertToMYSQL(credentials, options, callback);
```

# Want to use the GUI instead?
We have got you covered! <a href="https://github.com/ngudbhav/excel-to-mysql-electron-app">Github Link</a>.