# STRATA

![Angular](https://img.shields.io/badge/-Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-d0689d?style=for-the-badge&logo=sass&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-black?style=for-the-badge&logo=three.js&logoColor=white)
![D3.js](https://img.shields.io/badge/D3.js-orange?style=for-the-badge&logo=D3&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-white?style=for-the-badge&logo=chart.js&logoColor=red)

🔗 Backend Repository: https://github.com/marg4ryn/Strata-Backend

> Detailed project documentation can be found in the `docs/` directory. It includes Architecture Decision Record (ADR), the project structure convention, as well as activity and sequence diagrams.

## 🧭 About

**Strata** is a tool for analyzing the evolution of software repositories. It uses version control history to reveal how code changes over time, helping teams identify areas with high activity and complexity. Instead of focusing only on the current state of a codebase, Strata examines development patterns to provide insight into how the system evolves and where maintenance effort may be most valuable.

The application's name refers to rock strata – layers that accumulate over time, recording the history of everything that shaped them. In the context of software development, these layers correspond to the evolving history of a codebase, where high complexity coinciding with frequent changes forms so-called **_hotspots_**. Strata highlights these highly active regions that often remain hidden in traditional analyses. This allows teams to focus their attention and resources on the areas where intervention is most needed, reducing the risk of failures and supporting long-term, sustainable system maintenance.

## ✨ Features

### Running Analyses

To start an analysis, the user provides the URL of the target Git repository. Optionally, they can specify a date range to limit the analysis; otherwise, the repository's entire commit history is processed by default (see the **Target Form** below). During the analysis, the application displays real-time progress updates delivered by the server over a WebSocket connection, allowing users to monitor each stage of the process (see the **Loading Screen** below). Multiple analyses can be executed simultaneously in separate tabs, enabling users to work on different repositories independently. Application state is synchronized across browser tabs using Local Storage, while the Web Locks API prevents multiple tabs from competing for the same resources, ensuring consistent and reliable behavior.

If an error occurs or the WebSocket connection is interrupted, the application allows the user to reconnect and resume receiving status updates without restarting the analysis (see the **Analysis Error** below). An analysis continues running even if the application is closed. When the user returns later, Strata automatically detects any unfinished analysis and offers the option to reconnect to it (see the **Unfinished Analysis** below). 

| Target Form | Loading Screen | Analysis Error | Unfinished Analysis |
|:---:|:---:|:---:|:---:|
| <img src="./docs/analysis-run/screens/target_form.png" width="200"/> | <img src="./docs/analysis-run/screens/loading_screen.png" width="200"/> | <img src="./docs/analysis-run/screens/analysis_error.png" width="200"/> | <img src="./docs/analysis-run/screens/unfinished_analysis.png" width="200"/> |


### Additional Features

Users can access several application panels directly from the header. All panels are implemented using Angular CDK Overlay, which keeps them independent from the main application layout while providing consistent behavior and accessibility.

Important actions trigger notifications that inform users about the result of an operation. Notifications indicate the message type (`success`, `info`, `warn`, or `error`) and the number of unread notifications is displayed in the application header (see the **Notifications** below).

Each successfully completed analysis is added to the analysis history. Users can open a previous entry to load its results without having to run the analysis again (see the **Analysis History** below). The analysis history state is synchronized between browser tabs using the BroadcastChannel API, ensuring that additions and removals made in one tab are reflected in the others.

The settings panel allows users to change the application language between English and Polish. Translations are handled at runtime using Transloco, allowing the language to be changed without reloading the application (see the **Settings** below).

| Notifications | Analysis History | Settings |
|:---:|:---:|:---:|
| <img src="./docs/screens/notifications.png" width="300"/> | <img src="./docs/screens/analysis_history.png" width="300"/> | <img src="./docs/screens/settings.png" width="300"/> |


### About Page

Users interested in the application can visit the About Page, accessible from the footer of the interface. It presents the development team behind the project and the technology stack used to build the system, and it also documents the tool’s limitations to help users better understand Strata’s purpose and scope (see the **About Page** below).

| About Page |
|:---:|
| <img src="./docs/screens/about.png" width="900"/> |