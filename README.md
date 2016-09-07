#A (Brief?) Introduction
_In order to understand what this tool does, I highly recommend you read the following paragraphs. Don't worry, they get more relevant as you approach the end._

Android SDK is, at its core, a plain old folder. Actually, it can can have any name, not necessarily 'Android SDK', 'AndroidSDK', or any other variant thereof. What distinguishes an SDK folder from a non-SDK one is the folder's directory structure and contents: a folder can be an android sdk folder if it has (at the very least) a subfolder named 'tools'. That folder must in turn, contain certain files to in order to be distinguished as an sdk folder by programs like Android Studio, but as far as the folder structure is concerned, having a sub-folder named 'tools' is all an folder needs look like a (bare-bone) sdk folder.

"Installing" an android sdk component consists of downloading a compressed archive (i.e, a .zip file, or a .tgz file, etc.), and extracting it to a relevant folder under the sdk folder's root. the most common types of android sdk components are: system image, NDK, build tool, LLDB, and documentation.

"Updating" the sdk consists of downloading a number of certain XML files containing details (i.e., checksum, size and URL, etc.) of various android sdk components, and "installing" (cf. above) those you have chosen to.

But who is the one who does all the installing/updating stuff? Good questions. It is an executable file, to be found under `<sdk-root>/tools/`, and aptly named `android`. 
_(Note: replace <sdk-root> with the name you gave your android sdk folder.)_

`android` is a rather versatile tool whose duties range from updating/installing android sdk to managing your android projects, and beyond. I will soon describe how to actually obtain this executable. But for now, let me tell about the problem that made me create offdroid.

#The Problem
As stated above, `android` (which is the SDK manager, among other things) is in charge of finding, downloading, and installing sdk components:
* "Finding" involves retrieving the list of sdk components from google's servers.
* "Downloading" is downloading the components you select from the aforementioned list.
* "Installing" involves extracting the downloaded components under the sdk's root folder, and possibly editing certain configuration files along the way.

Even though the sdk manager can do all the above tasks, it could be arguably slower in downloading the components, compar'd to a dedicated download manager. Wouldn't it be great if we could somehow download the components ourselves, and "fed" them into the sdk manager, which would then install them for us?

Savvy android users might point out using the "cache" mechanism built into the sdk manager -- copy all the downloaded components under the sdk's 'cache' root (in linux, it is under ~/.android/cache). Unfortunately, the sdk manager only supports caching files up to 640KB in size, and even then, the files to be cached must be renamed in a certain way before being put in the cache folder.
 
Offdroid's solution is rather different.

#The Solution
The sdk manager downloads the things it needs from the internet, possibly through an http proxy. In case the previous sentence looks like a tautology to you, please read its last part again -- "*possibly through an http proxy*".

That's the solution! Creating a localhost proxy that serves the content you have on your local disk, and fooling the sdk manager to connect to the "internet" through this local proxy.

Offdroid contains all the tools to set up such a localhost server. So let's learn how to use it, which is what the next section is for.

#Setup and Usage
##Offdroid dependencies
Offdroid makes extensive use of node.js; you must install it before being able to use offdroid.
Offdroid also uses `node-expat` node package; assuming you have npm, you could install node-expat like so (if you haven't already):
```sh
npm install node-expat -g
# or if any permission error occurs, 'sudo npm install node-expat -g'
```
  
##Downloading offdroid
To use offdroid, you must first download it ;)
my favorite way to do so is:
```sh
git clone https://github.com/icefapper/offdroid
```

Another way would be downloading the zip of the master branch, and extracting it to a folder of your choice.

##Setting up the environment
After obtaining offdroid, you must set OFFDROID shell variable, and tweak the existing PATH variable as follows:
```sh
 export OFFDROID=path/to/offdroid
 export PATH="$PATH:$OFFDROID"
```
I would recommend you add the above lines to your .bashrc, otherwise you have to type them in each time you use offdroid. 

_NOTE 1: replace `path/to/offdroid` with the actual path to the folder offdroid resides in._
_NOTE 2: OFFDROID variable is crucial for offdroid to run properly; simply appending the `PATH` variable with the path to offdroid's folder will not work.   

##Commands
The main, and indeed the only, command Offdroid has is the `offdroid` command. It is an umbrella command, like `git` and `apt-get`, exposing different functionality through various subcommands it provides. Below is the list of all subcommands `offdroid` provides, along with a description of what they do.
 
* `offdroid init`
    * initialize an offdroid workspace. An offdroid workspace is the folder you run all other offdroid commands from, and is where all offdroid commands you issue read data from or write data to. 
