import { Range } from "./range.h"
import { error, Err } from "./err.h"
import * as fs from 'fs';
import * as path from 'path';

//deposit argument type
export type deposit = {
    'type': "cash" | "check",
    'amount':number
}

//deposit interface
export interface Deposit {
    (input:deposit): error | number
}

//withdraw interface
export interface Withdraw {
    (amount:number): error | number
}

//returns balance
export interface Getbalance {
    (): number
}
export interface Setbalance {
    (amt:number): number
}


export class account {
    private balance:number;
    public deposit:Deposit;
    public withdraw:Withdraw;
    public getbalance:Getbalance;
    public setbalance:Setbalance;
    public username:string;
    public accountPath:string;

    constructor (_bal:number, _username:string, _accountPath:string) {
        //initialize balance as 0 and username as empty string
        this.balance = _bal;
        this.username = _username;
        this.accountPath = _accountPath;

        //define check balance function
        this.getbalance = function(): number {
            return this.balance;
        }
        this.setbalance = function(amt:number): number {
            this.balance = amt;
            fs.writeFileSync(path.join(this.accountPath, "balance"), this.balance.toString());
            return 0;
        }

        //define deposit function
        this.deposit = function(input:deposit): error | number {
            if(input.type === "cash") {
                if(input.amount <= 100) {
                    this.setbalance(this.balance + input.amount);
                    return 0;
                } else {
                    return "DEPOSIT_TOO_BIG";
                }
            } else {
                this.setbalance(this.balance + input.amount);
                return 0;
            }
        }

        //define withdraw function
        this.withdraw = function(input:number): error | number {
            if(this.balance - input > 0) {
                if(input % 20 === 0) {
                    if(input <= 200) {
                        this.setbalance(this.balance - input);
                        return 0;
                    } else {
                        return "WITHDRAW_TOO_BIG";
                    }
                } else {
                    return "WITHDRAW_NOT_MULT";
                }
            } else {
                return "INSUFFICIENT_FUNDS";
            }
        }
    }
}
