"use strict";

const act = require("./actions");

let projectTypes;

const manager = {

  setupFromDirectory(dir) {
    const detectEnv = new act.DetectEnvironment();
    const askConfig = new act.AskProjectConfig();
    const askType = new act.AskProjectType();
    const detectType = new act.DetectProjectType();
    const createStructure = new act.CreateDirectoryStructure();
    const createEnv = new act.CreateProjectEnvironment();
    const moveProject = new act.MoveProject();
    const saveEnv = new act.SaveEnvironment();
    const composeEnv = new act.ComposeEnvironment();

    createStructure.after(detectEnv, (env) => env !== false);
    detectType.after(detectEnv, (env) => env === false);

    askType.after(detectType, (type) => type === false);
    askConfig.after(detectType, (type) => type !== false);

    createStructure.after(askConfig);
    createEnv.after(askConfig);

    moveProject.after(createStructure);

  },

  setupFromGit(repository) {

  },

  setupNew(type, args) {

  },



};

module.exports = function() {


  return manager;
};