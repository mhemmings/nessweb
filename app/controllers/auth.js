var ness = require('nessjs');

module.exports = function (req, res, next) {
    if (!req.session.user || !req.session.user.name || !req.session.user.cookie) {
        res.redirect('/login');
        req.session.referer = req.originalUrl;
        return;
    }

    req.session.touch();
    res.locals.user = req.session.user;

    next();
}

module.exports.login = function (req, res, onError) {
    var user = {
        id: req.body.id,
        pass: req.body.pass
    };
    var remember = !!req.body.remember;

    req.session.user = user;

    // Remember this user's id. Who cares about cookie policy
    res.cookie('ness_id', user.id, { httpOnly: true, maxAge: 365 * 24 * 60 * 60 * 1000 });

    ness.login(user, function(err, response) {
        if (err) {
            req.session.failed_login = true;
            req.session.failed_id = user.id;
            return res.redirect('/login');
        }
        req.session.user.name = response.name;
        req.session.user.cookie = response.cookie;
        var referer = req.session.referer;
        req.session.referer = null;
        if (remember) {
            // User will be kept logged in for 28 days
            req.session.cookie.maxAge = 28 * 24 * 60 * 60 * 1000;
        }
        else {
            // User will have to log on when browser restarts
            req.session.cookie.expires = false;
        }
        res.redirect(referer || '/');
    });
}

module.exports.logout = function (forced, req, res) {
    req.session.regenerate(function () {
        req.session.failed_login = forced;
        res.redirect('/login');
    });
}

module.exports.isLoggedIn = function (req) {
    return req.session.user && req.session.user.name;
}