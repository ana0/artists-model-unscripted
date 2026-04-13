const throwNonspecificError = (err, res, next) => {
    if (err) {
        console.log(err)
        return res.status(500).json({ error: 'Server Error' });
    }
    return next();
}

module.exports = {
    throwNonspecificError
}