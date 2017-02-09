"use strict";

const act = require("./actions");
const Task = require("../task");

let projectTypes = {drupal: require("./drupal")};

module.exports = {

  setupFromDirectory(dir) {

  },

  setupFromGit(repository) {
    return new Task(act.CloneProject)
      .then(act.DetectEnvironment)
      .ifThen((data) => data.get("env_data") !== false, (task) => {
        task.then(act.CreateDirectoryStructure)
          .then(act.MoveProject, act.SaveEnvironment, act.ComposeEnvironment);
      })
      .otherwise((task) => {
        task.then(act.DetectProjectType)
          .ifThen((data) => data.get("type") === false, act.AskProjectType)
          .then(act.AskProjectDirectory)
          .then(act.AskProjectConfig, {dirCreated: act.CreateDirectoryStructure})
          .after("dirCreated", act.MoveProject)
          .then({envCreated: act.CreateProjectEnvironment})
          .after(["dirCreated", "envCreated"], act.SaveEnvironment, act.ComposeEnvironment);

      })
      .start({
        repository: repository,
        project_types: this.getTypes(),
      });
  },

  setupNew(type, args) {
    return new Task(act.AskProjectType)
      .then(act.AskInstallationMethod)
      .then({projectDownloaded: act.DownloadProject, gotConfig: act.AskProjectConfig})
      .after("gotConfig", (task) => {
        task.then(act.AskProjectDirectory)
          .then({
            envCreated: act.CreateProjectEnvironment,
            dirCreated: act.CreateDirectoryStructure
          })
          .after(["dirCreated", "projectDownloaded"], {projectMoved: act.MoveProject})
          .then(act.SaveEnvironment, act.ComposeEnvironment)
          .after(["envCreated", "projectMoved"], act.RunProjectPostInstall);
      })
      .start({
        project_types: this.getTypes(),
      });
  },

  getTypes() {
    return projectTypes;
  }

};