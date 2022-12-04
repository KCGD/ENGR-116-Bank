import * as crypto from 'crypto';

export type hash = {
    'hash':string,
    'salt':string
}

export function createHash (data:string, salt:string, iterations:number): hash {
    let hash:string = crypto.createHash("sha256", {}).update(data + salt).digest('hex');
    //console.log(`[CRYPT | INFO]: Initial hash [${hash}]`);

    for(let i = 0; i < iterations - 1; i++) {
        hash = crypto.createHash("sha256", {}).update(hash).digest('hex');
        //console.log(`[CRYPT | INFO]: Hash iteration [${i}] [${hash}]`);
    }

    //console.log(`[CRYPT | INFO]: Return hash [${hash}]`);
    return {
        'hash':hash,
        'salt':salt
    } as hash;
}



export function createSalt(length:number):string {
    var result:string = "";
    var characters:string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength:number = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}