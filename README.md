<img src="./misc/drup_logo.png" align="right" alt="Drup logo" width="200"/>

# DRUP
Drup is a command line utility that helps to kick-start development 
on your projects. It allows you to configure an environment and by 
leveraging the power of [Docker](https://www.docker.com/) it builds
it for you. All configuration get stored in a yaml file that if
shared can be reused to build the same environment.

## Features
- creating new project with environment
- cloning or registering existing project
- automatically creating environment when configuration detected
- adding hosts aliases to exposed services
- keeping track of all projects registered locally

## Requirements
| | |
|------------------|--------------------------|
|[**GIT**](https://git-scm.com/downloads) | GIT is required to clone projects with drup.
|[**NodeJS**](https://nodejs.org/en/) | Drup is built upon Node. It also requires ES6 capable interpreter. **Version >= 6.4** is required. **Version 7 recommended**.
|[**Docker**](https://docs.docker.com/engine/installation/) | Drup uses docker to create virtual systems.
|[**DockerCompose**](https://docs.docker.com/compose/install/) | Drup heavily makes use of the docker extended functionality.

## Platforms
As drup has been built upon [NodeJS](https://en.wikipedia.org/wiki/Node.js)
it should support all major operating systems. Currently only the following
were tested:
- **UBUNTU**: mainly targeted, works best
- **WINDOWS 10**: supported, but slow (not recommended)

## Installation
**NOTE**: Admin privileges are required because drup provides a 
a global executable that has to be created upon installation.
```bash
sudo npm --global install drup
```
After you ran the above command 'drup' should be available in your PATH.
Run 'drup ?' to get started. You can also get help for operations by
appending the question mark (ex: 'drup create ?').

## Available support for
##### SERVICES: 
| | |
|------------------|--------------------------|
| **Interpreters** | PHP, NodeJS              |
| **WEB servers**  | Apache, Nginx, LightTPD  |
| **Database**     | MySQL, MariaDB, PMA      |
|                  |                          |

##### PROJECT TYPES:
| Type | Provided services |
|--------------|--------------------------|
| **Drupal**   |  Drush                   |
|              |                          |

## Example usage
You can use the following steps to learn the basic usage of drup.
1. Start by creating a new project. This will download Drupal files
and initiate a fresh website.
```bash
drup create drupal 
```
2. You will be asked to input some simple information, just follow
along and read carefully the descriptions for each input.
3. After you have gone through the last command you will a registered
project. You can check this by running the following command:
```bash
drup list
```
- This will display all registered projects. Each project has it's
key in front and after that the project name.
4. To list all the details of your project and it's environment first
 note the project ID and then run the following command (replace 
 <project-id>):
```bash
drup info <project-id>
```
- You will need this to take note of the database name and the
database container hosts alias so that you can do the installation
of Drupal.
5. After this you can start the project. This can take a long time
depending on whether your docker already has the required images
downloaded or not. Also this is the phase when drup does additional
installs, like composer install.
```bash
sudo drup start <project-id>
```
6. After the project has started you can visit the domain aliases
that got printed. At this step install the Drupal website. You might
have to create directories or set permissions.
7. Now just do a configuration dump.
```bash
sudo drup <project-id> drush cex
```

## Details

### Services
Services are at the base of the functionality. By combining and 
configuring these you create your environments. Services can provide
additional operations so that you don't have to manually execute
commands in containers. These basically create your container
configuration.

### Projects
Drup provides building and starting mechanism for defined project 
types. These project handlers define service requirements/
possibilities and default environment configuration. They also 
add custom services and installation methods to start anew. 

## Contribution
Drup is **open source**.
Anyone is welcome to contribute, be it that is by **testing**, 
creating **issues** of **bugs** or **suggestions** or even better 
**writing code**.

Documentation for coders is not yet available, you will have to
discover the backend yourself :D.