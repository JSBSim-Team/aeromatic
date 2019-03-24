# Aeromatic
Aero-Matic is a web application that uses an HTML interface to collect user-submitted data on an airplane, then generates configuration files for use with the [JSBSim Flight Dynamics Model](https://github.com/JSBSim-Team/jsbsim). Aero-Matic tries to strike a balance between simplicity and accuracy when modeling an airplane. The generated configuration files will result in a *plausible* airplane model, and is based on only a few data points that should be easily available from books or internet sources.

## How to use Aeromatic
Lets assume we want to make a model of the MiG-21. In this case we will need two configuration files, an *aero* configuration, and an *engine* configuration. Obviously we won't need a propeller configuration for the MiG-21.

The first step is to open [Aeromatic](https://jsbsim-team.github.io/aeromatic) in a browser. Step one is to define an engine for the MiG-21. From *The Encyclopedia of World Airpower* I find the following information on the engine used by the MiG-21. Name: Tumansky_R25, type: Turbine, thrust (without afterburning): 10000 lb., and afterburning is installed, but water-injection is not. Note that the name you chose for your engine should be a suitable file name, so only use appropriate characters.

When you click on the "generate" button Aero-Matic will send the information to *engine2.php*, which will do some calculations and send the results back to you. The results will look like garbage because the configuration file was not meant to look nice in a browser window. If you view the document source you will see the file as it really is. Save this file with the file name `Tumansky_R25.xml`, and place it in the `$FGROOT/Engine` directory with all the other engines.

Skip over the propeller form and fill in the aero form. You must first select a system of units, either English or metric. You cannot mix units! Now for the airplane data. For the MiG-21 I have the following data. Name: Mig21, type: Single Engine Fighter, maximum takeoff weight: 22,000 lb., span: 23.5 feet, length: 51.75 feet, wing area: 247 square feet, tricycle landing gear (meaning the third wheel is in front of the main wheels), one engine, engine type: Turbine, engine layout: aft fuselage. My source doesn't say whether the MiG-21 had a yaw damper, but since it's a high-performance jet I'll assume it needs one.

Now click on "generate" and the data will be sent to *aero2.php*, which will do some calculations and return the configuration file to you. As with the previous configuration file, it will look like garbage in your browser window, but will look properly if you view the document source. Save this file as `Mig21.xml`, and place it in a `$FGROOT/Aircraft/Mig21` folder. You will now have to open the file in a text editor and make a change. In the Propulsion section of the aero file you will find a reference to the file name of your engine, `Mig21_engine`. Edit this name to read `Tumansky_R25`. Your Mig-21 will now be matched with a correct engine.

If you model a multi-engined airplane you must make the above change for each engine. If you are modeling a propeller-driven airplane you must also change the thruster file name to reflect the file name of the propeller configuration file. This must be done for each propeller.

**NOTE!!** Be aware that some browsers can be configured to add HTML tags and make other changes to files without telling you. This will prevent Aero-Matic from working! Also, some browsers will *reload* the current page when displaying the document source. This may result in a bad document. Also, watch out for browsers that are set to fetch *cached* pages rather than new ones.


## Credits
This is based on the original PHP application by David P. Culp and has been ported to HTML/CSS/JavaScript by Bertrand Coconnier.
