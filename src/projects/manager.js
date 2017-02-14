"use strict";

const act = require("./actions");
const Task = require("../task");

let projectTypes = {drupal: require("./drupal")};

module.exports = {

  setupFromDirectory(dir) {
    return new Task(act.DetectEnvironment)
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
          .after(["dirCreated", "envCreated"], (task) => {
            task.then(act.SaveEnvironment, act.ComposeEnvironment, act.CreateServiceConfigFiles);
          });

      })
      .start({
        tmp_directory: dir,
        project_types: this.getTypes(),
      });
  },

  setupFromGit(repository) {
    return new Task(act.CloneProject)
      .start({
        repository: repository,
      })
      .then((data) => {
        return this.setupFromDirectory(data.get("tmp_directory"));
      })
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