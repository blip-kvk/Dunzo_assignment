const path = require('path');
const fs = require('fs');
const rimraf = require("rimraf");

//joining path of input and output directories 
const directoryPath = path.join(__dirname, 'testCases');
const outPath = path.join(__dirname, 'outputFiles');

// reads and gets all the testcase json files to be tested
function readInputDirectory(){
    //passing directoryPath and callback function
    fs.readdir(directoryPath, function (err, files) {
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        makeOutputDirectory(files);
    });
}

function makeOutputDirectory(files){
    if (fs.existsSync(outPath)){
        rimraf(outPath, function () {
            fs.mkdirSync(outPath); 
            files.forEach(file => {
                readFile(file);
            });
        });
    }else {
        fs.mkdirSync(outPath);
    }
}

// reads the file and gets the data containing number of outlets, inventory of ingredients and composition for each drink asynchronously
// sends this whole data to be processed to getItemsFinishedByInventory
function readFile(file){
    fs.readFile(path.resolve(directoryPath, file), "utf8", function (err, data) {
        if (err) {
            console.log(err);
        } 
        getItemsFinishedByInventory(file,data);
    });
}

// this function finds out the drinks that can be made using the ingredients inventory available and outputs the result to filename_result.txt file
function getItemsFinishedByInventory(file, data){
    data = JSON.parse(data)
    let { machine: { outlets : { count_n }, total_items_quantity, beverages }} = data;
    let result = "";
    for(let drink in beverages){
        let { availability, missing } = checkIfIngredientsAvailable(beverages[drink],total_items_quantity);
        if(availability){
            removeRequiredIngredients(beverages[drink], total_items_quantity);
            result += drink + " is prepared \n"; 
        } else {
            result += drink + " cannot be prepared because " + missing + "\n";
        }
    }
    // writing the result into respective files
    fs.writeFile(path.resolve(outPath, file.split('.')[0] + '_result.txt'), result, (err) => { 
        // In case of a error throw err. 
        if (err) throw err; 
    }) 
}

function checkIfIngredientsAvailable(ingredients, total_items_quantity){
    let returnObj = {
        availability: true,
        missing: "",
        missingType: 0
    }
    for(let eachIng in ingredients){
        if(total_items_quantity[eachIng]){
            if(total_items_quantity[eachIng] < ingredients[eachIng] && returnObj.missingType !=2){
                returnObj.availability = false;
                returnObj.missing = "item " + eachIng + " is not sufficient";
                returnObj.missingType = 1;
            }
        }else{
            returnObj.availability = false;
            returnObj.missing = eachIng + " is not available";
            returnObj.missingType = 2;
        }
    }
    return returnObj;
}

function removeRequiredIngredients(ingredients, total_items_quantity){
    for(let eachIng in ingredients){
        total_items_quantity[eachIng] -= ingredients[eachIng];
        total_items_quantity[eachIng] <0 ? 0 : total_items_quantity[eachIng];
    }
}

readInputDirectory();