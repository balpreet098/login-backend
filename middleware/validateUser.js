async function validateUser(req, res, next){
    try {

        const token = req.cookie.split('');
        console.log(token,'gjghhsdfhdfgdfghdfgdf');
        next();

    } catch (error) {
        
    }
}

module.exports  = {validateUser}