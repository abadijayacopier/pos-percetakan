const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server_error.log');
const outputPath = path.join(__dirname, 'server_error_utf8.log');

if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath);
    // Try to detect/convert UTF-16LE to UTF-8
    const utf8Content = content.toString('utf16le');
    fs.writeFileSync(outputPath, utf8Content, 'utf8');
    console.log('Converted server_error.log to UTF-8');
} else {
    console.log('server_error.log not found');
}

const errorTxtPath = path.join(__dirname, 'error.txt');
const errorTxtOutput = path.join(__dirname, 'error_utf8.txt');

if (fs.existsSync(errorTxtPath)) {
    const content = fs.readFileSync(errorTxtPath);
    const utf8Content = content.toString('utf16le');
    fs.writeFileSync(errorTxtOutput, utf8Content, 'utf8');
    console.log('Converted error.txt to UTF-8');
}
