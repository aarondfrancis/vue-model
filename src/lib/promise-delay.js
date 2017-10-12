// Adam Wathan https://twitter.com/adamwathan/status/885130802513752065?lang=en
// https://gist.github.com/adamwathan/babd10ed0e971404c5d8a86358d01b61

// Creates a new promise that automatically resolves after some timeout:
Promise.delay = function (time) {
    return new Promise(resolve => {
        setTimeout(resolve, time)
    })
}

// Throttle this promise to resolve no faster than the specified time:
Promise.prototype.takeAtLeast = function (time) {
    return new Promise((resolve, reject) => {
        Promise.all([this, Promise.delay(time)]).then(([result]) => {
            resolve(result)
        }, reject)
    })
}