import * as fs from "fs";
import { homedir } from "os";
import * as readline from 'readline';
import * as path from "path";
import * as process from "process";
import {createHash, createSalt, hash} from './src/modules/crypt/hash';
import { Stream, Writable } from "stream";

//create template for user argument parsing
//only flags that require aditional arguments will be assigned here
let knownFlags:string[] = ["--help", "-h"];

//store process arguments
let args = {

}

//globals
let workingDir:string;
let accountsDir:string;
let stdoutMuted:boolean = false;

//create mutable stdout
process.stdin.setRawMode(true);
process.stdin.resume();

let mutableStdout:Writable = new Writable({
    write: function(data:any, encoding:any, callback:Function): void {
        if(!stdoutMuted) {
            process.stdout.write(Buffer.from(data), encoding);
            callback();
        } else {
            process.stdout.write("*");
            callback();
        }
    }
})

//create readline interface
let rl:readline.Interface = readline.createInterface({
    'input':process.stdin,
    'output':mutableStdout,
    'terminal':true
})

//main function
Main();
function Main(): void {
    //parse process arguments
    for(let i:number = 0; i < process.argv.length; i++) {
        if(process.argv[i].startsWith("-") && !knownFlags.includes(process.argv[i])) {
            console.log(`[WARNING]: Unknown option "${process.argv[i]}"`);
        }
        switch(process.argv[i]) {
            case "--help":
            case "-h":
                console.log(fs.readFileSync(path.join(__dirname, "./src/HelpFile")).toString());
                process.exit(0);
            break;
        }
    }
    
    //do setup
    workingDir = path.join(homedir(), ".bank");
    if(!fs.existsSync(workingDir)) {
        fs.mkdirSync(workingDir);
    }

    //create accounts directory if it doesnt exist
    accountsDir = path.join(workingDir, "accounts")
    if(!fs.existsSync(accountsDir)) {
        fs.mkdirSync(accountsDir);
    }

    //print welcome screen message
    const welcomeScreen:string = 
        `
        ***********************************************
        *                                             *
        *           WELCOME TO ONECLICK BANK!         *
        *                                             *
        ***********************************************
        `;
    
    console.log(welcomeScreen);
    console.log("\n");

    _mainMenu();

    function _mainMenu(): void {
        console.log(`Would you like to:\n\t1: Log in\n\t2: Create an account`);

        rl.question("[?]: ", function(action:string): void {
            switch(action) {
                //log in
                case "1":
                    //get username
                    _getUsername();
                    function _getUsername(): void {
                        //get username
                        rl.question("Please enter your username: ", function (username:string): void {
                            let thisAccountPath:string = path.join(accountsDir, username);

                            //get password
                            rl.question("Please enter your password: ", function(password:string): void {
                                stdoutMuted = false;
                                process.stdout.write("\n");

                                //confirm account existance
                                if(fs.existsSync(thisAccountPath)) {
                                    let targetHash:hash = {
                                        'hash':fs.readFileSync(path.join(thisAccountPath, "hash")).toString(),
                                        'salt':fs.readFileSync(path.join(thisAccountPath, "salt")).toString()
                                    }

                                    //generate hash from given password
                                    let generatedHash:hash = createHash(password, targetHash.salt, 1024);

                                    //compare hashes
                                    if(generatedHash.hash === targetHash.hash) {
                                        console.log("Password correct!\n");
                                        _mainMenu();
                                    } else {
                                        console.log("Password Wrong!\n");
                                        _mainMenu();
                                    }
                                } else {
                                    console.log("This account does not exist!\n");
                                    _mainMenu();
                                }
                            });
                            stdoutMuted = true;
                        })
                    }
                break;

                //create account
                case "2":
                    _createAccount();
                    function _createAccount(): void {
                        //query user for a username
                        rl.question("Please enter a username: ", function(username:string): void {
                            let thisAccountPath:string = path.join(accountsDir, username);
                            if(!fs.existsSync(thisAccountPath))  {
                                fs.mkdirSync(thisAccountPath);
                                fs.writeFileSync(path.join(thisAccountPath, "balance"), "");
                                fs.writeFileSync(path.join(thisAccountPath, "hash"), "");
                                fs.writeFileSync(path.join(thisAccountPath, "salt"), "");
                                fs.writeFileSync(path.join(thisAccountPath, "iterations"), "");

                                _createPasswd(username);
                            } else {
                                console.log("This username already exists! Please choose a different one.");
                                _createAccount();
                            }
                        })
                    }

                    function _createPasswd(username:string): void {
                        //create password
                        rl.question("Please enter a password: ", function(passwd1:string): void {
                            stdoutMuted = false;
                            process.stdout.write("\n");

                            //confirm password
                            rl.question("Please re-enter your password: ", function(passwd2:string): void {
                                stdoutMuted = false;
                                process.stdout.write("\n");

                                //if the passwords match, hash it and store in account, else restart password prompt
                                if(passwd1 === passwd2) {
                                    let hash:hash = createHash(passwd1, createSalt(256), 1024);
                                    fs.writeFileSync(path.join(workingDir, "accounts", username, "hash"), hash.hash);
                                    fs.writeFileSync(path.join(workingDir, "accounts", username, "salt"), hash.salt);
                                    fs.writeFileSync(path.join(workingDir, "accounts", username, "iterations"), "1024");

                                    console.log("Account created successfully!\n");
                                    _mainMenu();
                                } else {
                                    console.log("Your passwords do not match!\n");
                                    _createPasswd(username);
                                }
                            })
                            stdoutMuted = true;
                        });
                        stdoutMuted = true;
                    }
                break;
                default:
                    console.log(`"${action}" is not a valid action!`);
                    _mainMenu();
            }
        })
    }
}