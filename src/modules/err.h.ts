//this module is a little redundant. Just made it to make classifying errors easier
export type errors = 
    "INSUFFICIENT_FUNDS" |
    "DEPOSIT_TOO_BIG"    |
    "WITHDRAW_TOO_BIG"   |
    "WITHDRAW_NOT_MULT";

export function Err (input:errors): Error {
    return new Error(input);
}