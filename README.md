# DRUP
Drup is a command line utility that helps to kickstart development 
on your projects. It allows you to configure an environment and by 
leveraging the power of [Docker](https://www.docker.com/) it builds
it for you. All configuration get stored in a yaml file that if
shared can be reused to build the same environment.

#### Services
Services are at the base of the functionality. By combining and 
configuring these you create your environments. Services can provide
additional operations so that you don't have to manually execute
commands in containers.

*Supported core services*: **PHP**, **Apache**, **LightTPD**, **Nginx**, 
**MariaDB**, **MySQL**, **PMA**, **Node**

#### Projects
This tool provides building and starting mechanism for defined project 
types. These project handlers define service requirements/possibilities
and default environment configuration. They also add custom services
and installation methods to start anew. 

*Supported project types*:
- **Drupal**: provides Drush as a custom service.

#### Features
- creating new project with environment
- cloning or registering existing project
- automatically creating environment when configuration detected
- adding hosts aliases to exposed services
- keeping track of all projects registered locally

## Installation
```
npm --global require drup
```
After you ran the above command 'drup' should be available in your PATH.
Run 'drup ?' to get started. You can also get help for operations by
appending the question mark.