* `offdroid fetch-xmls [through <PROXY>]`
    * fetch the xmls containing sdk component descriptors, optionally through a proxy
* `offdroid list-packages`
    * extract certain component details from the xmls obtained through `offdroid fetch-xmls`; the content server later uses the output produced by this command to resolve url addresses to local file paths.
* `offdroid latest-tool`
    * outputs the url(s) of the latest android 'tools' archive, the archive containing `android` executable; if you have decided to manually create an sdk (as opposed to downloading a pre-bundled archive) you will have to download the file this url points to, create a new folder, and extract this file under the folder you have created; the very folder you extracted the 'tools' archive in will be your sdk root folder; more about it on 'A Note About the SDK', below. 
* `offdroid set-sdk [FOLDER]`
    * set the sdk the current offdroid workspace is going to use
* `offdroid add-source-folder [FOLDER]`
    * adds a new source-folder to the current offdroid workspace's list of source folders. A source folder is a folder containing the sdk components you have downloaded.
* `offdroid launch-manager`
    * launches the local server, and then the sdk manager. This is the command all other offdroid commands labor for. 

##A Note About the SDK
As you know, `android` is traditionally used to manage the sdk folder's contents.
But what is the sdk folder? and where can `android` be found? as described in the very beginning of this README, the sdk folder is a plain old folder, in which a 'tools' archive has been extracted. A 'tools' archive is itself a component of android sdk, in the form of a 'zip' archive; this archive is where the `android` executable resides. You could obtain the url for the latest 'tools' archive as simply as below:
```sh
mkdir my-offdroid-workspace && cd my-offdroid-workspace
offdroid init
offdroid fetch-xmls
offdroid latest-tool
```

This might output more than one url; you should choose the one whose prefix matches the name of your operating system.

After downloading the 'tools' archive, you should extract in a folder -- preferably, a new folder. Congratulations! The very folder you extracted the 'tools' archive in is now a barebones but usable android sdk folder.

If you find the above process cumbersome (I didn't), you coul well go to https://developer.android.com, and download the pre-bundled sdk folder suiting you operating system. Its name is like so: "android-sdk_r<version>-<os>.tgz". The archive contains the sdk root itself; extracting gives you an sdk folder out of the box.

#A Complete Example of Usage
Below is an illustartion of how offdroid is actually used:

* creating workspace folder:
```sh
mkdir my-offdroid-workspace
``` 

* go into this workspace, and initialize it:
```sh
cd my-offdroid-workspace
offdroid init
```

* fetch sdk component descriptors; I prefer to fetch them through the tor client I have running on my machine:
```sh
offdroid fetch-xmls 
```

* use the component descriptors downloaded above to extract the hash and url of actual sdk components:
```sh
offdroid list-packages
```

* find the url of the lastest 'tools' archive:
```sh
offdroid latest-tool
```
 
* fetch (download) the tools archive from the url you obtained in the previous stage, and extract the archive under a preferably-new folder

Now return to your offdroid workspace (if you are not already there); then:

* tell your workspace the path to the sdk-folder you want it to use; in my case, it is located under ~/my-android-sdk, but your mileage might vary:
```sh
offdroid set-sdk ~/my-android-sdk
```

* run `android` from the tools folder under the sdk root; in my case, it is located under ~/my-android-sdk/tools/android
```sh
~/my-android-sdk/tools/android -v
```
   * In the sdk manager:
     * go to Tools > Options
     * Under 'Proxy Settings', set 'HTTP Proxy Server' to 127.0.0.1, and 'HTTP Proxy Port' to 8080
     * uncheck 'Use download cache', as we must not use the cache
     * check 'Force https://... sources to be fetched using http://...';
     * exit the sdk manager

* select the components you want to add to your sdk. this stage launches the actual manager; you select whatever you would like to install, and then follow the installation intructions as if you are actually installing the components you have chosen. when the "installation" is finished (it will actually take a few seconds, as all the downloads will fail immediately), close the sdk manager.
```sh
offdroid select-packages
```   
the urls for packages you had selected in the sdk manager are stor'd in `.selected-packages` in your offdroid workspace (i.e., in the current directory.)

* download the components you like (from the urls in `.selected-packages` or `.all-urls`); I highly recommend you create a new folder and download the components there.
  after you are done downloading the components, return to the offdroid workspace (if you haven't already), and add the path to the folder you have downloaded your components into to the workspace's source list. (I downloaded my componnents of choice under ~/my-downloaded-components.):
```sh
offdroid add-source ~/my-downloaded-components
```

* We are almost done; all we have to do is launching the content server and the sdk manager:
```sh
offdroid launch-manager
```

* choose and install the components you have downloaded.
* done!




