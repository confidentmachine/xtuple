/*jshint node:true, indent:2, curly:false, eqeqeq:true, immed:true, latedef:true, newcap:true, noarg:true,
regexp:true, undef:true, strict:true, trailing:true, white:true */
/*global X:true */

(function () {
  "use strict";

exports.login = passport.authenticate('local', { successReturnToOrRedirect: '/login/scope', failureRedirect: '/' });

exports.loginForm = function (req, res) {
  res.render('login');
};

exports.logout = function (req, res) {
  // TODO - delete the db session.
  req.logout();
  res.redirect('/');
}

exports.scope = function (req, res) {
  var sessionId = req.sessionID,
    selectedOrg = req.body.org;

  // TODO: verify that the org is valid for the user
  // TODO: update the session store row to add the org choice
  //console.log("session ID is " + sessionId + " and org is " + selectedOrg);
  res.redirect('/client');
}

exports.scopeForm = function (req, res) {
  var organizations = ['dev', 'dev2'];

  // TODO something like this should work once the plumbing works:
  // try {
  //   organizations = _.map(req.user.get("organizations").toJSON(), function (org) {return org.name;});
  // } catch (error) {
  //   // prevent unauthorized access
  //   res.render('login');
  // }

  // choose an org automatically if there's only one.
  if (organizations.length === 1) {
    req.body.org = organizations[0];
    exports.scope(req, res);
  }
  res.render('scope', { organizations: organizations });
};
}());
