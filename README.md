# gene-expression-visualizer

Plot and visualize gene expression over developmental stages. Currently displays CPM values from the BrainVar Project.

## Architecture Discussion

This project consists of four main pieces, all of which have been intentionally decoupled to allow maximum flexibility and re-use over time.

### Data storage and access

Currently, this project uses Postgres as an operational DB to store all the ETL'd data from the BrainVar project. This allows fast application performance and flexibility to grow the data store over time.

This is decoupled behind a `DataAccessClient` interface, so we could easily swap out to a different data approach as demands change.

### Database maintenance and ETL

Currently, this project uses KnexJS to maintain migrations (with schema definitions), seed data (for developmental milestones), and to facilitate ETL. ETL is done with a Node script that currently runs from the filesystem. This could easily be extended to support running in a cloud environment as part of an event-based system.

The migration maintenance and ETL process could easily be moved over to a different tool, language, or system as needed.

### API serving data

Currently, this project serves the data in a thin webserver layer that uses Node.js and Express. This is also decoupled from the specific data access implementation.

### Client web page

Currently, this project uses React, Vite, and some open source libraries to make a SPA for fetching and displaying expression data. The API request-making layer here is abstracted from the rest of the React app to support possible changes to the backend (different deployments with different APIs, etc.). This decoupling also opens the door for exciting potential re-uses of the client, such as bundling it with smaller data sets for fully offline use, potentially in an Electron app.

## Before production release

As this was a very time-bound project, I wanted to note other things I didn't have time for, but would normally do before a production release:

- Make sure any needed authentication is implemented.
- Find a way to calculate confidence intervals and render them on the graphs. Consider moving that calculation and all LOESS calculation to the backend to better handle scaling.
- Dockerize the components of the project and deploy to a cloud system.
- Possibly switch the backend or the ETL to Python if that is more appropriate for the ecosystem.
- Add caching at various points.
- Add a proper structured logger to the backend for production visibility.
- Allow searching and selecting genes in a "combo box" component using the definitions already available on the client.
- Find dedicated cloud-based homes and processes for ETL and migration management; maybe even move these into their own top-level directory in the monorepo so they can be deployed in isolation.
- Add automated testing: the project could benefit from some API/E2E tests for integration, and maybe even pixel-diff snapshots to ensure accidental changes do not affect the graph displays.
