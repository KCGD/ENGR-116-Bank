import { Range } from "./range.h"
import { errors, Err } from "./err.h"

//deposit argument type
export type deposit = {
    'type': "cash" | "check",
    'amount':number
}

//deposit interface
export interface Deposit {
    (input:deposit): errors | number
}

//withdraw interface
export interface Withdraw {
    (amount:number): errors | number
}

//returns balance
export interface Getbalance {
    (): number
}

export class account {
    'balance':number;
    'deposit':Deposit;
    'withdraw':Withdraw;
    'getbalance':Getbalance;

    constructor (_bal:number) {
        this.balance = _bal;

        //define check balance function
        this.getbalance = function(): number {
            return this.balance;
        }

        //define deposit function
        this.deposit = function(input:deposit): errors | number {
            if(input.type === "cash") {
                if(input.amount <= 100) {
                    this.balance += input.amount;
                    return 0;
                } else {
                    return "DEPOSIT_TOO_BIG";
                }
            } else {
                this.balance += input.amount;
                return 0;
            }
        }

        //define withdraw function
        this.withdraw = function(input:number): errors | number {
            if(this.balance - input > 0) {
                if(input % 20 === 0) {
                    if(input < 200) {
                        this.balance -= input;
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
