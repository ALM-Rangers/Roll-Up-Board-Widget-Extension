
## Data/Telemetry
This project collects usage data and sends it to Microsoft to help Microsoft improve its products and services. For more information about how Microsoft uses telemetry data, read the Microsoft [privacy statement](http://go.microsoft.com/fwlink/?LinkId=521839). 

This telemetry is used for A|B testing and troubleshooting. 

To turn off telemetry you need to fork this repo, publish, and use your own version of the project without replacing the \_\_InstrumentationKey\_\_ configuration key.# Roll-Up-Board-Widget-Extension

The **Roll-up Board Widget** displays an aggregated view of your backlog boards on your dashboards.

![](https://almrangers.visualstudio.com/_apis/public/build/definitions/7f3cfb9a-d1cb-4e66-9d36-1af87b906fe9/103/badge)

> ![Gears](Gears.png) Interested how our CI/CD pipeline works? Read [Set up a CI/CD pipeline with package management for your Team Services extension](https://blogs.msdn.microsoft.com/visualstudioalmrangers/2017/04/30/setup-a-cicd-pipeline-with-package-management-for-your-team-services-extension/) to learn more. 

![sample](src/vsarVSTS-Roll-up-board/static/images/overview_sample.png)

## Quick steps to get started ###

1. Edit your dashboard.

2. Select the **Roll-up Board Widget** (1) and click Add (2).

![addwidget](src/vsarVSTS-Roll-up-board/static/images/overview_add.png)

3. Enter a Title (1), select a suitable Size (2), and select a Backlog (3). Click Save (4).

![configure](src/vsarVSTS-Roll-up-board/static/images/overview_configure.png)

4. Add and arrange one or more of the widgets on your dashboard.

![dashboard](src/vsarVSTS-Roll-up-board/static/images/overview_dashboard.png)

5. Click on the widget to take you to the associated board. 

> KNOWN ISSUE - There is an oddity that occurs when a work item appears on several boards and has overlapping area path ownership between two or more teams. This is a current limitation and we are investigating.

## Minimum supported environments
- Visual Studio Team Services
- Team Foundation Server 2015 Update 3 (or higher)

## Contributors
We thank the following contributor(s) for this extension: Mikael Krief.

## Notices
Notices for certain third party software included in this solution are provided here: [Third Party Notice](ThirdPartyNotices.txt).

##Contribute
Contributions to Folder Management are welcome. Here is how you can contribute to Folder Management:  

- Submit bugs and help us verify fixes  
- Submit pull requests for bug fixes and features and discuss existing proposals   

Please refer to [Contribution guidelines](.github/CONTRIBUTING.md) and the [Code of Conduct](.github/COC.md) for more details.
