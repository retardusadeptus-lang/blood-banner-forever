const express = require('express');
const buildRaidSignupRoutes = require('./raidSignups/index');

function buildRaidSignupRoutesWrapper({ db }) {
  return buildRaidSignupRoutes({ db });
}

module.exports = buildRaidSignupRoutesWrapper;
