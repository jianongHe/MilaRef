# MilaRef

<img width="128" alt="milaref_logo3_256" src="https://github.com/user-attachments/assets/f2bf2747-d880-49a3-be30-d2a161097238">

Enhance Milanote desktop capabilities by integrating the core features of PureRef, making Milanote a reference software.

## features:
- [x] pin/unpin window
- [x] make the window transparent
- [x] support multiple windows
- [x] press [Tab] to hide/show the toolbar and header
- [x] no scroll bar
- [x] Click-through mode
- [x] multiple platform support(Mac/Windows/Linux)

Examples: 

![1201-ezgif com-video-to-gif-converter](https://github.com/user-attachments/assets/dc94e1b3-9c9e-4de6-98ea-69893ab88206)

<img width="500" alt="image" src="https://github.com/user-attachments/assets/d2aa2596-3813-4967-8817-9549afa528c0">


Issues:

if you encounter this issue on Mac

<img width="200" alt="image" src="https://github.com/user-attachments/assets/31fbe136-c506-436f-acfb-59213a47c7b0">

please run the below command to trust it

```shell
xattr -cr /Applications/MilaRef.app
```

## Dev:
```shell
npm run start-dev
```

Build:

This command will build packages inside of `out` folder

```shell
npm run package
```

Release:

> Notice: need to run these commands on both Mac and Windows to generate install packages for all platforms

```shell
# Build the vite app
npm run package

# Generate dmg / exe / zip files
npm run make

# Release to github
npm run publish
```
