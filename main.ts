import * as fs from "fs";
import { homedir } from "os";
import * as readline from 'readline';
import * as path from "path";
import * as process from "process";
import {createHash, createSalt, hash} from './src/modules/crypt/hash';
import { Stream, Writable } from "stream";
import {account} from './src/modules/account';
import {error, ErrorCodeMessage} from "./src/modules/err.h";

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
let loggedIn:boolean = true; //i'd usually replace this with a session token in a client/server setup, but it's all one program here so it doesnt really work
let activeAccount:account;

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

    _mainMenu(true);

    function _mainMenu(initial?: boolean): void {

        console.log(`Please select an option:\n\t1: Log in\n\t2: Create an account\n\t3: Exit`);

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
                                        activeAccount = new account(
                                            parseFloat(fs.readFileSync(path.join(thisAccountPath, "balance")).toString()),
                                            username,
                                            thisAccountPath
                                        );
                                        console.clear();
                                        _loggedInMenu();
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
                                fs.writeFileSync(path.join(thisAccountPath, "balance"), "1000");
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

                //exit
                case "3":
                    process.exit(0);
                break;

                //unknown action
                default:
                    console.log(`"${action}" is not a valid action!`);
                    _mainMenu();
            }
        })
    }

    //logged in menu
    function _loggedInMenu(): void {
        console.log("");
        console.log(`Your current balance is: ${activeAccount.getbalance()}$`);
        _action();

        function _action(): void {
            console.log("\nPlease choose an option: ");
            console.log("\t1. Withdraw money");
            console.log("\t2. Deposit money");
            console.log("\t3. Change your password");
            console.log("\t4. Log out");
    
            rl.question("[?]: ", function(action:string): void {
                switch(action) {
                    //withdraw
                    case "1":
                        console.log("");
                        console.log("Please enter an amount to withdraw (maximum withdrawal: 200$, must be a multiple of 20).");

                        rl.question("[?]: ", function(amt:string): void {
                            console.log("");
                            let thisResult = activeAccount.withdraw(parseFloat(amt));

                            if(typeof thisResult === "number") {
                                console.log("Transaction complete!");
                                _loggedInMenu();
                            } else {
                                console.log(ErrorCodeMessage(thisResult));
                                console.log("Cannot proceed.");
                                _action();
                            }
                        })
                    break;

                    //deposit
                    case "2":
                        console.log("");
                        console.log("Please enter a type of deposit to make [cash/check] (maximum cash deposit: 100$, checks not limited).");
                        rl.question("[cash/check]: ", function (type:any): void {
                            //ensure that type (any) conforms to deposit type
                            if(type !== "cash" || type !== "check") {
                                console.log("");
                                console.log("Please enter an amount to deposit (maximum cash deposit: 100$, checks not limited).");
                                console.log("");

                                rl.question("[?]: ", function(amt:string): void {
                                    console.log("")
                                    let thisResult = activeAccount.deposit({'type':type, 'amount': parseFloat(amt)});
        
                                    if(typeof thisResult === "number") {
                                        console.log("Transaction complete!");
                                        _loggedInMenu();
                                    } else {
                                        console.log(ErrorCodeMessage(thisResult));
                                        console.log("Cannot proceed.");
                                        _action();
                                    }
                                })
                            } else {
                                console.log(`Invalid deposit type "${type}".`);
                                _action();
                            }
                        })
                    break;

                    //change password
                    case "3":
                        rl.question("Please enter your current password: ", function(currentPasswd:string): void {
                            process.stdout.write("\n");
                            stdoutMuted = false;
                            let targetHash:hash = {
                                'hash':fs.readFileSync(path.join(activeAccount.accountPath, "hash")).toString(),
                                'salt':fs.readFileSync(path.join(activeAccount.accountPath, "salt")).toString()
                            }
                            //generate hash from given password
                            let generatedHash:hash = createHash(currentPasswd, targetHash.salt, 1024);

                            //compare hashes
                            if(generatedHash.hash === targetHash.hash) {
                                //password is correct, generate new password
                                _passwd();
                            } else {
                                console.log("Incorrect password.\n");
                                _action();
                            }
                        })
                        stdoutMuted = true;
                    break;

                    //log out
                    case "4":
                        loggedIn = false;
                        _mainMenu();
                    break;

                    //unknown option
                    default:
                        console.log(`Unknown option "${action}"`);
                        _action();
                }
            })
        }

        //reset active account password (requires logged-in)
        function _passwd(): void {
            rl.question("Please enter your new password: ", function(passwd1:string): void {
                stdoutMuted = false;
                process.stdout.write("\n");
    
                //confirm password
                rl.question("Please re-enter your new password: ", function(passwd2:string): void {
                    stdoutMuted = false;
                    process.stdout.write("\n");
    
                    //if the passwords match, hash it and store in account, else restart password prompt
                    if(passwd1 === passwd2) {
                        let hash:hash = createHash(passwd1, createSalt(256), 1024);
                        fs.writeFileSync(path.join(workingDir, "accounts", activeAccount.username, "hash"), hash.hash);
                        fs.writeFileSync(path.join(workingDir, "accounts", activeAccount.username, "salt"), hash.salt);
                        fs.writeFileSync(path.join(workingDir, "accounts", activeAccount.username, "iterations"), "1024");
    
                        console.log("Password reset successfully!\n");
                        _action();
                    } else {
                        console.log("Your passwords do not match!\n");
                        _passwd();
                    }
                })
                stdoutMuted = true;
            });
            stdoutMuted = true;
        }
    }
}