# Cell-Viz

> _This is a work in progress._

This package consists of a collection of HTM cell visualizations. It was originally created to visualize HTM systems, but now it is not meant to be used as a stand-alone package. It is e.g. used as a dependency of the package [htm-school-viz](https://github.com/htm-community/htm-school-viz). There is a 2D and 3D library. 

## Prerequisites

This project requires you to have [Node](https://nodejs.org/) and its package manager [npm](https://www.npmjs.com/) installed on your system. If you install the latest version of Node (at the time of writing, it is 10.9.0), you may run into compatibility issues between that Node version and the dependencies used by this project. If you install the latest [LTS](https://en.wikipedia.org/wiki/Long-term_support) version of Node (at the time of writing, it is 8.11.4), you should not encounter any problems. You can manage the installation of different versions of Node using the tool [nvm](https://github.com/creationix/nvm#installation).

## Installation

Install this npm package locally by issuing the following command

    npm install .

## Usage

Generate static assets:

    npm run build
