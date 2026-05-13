# MBSL (a.k.a AGL)
A repository for tool AGL: Incorporating Behavioral Aspects into Domain-Driven Design.
### This is a single, concise, pictorial and visual summary of the main findings of the article
![Graphical abstracts](docs/images/Graphicalabstracts.png)

***Version: current***
- This is the current release version


# Project structure
### Tool implementation in the jDomainApp framework.
   ![Tool implementation in the jDOMAINAPP framework](docs/images/struct-tool1.png)
```
jda:root	-> the root project
  common  -> module-common: (base) module used by other modules
  jda:main -> contains the core components of JDA
  modules:mbsl    -> implements MBSL language
   - ...
```

# Using the deployed module MBSL
GitHub repository: https://github.com/jdomainapp/jda-mbsl
1. Download the deployed module MBSL: jda-mbsl into the Jdomainapp folder
2. Unzip it into the Jdomainapp folder
The content of Jdomainapp folder needs to look like this:
```
  - common
  - main
  - modules
      - MBSL
   - ...
```
# How to run the tool in a Java software framework
The tool can be executed within an Integrated evelopment Environment (IDE), such as Eclipse; PostgreSQL Database
1. Use the "Import existing Maven project" to import the artifact project
2. MySQL:
   - Create User: admin; Pass: password
   - Create a database name: domainds
## running a pattern form: Decisional, forked, joined, merged, sequential (in jda\modules\mbsl\src\test\java\org\jda\example\courseman\software):
![running a pattern form](docs/images/sourses.png)
# Code:
## Unified model:
![Conceptual Model: CM](docs/images/agl_cm.PNG)
``private void genGraph()`` 
### in class: ActivityModel transform CMT
![ Abstract Syntax Model: ASM](docs/images/agl_cmt.PNG)
### Result: Concrete Syntax Model (CSM) in the class: EnrolmentMgmt
![Concrete Syntax Model: CSM](docs/images/agl_csm.PNG)

