//this module is a little redundant. Just made it to make classifying errors easier
export type error = 
    "INSUFFICIENT_FUNDS" |
    "DEPOSIT_TOO_BIG"    |
    "WITHDRAW_TOO_BIG"   |
    "WITHDRAW_NOT_MULT";

export function Err (input:error): Error {
    return new Error(input);
}

export function ErrorCodeMessage(err:error): string {
    let msg:string;
    switch(err){
        case "DEPOSIT_TOO_BIG":
            msg = "Deposit is too big.";
        break;
        case "INSUFFICIENT_FUNDS":
            msg = "Your account has insufficient funds to complete this transaction.";
        break;
        case "WITHDRAW_NOT_MULT":
            msg = "This withdraw is not a multiple of 20.";
        break;
        case "WITHDRAW_TOO_BIG":
            msg = "This withdraw is too big.";
        break;
    }

    return msg;
}