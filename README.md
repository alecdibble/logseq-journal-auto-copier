# Logseq Journal Auto Copier Plugin

<p align="center">
  <img src="icon.png" width="100" height="100">
</p>

## Functionality

* Copies last filled out journal to today's journal

* Deletes any completed tasks

* Deletes any children of blocks that contain the string "Notes"

* Runs every minute, won't run if today's note already has content

<p align="center">
  <img src="demo.gif">
</p>

## Developing

* If you have a feature suggestion or bug fix, feel free to submit a PR

* To build: `npm install && npm run build`

* To run:
     1. Follow the instructions above to build

     2. Enable Developer Mode in Logseq

     3. Click `Plugins` -> `Load Unpacked Plugin` and select this repo's folder